const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),ts=require('typescript');
function nodes(x){return x&&typeof x==='object'?[x,...(x.children||[]).flatMap(nodes)]:[];}
function render(states={},request=async()=>({id:'new'})){
 let i=0;const updates={},calls=[];const React={createElement:(type,props,...children)=>({type,props:props||{},children:children.flat(Infinity)}),useEffect:()=>{},useRef:v=>({current:v}),useState:v=>{const key=i++;return [key in states?states[key]:v,next=>updates[key]=next];}};
 const module={exports:{}};
 vm.runInNewContext(ts.transpileModule(fs.readFileSync('components/office/PendingClientIntake.tsx','utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React}}).outputText,{module,exports:module.exports,React,require:n=>n==='react'?React:n.includes('office.service')?{officeService:{createPendingClient:async data=>{calls.push(data);return request(data);}},officeError:e=>e.message}:{blankMatch:{roomType:'ANY'},requirementsPayload:x=>x}});
 return {tree:module.exports.PendingClientIntake(),updates,calls};
}
(async()=>{
 assert.equal(render().tree,null);assert.equal(render({0:{allowed:false}}).tree,null);
 const old=render({0:{allowed:true}});assert.equal(nodes(old.tree).find(x=>x.type==='button').props.disabled,true);
 const allowed={allowed:true,pendingClientIntake:true};
 let ui=render({0:allowed});nodes(ui.tree).find(x=>x.type==='button').props.onClick();assert.equal(ui.updates[1],true);
 let release;const pending=new Promise(r=>release=r);ui=render({0:allowed,1:true,2:'Test',3:'9812345678',6:true},()=>pending);
 const submit=nodes(ui.tree).find(x=>x.type==='form').props.onSubmit;
 const first=submit({preventDefault(){}});await submit({preventDefault(){}});assert.equal(ui.calls.length,1);assert.equal(ui.calls[0].confirmedUnpaid,true);assert.equal(ui.calls[0].clientPhone,'9812345678');release();await first;assert.equal(ui.updates[1],false);assert.equal(ui.updates[2],'');
 ui=render({0:allowed,1:true,6:false});await nodes(ui.tree).find(x=>x.type==='form').props.onSubmit({preventDefault(){}});assert.equal(ui.calls.length,0);
 ui=render({0:allowed,1:true,6:true},async()=>{throw Error('Client already saved');});await nodes(ui.tree).find(x=>x.type==='form').props.onSubmit({preventDefault(){}});assert.equal(ui.updates[8],'Client already saved');assert.equal(ui.updates[2],undefined);
 const saved=fs.readFileSync('components/office/SavedClients.tsx','utf8');assert.ok(saved.includes("staffIntake?.paymentState==='PENDING'"));assert.ok(saved.includes('border-yellow-400 bg-yellow-50'));
 const availability=fs.readFileSync('components/office/RoomAvailability.tsx','utf8');assert.ok(availability.includes('user?.id&&<PendingClientIntake key={user.id}/>'));
 console.log('PASS permission and capability gating, confirmed-only intake, duplicate click guard, success/error form state and yellow saved marker wiring');
})().catch(e=>{console.error(e);process.exit(1);});