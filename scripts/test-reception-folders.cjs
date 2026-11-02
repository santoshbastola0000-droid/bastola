const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const vm = require('node:vm');
const source = fs.readFileSync('components/office/OfficeDashboard.tsx','utf8');
const tree = ts.createSourceFile('dashboard.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
let privatePlayers = 0;
function walk(node) {
  if (ts.isJsxSelfClosingElement(node) && node.tagName.getText(tree)==='OfficeVideo') {
    const attrs=node.attributes.properties.map(p=>p.name?.getText(tree));
    assert.ok(!attrs.includes('available'),'Reception must not use availability-gated public playback');
    assert.ok(attrs.includes('roomId'));
    privatePlayers++;
  }
  ts.forEachChild(node,walk);
}
walk(tree);
assert.equal(privatePlayers,2,'card and drawer both use authenticated playback');
const handler=source.match(/onClick=\{\(\) => \{ setFolder\(status\);[^}]+\}\}/);
assert.ok(handler,'folder switch handler exists');
for(const status of ['ALL','AVAILABLE','EXPIRED','RENTED']) {
  const state={};
  vm.runInNewContext('('+handler[0].slice(9,-1)+')()',{
    status,
    setFolder:v=>state.folder=v,setPage:v=>state.page=v,
    setLocationFilter:v=>state.location=v,setTypeFilter:v=>state.type=v,
    setPriceFilter:v=>state.price=v,setPreviewRoomId:v=>state.preview=v
  });
  assert.deepEqual(state,{folder:status,page:0,location:'',type:'',price:'',preview:null});
}
console.log('PASS Reception private playback and all four folder filter resets');
