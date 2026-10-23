"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import useTokenStore from "@/store";
const Voice = dynamic(() => import("@/components/OwnerRealtimeVoice"), { ssr:false });
const API=(process.env.NEXT_PUBLIC_BACKEND_URL || "https://api.roomkhoj.com").replace(/\/$/,"");
type Review={kind:"style"|"memory";text:string;summary:string;suggestions:string[];risks:string[];severity:"low"|"medium"|"high";style:{tone:string;length:string;acknowledgements:boolean}|null};
type Memory={id:string;source?:string;review:Review;status:"DRAFT"|"SAVED"|"DELETED";createdAt?:string;savedAt?:string;deletedAt?:string};
type Session={id:string;expiresAt:string};

export default function DeveloperVoiceTraining() {
  const token=useTokenStore(s=>s.token);
  const [session,setSession]=useState<Session|null>(null);
  const [draft,setDraft]=useState<Memory|null>(null);
  const [memories,setMemories]=useState<Memory[]>([]);
  const [hasMore,setHasMore]=useState(false);
  const [lesson,setLesson]=useState("");
  const [feedback,setFeedback]=useState<{id:string;text:string}|null>(null);
  const [busy,setBusy]=useState(false);
  const [status,setStatus]=useState("");
  const [filter,setFilter]=useState("ALL");
  const [search,setSearch]=useState("");
  const sessionRef=useRef<Session|null>(null);
  const draftRef=useRef<Memory|null>(null);
  const sequence=useRef(0);
  const inFlight=useRef<AbortController|null>(null);
  const opening=useRef(false);
  const saving=useRef(false);

  const request=useCallback(async(path:string,method="GET",body?:unknown,signal?:AbortSignal)=>{
    const res=await fetch(API+"/ai-owner/admin/training/"+path,{
      method,credentials:"include",signal,headers:{Authorization:`Bearer ${token}`,"Content-Type":"application/json"},
      ...(body===undefined?{}:{body:JSON.stringify(body)}),
    });
    const json=await res.json().catch(()=>({}));
    if(!res.ok)throw new Error(typeof json.message==="string"?json.message:"Training request failed");
    return json.data??json;
  },[token]);

  const disable=useCallback(()=>{
    sequence.current++;inFlight.current?.abort();inFlight.current=null;opening.current=false;saving.current=false;
    const old=sessionRef.current;sessionRef.current=null;draftRef.current=null;
    setSession(null);setDraft(null);setFeedback(null);setBusy(false);setStatus("Developer Mode बन्द छ।");
    if(old)void request("sessions/"+old.id,"DELETE").catch(()=>undefined);
  },[request]);

  useEffect(()=>{ return ()=>{
    sequence.current++;inFlight.current?.abort();
    const old=sessionRef.current;sessionRef.current=null;
    if(old)void request("sessions/"+old.id,"DELETE").catch(()=>undefined);
  };},[request]);
  useEffect(()=>{
    if(!session)return;
    const timer=setTimeout(disable,Math.max(0,Date.parse(session.expiresAt)-Date.now()));
    return ()=>clearTimeout(timer);
  },[session,disable]);
  useEffect(()=>{setSession(null);setDraft(null);setMemories([]);draftRef.current=null;setFeedback(null);setBusy(false);},[token]);

  async function enable(){
    if(opening.current)return;
    opening.current=true;const seq=++sequence.current;setBusy(true);setStatus("");
    try{
      const next:Session=await request("sessions","POST");
      if(seq!==sequence.current){void request("sessions/"+next.id,"DELETE").catch(()=>undefined);return;}
      sessionRef.current=next;setSession(next);
      const rows=await request("sessions/"+next.id+"/memories");
      if(seq===sequence.current){setMemories(rows);setHasMore(rows.length===100);}
    }catch(e){if(seq===sequence.current)setStatus(e instanceof Error?e.message:"Mode खोल्न सकिएन।");}
    finally{if(seq===sequence.current){opening.current=false;setBusy(false);}}
  }

  async function review(source:string){
    const current=sessionRef.current;if(!current||saving.current)return;
    const seq=++sequence.current;inFlight.current?.abort();
    const abort=new AbortController();inFlight.current=abort;
    setBusy(true);setDraft(null);draftRef.current=null;setStatus("बुझेको कुरा, सुझाव र जोखिम जाँच्दैछु…");
    try{
      const next:Memory=await request("sessions/"+current.id+"/review","POST",{source},abort.signal);
      if(seq!==sequence.current||sessionRef.current?.id!==current.id)return;
      draftRef.current=next;setDraft(next);setMemories(rows=>[next,...rows]);
      const r=next.review;
      const text=JSON.stringify({saved:false,summary:r.summary,proposedMemory:r.text,suggestions:r.suggestions,risks:r.risks,severity:r.severity,
        next:r.severity==="high"?"यो draft save गर्न मिल्दैन। जोखिम सच्याएर नयाँ review गर्नुहोस्।":"यो कुरा ठ्याक्कै save गर्न पक्का सेभ गर भन्नुहोस् वा Save थिच्नुहोस्।"});
      setFeedback({id:next.id,text});setStatus("Draft तयार छ; अझै save भएको छैन।");
    }catch(e){if(seq===sequence.current){const message=e instanceof Error?e.message:"Review असफल भयो।";setStatus(message);setFeedback({id:crypto.randomUUID(),text:JSON.stringify({saved:false,error:message,next:"कुरा स्पष्ट भएन। पूरा lesson फेरि भन्नुहोस्। केहि save भएको छैन।"})});}}
    finally{if(seq===sequence.current)setBusy(false);}
  }

  async function save(){
    const current=sessionRef.current;const chosen=draftRef.current;
    if(!current||!chosen||saving.current||busy||chosen.review.severity==="high")return;
    saving.current=true;setBusy(true);const seq=++sequence.current;
    try{
      const saved:Memory=await request("sessions/"+current.id+"/memories/"+chosen.id+"/save","POST",{confirmed:true});
      if(seq!==sequence.current||sessionRef.current?.id!==current.id)return;
      draftRef.current=null;setDraft(null);setMemories(rows=>rows.map(row=>row.id===saved.id?{...row,...saved}:row));
      setStatus("Memory save भयो। अर्को voice session मा प्रयोग हुनेछ।");
      setFeedback({id:crypto.randomUUID(),text:JSON.stringify({saved:true,memory:saved.review.text,scope:saved.review.kind==="style"?"तपाईंको अर्को owner voice test मा बोल्ने शैली":"अर्को owner voice test मा reference"})});
    }catch(e){if(seq===sequence.current)setStatus(e instanceof Error?e.message:"Save असफल भयो।");}
    finally{if(seq===sequence.current){saving.current=false;setBusy(false);}}
  }
  async function more(){
    const current=sessionRef.current;if(!current||busy)return;
    const seq=++sequence.current;setBusy(true);
    try{
      const next:Memory[]=await request("sessions/"+current.id+"/memories?offset="+memories.length);
      if(seq!==sequence.current)return;
      setMemories(rows=>[...rows,...next.filter(n=>!rows.some(row=>row.id===n.id))]);setHasMore(next.length===100);
    }catch(e){if(seq===sequence.current)setStatus(e instanceof Error?e.message:"History ल्याउन सकिएन।");}
    finally{if(seq===sequence.current)setBusy(false);}
  }
  async function remove(id:string){
    const current=sessionRef.current;if(!current||busy)return;
    const seq=++sequence.current;setBusy(true);
    try{
      await request("sessions/"+current.id+"/memories/"+id,"DELETE");
      if(seq!==sequence.current)return;
      setMemories(rows=>rows.map(row=>row.id===id?{...row,status:"DELETED"}:row));
      setStatus("Memory हटाइयो। नयाँ voice session मा प्रयोग हुँदैन।");
    }catch(e){if(seq===sequence.current)setStatus(e instanceof Error?e.message:"हटाउन सकिएन।");}
    finally{if(seq===sequence.current)setBusy(false);}
  }
  function utterance(text:string){
    const exact=text.toLowerCase().replace(/[।.!?,]/g,"").trim();
    if(["पक्का सेभ गर","पक्का सेभ गर्नुहोस्","pakka save gara","confirm save"].includes(exact)){void save();return;}
    setLesson(text);void review(text);
  }
  const rows=memories.filter(m=>(filter==="ALL"||m.status===filter)&&
    (m.review.text+" "+m.review.summary+" "+(m.source||"")).toLowerCase().includes(search.toLowerCase()));
  const time=(value?:string)=>value?new Date(value).toLocaleString():"—";
  return <section className="space-y-4 rounded-xl border bg-background p-5">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h2 className="text-lg font-semibold">Developer Voice Training & AI Memory</h2>
      <p className="text-sm text-muted-foreground">आवाजबाट सिकाउनुहोस्। बोलेको lesson review draft का रूपमा राखिन्छ; स्पष्ट पुष्टि गरेपछि मात्र सक्रिय memory हुन्छ।</p></div>
      <button type="button" disabled={busy&&!session} aria-pressed={!!session} onClick={session?disable:()=>void enable()} className="rounded-lg bg-blue-700 px-4 py-3 text-white disabled:opacity-50">{session?"Developer Mode बन्द गर्नुहोस्":"Developer Mode खोल्नुहोस्"}</button>
    </div>
    <p role="status" aria-live="polite" className="text-sm">{status}</p>
    {session&&<>
      <Voice key={session.id} developerSessionId={session.id} onUtterance={utterance} feedback={feedback}/>
      <label className="block text-sm">बोलेको lesson सच्याउनुहोस्
        <textarea value={lesson} maxLength={1500} onChange={e=>{setLesson(e.target.value);draftRef.current=null;setDraft(null);sequence.current++;inFlight.current?.abort();setBusy(false);}} className="mt-2 min-h-24 w-full rounded border bg-background p-3"/>
      </label>
      <button type="button" disabled={busy||lesson.trim().length<4} onClick={()=>void review(lesson)} className="rounded-lg border px-4 py-2 disabled:opacity-50">बुझाइ, सुझाव र जोखिम जाँच्नुहोस्</button>
      {draft&&<div className="space-y-2 rounded-xl border p-4">
        <h3 className="font-semibold">Save गर्नुअघिको draft · {draft.review.severity} risk</h3>
        <p>{draft.review.summary}</p><p className="whitespace-pre-wrap">{draft.review.text}</p>
        <p className="text-sm">सुझाव: {draft.review.suggestions.join(" · ")||"—"}</p>
        <p className="text-sm">सम्भावित जोखिम: {draft.review.risks.join(" · ")||"Review मा विशेष जोखिम भेटिएन; यो सही भएको ग्यारेन्टी होइन।"}</p>
        <button type="button" disabled={busy||draft.review.severity==="high"} onClick={()=>void save()} className="rounded-lg bg-green-700 px-4 py-2 text-white disabled:opacity-50">पक्का सेभ गर — Save reviewed memory</button>
      </div>}
      <div className="space-y-3 border-t pt-4">
        <h3 className="font-semibold">AI ले के save गरेको छ?</h3>
        <div className="flex flex-wrap gap-3">
          <input aria-label="Search AI memory" placeholder="Memory खोज्नुहोस्…" value={search} onChange={e=>setSearch(e.target.value)} className="rounded border bg-background p-2"/>
          <select aria-label="Memory status" value={filter} onChange={e=>setFilter(e.target.value)} className="rounded border bg-background p-2">
            <option value="ALL">सबै history</option><option value="SAVED">Saved</option><option value="DRAFT">Draft</option><option value="DELETED">Deleted</option>
          </select>
        </div>
        <p className="text-xs text-muted-foreground">तपाईंको admin account को history। पछिल्लो saved style र पछिल्ला २० saved reference notes अर्को session मा प्रयोग हुन्छन्। पुराना entries हेर्न थप history खोल्नुहोस्। Style: अर्को owner voice test मा। Reference notes: अर्को owner voice test मा relevant reference मात्र। हटाएको style भए अघिल्लो saved style लागू हुन सक्छ।</p>
        {hasMore&&<button type="button" disabled={busy} onClick={()=>void more()} className="rounded border px-4 py-2">अझै पुरानो history हेर्नुहोस्</button>}
        {!rows.length&&<p className="text-sm">Memory भेटिएन।</p>}
        {rows.map(row=><article key={row.id} className="space-y-2 rounded-lg border p-4 text-sm">
          <div className="flex justify-between gap-2"><strong>{row.review.kind==="style"?"बोल्ने शैली":"Voice reference memory"}</strong><span>{row.status} · {row.review.severity} risk</span></div>
          <p className="whitespace-pre-wrap">{row.review.text}</p>
          <p>बुझाइ: {row.review.summary}</p>
          <p className="text-xs text-muted-foreground">बनाएको: {time(row.createdAt)} · Saved: {time(row.savedAt)}{row.deletedAt?" · हटाएको: "+time(row.deletedAt):""}</p>
          <details><summary className="cursor-pointer">मूल lesson, सुझाव र जोखिम</summary>
            <p className="mt-2 whitespace-pre-wrap">{row.source}</p>
            <p>सुझाव: {row.review.suggestions.join(" · ")||"—"}</p><p>जोखिम: {row.review.risks.join(" · ")||"—"}</p>
            {row.review.style&&<p>Style: {row.review.style.tone} · {row.review.style.length} · Acknowledgements {row.review.style.acknowledgements?"On":"Off"}</p>}
          </details>
          {row.status==="SAVED"&&<button type="button" disabled={busy} onClick={()=>void remove(row.id)} className="rounded border px-3 py-2 text-red-700 disabled:opacity-50">Memory हटाउनुहोस्</button>}
          {row.status!=="DELETED"&&<button type="button" disabled={busy} onClick={()=>{setLesson(row.source||row.review.text);draftRef.current=null;setDraft(null);}} className="ml-2 rounded border px-3 py-2">सच्याएर फेरि review</button>}
        </article>)}
      </div>
    </>}
  </section>;
}
