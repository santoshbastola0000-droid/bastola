const {test}=require("node:test"),assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const root=process.env.ROOM_NAV_SOURCE_ROOT||path.resolve(__dirname,"..");
let user=null,pathname="/rooms",apiCalls=[],timers=0,events=[],storage=new Map();
const RoomScreen=()=>null;
const jsx=(type,props)=>({type,props});
function load(relative){
 const filename=process.env.ROOM_NAV_COMPILED?path.join(process.env.ROOM_NAV_COMPILED,relative.replace(/\.tsx$/,".js")):path.join(root,relative);
 const code=process.env.ROOM_NAV_COMPILED?fs.readFileSync(filename,"utf8"):require("typescript").transpileModule(fs.readFileSync(filename,"utf8"),{compilerOptions:{jsx:4,module:1,target:9,esModuleInterop:true}}).outputText;
 const exports={};
 const requireMock=name=>{
  if(name==="react/jsx-runtime")return{jsx,jsxs:jsx};
  if(name==="react")return{useState:initial=>[typeof initial==="function"?initial():initial,()=>{}],useRef:initial=>({current:initial}),useId:()=>"id",useEffect:fn=>fn()};
  if(name==="@/stores/user-store")return{useUserStore:fn=>fn({user})};
  if(name==="@/store")return{default:fn=>fn({token:user?"token":null}),__esModule:true};
  if(name==="next/navigation")return{usePathname:()=>pathname,useRouter:()=>({push(){}}),redirect:href=>{throw Error("redirect:"+href);}};
  if(name==="next/dynamic")return{default:()=>"FeedScreen",__esModule:true};
  if(name==="next/link")return{default:"Link",__esModule:true};
  if(name==="@/components/providers/LanguageProvider")return{useLanguage:()=>({language:"en"})};
  if(name==="@/components/rooms/RoomBrowseScreen")return{RoomBrowseScreen:RoomScreen};
  if(name==="@/http/api/api")return{api:{get:async url=>{apiCalls.push(url);return{data:{id:"room"}};}}};
  if(name==="@/http/services/office.service")return{officeBackend:"https://api.roomkhoj.com",officeError:e=>e.message};
  return new Proxy({}, {get:(_,property)=>String(property)});
 };
 const window={location:{href:"https://www.roomkhoj.com/rooms"},dispatchEvent:event=>events.push(event.type),addEventListener(){},removeEventListener(){},setTimeout(){timers++;return 1;},clearTimeout(){}};
 const document={body:{style:{overflow:""}},addEventListener(){},removeEventListener(){}};
 vm.runInNewContext(code,{exports,require:requireMock,URL,URLSearchParams,Intl,Date,Number,window,document,Event,sessionStorage:{setItem:(key,value)=>storage.set(key,value)}},{filename});
 return exports;
}
function reset(){user=null;pathname="/rooms";apiCalls=[];timers=0;events=[];storage=new Map();}
test("guest homepage shows room browser directly",()=>{reset();assert.equal(load("app/page.tsx").default().type,RoomScreen);});
test("signed-in homepage retains Feed",()=>{reset();user={id:"user"};assert.equal(load("app/page.tsx").default().type,"FeedScreen");});
test("guest shared room does not fetch details and explicitly requests login with room return target",()=>{
 reset();const component=load("components/office/RoomListingDetails.tsx");
 const result=component.SharedAvailabilityRoom({id:"room-id"});assert.equal(apiCalls.length,0);assert.equal(result.type,"button");
 result.props.onClick();assert.equal(storage.get("roomkhoj_post_auth_redirect"),"/rooms?room=room-id");assert.deepEqual(events,["roomkhoj:open-login"]);
});
test("detail dialog cannot render while logged out",()=>{reset();assert.equal(load("components/office/RoomListingDetails.tsx").RoomListingDetails({room:{id:"room"},onClose(){}}),null);});
test("room browsing has no timed login popup",()=>{for(const route of ["/","/rooms","/rooms/availability"]){reset();pathname=route;assert.equal(load("components/GuestLoginPopup.tsx").GuestLoginPopup(),null);assert.equal(timers,0);}});
test("desktop navigation exposes five mobile destinations with Room pointing to /rooms",()=>{
 reset();user={id:"user"};const result=load("components/DesktopPrimaryNav.tsx").DesktopPrimaryNav({isAuthenticated:true});
 const links=result.props.children;
 assert.deepEqual(Array.from(links,link=>link.props.href),["/feed","/rooms","/reels","/messages","/user/dashboard/profile"]);
 assert.equal(links[1].props["aria-current"],"page");
});
test("legacy availability links retain deep-link and filter parameters",async()=>{
 reset();const component=load("app/rooms/availability/page.tsx").default;
 await assert.rejects(component({searchParams:Promise.resolve({room:"abc",q:"Pokhara",cat:["single","flat"]})}),/redirect:\/rooms\?room=abc&q=Pokhara&cat=single&cat=flat/);
});
