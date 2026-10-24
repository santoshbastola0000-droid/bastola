"use client";
import { useEffect,useState } from "react";
import useTokenStore from "@/store";
const API=(process.env.NEXT_PUBLIC_BACKEND_URL||"https://api.roomkhoj.com").replace(/\/$/,"");
const FIELDS=["ownerName","location","floor","landmark","roomType","monthlyRentNpr","depositNpr","availableRooms","bathroom","kitchen","water","electricity","wifi","parking","furnished","availableFrom","restrictions","notes"];
type Item={id:string;question:string;originalQuestion:string;field:string|null;status:string;source:string;seenCount:number};
export function OwnerVoiceMemory({userId}:{userId:string}){
 const token=useTokenStore(s=>s.token);
 const [items,setItems]=useState<Item[]>([]);
 const [preferences,setPreferences]=useState<Record<string,string>>({});
 const [evidence,setEvidence]=useState("");
 const [notice,setNotice]=useState("");
 const [busy,setBusy]=useState(false);
 const [refresh,setRefresh]=useState(0);
 const [offset,setOffset]=useState(0);
 useEffect(()=>{
  if(!token)return;
  const controller=new AbortController();
  setItems([]);setPreferences({});setEvidence("");setNotice("");
  const request=(path:string)=>fetch(API+path,{credentials:"include",cache:"no-store",signal:controller.signal,headers:{Authorization:"Bearer "+token}}).then(async r=>{if(!r.ok)throw new Error("लोड भएन। Backend update र admin access जाँच्नुहोस्।");const d=await r.json();return d.data||d;});
  void Promise.all([request("/ai-owner/admin/question-library?offset="+offset),userId?request("/ai-owner/admin/users/"+encodeURIComponent(userId)+"/communication"):Promise.resolve(null)])
   .then(([questions,memory])=>{if(controller.signal.aborted)return;setItems(questions);if(memory){setPreferences(memory.preferences||{});setEvidence(memory.evidence||"");}})
   .catch(e=>{if(!controller.signal.aborted)setNotice(String(e.message||e));});
  return()=>controller.abort();
 },[token,userId,refresh,offset]);
 async function save(path:string,body:unknown){
  if(!token||busy)return;
  setBusy(true);setNotice("");
  try{
   const r=await fetch(API+path,{method:"PATCH",credentials:"include",headers:{Authorization:"Bearer "+token,"Content-Type":"application/json"},body:JSON.stringify(body)});
   const data=await r.json().catch(()=>({}));if(!r.ok)throw new Error(typeof data.message==="string"?data.message:"Save भएन।");
   setNotice("Save भयो। नयाँ call मा लागू हुन्छ।");
  }catch(e){setNotice(e instanceof Error?e.message:"Save भएन।");}
  finally{setBusy(false);}
 }
 return <section className="space-y-4 rounded-xl border p-5">
  <div className="flex items-center justify-between gap-2"><h2 className="text-lg font-semibold">प्रश्न भण्डार र Owner को बोल्ने रोजाइ</h2><button type="button" disabled={busy} onClick={()=>setRefresh(n=>n+1)} className="rounded border px-3 py-2">Refresh</button></div>
  <p className="text-sm text-muted-foreground">AI का प्रश्न Draft मा आउँछन्। सच्याएर सम्बन्धित विवरण छानेपछि मात्र प्रयोगमा राख्नुहोस्। प्रत्येक पेजमा २०० फरक प्रश्न देखिन्छन्; दोहोरिएको प्रश्नको संख्या बढ्छ।</p>
  {notice&&<p role="status" className="text-sm">{notice}</p>}
  <details className="rounded-lg border p-3"><summary className="cursor-pointer font-medium">AI ले सोधेका प्रश्न ({items.length})</summary>
   {!items.length&&<p className="mt-3 text-sm">अहिलेसम्म प्रश्न आएको छैन। Website call मा transcript को अनुमति दिएपछि प्रश्न पनि यहाँ आउँछन्।</p>}
   {items.map(item=><article key={item.id} className="mt-3 space-y-2 rounded border p-3">
    <label className="block text-sm">प्रश्न<textarea rows={2} maxLength={400} value={item.question} onChange={e=>setItems(list=>list.map(q=>q.id===item.id?{...q,question:e.target.value}:q))} className="mt-1 w-full rounded border bg-background p-2"/></label>
    <p className="text-xs text-muted-foreground">स्रोत: {item.source} · देखिएको: {item.seenCount} · मूल: {item.originalQuestion}</p>
    <div className="flex flex-wrap gap-2">
     <label className="text-sm">विवरण<select value={item.field||""} onChange={e=>setItems(list=>list.map(q=>q.id===item.id?{...q,field:e.target.value||null}:q))} className="ml-2 rounded border bg-background p-2"><option value="">छान्नुहोस्</option>{FIELDS.map(f=><option key={f} value={f}>{f}</option>)}</select></label>
     <label className="text-sm">अवस्था<select value={item.status} onChange={e=>setItems(list=>list.map(q=>q.id===item.id?{...q,status:e.target.value}:q))} className="ml-2 rounded border bg-background p-2"><option value="DRAFT">Draft</option><option value="ACTIVE">प्रयोग गर्ने</option><option value="DISABLED">बन्द</option></select></label>
     <button type="button" disabled={busy} onClick={()=>void save("/ai-owner/admin/question-library/"+item.id,{question:item.question,field:item.field,status:item.status})} className="rounded bg-blue-700 px-3 py-2 text-sm text-white disabled:opacity-40">Save</button>
    </div>
   </article>)}
   <div className="mt-3 flex justify-between"><button type="button" disabled={offset===0||busy} onClick={()=>setOffset(n=>Math.max(0,n-200))}>Previous</button><span>Page {offset/200+1}</span><button type="button" disabled={items.length<200||busy} onClick={()=>setOffset(n=>n+200)}>Next</button></div>
  </details>
  {userId?<div className="space-y-3 rounded-lg border p-3">
   <h3 className="font-medium">छानिएको Owner को सञ्चार रोजाइ</h3>
   <p className="text-xs text-muted-foreground">पुरानो अनुमति भएको website conversation मा स्पष्ट मागेको भाषा, गति र उत्तरको लम्बाइ मात्र सम्झिन्छ। व्यक्तित्व अनुमान गर्दैन। Phone नम्बर मात्रैका आधारमा account memory जोडिँदैन।</p>
   {evidence&&<p className="rounded bg-muted p-2 text-sm">Owner ले भनेको: {evidence}</p>}
   {([["language","भाषा",[["ne","नेपाली"],["en","English"]]],["pace","गति",[["slow","बिस्तारै"],["normal","सामान्य"]]],["replyLength","उत्तर",[["short","छोटो"],["normal","सामान्य"]]]] as [string,string,string[][]][]).map(([key,label,options])=><label key={key} className="block text-sm">{label}<select className="ml-3 rounded border bg-background p-2" value={preferences[key]||""} onChange={e=>setPreferences(p=>{const next={...p};if(e.target.value)next[key]=e.target.value;else delete next[key];return next;})}><option value="">निर्धारण छैन</option>{options.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></label>)}
   <div className="flex gap-2"><button type="button" disabled={busy} onClick={()=>void save("/ai-owner/admin/users/"+userId+"/communication",{preferences})} className="rounded bg-blue-700 px-3 py-2 text-sm text-white">रोजाइ Save</button><button type="button" disabled={busy} onClick={()=>{setPreferences({});setEvidence("");void save("/ai-owner/admin/users/"+userId+"/communication",{preferences:{}});}} className="rounded border px-3 py-2 text-sm">Memory हटाउने</button></div>
  </div>:<p className="text-sm">Owner को रोजाइ हेर्न माथिबाट user छान्नुहोस्।</p>}
 </section>;
}
