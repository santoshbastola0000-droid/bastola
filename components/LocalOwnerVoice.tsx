"use client";
import {useCallback,useEffect,useRef,useState} from 'react';
import useTokenStore from '@/store';
import {monitorMicrophone} from '@/lib/voice/microphone-meter';
import {OwnerListeningIndicator} from '@/components/OwnerListeningIndicator';
const API=(process.env.NEXT_PUBLIC_BACKEND_URL||'https://api.roomkhoj.com').replace(/\/$/,'');
type Turn={role:'user'|'assistant';content:string};
type Reply={heard:string;reply:string;audioBase64:string;mimeType:string};
export default function LocalOwnerVoice({callId,onTurn,onEnd,onReady,autoStart=false}:{callId?:string;onTurn?:(speaker:'OWNER'|'AI',text:string)=>void;onEnd:()=>void;onReady?:()=>void;autoStart?:boolean}) {
 const token=useTokenStore(s=>s.token);
 const [active,setActive]=useState(false),[busy,setBusy]=useState(false),[status,setStatus]=useState('Mic खोलेर कुरा गर्नुहोस्।'),[levels,setLevels]=useState<number[]>([]),[speaking,setSpeaking]=useState(false),[heard,setHeard]=useState(''),[reply,setReply]=useState(''),[blocked,setBlocked]=useState(false);
 const stream=useRef<MediaStream|null>(null),recorder=useRef<MediaRecorder|null>(null),audio=useRef<HTMLAudioElement>(null),stopMeter=useRef<(()=>void)|null>(null),request=useRef<AbortController|null>(null),epoch=useRef(0),running=useRef(false),working=useRef(false),history=useRef<Turn[]>([]),lastVoice=useRef(0),startAt=useRef(0),heardVoice=useRef(false),objectUrl=useRef(''),bargeCount=useRef(0),timer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const callbacks=useRef({onTurn,onEnd,onReady});callbacks.current={onTurn,onEnd,onReady};
 const speechRevision=useRef(0),pendingAudio=useRef<Blob[]>([]);
 const stopping=useRef(false);
 const cleanup=useCallback(()=>{
   running.current=false;working.current=false;epoch.current++;request.current?.abort();request.current=null;
   pendingAudio.current=[];
   stopping.current=false;
   stopMeter.current?.();stopMeter.current=null;
   if(timer.current)clearTimeout(timer.current);timer.current=null;
   if(recorder.current?.state==='recording'){recorder.current.onstop=null;recorder.current.stop();}recorder.current=null;
   stream.current?.getTracks().forEach(t=>t.stop());stream.current=null;
   if(audio.current){audio.current.pause();audio.current.removeAttribute('src');}
   if(objectUrl.current)URL.revokeObjectURL(objectUrl.current);objectUrl.current='';
 },[]);
 useEffect(()=>cleanup,[cleanup]);
 async function submit(blob?:Blob,greeting=false) {
   if(!running.current||working.current)return;
   const generation=epoch.current,revision=speechRevision.current;working.current=true;setBusy(true);setStatus('कुरा बुझ्दैछु…');
   const abort=new AbortController();request.current=abort;
   const timeout=setTimeout(()=>abort.abort(),90000);
   try {
     const form=new FormData();form.append('history',JSON.stringify(history.current.slice(-29)));form.append('greeting',String(greeting));if(blob)form.append('audio',blob,'owner.webm');
     const endpoint=callId?'/ai-owner/calls/'+encodeURIComponent(callId)+'/local-voice-turn':'/ai-owner/admin/local-voice-turn';
     const response=await fetch(API+endpoint,{method:'POST',credentials:'include',headers:{Authorization:`Bearer ${token}`},body:form,signal:abort.signal});
     if(!response.ok)throw new Error('Voice worker तयार छैन वा उत्तर दिन सकेन। Admin ले worker/model configuration जाँच्नुहोस्।');
     const payload=await response.json();const result=(payload.data||payload) as Reply;
     if(!running.current||generation!==epoch.current)return;
     if(result.heard){history.current.push({role:'user',content:result.heard});setHeard(result.heard);callbacks.current.onTurn?.('OWNER',result.heard);}
     if(revision!==speechRevision.current)return; // The owner continued: do not play a stale answer over them.
     if(result.reply){history.current.push({role:'assistant',content:result.reply});setReply(result.reply);callbacks.current.onTurn?.('AI',result.reply);}
     if(objectUrl.current)URL.revokeObjectURL(objectUrl.current);
     const binary=atob(result.audioBase64);const bytes=Uint8Array.from(binary,c=>c.charCodeAt(0));objectUrl.current=URL.createObjectURL(new Blob([bytes],{type:result.mimeType}));
     if(audio.current){audio.current.src=objectUrl.current;await audio.current.play().catch(()=>setBlocked(true));}
     setStatus('सुन्दैछु…');
   }catch(error){if(running.current&&generation===epoch.current)setStatus(error instanceof Error?error.message:'Voice unavailable');}
   finally{clearTimeout(timeout);if(generation===epoch.current){working.current=false;setBusy(false);const next=pendingAudio.current.shift();if(next&&running.current)void submit(next);}}
 }
 function listen() {
   if(!running.current||!stream.current||stopping.current||recorder.current?.state==='recording')return;
   speechRevision.current++;
   const type=['audio/webm;codecs=opus','audio/mp4','audio/webm'].find(t=>MediaRecorder.isTypeSupported(t));
   const r=new MediaRecorder(stream.current,type?{mimeType:type}:undefined);recorder.current=r;const chunks:BlobPart[]=[];
   heardVoice.current=false;lastVoice.current=performance.now();startAt.current=lastVoice.current;
   r.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};
   const current=epoch.current;
   r.onstop=()=>{stopping.current=false;if(running.current&&current===epoch.current&&heardVoice.current){const blob=new Blob(chunks,{type:r.mimeType});if(working.current){if(pendingAudio.current.length<3)pendingAudio.current.push(blob);else setStatus('Voice worker ढिलो छ। एकछिन पर्खेर फेरि भन्नुहोस्।');}else void submit(blob);}};
   r.start();
 }
 async function start() {
   if(running.current||!token)return;
   if(!navigator.mediaDevices?.getUserMedia||typeof MediaRecorder==='undefined'){setStatus('यो browser मा local voice recording उपलब्ध छैन।');return;}
   running.current=true;const generation=++epoch.current;setStatus('Voice worker जोड्दैछु…');history.current=[];
   try {
     const mic=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true}});
     if(!running.current||generation!==epoch.current){mic.getTracks().forEach(t=>t.stop());return;}
     stream.current=mic;setActive(true);callbacks.current.onReady?.();
     stopMeter.current=monitorMicrophone(mic,(voiced,values,now)=>{
       if(!running.current)return;setLevels(values);setSpeaking(voiced);
       if(voiced){
         // Require a sustained start, not one noise spike, before interrupting playback.
         bargeCount.current++;
         if(bargeCount.current>=3&&audio.current&&!audio.current.paused){audio.current.pause();audio.current.currentTime=0;setBlocked(false);}
         heardVoice.current=true;lastVoice.current=now;
         if(bargeCount.current>=3)listen();
       }else bargeCount.current=0;
       if(recorder.current?.state==='recording'&&((heardVoice.current&&now-lastVoice.current>1300)||now-startAt.current>25000)){stopping.current=true;recorder.current.stop();}
     });
     timer.current=setTimeout(()=>{cleanup();setActive(false);setStatus('१० मिनेटको call सकियो।');callbacks.current.onEnd();},10*60*1000);
     await submit(undefined,true);
   }catch(error){cleanup();setActive(false);setStatus(error instanceof Error?error.message:'Mic unavailable');}
 }
 const startRef=useRef(start);startRef.current=start;
 useEffect(()=>{if(autoStart)void startRef.current();},[autoStart]);
 return <section className="space-y-3 rounded-xl border p-4">
   <h3 className="font-semibold">RoomKhoj AI · Worker voice</h3>
   <p role="status" aria-live="polite" className="text-sm">{status}</p>
   <audio ref={audio} onEnded={()=>{if(running.current)setStatus('सुन्दैछु…');}}/>
   {active&&<OwnerListeningIndicator speaking={speaking} levels={levels}/>}
   {blocked&&<button type="button" onClick={()=>void audio.current?.play().then(()=>setBlocked(false)).catch(()=>setBlocked(true))} className="rounded border px-3 py-2">AI को आवाज सुन्नुहोस्</button>}
   <div className="flex gap-2"><button type="button" disabled={active} onClick={()=>void start()} className="rounded bg-green-700 px-4 py-2 text-white disabled:opacity-50">Mic खोलेर बोल्नुहोस्</button><button type="button" onClick={()=>{cleanup();setActive(false);callbacks.current.onEnd();}} className="rounded bg-red-700 px-4 py-2 text-white">End</button></div>
   {busy&&<p className="text-xs">उत्तर तयार हुँदैछ…</p>}
   {heard&&<p className="text-sm">तपाईं: {heard}</p>}{reply&&<p className="text-sm">AI: {reply}</p>}
 </section>;
}
