const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),ts=require('typescript');
function compile(source,extra={}) {
 const module={exports:{}};
 const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React}}).outputText;
 vm.runInNewContext(js,{module,exports:module.exports,require:()=>({}),console,...extra});
 return module.exports;
}
const helper=compile(fs.readFileSync('lib/reception-client-history.ts','utf8'));
const e=(id,clientId,roomId,date)=>({id,clientId,roomId,createdAt:date,clientName:'Ram',clientPhone:'9812345678',code:'RK-1',title:'Room',location:'Pokhara',price:5000,status:'AVAILABLE'});
const a=e('1','a','r1','2026-11-01'),b=e('2','b','r2','2026-11-02'),c=e('3','a','r1','2026-11-02'),d=e('4','a','r3','2026-11-01');
assert.equal(helper.clientHistoryGroups([a,b,c,d]).length,2);
const rooms=helper.clientRoomHistory('a',[a,b,c,d]);assert.equal(rooms.length,2);assert.equal(rooms[0].id,'3');assert.ok(rooms.every(x=>x.clientId==='a'));
const history=fs.readFileSync('components/office/ReceptionHistory.tsx','utf8');
assert.ok(!history.includes('<RoomDetails'));assert.ok(history.includes('row.clientId===client.clientId'));
const React={createElement:(type,props,...children)=>({type,props:props||{},children:children.flat(Infinity)}),useState:v=>[v,()=>{}],useRef:v=>({current:v}),useEffect:()=>{}};
const uiModule= {exports:{}};
const js=ts.transpileModule(history+'\nexport { CompactClientRoom };',{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React}}).outputText;
vm.runInNewContext(js,{module:uiModule,exports:uiModule.exports,require:n=>n==='react'?React:{},React,console});
function nodes(x){return [x,...(x.children||[]).filter(v=>v&&typeof v==='object').flatMap(nodes)];}
let calls=0,release;
const deferred=new Promise(r=>release=r);
const rendered=uiModule.exports.CompactClientRoom({entry:a,busy:false,onSend:()=>assert.fail(),onOutcome:async()=>{calls++;await deferred;}});
const checkbox=nodes(rendered).find(x=>x.type==='input'&&x.props.type==='checkbox');assert.ok(checkbox);assert.equal(checkbox.props.checked,false);
checkbox.props.onChange({target:{checked:true}});checkbox.props.onChange({target:{checked:true}});assert.equal(calls,1,'double tick must not submit twice');release();
for(const entry of [{...a,status:'RENTED'},{...a,occupancyStatus:'MOVED_IN'}]) {
 const tree=uiModule.exports.CompactClientRoom({entry,busy:false,onSend:()=>{},onOutcome:async()=>{}});
 assert.equal(nodes(tree).find(x=>x.type==='input').props.disabled,true);
}
const dash=fs.readFileSync('components/office/OfficeDashboard.tsx','utf8');
const start=dash.indexOf('  async function saveOutcome('),end=dash.indexOf('  const roomEditor',start);
const body=dash.slice(start,end);assert.ok(!body.includes('setTenantRoom'));assert.ok(!body.includes('setTenantSource'));
const effects=[];let visit;
const controller=compile('export '+body.trim(),{officeService:{visit:async(...args)=>{visit=args;}},setBusy:v=>effects.push(v),setError:()=>{},setNotice:()=>{},setHistoryRevision:()=>{},setMatchingRevision:()=>{},tab:'history',reloadRooms:()=>assert.fail(),officeError:e=>e.message});
(async()=>{await controller.saveOutcome(a,'MOVED_IN','confirmed');assert.equal(visit[0],'r1');assert.equal(visit[1].clientPhone,a.clientPhone);assert.equal(visit[2],'MOVED_IN');assert.equal(effects[effects.length-1],false);console.log('PASS client grouping, latest room dedup, exact client isolation, compact fixed checkbox, double-click guard and direct MOVED_IN without tenant form');})().catch(e=>{console.error(e);process.exit(1)});
