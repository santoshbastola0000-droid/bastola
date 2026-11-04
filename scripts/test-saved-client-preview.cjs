const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),ts=require('typescript');
const source=fs.readFileSync('components/office/SavedClients.tsx','utf8');
const client={id:'client-a',name:'Test Client',phone:'9812345678',createdAt:'2026-11-01',requirements:{city:'Pokhara',maxRent:6000},notes:'Near bus stop'};
function render(states={}) {
 let index=0;const updates={};const React={createElement:(type,props,...children)=>({type,props:props||{},children:children.flat(Infinity)}),useEffect:()=>{},useState:initial=>{const key=index++;return [key in states?states[key]:initial,value=>updates[key]=value];}};
 const module={exports:{}};const requests=[];
 const js=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React}}).outputText;
 vm.runInNewContext(js,{module,exports:module.exports,React,require:n=>n==='react'?React:n.includes('privateApi')?{privateApi:{get:async url=>{requests.push(url);return {data:{id:'paper-a',createdAt:client.createdAt,values:{fullName:client.name}}};}}}:{},console});
 return {tree:module.exports.SavedClients({revision:0}),updates,requests};
}
function nodes(x){return x&&typeof x==='object'?[x,...(x.children||[]).flatMap(nodes)]:[];}
function text(x){return typeof x==='string'?x:(x?.children||[]).map(text).join('');}
(async()=>{
 let ui=render({14:[client]}); // Render a saved client while all details remain collapsed.
 // Find state position without relying on silently rendering an empty list.
 if(!nodes(ui.tree).some(x=>text(x)==='Form Preview')) throw Error('client fixture not rendered');
 nodes(ui.tree).find(x=>x.type==='button'&&text(x).includes('Add Client Details')).props.onClick();assert.equal(ui.updates[0],true);
 nodes(ui.tree).find(x=>x.type==='button'&&text(x)==='Form Preview').props.onClick();
 assert.equal(ui.updates[4].values.fullName,client.name);assert.equal(ui.updates[4].values.phone,client.phone);
 assert.equal(ui.updates[4].values.paymentCode,undefined);assert.equal(ui.updates[4].values.documentNumber,undefined);assert.equal(ui.requests.length,0);
 ui=render({3:{[client.id]:{id:'paper / a'}},14:[client]});
 await nodes(ui.tree).find(x=>x.type==='button'&&text(x)==='Form Preview').props.onClick();
 await new Promise(resolve=>setImmediate(resolve));assert.equal(ui.requests[0],'/office/paper-forms/paper%20%2F%20a');
 assert.equal(ui.updates[4].id,'paper-a');
 const phoneFn=source.match(/const phoneKey=(.*);/)[1].replace('(v:string)','(v)');assert.equal(vm.runInNewContext('('+phoneFn+')')('+977 981-234-5678'),'9812345678');
 const paper=fs.readFileSync('components/admin/records/PaperClientForm.tsx','utf8');
 assert.ok(paper.includes('if(!allowBrowserDraft)return;'));assert.ok(source.includes('allowBrowserDraft={false}'));
 console.log('PASS add-client action, saved-data preview, blank sensitive/payment fields, authorized encoded paper fetch, formatted phone matching and embedded draft isolation');
})().catch(e=>{console.error(e);process.exit(1);});
