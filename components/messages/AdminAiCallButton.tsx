"use client";
import { useEffect, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { Phone, PhoneOff, Loader2 } from 'lucide-react';
import useTokenStore from '@/store';
import { privateApi } from '@/http/api/privateApi';

const API=(process.env.NEXT_PUBLIC_BACKEND_URL||'https://api.roomkhoj.com').replace(/\/$/,'');
type Phase='dialing'|'ringing'|'accepted'|'connected'|'declined'|'no-answer'|'ended'|'failed';
const labels:Record<Phase,string>={dialing:'Dialing RoomKhoj AI…',ringing:'Ringing · user ले Accept गर्ने प्रतीक्षामा',accepted:'Accepted · AI voice जोडिँदैछ…',connected:'AI connected · user सँग AI बोल्दैछ',declined:'User ले call decline गर्नुभयो', 'no-answer':'No answer',ended:'Call सकियो',failed:'Call सुरु हुन सकेन'};
export function AdminAiCallButton({targetUserId,targetName}:{targetUserId:string;targetName?:string}){
  const token=useTokenStore(s=>s.token);const connection=useRef<Socket|null>(null);const active=useRef('');const pending=useRef(false);const generation=useRef(0);
  const [phase,setPhase]=useState<Phase|null>(null);const [error,setError]=useState('');
  const busy=phase==='dialing'||phase==='ringing'||phase==='accepted'||phase==='connected';
  useEffect(()=>{setPhase(null);setError('');return ()=>{generation.current+=1;const s=connection.current;if(active.current)s?.emit('ai-owner:end',{callId:active.current});s?.disconnect();connection.current=null;active.current='';pending.current=false;};},[targetUserId,token]);
  async function start(){
    if(!token||!targetUserId||pending.current)return;pending.current=true;const current=++generation.current;setPhase('dialing');setError('');active.current='';connection.current?.disconnect();
    let s:Socket|null=null;
    try{
      const response=await privateApi.get(`/ai-owner/admin/users/${encodeURIComponent(targetUserId)}/eligibility`);
      if(current!==generation.current)return;
      const eligibility=response.data?.data||response.data;
      if(eligibility.optedIn!==true)throw Error('User ले AI website calls अनुमति दिनुभएको छैन। /ai-call-privacy बाट अनुमति दिनुपर्छ।');
      if(!eligibility.online)throw Error('User अहिले offline हुनुहुन्छ।');
      s=io(API+'/messages',{autoConnect:false,auth:{token:useTokenStore.getState().token},transports:['polling','websocket'],withCredentials:true});connection.current=s;
      s.on('ai-owner:status',(data:{callId?:string;status?:string})=>{
        if(current!==generation.current||!data.callId||(active.current&&active.current!==data.callId))return;
        if(!active.current)active.current=data.callId;
        if(data.status&&data.status in labels){setPhase(data.status as Phase);if(['ended','declined','no-answer','failed'].includes(data.status))pending.current=false;}
      });
      s.on('disconnect',()=>{if(current===generation.current&&pending.current){pending.current=false;setPhase('failed');setError('Call connection छुट्यो। फेरि प्रयास गर्नुहोस्।');}});
      await new Promise<void>((resolve,reject)=>{const timeout=window.setTimeout(()=>reject(Error('Call server connection timed out')),10000);s!.once('connect',()=>{clearTimeout(timeout);resolve();});s!.once('connect_error',()=>{clearTimeout(timeout);reject(Error('Call server मा connect भएन। Backend deployment जाँच्नुहोस्।'));});s!.connect();});
      if(current!==generation.current){s.disconnect();return;}
      const result=await s.timeout(12000).emitWithAck('ai-owner:call',{targetUserId,consentConfirmed:true}) as {success?:boolean;callId?:string;error?:string};
      if(current!==generation.current){if(result.callId)s.emit('ai-owner:end',{callId:result.callId});s.disconnect();return;}
      if(!result.success||!result.callId)throw Error(result.error||'AI call सुरु हुन सकेन। Backend update आवश्यक हुन सक्छ।');
      active.current=result.callId;setPhase(prev=>prev==='dialing'?'ringing':prev);
    }catch(e){if(current===generation.current){pending.current=false;setPhase('failed');const status=(e as {response?:{status?:number}})?.response?.status;setError(status===404?'AI calling API live server मा उपलब्ध छैन। Backend update आवश्यक छ।':e instanceof Error?e.message:'AI call failed');s?.disconnect();}}
  }
  function end(){generation.current+=1;const s=connection.current;if(active.current)s?.emit('ai-owner:end',{callId:active.current});s?.disconnect();connection.current=null;active.current='';pending.current=false;setPhase('ended');}
  return <><button type="button" aria-label="AI voice call" title="AI voice call" disabled={!token||!targetUserId||busy} onClick={()=>void start()} className="flex h-10 w-10 items-center justify-center rounded-full text-foreground hover:bg-primary/10 disabled:opacity-50"><Phone className="h-5 w-5"/></button>{phase&&<div role="dialog" aria-modal="true" aria-label="Outgoing AI call" className="fixed inset-0 z-[160] flex items-center justify-center bg-black/70 p-4"><div className="w-full max-w-sm space-y-4 rounded-2xl bg-white p-6 text-center text-slate-900 shadow-xl"><div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 motion-safe:animate-pulse"><Phone className="h-9 w-9"/></div><h2 className="text-xl font-bold">RoomKhoj AI → {targetName||'User'}</h2><p role="status">{labels[phase]}</p>{busy&&phase!=='connected'&&<Loader2 className="mx-auto h-5 w-5 animate-spin"/>}{error&&<p role="alert" className="text-sm text-red-700">{error}</p>}<p className="text-xs text-slate-500">User ले Accept गरेपछि AI बोल्छ।</p><button type="button" onClick={busy?end:()=>{end();setPhase(null);}} className="rounded-full bg-red-700 px-5 py-3 text-white"><PhoneOff className="mr-2 inline h-4 w-4"/>{busy?'End AI call':'Close'}</button></div></div>}</>;
}
