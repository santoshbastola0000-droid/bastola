"use client";
import { useEffect, useState } from 'react';
import useTokenStore from '@/store';
import type { OwnerCostReport } from '@/lib/voice/owner-cost-reporter';
const API=(process.env.NEXT_PUBLIC_BACKEND_URL||'https://api.roomkhoj.com').replace(/\/$/,'');
const money=(n:number|null|undefined)=>typeof n==='number'&&Number.isFinite(n)?`रु. ${n.toFixed(2)}`:'मापन उपलब्ध छैन';
export function OwnerVoiceCostPanel({report,callId,sessionId,phoneSid,poll=true,phone=false}:{report?:OwnerCostReport|null;callId?:string;sessionId?:string;phoneSid?:string;poll?:boolean;phone?:boolean}) {
 const token=useTokenStore(s=>s.token);
 const [remote,setRemote]=useState<OwnerCostReport|null>(null),[failed,setFailed]=useState(false);
 useEffect(()=>{
   setRemote(null);setFailed(false);
   const path=phoneSid?'/ai-owner/admin/phone-voice-cost/'+encodeURIComponent(phoneSid):sessionId?'/ai-owner/admin/voice-cost/'+encodeURIComponent(sessionId):callId?'/ai-owner/admin/calls/'+encodeURIComponent(callId)+'/cost':null;
   if(!path||!token)return;
   let live=true;let done=false;let timer:ReturnType<typeof setTimeout>;const abort=new AbortController();
   const load=async()=>{try{const r=await fetch(API+path,{credentials:'include',signal:abort.signal,headers:{Authorization:`Bearer ${token}`}});
     if(!r.ok)throw Error('Unavailable');const p=await r.json();const value=p.data||p;
     if(live){setRemote(value);setFailed(false);done=value.ended===true;}
   }catch{if(live){setRemote(null);setFailed(true);}}
   finally{if(live&&!done&&poll)timer=setTimeout(()=>void load(),3000);}};
   void load();return()=>{live=false;abort.abort();clearTimeout(timer);};
 },[token,callId,sessionId,phoneSid,poll]);
 const data=(callId||sessionId||phoneSid)?remote:report;
 const flag=data?.overTarget===true;
 return <div role="status" aria-live="polite" className={`space-y-1 rounded-xl border p-3 text-sm ${flag?'border-red-500 bg-red-50 text-red-900':'border-amber-400 bg-amber-50 text-amber-950'}`}>
   <p className="font-semibold">{flag?'⚑ खर्च बढी छ — ':''}AI खर्च अनुमान · लक्ष्य {money(data?.targetNprPerMinute??3)}/min</p>
   <p>अहिलेसम्म: <strong>{money(data?.estimatedAiNpr)}</strong> · औसत प्रति call मिनेट: <strong>{money(data?.nprPerMinute)}</strong></p>
   {data&&<p className="text-xs">Model: {data.model} · मापन समय {Math.round(data.durationSeconds)} sec · {data.responseCount} usage events · USD 1 ≈ रु. {data.usdToNpr}</p>}
   {flag&&<p className="font-medium">दर लक्ष्यभन्दा माथि छ। Call रोक्ने वा छोटो उत्तर प्रयोग गर्ने निर्णय गर्नुहोस्।</p>}
   {(!data||failed||data.stale||data.incomplete)&&<p>{data?.incomplete?'अधुरो usage छ। देखिएको रकम पूरा bill होइन; वास्तविक खर्च बढी हुन सक्छ।':phone?'Phone STT/LLM/TTS usage उपलब्ध छैन। पुरानो call, अर्को admin, local/clone वा backend update को अवस्था हुन सक्छ।':'Usage नआएको, अधुरो वा connection छुटेको छ। खर्च शून्य भएको अर्थ होइन।'}</p>}
   {data&&data.durationSeconds<15&&<p className="text-xs">Call सुरुको छोटो समयको औसत हो; दर छिटो बदलिन सक्छ।</p>}
   <p className="text-xs">{data?.source==='SERVER_PHONE_ESTIMATE'?'Server ले नापेको audio अवधि र text tokens को अनुमान हो, provider bill होइन।':'Browser बाट पठाइएको usage को अनुमान हो, provider bill होइन।'} SIP/फोन, Maps/tools, hosting र कर जोडिएका छैनन्। छुट्टै transcription usage आएपछि जोडिन्छ।</p>
   {data?.source==='SERVER_PHONE_ESTIMATE'&&<p className="text-xs">Audio-minute planning दर: STT ${data.sttUsdPerMinute}/min · TTS ${data.ttsUsdPerMinute}/min। Provider दरसँग मिलाएर configure गर्नुपर्छ।</p>}
   {data&&<p className="text-xs">{data.fxSource} · दर जाँच: {data.pricesCheckedAt} · Session मापन restart हुँदा हराउँछ; अधिकतम २ घण्टा।</p>}
 </div>;
}
