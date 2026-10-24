"use client";

import { useCallback, useEffect, useState } from "react";
import useTokenStore from "@/store";

const API = (process.env.NEXT_PUBLIC_BACKEND_URL || "https://api.roomkhoj.com").replace(/\/$/, "");
const FIELDS: Record<string, string> = {
  ownerName:"मालिकको नाम", location:"ठाउँ", landmark:"नजिकको चिनारी", roomType:"कोठाको प्रकार",
  monthlyRentNpr:"मासिक भाडा", depositNpr:"धरौटी", availableRooms:"खाली कोठाको संख्या",
  bathroom:"बाथरुम", kitchen:"भान्सा", water:"पानी", electricity:"बिजुली", wifi:"Wi-Fi",
  parking:"पार्किङ", furnished:"फर्निचर", availableFrom:"खाली हुने मिति", restrictions:"सर्तहरू", notes:"अन्य विवरण / सुविधा",
};
type Question = {field:string; question:string; required:boolean; enabled:boolean};
type Plan = {questions:Question[];updatedAt:string|null};
const button = "rounded-lg border px-3 py-2 text-sm disabled:opacity-40";

export function OwnerRequiredDetails() {
  const token = useTokenStore(s=>s.token);
  const [plan, setPlan] = useState<Plan|null>(null);
  const [saved, setSaved] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const load = useCallback(async (signal?:AbortSignal) => {
    if (!token) return;
    setBusy(true);setError("");
    try {
      const r=await fetch(API+"/ai-owner/admin/required-details",{credentials:"include",cache:"no-store",signal,headers:{Authorization:`Bearer ${token}`}});
      if(!r.ok)throw new Error("प्रश्न लोड भएनन्। Backend update र admin login जाँच गर्नुहोस्।");
      const raw=await r.json();const data:Plan=raw.data||raw;
      if(!Array.isArray(data.questions))throw new Error("प्रश्नको format मिलेन।");
      setPlan(data);setSaved(JSON.stringify(data.questions));
    }catch(e){if(!signal?.aborted)setError(e instanceof Error?e.message:"लोड भएन।");}
    finally{if(!signal?.aborted)setBusy(false);}
  },[token]);
  useEffect(()=>{const controller=new AbortController();setPlan(null);void load(controller.signal);return()=>controller.abort();},[load]);
  const update=(index:number, patch:Partial<Question>)=>{
    setNotice("");setPlan(p=>p?{...p,questions:p.questions.map((q,i)=>i===index?{...q,...patch}:q)}:p);
  };
  const move=(index:number, direction:number)=>{
    setNotice("");setPlan(p=>{
      if(!p || index+direction<0 || index+direction>=p.questions.length)return p;
      const questions=[...p.questions];[questions[index],questions[index+direction]]=[questions[index+direction],questions[index]];
      return {...p,questions};
    });
  };
  const save=async()=>{
    if(!plan||!token||busy)return;
    setBusy(true);setError("");setNotice("");
    try {
      const r=await fetch(API+"/ai-owner/admin/required-details",{method:"PATCH",credentials:"include",headers:{Authorization:`Bearer ${token}`,"Content-Type":"application/json"},body:JSON.stringify({questions:plan.questions})});
      const raw=await r.json().catch(()=>({}));
      if(!r.ok)throw new Error(typeof raw.message==="string"?raw.message:"प्रश्न save भएनन्। फेरि प्रयास गर्नुहोस्।");
      const data:Plan=raw.data||raw;setPlan(data);setSaved(JSON.stringify(data.questions));
      setNotice("प्रश्न save भए। नयाँ voice session र नयाँ website owner call मा लागू हुन्छन्।");
    }catch(e){setError(e instanceof Error?e.message:"Save भएन।");}
    finally{setBusy(false);}
  };
  const dirty=plan!==null && JSON.stringify(plan.questions)!==saved;
  const valid=plan!==null && plan.questions.every(q=>q.question.trim().length>=4&&q.question.length<=400);
  const available=Object.keys(FIELDS).filter(field=>!plan?.questions.some(q=>q.field===field));
  return <section className="space-y-4 rounded-xl border p-5" aria-labelledby="required-details-title">
    <h2 id="required-details-title" className="text-lg font-semibold">आवश्यक विवरण</h2>
    <p className="text-sm text-muted-foreground">Owner लाई सोध्ने प्रश्न तयार गर्नुहोस्। AI ले पहिले कोठा उपलब्ध छ कि छैन बुझ्छ, त्यसपछि यहाँको क्रममा एकएक प्रश्न सोध्छ। दिइसकेको उत्तर फेरि सोध्दैन।</p>
    {error&&<p role="alert" className="text-sm text-red-700">{error}</p>}
    {notice&&<p role="status" className="text-sm text-green-700">{notice}</p>}
    {!plan?<button type="button" className={button} disabled={busy||!token} onClick={()=>void load()}>{busy?"लोड हुँदैछ…":"फेरि लोड गर्नुहोस्"}</button>:<>
      <fieldset disabled={busy} className="space-y-3">
        <legend className="sr-only">Owner call का प्रश्नहरू</legend>
        {!plan.questions.length&&<p className="text-sm">प्रश्न छैनन्। तलबाट विवरण थप्नुहोस्।</p>}
        {plan.questions.map((q,i)=><div key={q.field} className="space-y-3 rounded-lg border p-3">
          <label htmlFor={`owner-question-${q.field}`} className="block text-sm font-medium">{i+1}. {FIELDS[q.field]}</label>
          <textarea id={`owner-question-${q.field}`} value={q.question} onChange={e=>update(i,{question:e.target.value})} rows={2} minLength={4} maxLength={400} className="w-full rounded-lg border bg-background p-3" />
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <label className="flex items-center gap-2"><input type="checkbox" checked={q.required} onChange={e=>update(i,{required:e.target.checked})}/>आवश्यक</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={q.enabled} onChange={e=>update(i,{enabled:e.target.checked})}/>सोध्ने (On)</label>
            <button type="button" className={button} aria-label={`${FIELDS[q.field]} माथि सार्ने`} disabled={i===0} onClick={()=>move(i,-1)}>↑ माथि</button>
            <button type="button" className={button} aria-label={`${FIELDS[q.field]} तल सार्ने`} disabled={i===plan.questions.length-1} onClick={()=>move(i,1)}>↓ तल</button>
            <button type="button" className={button} onClick={()=>{setNotice("");setPlan(p=>p?{...p,questions:p.questions.filter(x=>x.field!==q.field)}:p);}}>हटाउने</button>
          </div>
        </div>)}
        <label className="block space-y-2 text-sm"><span>नयाँ विवरण / प्रश्न थप्ने</span>
          <select value="" disabled={!available.length} className="w-full rounded-lg border bg-background p-3" onChange={e=>{const field=e.target.value;if(!field)return;setNotice("");setPlan(p=>p?{...p,questions:[...p.questions,{field,question:"",required:false,enabled:true}]}:p);}}>
            <option value="">विवरण छान्नुहोस्…</option>{available.map(field=><option key={field} value={field}>{FIELDS[field]}</option>)}
          </select>
        </label>
      </fieldset>
      <p className="text-xs text-muted-foreground">“आवश्यक” भए पनि owner लाई जवाफ दिन बाध्य पार्दैन। अस्पष्ट उत्तरमा फेरि सोध्छ; प्रश्न save गर्दा कोठाको वास्तविक विवरण बदलिँदैन।</p>
      {dirty&&<p className="text-sm">परिवर्तन save गर्न बाँकी छ।</p>}
      <button type="button" disabled={busy||!dirty||!valid} onClick={()=>void save()} className="rounded-lg bg-blue-700 px-4 py-3 text-white disabled:opacity-40">{busy?"Save हुँदैछ…":"प्रश्नहरू Save गर्ने"}</button>
      {plan.updatedAt&&<p className="text-xs">पछिल्लो save: {new Date(plan.updatedAt).toLocaleString()}</p>}
    </>}
  </section>;
}
