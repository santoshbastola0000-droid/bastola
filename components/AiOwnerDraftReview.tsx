"use client";
import { useCallback, useEffect, useState } from "react";
import useTokenStore from "@/store";
const API=(process.env.NEXT_PUBLIC_BACKEND_URL||"https://api.roomkhoj.com").replace(/\/$/,"");
type Draft={id:string;callId:string;details:Record<string,string|number|null>;
  missingFields:string[];reviewStatus:string;userName:string;callStatus:string;
  callStartedAt:string;callEndedAt:string|null;createdAt:string;};
export function AiOwnerDraftReview() {
  const token=useTokenStore(s=>s.token);
  const [drafts,setDrafts]=useState<Draft[]>([]);
  const [notice,setNotice]=useState("");
  const [busy,setBusy]=useState("");
  const load=useCallback(async()=>{
    if(!token)return;
    try {
      const r=await fetch(API+"/ai-owner/admin/drafts",{credentials:"include",headers:{Authorization:`Bearer ${token}`}});
      if(!r.ok)throw new Error("Cannot load drafts ("+r.status+")");
      const response=await r.json();
      setDrafts(Array.isArray(response)?response:Array.isArray(response.data)?response.data:[]);
    }catch(e){setNotice(String(e));}
  },[token]);
  useEffect(()=>{void load();},[load]);
  const review=async (id:string,status:"APPROVED"|"REJECTED")=>{
    if(!token)return;
    setBusy(id);setNotice("");
    try {
      const r=await fetch(API+"/ai-owner/admin/drafts/"+encodeURIComponent(id)+"/review",{
        method:"PATCH",credentials:"include",
        headers:{Authorization:`Bearer ${token}`,"Content-Type":"application/json"},
        body:JSON.stringify({status}),
      });
      if(!r.ok)throw new Error("Cannot review draft ("+r.status+")");
      await load();
    }catch(e){setNotice(String(e));}
    finally{setBusy("");}
  };
  return <section className="space-y-4 rounded-xl border p-5">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h2 className="text-lg font-semibold">AI Calling — Room Drafts</h2>
      <button onClick={()=>void load()} className="rounded border px-3 py-2">Refresh</button>
    </div>
    <p className="text-sm">यी room details user को save consent पछिमात्र आएका हुन्। Approved भनेको review हो; room आफैं publish हुँदैन।</p>
    {notice&&<p role="alert">{notice}</p>}
    {!drafts.length&&<p className="text-sm">अहिले कुनै draft छैन।</p>}
    {drafts.map(draft=><article key={draft.id} className="space-y-3 rounded-xl border p-4">
      <div className="font-medium">{draft.userName} — {draft.reviewStatus}</div>
      <p className="text-xs">Call: {draft.callStatus} · {new Date(draft.callStartedAt).toLocaleString()}</p>
      <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
        {Object.entries(draft.details||{}).map(([key,value])=><div key={key}>
          <dt className="font-medium">{key}</dt><dd>{value===null?"Not provided":String(value)}</dd>
        </div>)}
      </dl>
      <p className="text-xs">Missing: {(draft.missingFields||[]).join(", ")||"None"}</p>
      {draft.reviewStatus==="PENDING"&&<div className="flex gap-2">
        <button disabled={busy===draft.id} onClick={()=>void review(draft.id,"APPROVED")} className="rounded bg-green-700 px-4 py-2 text-white">Approve draft</button>
        <button disabled={busy===draft.id} onClick={()=>void review(draft.id,"REJECTED")} className="rounded bg-red-700 px-4 py-2 text-white">Reject draft</button>
      </div>}
    </article>)}
  </section>;
}
