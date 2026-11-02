const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
const source=fs.readFileSync('components/office/OfficeDashboard.tsx','utf8');
assert.ok(source.includes('if (!access?.allowed || addRoomOnOpen) return;'),'standalone must skip list effects');
assert.ok(source.includes('if (addRoomOnOpen) return;'),'standalone must skip reloadRooms');
assert.ok(source.includes("if (addRoomOnOpen || !access?.allowed"),'standalone must skip refresh timer');
const start=source.indexOf('  if (addRoomOnOpen) return <section');
const end=source.indexOf('  return <div className="grid items-start',start);
assert.ok(start>0&&end>start);
const branch=source.slice(start,end);
for(const notice of ['', 'Room saved. Code: RK-123']) {
 for(const showEditor of [true,false]) {
  const module={exports:{}};
  const js=ts.transpileModule('export function render(){'+branch+'}',{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React}}).outputText;
  const React={createElement:(type,props,...children)=>({type,props:props||{},children:children.flat(Infinity)})};
  vm.runInNewContext(js,{module,exports:module.exports,React,addRoomOnOpen:true,showEditor,notice,button:'button',openEditor:()=>{},roomEditor:{type:'ROOM_FORM',children:[]}});
  const result=module.exports.render();
  const flat=x=>[x,...(x.children||[]).filter(v=>v&&typeof v==='object').flatMap(flat)];
  const nodes=flat(result),serialized=JSON.stringify(result);
  assert.equal(result.props['aria-label'],'Staff room entry');
  assert.ok(nodes.some(n=>n.type==='ROOM_FORM'));
  for(const label of ['Saved Clients','Reception search','Staff access','Room requests','Fixed to:'])assert.ok(!serialized.includes(label),label+' must stay absent');
 }
}
console.log('PASS standalone Add Room renders no dashboard before/after save; skips list fetch/reload/polling');
