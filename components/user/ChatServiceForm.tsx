"use client";
import { FormEvent, useRef, useState } from 'react';
import { privateApi } from '@/http/api/privateApi';
import { officeError } from '@/http/services/office.service';

export const chatServices = { ROOM:'Room requirement', JOB:'Job requirement', MOVING:'Room shifting', CLEANING:'Home cleaning', REPAIR:'Repair / electrician', PLUMBING:'Plumbing', INTERNET:'Internet setup', OTHER:'Other service' } as const;
export type ChatService = keyof typeof chatServices;
export function requestedChatForm(text: string): ChatService | undefined {
  const t=text.toLowerCase();
  if (/(?:cancel|रद्द|form.*(?:nacha|pardaina)|फारम.*चाहिँदैन)/u.test(t)) return;
  const services: [ChatService,RegExp][]=[['MOVING',/shifting|moving|सार्ने|shift gar/],['CLEANING',/cleaning|सफाइ|सरसफाइ/],['REPAIR',/repair|electrician|मर्मत|बिजुली/],['PLUMBING',/plumbing|plumber|प्लम्ब/],['INTERNET',/internet|wifi setup|इन्टरनेट/],['JOB',/job|jagir|जागिर/],['ROOM',/room|kotha|कोठा|flat|फ्ल्याट/]];
  const request=/(?:form|फारम|requirement|req\b|apply|आवेदन|request|book|chaiyo|chahiyo|चाहियो|चाहिन्छ|bhar|भर|सेवा)/u.test(t);
  if (!request) return;
  return services.find(([,pattern])=>pattern.test(t))?.[0] || (/service|सेवा/.test(t)?'OTHER':undefined);
}
const field='mt-1 w-full min-w-0 rounded-lg border border-slate-300 bg-white p-2 text-sm text-slate-900';
export function ChatServiceForm({service,authenticated}:{service:ChatService;authenticated:boolean}) {
  const [draft,setDraft]=useState({name:'',phone:'',city:'Pokhara',area:'',roomType:'ANY',people:'1',budget:'',date:'',details:''});
  const [busy,setBusy]=useState(false);const [done,setDone]=useState(false);const [error,setError]=useState('');const pending=useRef(false);const key=useRef<string>('');
  const update=(name:keyof typeof draft,value:string)=>setDraft(prev=>({...prev,[name]:value}));
  async function submit(event:FormEvent) {
    event.preventDefault();if(pending.current||!authenticated)return;
    pending.current=true;setBusy(true);setError('');
    try {key.current ||= crypto.randomUUID();await privateApi.post('/office/chat-forms',{requestKey:key.current,service,name:draft.name,phone:draft.phone,location:[draft.city,draft.area].filter(Boolean).join(', '),details:[draft.date&&`Preferred date: ${draft.date}`,draft.details].filter(Boolean).join('\n'),requirements:service==='ROOM'?{city:draft.city,area:draft.area,roomType:draft.roomType,people:Number(draft.people),minRent:0,maxRent:Number(draft.budget),facilities:[]}:undefined});setDone(true);}catch(e){setError(officeError(e));}finally{pending.current=false;setBusy(false);}
  }
  if(done)return <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">✓ {chatServices[service]} reception मा पुग्यो। Reception ले उपलब्धता जाँचेर सम्पर्क गर्नेछ।</p>;
  return <form onSubmit={submit} className="my-3 w-full max-w-sm space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-slate-900 motion-safe:animate-in motion-safe:fade-in" aria-label={chatServices[service]}><h3 className="text-sm font-bold">{chatServices[service]}</h3><p className="text-xs leading-4 text-slate-500">यहीँ विवरण भरेर reception मा पठाउनुहोस्।</p><fieldset disabled={busy} className="grid min-w-0 grid-cols-2 gap-2"><label className="text-xs">Name *<input required maxLength={180} autoComplete="name" className={field} value={draft.name} onChange={e=>update('name',e.target.value)}/></label><label className="text-xs">Phone *<input required type="tel" maxLength={30} autoComplete="tel" className={field} value={draft.phone} onChange={e=>update('phone',e.target.value)}/></label><label className="text-xs">City *<input required maxLength={100} className={field} value={draft.city} onChange={e=>update('city',e.target.value)}/></label><label className="text-xs">Area<input maxLength={100} className={field} value={draft.area} onChange={e=>update('area',e.target.value)}/></label>{service==='ROOM'&&<><label className="text-xs">Room type<select className={field} value={draft.roomType} onChange={e=>update('roomType',e.target.value)}>{['ANY','SINGLE','FLAT','HOSTEL'].map(v=><option key={v}>{v}</option>)}</select></label><label className="text-xs">People *<input required type="number" min={1} max={100} step={1} className={field} value={draft.people} onChange={e=>update('people',e.target.value)}/></label><label className="col-span-2 text-xs">Maximum monthly rent (Rs) *<input required type="number" min={1} max={9999999999} className={field} value={draft.budget} onChange={e=>update('budget',e.target.value)}/></label></>}<label className="col-span-2 text-xs">Preferred date<input type="date" className={field} value={draft.date} onChange={e=>update('date',e.target.value)}/></label><label className="col-span-2 text-xs">{service==='JOB'?'Desired job, skills & experience':'Details / facilities needed'}{service!=='ROOM'?' *':''}<textarea required={service!=='ROOM'} rows={2} maxLength={2800} className={field} value={draft.details} onChange={e=>update('details',e.target.value)}/></label></fieldset>{error&&<p role="alert" className="text-xs text-red-700">{error}</p>}{!authenticated&&<p className="text-xs">Submit गर्न <a href="/auth/login" className="font-semibold underline">login गर्नुहोस्</a>। Login गरेपछि यो form बाट पठाउन सक्नुहुन्छ।</p>}<button disabled={busy||!authenticated} className="w-full rounded-lg bg-emerald-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">{busy?'Sending…':'Send to reception'}</button></form>;
}
