"use client";
import { useEffect, useRef, useState } from "react";
import useTokenStore from "@/store";
import { privateApi } from "@/http/api/privateApi";
import Link from "next/link";

type Preference = { optedIn: boolean };
function preference(data: unknown): Preference {
  const payload = data && typeof data === 'object' && 'data' in data ? (data as {data:unknown}).data : data;
  if (!payload || typeof payload !== 'object' || !('optedIn' in payload) || typeof payload.optedIn !== 'boolean') throw new Error('Server ले सही preference response दिएन। फेरि प्रयास गर्नुहोस्।');
  return { optedIn: payload.optedIn };
}
function failure(error: unknown): string {
  const e=error as {response?:{status?:number;data?:{message?:string|string[]}};message?:string};
  const status=e.response?.status;
  if(status===404)return 'AI call settings अहिले server मा उपलब्ध छैन। Backend update आवश्यक छ। तपाईंको अनुमति परिवर्तन भएको छैन।';
  if(status===401)return 'Session सकिएको छ। फेरि login गरेर प्रयास गर्नुहोस्।';
  if(status===429)return 'धेरै पटक प्रयास भयो। एक मिनेटपछि फेरि प्रयास गर्नुहोस्।';
  const message=e.response?.data?.message;
  if(message)return Array.isArray(message)?message.join(', '):message;
  return e.response ? 'Preference save/load हुन सकेन। फेरि प्रयास गर्नुहोस्।' : e.message==='Network Error'?'Connection जाँचेर फेरि प्रयास गर्नुहोस्।':e.message||'Preference save/load हुन सकेन। फेरि प्रयास गर्नुहोस्।';
}
export default function AiCallsPrivacySettings() {
  const token=useTokenStore(s=>s.token);
  const [optedIn,setOptedIn]=useState<boolean|null>(null);
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);
  const [notice,setNotice]=useState("");
  const [error,setError]=useState("");
  const [attempt,setAttempt]=useState(0);
  const pending=useRef(false);
  const generation=useRef(0);
  useEffect(()=>{
    const current=++generation.current;
    setOptedIn(null);setNotice('');setError('');
    if(!token){setLoading(false);return;}
    setLoading(true);
    void privateApi.get('/ai-owner/contact-preference')
      .then(response=>{const result=preference(response.data);if(current===generation.current)setOptedIn(result.optedIn);})
      .catch(e=>{if(current===generation.current)setError(failure(e));})
      .finally(()=>{if(current===generation.current)setLoading(false);});
    return ()=>{generation.current+=1;};
  },[token,attempt]);
  const update=async (value:boolean)=>{
    if(!token||pending.current||optedIn===null)return;
    const current=generation.current;
    pending.current=true;setSaving(true);setNotice('');setError('');
    try {
      const response=await privateApi.patch('/ai-owner/contact-preference',{optedIn:value});
      const result=preference(response.data);
      if(current!==generation.current)return;
      setOptedIn(result.optedIn);
      setNotice(result.optedIn?'AI calls enabled. You may decline any incoming call.':'AI calls disabled.');
    }catch(e){if(current===generation.current)setError(failure(e));}
    finally{pending.current=false;setSaving(false);}
  };
  return <main className="mx-auto max-w-xl space-y-5 p-6">
    <h1 className="text-2xl font-bold">AI Voice Calling Privacy</h1>
    <p>RoomKhoj बाट AI ले वेबसाइटमा incoming call गर्न अनुमति दिने वा नदिने तपाईंको निर्णय हो। यो वास्तविक फोन नम्बरमा जाने call होइन।</p>
    <p>AI ले आफू AI भएको परिचय दिन्छ। तपाईंले Accept थिचेपछि मात्रै माइक्रोफोन चल्छ। Room draft अलग अनुमति लिएर मात्रै सुरक्षित गरिन्छ।</p>
    {!token?<p>पहिला <Link href="/auth/login?redirect=%2Fai-call-privacy" className="underline">login गर्नुहोस्</Link>।</p>:loading?<p role="status">Loading…</p>:optedIn!==null&&
    <label className="flex items-center gap-3 rounded-lg border p-4">
      <input type="checkbox" checked={optedIn} disabled={saving} onChange={event=>void update(event.target.checked)} />
      <span><strong>RoomKhoj AI website calls अनुमति दिन्छु</strong><span className="block text-xs">जुनसुकै बेला बन्द गर्न सकिन्छ।</span></span>
    </label>}
    {saving&&<p role="status">Saving…</p>}
    {error&&<div role="alert" className="space-y-2 text-red-700"><p>{error}</p>{token&&optedIn===null&&<button type="button" disabled={loading||saving} onClick={()=>setAttempt(v=>v+1)} className="rounded-lg border px-3 py-2">Try again</button>}</div>}
    {notice&&<p role="status">{notice}</p>}
    <Link href="/" className="underline">Back to RoomKhoj</Link>
  </main>;
}
