"use client";
import { useEffect, useState } from "react";
import useTokenStore from "@/store";
import Link from "next/link";
const API=(process.env.NEXT_PUBLIC_BACKEND_URL||"https://api.roomkhoj.com").replace(/\/$/,"");
export default function AiCallsPrivacySettings() {
  const token=useTokenStore(s=>s.token);
  const [optedIn,setOptedIn]=useState(false);
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);
  const [notice,setNotice]=useState("");
  useEffect(()=>{
    if(!token){setLoading(false);return;}
    let active=true;
    void fetch(API+"/ai-owner/contact-preference",{headers:{Authorization:`Bearer ${token}`},credentials:"include"})
      .then(async response=>{if(!response.ok)throw new Error("Unable to load preference");return response.json();})
      .then(data=>{if(active)setOptedIn(data.optedIn===true);})
      .catch(error=>{if(active)setNotice(String(error));})
      .finally(()=>{if(active)setLoading(false);});
    return ()=>{active=false;};
  },[token]);
  const update=async (value:boolean)=>{
    if(!token||saving)return;
    setSaving(true);setNotice("");
    try {
      const response=await fetch(API+"/ai-owner/contact-preference",{
        method:"PATCH",credentials:"include",
        headers:{Authorization:`Bearer ${token}`,"Content-Type":"application/json"},
        body:JSON.stringify({optedIn:value}),
      });
      if(!response.ok)throw new Error("Could not save preference");
      const result=await response.json();
      setOptedIn(result.optedIn===true);
      setNotice(value?"AI calls enabled. You may decline any incoming call.":"AI calls disabled.");
    }catch(error){setNotice(String(error));}
    finally{setSaving(false);}
  };
  return <main className="mx-auto max-w-xl space-y-5 p-6">
    <h1 className="text-2xl font-bold">AI Voice Calling Privacy</h1>
    <p>RoomKhoj बाट AI ले वेबसाइटमा incoming call गर्न अनुमति दिने वा नदिने तपाईंको निर्णय हो। यो वास्तविक फोन नम्बरमा जाने call होइन।</p>
    <p>AI ले आफू AI भएको परिचय दिन्छ। तपाईंले Accept थिचेपछि मात्रै माइक्रोफोन चल्छ। Room draft अलग अनुमति लिएर मात्रै सुरक्षित गरिन्छ।</p>
    {!token?<p>पहिला login गर्नुहोस्।</p>:loading?<p>Loading…</p>:
    <label className="flex items-center gap-3 rounded-lg border p-4">
      <input type="checkbox" checked={optedIn} disabled={saving} onChange={event=>void update(event.target.checked)} />
      <span><strong>RoomKhoj AI website calls अनुमति दिन्छु</strong><span className="block text-xs">जुनसुकै बेला बन्द गर्न सकिन्छ।</span></span>
    </label>}
    {notice&&<p role="status">{notice}</p>}
    <Link href="/" className="underline">Back to RoomKhoj</Link>
  </main>;
}
