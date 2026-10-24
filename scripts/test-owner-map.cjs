const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),ts=require('typescript');
function load(file){const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname,'../lib/voice',file),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{exports,AbortController,setTimeout,clearTimeout});return exports;}
const {OwnerVoiceTurns}=load('owner-voice-turns.ts'),{OwnerMapLookup}=load('owner-map-lookup.ts');
const flush=()=>new Promise(resolve=>setImmediate(resolve));
const tool=(id='call-1')=>({type:'response.function_call_arguments.done',name:'lookup_owner_location',call_id:id,arguments:JSON.stringify({area:'sirjanachok',city:'pokhara',landmark:'',ownerWords:'invented model words'})});
(async()=>{
 let events=[],shown=[],args,finish;
 const turns=new OwnerVoiceTurns(e=>events.push(e));turns.greet();
 const lookup=new OwnerMapLookup(turns,e=>events.push(e),input=>{args=input;return new Promise(resolve=>finish=resolve);},r=>shown.push(r));
 lookup.handle({type:'conversation.item.input_audio_transcription.completed',item_id:'owner1',transcript:'pokhara sirjanachok bata vitra'});
 lookup.handle(tool());lookup.handle(tool());
 turns.handle('response.done',0);assert.equal(events.length,1,'Wait for lookup result');
 finish({available:true,reason:'CANDIDATES_ONLY',nearby:[{name:'Real provider shop'}]});await flush();
 assert.equal(args.ownerWords,'pokhara sirjanachok bata vitra','Use owner transcript, never model evidence');
 assert.equal(shown.length,1);assert.equal(events[1].item.type,'function_call_output');assert.equal(events.filter(e=>e.type==='response.create').length,2,'Exactly one response after tool result');
 lookup.stop();turns.stop();
 events=[];shown=[];let resolveStale;
 const t2=new OwnerVoiceTurns(e=>events.push(e));t2.greet();
 const stale=new OwnerMapLookup(t2,e=>events.push(e),()=>new Promise(r=>resolveStale=r),r=>shown.push(r));
 stale.handle(tool());stale.handle({type:'input_audio_buffer.speech_started'});t2.handle('input_audio_buffer.speech_started',1);t2.handle('response.done',2);
 resolveStale({available:true,reason:'CANDIDATES_ONLY',nearby:[{name:'Old shop'}]});await flush();
 assert.equal(shown.length,0,'Never show stale map result');assert.match(events.at(-1).item.output,/OWNER_CONTINUED_SPEAKING/);assert.doesNotMatch(events.at(-1).item.output,/Old shop/);
 assert.equal(events.filter(e=>e.type==='response.create').length,1,'No interrupted stale answer');stale.stop();t2.stop();
 let release;events=[];const t3=new OwnerVoiceTurns(e=>events.push(e));
 const ended=new OwnerMapLookup(t3,e=>events.push(e),(_a,signal)=>{signal.addEventListener('abort',()=>{});return new Promise(r=>release=r);},()=>assert.fail('End blocks late UI'));
 ended.handle(tool());ended.stop();t3.stop();release({available:true,reason:'CANDIDATES_ONLY'});await flush();assert.equal(events.length,0,'End blocks late audio and map output');
 const t4=new OwnerVoiceTurns(e=>events.push(e));const failed=new OwnerMapLookup(t4,e=>events.push(e),async()=>{throw new Error('offline');},()=>{});failed.handle(tool());await flush();assert.match(events[0].item.output,/MAP_LOOKUP_UNAVAILABLE/);assert.equal(events[1].type,'response.create','Continue talking after map failure');failed.stop();t4.stop();
 console.log('PASS: map tool serialization, real owner evidence, duplicate calls, stale results, End cleanup and map failure fallback');
})().catch(e=>{console.error(e);process.exitCode=1;});
