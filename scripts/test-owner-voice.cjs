const assert=require('node:assert/strict');
const fs=require('fs'),ts=require('typescript'),vm=require('vm');
const exportsObject={};
vm.runInNewContext(ts.transpileModule(fs.readFileSync(require('node:path').join(__dirname,'../lib/voice/owner-voice-turns.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{exports:exportsObject});
const {OwnerVoiceTurns}=exportsObject;
let events=[];let t=new OwnerVoiceTurns(e=>events.push(e));
t.greet();t.tick(8000);assert.equal(events.length,1,'No cue during greeting');
t.handle('response.done',0);t.handle('input_audio_buffer.speech_started',1000);
t.microphone(true,8000);t.tick(8000);assert.equal(events.length,1,'Never interrupt continuous speech');
t.microphone(false,8100);t.tick(8549);assert.equal(events.length,1,'Wait for natural pause');
t.tick(8550);assert.equal(events.length,2);assert.equal(events[1].response.conversation,'none');assert.deepEqual(Array.from(events[1].response.input),[]);
assert.match(events[1].response.instructions,/never agreement/);
t.tick(9000);assert.equal(events.length,2,'Only one cue per turn');
t.handle('output_audio_buffer.started',9000);t.handle('input_audio_buffer.speech_stopped',9100);t.handle('input_audio_buffer.committed',9101);t.handle('response.done',9102);assert.equal(events.length,2,'Wait for cue audio drain');
t.handle('output_audio_buffer.stopped',9103);assert.equal(events.length,3,'Resume normal answer after cue drains');
t.stop();t.microphone(false,99999);t.tick(99999);t.handle('input_audio_buffer.committed',99999);assert.equal(events.length,3,'End prevents late callbacks');
events=[];t=new OwnerVoiceTurns(e=>events.push(e));t.handle('input_audio_buffer.speech_started',0);t.microphone(false,7000);t.tick(7450);assert.equal(events.length,1);
t.microphone(true,7460);assert.equal(events[1].type,'response.cancel');assert.equal(events[2].type,'output_audio_buffer.clear');
t.handle('response.done',7500);t.handle('output_audio_buffer.cleared',7501);t.microphone(false,15000);t.tick(15450);assert.equal(events.length,3,'No repeated cue in same turn');
events=[];t=new OwnerVoiceTurns(e=>events.push(e));t.handle('input_audio_buffer.speech_started',0);t.tick(10000);assert.equal(events.length,0,'No guessed pause without meter');
t.handle('input_audio_buffer.speech_stopped',11000);t.handle('input_audio_buffer.committed',11001);assert.equal(events.length,1,'Normal response works without meter');
events=[];t=new OwnerVoiceTurns(e=>events.push(e));t.handle('input_audio_buffer.speech_started',0);t.microphone(false,1000);t.tick(1450);assert.equal(events.length,0,'Short utterances receive no cue');
t.microphone(false,7000);t.tick(9000);assert.equal(events.length,0,'Stale pause receives no cue');
console.log('PASS: measured pauses, continuous speech, cue interruption, audio serialization, no meter fallback and End cleanup');
const meterExports={};let sampleTick,closed=0,disconnected=0,cleared=0,connected=0;
class FakeAudioContext{
 constructor(){this.state='running';}
 createMediaStreamSource(){return {connect:()=>{connected++;},disconnect:()=>{disconnected++;}};}
 createAnalyser(){return {fftSize:1024,getFloatTimeDomainData:buffer=>buffer.fill(0.1)};}
 resume(){return Promise.resolve();}close(){closed++;return Promise.resolve();}
}
vm.runInNewContext(ts.transpileModule(fs.readFileSync(require('node:path').join(__dirname,'../lib/voice/microphone-meter.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{exports:meterExports,AudioContext:FakeAudioContext,Float32Array,performance:{now:()=>1000},setInterval:fn=>{sampleTick=fn;return 1;},clearInterval:()=>{cleared++;}});
let measurement;const stopMeter=meterExports.monitorMicrophone({},(voiced,levels)=>{measurement={voiced,levels};});sampleTick();
assert.equal(measurement.voiced,true);assert.equal(measurement.levels.length,7);assert.ok(measurement.levels.every(v=>v>0));assert.equal(connected,1,'Only analyser connected; no speaker monitor path');
stopMeter();assert.equal(cleared,1);assert.equal(closed,1);assert.equal(disconnected,1);console.log('PASS: real-signal meter and audio resource cleanup');
