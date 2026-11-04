const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),ts=require('typescript');
function compile(path,mocks={},globals={}){
 const module={exports:{}};
 vm.runInNewContext(ts.transpileModule(fs.readFileSync(path,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React}}).outputText,{module,exports:module.exports,require:n=>mocks[n]||{},console,...globals});
 return module.exports;
}
const helper=compile('lib/reception-client-lookup.ts');
const client=(id,phone='9812345678')=>({id,name:'Client '+id,phone,notes:'',requirements:{},active:true,createdAt:'2026-11-04'});
function nodes(x){return x&&typeof x==='object'?[x,...(x.children||[]).flatMap(nodes)]:[];}
const flush=()=>new Promise(resolve=>setImmediate(resolve));
function harness(initial,fetchPage,visit=async()=>{}){
 const state=[...initial],refs=[],effects=[],timers=new Map();let cursor=0,refCursor=0,id=0,tree,saved=0;
 const react={createElement:(type,props,...children)=>({type,props:props||{},children:children.flat(Infinity)}),useState:value=>{const at=cursor++;if(!(at in state))state[at]=value;return [state[at],value=>state[at]=typeof value==='function'?value(state[at]):value];},useRef:value=>{const at=refCursor++;return refs[at]||(refs[at]={current:value});},useEffect:fn=>effects.push(fn)};
 const mod=compile('components/office/AddClientHistory.tsx',{react,'@/lib/reception-client-lookup':helper,'@/http/services/office.service':{officeService:{clients:fetchPage,visit},officeError:e=>e.message}},{React:react,window:{setTimeout:fn=>{timers.set(++id,fn);return id;},clearTimeout:id=>timers.delete(id)}});
 function render(){cursor=0;refCursor=0;effects.length=0;tree=mod.AddClientHistory({roomId:'room-a',onSaved:()=>saved++});return tree;}
 return {state,render,effect:()=>effects[0](),runTimers:()=>{const tasks=[...timers.values()];timers.clear();tasks.forEach(fn=>fn());},get saved(){return saved;}};
}
function lookup(tree){return nodes(tree).find(n=>n.type==='input'&&n.props.placeholder==='98XXXXXXXX');}
(async()=>{
 for(const input of ['9812345678','+977 981-234-5678','00977 9812345678','९८१२३४५६७८'])assert.equal(helper.normalizeClientLookupPhone(input),'9812345678');
 for(const input of ['+1 9812345678','981234567899','phone 9812345678','98123 / 45678',''])assert.equal(helper.normalizeClientLookupPhone(input),null);
 let pages=[];
 const rows=await helper.findSavedClientsByPhone('9812345678',async(q,p)=>{pages.push([q,p]);return {clients:p?[client('target')]:Array.from({length:20},(_,i)=>client(String(i),'9800000000')),total:21};});
 assert.equal(rows.length,1);assert.equal(rows[0].id,'target');assert.equal(pages.length,2);
 const ambiguous=await helper.findSavedClientsByPhone('9812345678',async(q,p)=>({clients:p?[client('b')]:[client('a')],total:21}));assert.equal(ambiguous.length,2);
 await assert.rejects(()=>helper.findSavedClientsByPhone('9812345678',async(q,p)=>{if(p)throw Error('network');return {clients:[client('a')],total:21};}),/network/);
 await assert.rejects(()=>helper.findSavedClientsByPhone('9812345678',async()=>({clients:[],total:21})),/incomplete/);
 let current=true,calls=0;
 await helper.findSavedClientsByPhone('9812345678',async()=>{calls++;current=false;return {clients:[],total:40};},()=>current);assert.equal(calls,1);
 let visits=0;
 const h=harness([true,'','','','SENT','',false,'','9812345678'],async()=>({clients:[client('a')],total:1}),async()=>visits++);
 h.render();const cleanup=h.effect();h.runTimers();await flush();assert.equal(h.state[1],'Client a');assert.equal(h.state[2],'9812345678');assert.equal(visits,0);
 let tree=h.render();lookup(tree).props.onChange({target:{value:'9800000000'}});assert.equal(h.state[1],'');assert.equal(h.state[2],'');cleanup();
 let resolve;const delayed=new Promise(r=>resolve=r);
 const stale=harness([true,'','','','SENT','',false,'','9812345678'],()=>delayed);
 stale.render();stale.effect();stale.runTimers();
 tree=stale.render();lookup(tree).props.onChange({target:{value:'9800000000'}});
 resolve({clients:[client('old')],total:1});await flush();assert.equal(stale.state[1],'');assert.equal(stale.state[2],'');
 let resolveManual;const waiting=new Promise(r=>resolveManual=r);
 const manual=harness([true,'','','','SENT','',false,'','9812345678'],()=>waiting);
 manual.render();manual.effect();manual.runTimers();
 tree=manual.render();nodes(tree).find(n=>n.type==='input'&&n.props.maxLength===150).props.onChange({target:{value:'Manual name'}});
 resolveManual({clients:[client('late')],total:1});await flush();assert.equal(manual.state[1],'Manual name');
 const cancel=harness([true,'','','','SENT','',false,'','9812345678'],async()=>({clients:[],total:0}));
 tree=cancel.render();nodes(tree).find(n=>n.type==='button').props.onClick();assert.equal(cancel.state[0],false);assert.equal(cancel.state[8],'');
 let end,submits=0;const saving=new Promise(r=>end=r);
 const submit=harness([true,'Manual','9812345678','','SENT','note'],async()=>({clients:[],total:0}),async()=>{submits++;await saving;});
 tree=submit.render();const save=nodes(tree).find(n=>n.type==='form').props.onSubmit;
 const first=save({preventDefault(){}});await save({preventDefault(){}});assert.equal(submits,1);end();await first;assert.equal(submit.saved,1);assert.equal(submit.state[1],'');
 console.log('PASS exact Nepal phones, full pagination, ambiguity, incomplete/error handling, cancellation, stale lookup/manual-entry isolation, autofill reset and duplicate submit guard; no provider calls');
})().catch(e=>{console.error(e);process.exit(1);});
