const {test}=require('node:test'),assert=require('node:assert/strict'),Module=require('node:module');
const original=Module._load;
let active,inboxData,posts=[],roomLoads=0,intervals=[];
const jsx=(type,props)=>({type,props});
const hooks={
 useState(initial){const host=active,i=host.cursor++;if(!(i in host.slots))host.slots[i]=typeof initial==='function'?initial():initial;return [host.slots[i],value=>{host.slots[i]=typeof value==='function'?value(host.slots[i]):value}];},
 useRef(initial){const host=active,i=host.cursor++;return host.slots[i]||=( {current:initial} );},
 useEffect(fn,deps){const host=active,i=host.cursor++,previous=host.slots[i];if(!previous||deps.some((value,index)=>value!==previous[index])){host.slots[i]=deps;host.effects.push(fn);}}
};
const api={get:async()=>({data:inboxData}),post:(url,data)=>new Promise((resolve,reject)=>posts.push({url,data,resolve,reject}))};
Module._load=function(name,...rest){
 if(name==='react')return hooks;
 if(name==='react/jsx-runtime')return {jsx,jsxs:jsx};
 if(name==='@/http/api/privateApi')return {privateApi:api};
 if(name==='@/http/services/office.service')return {officeError:()=> 'Failed',officeService:{room:async id=>{roomLoads++;return {id,code:'RK-01',title:'Room',location:'Pokhara',price:5000,details:'Wi-Fi: yes',ownerPhone:'private-admin-contact'}}}};
 if(name==='@/lib/ui-sounds')return {playUiSound(){},playIncomingMessageSound(){},unlockSounds(){}};
 if(name==='./OfficeVideo'||name==='./RoomDetails'||name==='lucide-react'||name==='@/components/SiteSoundEffects')return new Proxy({}, {get:(_,key)=>key});
 return original.call(this,name,...rest);
};
const compiled=process.env.ROOM_ADMIN_COMPILED||'/tmp/multi-chat-check';
const {RoomAdminInbox}=require(compiled+'/components/office/RoomAdminInbox.js');
const {parseRoomInquiry,AdminRoomInquiry}=require(compiled+'/components/office/AdminRoomInquiry.js');
Module._load=original;
global.window={setInterval:fn=>{intervals.push(fn);return intervals.length},clearInterval(){}};
global.document={visibilityState:'visible'};
const tick=()=>new Promise(setImmediate);
function host(fn,props){return {fn,props,slots:[],cursor:0,effects:[]};}
function render(host,runEffects=false){active=host;host.cursor=0;host.effects=[];const result=host.fn(host.props);if(runEffects)host.effects.forEach(fn=>fn());return result;}
function nodes(root,predicate){const found=[];function walk(node){if(!node||typeof node!=='object')return;if(predicate(node))found.push(node);for(const child of [node.props?.children].flat(Infinity))walk(child);}walk(root);return found;}
const conversation=(id,name,message)=>({id,otherUser:{id:name,name},unreadCount:1,lastMessage:{id:message,senderId:name,content:'Hello'},createdAt:'2026-01-01'});
test('separate user windows, concurrent replies and incoming reopen stay scoped',async()=>{
 inboxData={officialAdminId:'admin',conversations:[conversation('ram-chat','Ram','r1'),conversation('sita-chat','Sita','s1')]};
 const parent=host(RoomAdminInbox,{});render(parent,true);await tick();
 let panels=nodes(render(parent),node=>node.type?.name==='UserChatBox');assert.equal(panels.length,2);
 const ram=host(panels[0].type,panels[0].props),sita=host(panels[1].type,panels[1].props);
 const draft=(box,value)=>nodes(render(box),node=>node.type==='textarea')[0].props.onChange({target:{value}});
 draft(ram,'Ram reply');draft(sita,'Sita reply');
 const submit=box=>nodes(render(box),node=>node.type==='form')[0].props.onSubmit({preventDefault(){},stopPropagation(){}});
 const r=submit(ram),s=submit(sita);
 assert.equal(posts[0].url,'/message/room-admin/conversations/ram-chat/messages');assert.equal(posts[0].data.content,'Ram reply');
 assert.equal(posts[1].url,'/message/room-admin/conversations/sita-chat/messages');assert.equal(posts[1].data.content,'Sita reply');
 posts[1].resolve({data:{id:'s-reply',senderId:'admin',content:'Sita reply',createdAt:'2026-01-01'}});await s;
 posts[0].reject(Error('Ram failed'));await r;
 assert.equal(nodes(render(ram),node=>node.type==='textarea')[0].props.value,'Ram reply');
 assert.equal(nodes(render(sita),node=>node.type==='textarea')[0].props.value,'');
 assert.equal(nodes(render(ram),node=>node.props?.role==='alert').length,1);
 assert.equal(nodes(render(sita),node=>node.props?.role==='alert').length,0);
 const sitaText=JSON.stringify(render(sita));assert.ok(sitaText.includes('Sita reply'));assert.ok(!sitaText.includes('Ram reply'));
 panels[0].props.onClose();assert.equal(nodes(render(parent),node=>node.type?.name==='UserChatBox').length,1);
 await intervals[0]();assert.equal(nodes(render(parent),node=>node.type?.name==='UserChatBox').length,1);
 inboxData.conversations[0].lastMessage.id='r2';await intervals[0]();assert.equal(nodes(render(parent),node=>node.type?.name==='UserChatBox').length,2);
});
test('room inquiries replace only validated room links and reuse private room reads',async()=>{
 const id='30000000-0000-4000-8000-000000000003',content='Room inquiry · RK-01 · Room\n/rooms/availability?room='+id+'\n\nIs it available?';
 assert.deepEqual(parseRoomInquiry(content),{roomId:id,text:'Is it available?'});
 assert.equal(parseRoomInquiry('Hello https://example.com'),null);
 assert.equal(parseRoomInquiry(content.replace(id,'bad-id')),null);
 const cache=new Map(),a=host(AdminRoomInquiry,{content,cache}),b=host(AdminRoomInquiry,{content,cache});
 render(a,true);render(a,true);render(b,true);render(b,true);await tick();
 assert.equal(roomLoads,1);
 const result=render(a);assert.ok(!JSON.stringify(result).includes('/rooms/availability?room='));
 const video=nodes(result,node=>node.type==='OfficeVideo')[0];assert.equal(video.props.roomId,id);assert.equal(video.props.compact,true);
 const details=nodes(result,node=>node.type==='RoomDetails')[0];assert.equal(details.props.isAdmin,true);assert.equal(details.props.room.ownerPhone,'private-admin-contact');
});
