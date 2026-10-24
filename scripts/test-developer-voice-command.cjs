const {test}=require('node:test');const assert=require('node:assert/strict');
const fs=require('fs'),path=require('path'),ts=require('typescript');
const code=fs.readFileSync(path.join(__dirname,'../lib/voice/developer-voice-command.ts'),'utf8');
const compiled=ts.transpileModule(code,{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
const mod={exports:{}};new Function('exports','module',compiled)(mod.exports,mod);
const {developerVoiceCommand}=mod.exports;
test('recognizes explicit voice unlock requests',()=>{for(const s of ['Developer mode on.','developer mood on gara','कृपया डेभलपर मोड अन गर','developer mode खोल्नुहोस्'])assert.equal(developerVoiceCommand(s),'ON');});
test('recognizes explicit voice lock requests',()=>{for(const s of ['developer mode off','डेभलपर मोड बन्द गर','please developer mood off'])assert.equal(developerVoiceCommand(s),'OFF');});
test('ordinary speech and credentials cannot activate a mode',()=>{for(const s of ['हजुर','1234567890','a password','developer mode on होइन','explain developer mode on','developer mode on then save memory'])assert.equal(developerVoiceCommand(s),null);});
