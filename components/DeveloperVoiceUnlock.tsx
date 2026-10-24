"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import useTokenStore from "@/store";
const API=(process.env.NEXT_PUBLIC_BACKEND_URL||"https://api.roomkhoj.com").replace(/\/$/,"");
type Session={id:string;expiresAt:string};
type Challenge=Session&{unlockStage:"PASSWORD"|"PHONE"};
type Result={accepted:boolean;stage:"PASSWORD"|"PHONE"|"VERIFIED";session?:Session};
export default function DeveloperVoiceUnlock({onVerified}:{onVerified:(session:Session)=>void}) {
  const token=useTokenStore(s=>s.token);
  const [challenge,setChallenge]=useState<Challenge|null>(null);
  const challengeRef=useRef<Challenge|null>(null);
  const callback=useRef(onVerified);callback.current=onVerified;
  const [value,setValue]=useState("");
  const [status,setStatus]=useState("");
  const [busy,setBusy]=useState(false);
  const [recording,setRecording]=useState(false);
  const epoch=useRef(0);
  const activeRequest=useRef<AbortController|null>(null);
  const pending=useRef(false);
  const recorder=useRef<MediaRecorder|null>(null);
  const stream=useRef<MediaStream|null>(null);
  const timer=useRef<ReturnType<typeof setTimeout>|null>(null);
  const promptAudio=useRef<HTMLAudioElement|null>(null);
  const audioUrl=useRef("");

  const stopDevices=useCallback(()=>{
    if(timer.current)clearTimeout(timer.current);timer.current=null;
    const current=recorder.current;recorder.current=null;
    if(current){current.onstop=null;current.ondataavailable=null;if(current.state!=='inactive')current.stop();}
    stream.current?.getTracks().forEach(track=>track.stop());stream.current=null;
    promptAudio.current?.pause();promptAudio.current=null;
    if(audioUrl.current)URL.revokeObjectURL(audioUrl.current);audioUrl.current="";
    window.speechSynthesis?.cancel();
  },[]);
  const cancel=useCallback(()=>{
    epoch.current++;activeRequest.current?.abort();activeRequest.current=null;pending.current=false;stopDevices();
    const old=challengeRef.current;challengeRef.current=null;setChallenge(null);setValue("");setRecording(false);setBusy(false);setStatus("");
    if(old)void fetch(API+'/ai-owner/admin/training/sessions/'+old.id,{method:'DELETE',credentials:'include',headers:{Authorization:`Bearer ${token}`}}).catch(()=>undefined);
  },[token,stopDevices]);
  useEffect(()=>{return cancel;},[cancel]);

  async function request(path:string,body:unknown,signal?:AbortSignal){
    const multipart=body instanceof FormData;
    const response=await fetch(API+'/ai-owner/admin/training/'+path,{method:'POST',credentials:'include',signal,
      headers:{Authorization:`Bearer ${token}`,...(multipart?{}:{'Content-Type':'application/json'})},
      body:multipart?body:JSON.stringify(body)});
    const data=await response.json().catch(()=>({}));
    if(!response.ok)throw new Error(typeof data.message==='string'?data.message:'Verification failed');
    return data.data??data;
  }
  async function say(text:string,generation:number){
    setStatus(text);
    try {
      const response=await fetch(API+'/ai-call/speak',{method:'POST',credentials:'include',signal:activeRequest.current?.signal,
        headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({text})});
      if(!response.ok)throw new Error('Speech unavailable');
      const blob=await response.blob();if(generation!==epoch.current)return;
      const url=URL.createObjectURL(blob);audioUrl.current=url;
      const audio=new Audio(url);promptAudio.current=audio;
      await new Promise<void>(resolve=>{audio.onended=()=>resolve();audio.onerror=()=>resolve();void audio.play().catch(()=>resolve());});
      if(audioUrl.current===url){URL.revokeObjectURL(url);audioUrl.current='';}
    }catch { /* The visible prompt and record button remain available. */ }
  }
  async function listen(generation:number,current:Challenge){
    if(generation!==epoch.current||pending.current||recorder.current)return;
    if(!navigator.mediaDevices?.getUserMedia||typeof MediaRecorder==='undefined'){setStatus('आवाज उपलब्ध भएन। तलको सुरक्षित input प्रयोग गर्नुहोस्।');return;}
    pending.current=true;setBusy(true);
    try{
      const mic=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true},video:false});
      if(generation!==epoch.current){mic.getTracks().forEach(track=>track.stop());return;}
      stream.current=mic;
      const mime=['audio/webm;codecs=opus','audio/ogg;codecs=opus','audio/mp4'].find(type=>MediaRecorder.isTypeSupported(type));
      const rec=new MediaRecorder(mic,mime?{mimeType:mime}:undefined);recorder.current=rec;
      const chunks:BlobPart[]=[];let bytes=0;
      rec.ondataavailable=event=>{bytes+=event.data.size;if(bytes<=2*1024*1024)chunks.push(event.data);else if(rec.state!=='inactive')rec.stop();};
      rec.onstop=()=>{
        if(timer.current)clearTimeout(timer.current);timer.current=null;
        mic.getTracks().forEach(track=>track.stop());stream.current=null;recorder.current=null;
        pending.current=false;setRecording(false);setBusy(false);
        if(generation!==epoch.current)return;
        if(bytes>2*1024*1024){setStatus('छोटो recording मात्र पठाउनुहोस्।');return;}
        const form=new FormData();form.append('step',current.unlockStage);
        const type=rec.mimeType||'audio/webm';const extension=type.includes('mp4')?'mp4':type.includes('ogg')?'ogg':'webm';
        form.append('audio',new Blob(chunks,{type}),'verification.'+extension);
        void verify(current,form,generation,true);
      };
      rec.start(250);setRecording(true);setStatus(current.unlockStage==='PASSWORD'?'Password मात्र बोल्नुहोस्।':'पुष्टि नम्बर एकएक अंक गरेर बोल्नुहोस्।');
      timer.current=setTimeout(()=>{if(rec.state!=='inactive')rec.stop();},current.unlockStage==='PASSWORD'?6000:14000);
    }catch {if(generation===epoch.current)setStatus('Microphone अनुमति दिनुहोस् वा तल टाइप गर्नुहोस्।');}
    finally{if(generation===epoch.current){pending.current=false;setBusy(false);}}
  }
  async function prompt(current:Challenge,generation:number,voice:boolean){
    await say(current.unlockStage==='PASSWORD'?'Developer mode खोल्न आफ्नो password भन्नुहोस्।':'Password मिल्यो। अब पुष्टि नम्बर एकएक अंक गरेर भन्नुहोस्।',generation);
    if(voice&&generation===epoch.current)await listen(generation,current);
  }
  async function begin(){
    if(pending.current||challengeRef.current||!token)return;
    const generation=++epoch.current;pending.current=true;setBusy(true);setStatus('Admin verification सुरु गर्दैछु…');
    const abort=new AbortController();activeRequest.current=abort;
    try{
      const next:Challenge=await request('sessions',{},abort.signal);
      if(generation!==epoch.current){void fetch(API+'/ai-owner/admin/training/sessions/'+next.id,{method:'DELETE',credentials:'include',headers:{Authorization:`Bearer ${token}`}});return;}
      challengeRef.current=next;setChallenge(next);pending.current=false;setBusy(false);
      await prompt(next,generation,true);
    }catch(e){if(generation===epoch.current)setStatus(e instanceof Error?e.message:'Verification सुरु भएन।');}
    finally{if(generation===epoch.current){pending.current=false;setBusy(false);}}
  }
  const beginRef=useRef(begin);beginRef.current=begin;
  useEffect(()=>{
    const start=()=>{void beginRef.current();};window.addEventListener('roomkhoj:developer-unlock',start);
    return()=>window.removeEventListener('roomkhoj:developer-unlock',start);
  },[]);
  async function verify(current:Challenge,body:unknown,generation:number,voice:boolean){
    if(pending.current||generation!==epoch.current)return;
    pending.current=true;setBusy(true);setValue('');setStatus('पुष्टि गर्दैछु…');
    try{
      const result:Result=await request(`sessions/${current.id}/${body instanceof FormData?'unlock-voice':'unlock'}`,body,activeRequest.current?.signal);
      if(generation!==epoch.current)return;
      if(!result.accepted){setStatus('मिलेन। फेरि भन्नुहोस् वा टाइप गर्नुहोस्।');return;}
      if(result.stage==='VERIFIED'&&result.session){
        challengeRef.current=null;setChallenge(null);stopDevices();
        callback.current(result.session);return;
      }
      const next={...current,unlockStage:'PHONE' as const};challengeRef.current=next;setChallenge(next);
      pending.current=false;setBusy(false);await prompt(next,generation,voice);
    }catch(e){if(generation===epoch.current)setStatus(e instanceof Error?e.message:'पुष्टि भएन।');}
    finally{if(generation===epoch.current){pending.current=false;setBusy(false);}}
  }
  return <div className="space-y-3 rounded-lg border p-4">
    <p className="text-sm">Admin voice unlock: password → पुष्टि नम्बर → Developer Mode। नम्बर बोल्नु SMS OTP वा फोनको ownership verification होइन।</p>
    {!challenge?<button type="button" disabled={busy||!token} onClick={()=>void begin()} className="rounded-lg bg-blue-700 px-4 py-2 text-white disabled:opacity-50">आवाजबाट Developer Mode खोल्नुहोस्</button>:<>
      <p className="font-medium">{challenge.unlockStage==='PASSWORD'?'पहिलो चरण: Password':'दोस्रो चरण: पुष्टि नम्बर'}</p>
      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={busy} onClick={()=>{if(recording)recorder.current?.stop();else void listen(epoch.current,challenge);}} className="rounded-lg bg-blue-700 px-4 py-2 text-white disabled:opacity-50">{recording?'बोलेँ — पुष्टि गर्नुहोस्':'बोल्नुहोस्'}</button>
        <button type="button" onClick={cancel} className="rounded-lg border px-4 py-2">Cancel</button>
      </div>
      <form onSubmit={e=>{e.preventDefault();if(!recording)void verify(challenge,{step:challenge.unlockStage,value},epoch.current,false);}} className="flex flex-wrap gap-2">
        <input aria-label={challenge.unlockStage==='PASSWORD'?'Developer password':'Confirmation number'} autoComplete="off" type="password" inputMode={challenge.unlockStage==='PHONE'?'numeric':'text'} value={value} maxLength={160} disabled={busy||recording} onChange={e=>setValue(e.target.value)} placeholder="आवश्यक परे यहाँ सुरक्षित रूपमा टाइप गर्नुहोस्" className="min-w-0 flex-1 rounded border bg-background p-2"/>
        <button type="submit" disabled={busy||recording||!value.trim()} className="rounded border px-3 py-2 disabled:opacity-50">पुष्टि</button>
      </form>
    </>}
    <p role="status" className="text-sm">{status}</p>
    <p className="text-xs text-muted-foreground">Unlock audio transcription का लागि OpenAI मा पठाइन्छ; RoomKhoj training memory मा audio वा credential transcript राखिँदैन।</p>
  </div>;
}
