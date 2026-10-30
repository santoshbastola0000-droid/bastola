const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ts=require('typescript');
const React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
function load(file,mocks={},globals={}){const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.ReactJSX}}).outputText,{exports,require:name=>name in mocks?mocks[name]:require(name),process,Promise,...globals});return exports;}
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
 // Render the real practice component with controlled hooks/transport. An older backend
 // must fail before opening the mic, issuing a voice token, or contacting OpenAI.
 let openedMic=0,requests=[];
 const hooks={useState:v=>[v,()=>{}],useRef:v=>({current:v}),useEffect:()=>{},useCallback:f=>f};
 const mocks={
  react:hooks,'next/dynamic':{__esModule:true,default:()=>()=>null},
  '@/store':{__esModule:true,default:selector=>selector({token:'test-only'})},
  '@/lib/voice/owner-cost-reporter':{OwnerCostReporter},
  '@/components/OwnerVoiceCostPanel':{OwnerVoiceCostPanel:()=>null},
  '@/lib/voice/developer-voice-command':{developerVoiceCommand:()=>null},
  '@/components/OwnerListeningIndicator':{OwnerListeningIndicator:()=>null},
  '@/lib/voice/microphone-meter':{monitorMicrophone:()=>()=>{}},
  '@/lib/voice/owner-voice-turns':{OwnerVoiceTurns:class{}},
  '@/lib/voice/owner-map-lookup':{OwnerMapLookup:class{}},
  '@/components/OwnerMapCandidates':{OwnerMapCandidates:()=>null}
 };
 const Practice=load('components/OwnerRealtimeVoice.tsx',mocks,{
  navigator:{mediaDevices:{getUserMedia:async()=>{openedMic++;throw Error('Unexpected microphone');}}},
  RTCPeerConnection:class {constructor(){throw Error('Unexpected provider connection');}},
  AbortController,AbortSignal,DOMException,setTimeout:()=>1,clearTimeout:()=>{},clearInterval:()=>{},
  fetch:async url=>{requests.push(String(url));return {ok:false,status:404};}
 }).default;
 const tree=Practice({});
 function findStart(node){if(!node||typeof node!=='object')return null;
  if(node.type==='button'&&String(node.props.children).startsWith('Start'))return node;
  for(const child of [].concat(node.props?.children||[])){const found=findStart(child);if(found)return found;}return null;}
 const start=findStart(tree);assert.ok(start);start.props.onClick();await new Promise(resolve=>setImmediate(resolve));
 assert.equal(openedMic,0);assert.equal(requests.length,1);assert.match(requests[0],/admin\/voice-cost-config$/);
 console.log('PASS: older/missing backend fails closed before mic, voice-token or paid model connection');
 console.log('PASS: privacy-safe usage, canceled response billing, transcription events, serial retry/End cleanup, telemetry failure, red flag and unknown/phone UI');
})().catch(e=>{console.error(e);process.exitCode=1;});
