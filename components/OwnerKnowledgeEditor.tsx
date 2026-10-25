"use client";
import {useState} from 'react';
import useTokenStore from '@/store';
const API=(process.env.NEXT_PUBLIC_BACKEND_URL||'https://api.roomkhoj.com').replace(/\/$/,'');
type Entry={id:string;question:string;answer:string;aliases:string[];status:'DRAFT'|'ACTIVE'|'DISABLED';source:string};
export function OwnerKnowledgeEditor(){
 const token=useTokenStore(s=>s.token);const [items,setItems]=useState<Entry[]>([]),[question,setQuestion]=useState(''),[answer,setAnswer]=useState(''),[message,setMessage]=useState(''),[busy,setBusy]=useState(false),[loaded,setLoaded]=useState(false),[edits,setEdits]=useState<Record<string,{answer:string;aliases:string;confirmed:boolean}>>({});
 async function request(path:string,method='GET',body?:unknown){
   const response=await fetch(API+'/ai-owner/admin/knowledge'+path,{method,credentials:'include',headers:{Authorization:`Bearer ${token}`,...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});
   const payload=await response.json().catch(()=>null);if(!response.ok)throw new Error(payload?.message||'Knowledge worker configure वा उपलब्ध छैन।');return payload?.data||payload;
 }
 async function load(){if(!token)return;setBusy(true);setMessage('');try{const rows=await request('');setItems(Array.isArray(rows)?rows:[]);setEdits({});setLoaded(true);}catch(e){setMessage(String(e));}finally{setBusy(false);}}
 async function save(){if(!token||busy)return;setBusy(true);setMessage('');try{await request('','POST',{question,answer});setQuestion('');setAnswer('');const rows=await request('');setItems(rows);setLoaded(true);setMessage('Draft save भयो। जाँचेर मात्र Activate गर्नुहोस्।');}catch(e){setMessage(String(e));}finally{setBusy(false);}}
 async function review(row:Entry,status:Entry['status']){
   const edit=edits[row.id]||{answer:row.answer,aliases:row.aliases.join('\n'),confirmed:false};
   if(busy||!token)return;setBusy(true);setMessage('');try{await request('/'+row.id,'PATCH',{answer:edit.answer,aliases:edit.aliases.split('\n').map(s=>s.trim()).filter(Boolean),status,publicConfirmed:edit.confirmed});const rows=await request('');setItems(rows);setEdits({});}catch(e){setMessage(String(e));}finally{setBusy(false);}
 }
 function change(row:Entry,patch:Partial<{answer:string;aliases:string;confirmed:boolean}>){setEdits(prev=>({...prev,[row.id]:{...(prev[row.id]||{answer:row.answer,aliases:row.aliases.join('\n'),confirmed:false}),...patch}}));}
 return <details className="space-y-3 rounded-xl border p-5"><summary className="cursor-pointer font-semibold">API बिना सिकाउने · Approved FAQ knowledge</summary>
   <p className="mt-3 text-sm">Question–answer save र review गर्न OpenAI प्रयोग हुँदैन। यो छुट्टै worker मा रहने knowledge हो; model को weights training होइन। सार्वजनिक, स्थिर office/app/सेवा सम्बन्धी उत्तर मात्र राख्नुहोस्। Owner का भाडा, availability र व्यक्तिगत विवरण यहाँ नराख्नुहोस्।</p>
   <div className="space-y-2"><label className="block text-sm">प्रश्न<input maxLength={400} value={question} onChange={e=>setQuestion(e.target.value)} className="mt-1 w-full rounded border bg-background p-2" placeholder="Office ko location kata xa?"/></label>
   <label className="block text-sm">सही उत्तर<textarea maxLength={1500} value={answer} onChange={e=>setAnswer(e.target.value)} className="mt-1 w-full rounded border bg-background p-2"/></label>
   <button disabled={busy||question.trim().length<4||!answer.trim()} onClick={()=>void save()} className="rounded bg-blue-700 px-4 py-2 text-white disabled:opacity-50">Draft save</button> <button disabled={busy} onClick={()=>void load()} className="rounded border px-4 py-2">{loaded?'Refresh':'Saved knowledge हेर्नुहोस्'}</button></div>
   {message&&<p role="status" className="text-sm">{message}</p>}
   {items.map(row=>{const edit=edits[row.id]||{answer:row.answer,aliases:row.aliases.join('\n'),confirmed:false};return <article key={row.id} className="space-y-2 rounded border p-3 text-sm">
     <h3 className="font-medium">{row.question} · {row.status}</h3><p className="text-xs">Source: {row.source}</p>
     <label className="block">उत्तर<textarea value={edit.answer} maxLength={1500} onChange={e=>change(row,{answer:e.target.value,confirmed:false})} className="mt-1 w-full rounded border bg-background p-2"/></label>
     <label className="block">उस्तै प्रश्नहरू (एक line मा एउटा)<textarea value={edit.aliases} onChange={e=>change(row,{aliases:e.target.value,confirmed:false})} className="mt-1 w-full rounded border bg-background p-2"/></label>
     <label className="flex items-start gap-2"><input type="checkbox" checked={edit.confirmed} onChange={e=>change(row,{confirmed:e.target.checked})}/>यो उत्तर जाँचेको छु र सार्वजनिक FAQ का लागि सही छ।</label>
     <button disabled={busy||!edit.confirmed} onClick={()=>void review(row,'ACTIVE')} className="rounded bg-green-700 px-3 py-2 text-white disabled:opacity-50">Approve / Update</button> <button disabled={busy} onClick={()=>void review(row,'DISABLED')} className="rounded border px-3 py-2">Disable</button>
   </article>;})}
 </details>;
}
