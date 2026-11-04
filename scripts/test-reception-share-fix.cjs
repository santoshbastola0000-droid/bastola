const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),ts=require('typescript');
function load(path,mocks){
 const src=fs.readFileSync(path,'utf8'),js=ts.transpileModule(src,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React}}).outputText;
 const module={exports:{}};vm.runInNewContext(js,{module,exports:module.exports,require:n=>mocks[n]||{},React:mocks.react,console});return module.exports;
}
function renderHistory(props,values){
 let index=0;
 const react={useEffect:()=>{},useState:initial=>[index<values.length?values[index++]:initial,()=>{}],createElement:(type,props,...children)=>({type,props:props||{},children:children.flat(Infinity)})};
 return load('components/office/AddClientHistory.tsx',{react}).AddClientHistory(props);
}
function nodes(tree){return [tree,...(tree?.children||[]).filter(x=>x&&typeof x==='object').flatMap(nodes)];}
let fixed=null;const values=[true,'Ram','9812345678','','SENT','notes',false,''];
let tree=renderHistory({roomId:'room',canFix:true,onFix:v=>fixed=v,onSaved:()=>{}},values);
const button=nodes(tree).find(x=>x.children?.includes('Fix Room to this Client'));assert.ok(button);
button.props.onClick({currentTarget:{form:{reportValidity:()=>false}}});assert.equal(fixed,null);
button.props.onClick({currentTarget:{form:{reportValidity:()=>true}}});assert.deepEqual(JSON.parse(JSON.stringify(fixed)),{clientName:'Ram',clientPhone:'9812345678',notes:'notes'});
tree=renderHistory({roomId:'room',canFix:false,onFix:()=>{},onSaved:()=>{}},values);
assert.ok(!nodes(tree).some(x=>x.children?.includes('Fix Room to this Client')));
const dashboard=fs.readFileSync('components/office/OfficeDashboard.tsx','utf8');
const share=dashboard.slice(dashboard.indexOf('  async function shareAddRoomLink()'),dashboard.indexOf('  async function saveRoom'));
async function run(shareFn,clipboard){const effects=[];await vm.runInNewContext(ts.transpileModule('('+share.trim()+')()',{compilerOptions:{target:ts.ScriptTarget.ES2020}}).outputText,{window:{location:{origin:'https://roomkhoj.com'}},navigator:{share:shareFn,clipboard:{writeText:clipboard}},setAddRoomLink:v=>effects.push(v),setNotice:v=>effects.push(v)});return effects;}
(async()=>{
 let payload;await run(async p=>payload=p,async()=>assert.fail());assert.equal(payload.url,'https://roomkhoj.com/office/add-room');assert.ok(!JSON.stringify(payload).includes('token'));
 await run(async()=>{throw {name:'AbortError'}},async()=>assert.fail('cancel must not copy'));
 let copied;await run(undefined,async v=>copied=v);assert.equal(copied,payload.url);
 const manual=await run(undefined,async()=>{throw Error()});assert.ok(manual.some(v=>v.includes('Copy the Add Room link')));
 assert.ok(dashboard.includes('!access?.allowed || openedSharedForm.current'));
 const tenant=fs.readFileSync('components/office/TenantForm.tsx','utf8');assert.ok(tenant.includes("if(source || pending.current)return"));assert.ok(tenant.includes('{!source&&<button'));assert.ok(tenant.includes("source?.clientId"));
 console.log('PASS shared link cancellation/copy/manual fallback and selected-client fix validation');
})().catch(e=>{console.error(e);process.exit(1)});
