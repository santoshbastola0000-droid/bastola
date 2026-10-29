"use client";
import { FormEvent, useId, useRef, useState } from "react";
import Link from "next/link";
import { Flag } from "lucide-react";
import { useUserStore } from "@/stores/user-store";
import { privateApi } from "@/http/api/privateApi";
import { officeError } from "@/http/services/office.service";
const reasons=[["NOT_AVAILABLE","Room उपलब्ध छैन"],["WRONG_DETAILS","गलत जानकारी / मूल्य"],["SCAM","Scam वा शंकास्पद listing"],["INAPPROPRIATE","अनुपयुक्त content"],["OTHER","अन्य कारण"]];
export function ReportRoom({roomId}:{roomId:string}) {
 const user=useUserStore(state=>state.user),formId=useId(),pending=useRef(false);
 const [reason,setReason]=useState("NOT_AVAILABLE"),[details,setDetails]=useState(""),[busy,setBusy]=useState(false),[sent,setSent]=useState(false),[error,setError]=useState("");
 async function submit(event:FormEvent){
  event.preventDefault();if(pending.current)return;pending.current=true;setBusy(true);setError("");
  try{await privateApi.post("/office/availability/"+encodeURIComponent(roomId)+"/report",{reason,details:details.trim()});setSent(true);}
  catch(e){setError((e as {response?:{status?:number}})?.response?.status===404?"Report सेवा अहिले उपलब्ध छैन। केही समयपछि प्रयास गर्नुहोस्।":officeError(e));}
  finally{pending.current=false;setBusy(false);}
 }
 return <details className="mx-4 mb-6 rounded-xl border border-border bg-card text-card-foreground sm:mx-5">
  <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2.5 text-xs font-semibold text-muted-foreground [&::-webkit-details-marker]:hidden"><Flag className="h-3.5 w-3.5" aria-hidden="true"/>Report this room</summary>
  <div className="space-y-3 border-t border-border p-3">
   <p className="text-xs text-muted-foreground">Report admin ले मात्र हेर्न मिल्छ।</p>
   {sent?<p role="status" className="rounded-lg bg-primary/10 p-3 text-xs text-primary">Report पठाइयो। Admin ले जाँच गर्नुहुनेछ।</p>:user?<form onSubmit={submit} className="space-y-3">
    <label htmlFor={formId} className="block text-xs font-medium">कारण</label><select id={formId} value={reason} onChange={e=>setReason(e.target.value)} className="w-full rounded-lg border border-input bg-background p-2 text-sm">{reasons.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select>
    <label htmlFor={formId+"-details"} className="block text-xs font-medium">थप विवरण {reason!=="OTHER"&&"(optional)"}</label><textarea id={formId+"-details"} required={reason==="OTHER"} maxLength={2000} rows={3} value={details} onChange={e=>setDetails(e.target.value)} className="w-full rounded-lg border border-input bg-background p-2 text-[16px] sm:text-sm" placeholder="समस्या छोटकरीमा लेख्नुहोस्…"/>
    <button disabled={busy} className="rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-50">{busy?"Sending…":"Send report to admin"}</button>
   </form>:<Link href="/auth/login" className="inline-block rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground">Log in to report</Link>}
   {error&&<p role="alert" className="text-xs text-destructive">{error}</p>}
  </div>
 </details>;
}
