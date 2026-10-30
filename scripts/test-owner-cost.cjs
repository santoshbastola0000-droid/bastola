const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ts=require('typescript');
const React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
function load(file,mocks={}){const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.ReactJSX}}).outputText,{exports,require:name=>name in mocks?mocks[name]:require(name),process,Promise});return exports;}
const {OwnerCostReporter,costUsageEvent}=load('lib/voice/owner-cost-reporter.ts');
const event={type:'response.done',response:{id:'resp_1',status:'cancelled',usage:{total_tokens:2,input_tokens:1,output_tokens:1,input_token_details:{text_tokens:0,audio_tokens:1,cached_tokens:0},output_token_details:{text_tokens:0,audio_tokens:1}},output:[{transcript:'PRIVATE'}]},apiKey:'SECRET'};
assert.ok(!JSON.stringify(costUsageEvent(event)).match(/PRIVATE|SECRET|output\"/),'Only usage, no transcript or credentials');
assert.equal(costUsageEvent({type:'response.done',response:{id:'bad'}}).type,'missing');
assert.equal(costUsageEvent({type:'unrelated',transcript:'PRIVATE'}),null);
assert.equal(costUsageEvent({type:'input_audio_buffer.committed',item_id:'item1'}).type,'transcription_pending');
assert.equal(costUsageEvent({type:'conversation.item.input_audio_transcription.completed',item_id:'item1',usage:{type:'tokens',total_tokens:2,input_tokens:1,output_tokens:1},transcript:'PRIVATE'}).type,'transcription');
(async()=>{
 let calls=[],shown=[],failed=false;
 const reporter=new OwnerCostReporter(async e=>{calls.push(e);if(e.type==='usage'&&!failed){failed=true;throw Error('retry');}return {id:'s',responseCount:1};},r=>shown.push(r));
 reporter.start();reporter.handle(event);reporter.end();reporter.end();reporter.handle(event);await reporter.queue;
 assert.deepEqual(calls.map(x=>x.type),['started','usage','usage','ended']);assert.equal(shown.length,3);
 const broken=new OwnerCostReporter(async()=>{throw Error('offline');},r=>shown.push(r));broken.start();await broken.queue;assert.equal(shown.at(-1),null,'Telemetry failure must not display zero');
 const {OwnerVoiceCostPanel}=load('components/OwnerVoiceCostPanel.tsx',{'@/store':{__esModule:true,default:()=>null}});
 const report={id:'s',model:'mini',durationSeconds:60,estimatedAiNpr:4.5,nprPerMinute:4.5,targetNprPerMinute:3,overTarget:true,responseCount:1,incomplete:false,ended:true,stale:false,usdToNpr:153,fxSource:'Planning',pricesCheckedAt:'2026-10-30'};
 const html=renderToStaticMarkup(React.createElement(OwnerVoiceCostPanel,{report}));assert.match(html,/border-red-500/);assert.match(html,/रु. 4.50/);assert.match(html,/provider bill होइन/);
 const unknown=renderToStaticMarkup(React.createElement(OwnerVoiceCostPanel,{}));assert.match(unknown,/मापन उपलब्ध छैन/);assert.doesNotMatch(unknown,/रु. 0.00/);
 const phone=renderToStaticMarkup(React.createElement(OwnerVoiceCostPanel,{phone:true}));assert.match(phone,/STT\/LLM\/TTS/);
 console.log('PASS: privacy-safe usage, canceled response billing, transcription events, serial retry/End cleanup, telemetry failure, red flag and unknown/phone UI');
})().catch(e=>{console.error(e);process.exitCode=1;});
