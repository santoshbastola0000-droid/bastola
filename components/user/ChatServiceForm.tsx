"use client";
import { FormEvent, useEffect, useRef, useState } from 'react';
import { privateApi } from '@/http/api/privateApi';
import { officeError } from '@/http/services/office.service';
import { MatchingFields, blankMatch, requirementsDraft, requirementsPayload, type MatchDraft } from '@/components/office/MatchingFields';

export const chatServices = { ROOM:'Room requirement', JOB:'Job requirement', MOVING:'Room shifting', CLEANING:'Home cleaning', REPAIR:'Repair / electrician', PLUMBING:'Plumbing', INTERNET:'Internet setup', OTHER:'Other service' } as const;
export type ChatService = keyof typeof chatServices;
export function requestedChatForm(text: string): ChatService | undefined {
  const t=text.toLowerCase();
  if (/(?:cancel|रद्द|form.*(?:nacha|pardaina)|फारम.*चाहिँदैन)/u.test(t)) return;
  const services: [ChatService,RegExp][]=[['MOVING',/shifting|moving|सार्ने|shift gar/],['CLEANING',/cleaning|सफाइ|सरसफाइ/],['REPAIR',/repair|electrician|मर्मत|बिजुली/],['PLUMBING',/plumbing|plumber|प्लम्ब/],['INTERNET',/internet|wifi setup|इन्टरनेट/],['JOB',/job|jagir|जागिर/],['ROOM',/room|kotha|कोठा|flat|फ्ल्याट/]];
  const request=/(?:form|फारम|requirement|req\\b|apply|आवेदन|request|book|chaiyo|chahiyo|चाहियो|चाहिन्छ|bhar|भर|सेवा)/u.test(t);
  if (!request) return;
  return services.find(([,pattern])=>pattern.test(t))?.[0] || (/service|सेवा/.test(t)?'OTHER':undefined);
}
const field='mt-1 w-full min-w-0 rounded-lg border border-slate-300 bg-white p-2 text-sm text-slate-900';
type Draft = {name:string;phone:string;city:string;area:string;date:string;callTime:string;contactPreference:string;details:string};
const blankDraft:Draft={name:'',phone:'',city:'Pokhara',area:'',date:'',callTime:'Any time',contactPreference:'Phone call',details:''};
function extraRequirementNotes(r: MatchDraft, callTime: string, contactPreference: string) {
  return [
    'Preferred contact: '+contactPreference,
    'Best time to call: '+callTime,
    r.occupancy && r.occupancy!=='ANY' ? 'Who will stay: '+r.occupancy : '',
    r.alternativeAreas.filter(Boolean).length ? 'Alternative areas: '+r.alternativeAreas.filter(Boolean).join(', ') : '',
    r.vehicle && r.vehicle!=='NONE' ? 'Vehicle: '+r.vehicle+' ('+r.vehicleCount+')' : '',
    r.parkingRequired ? 'Parking required' : '',
    r.rentalEndsOn ? 'Current rental ends: '+r.rentalEndsOn : '',
    r.moveInDate ? 'Desired move-in: '+r.moveInDate : '',
  ].filter(Boolean).join('\\n');
}
export function ChatServiceForm({service,authenticated}:{service:ChatService;authenticated:boolean}) {
  const [draft,setDraft]=useState<Draft>(blankDraft);
  const [roomRequirements,setRoomRequirements]=useState<MatchDraft>({...blankMatch,city:'Pokhara',roomType:'ANY'});
  const [busy,setBusy]=useState(false);const [done,setDone]=useState(false);const [editing,setEditing]=useState(false);const [submittedId,setSubmittedId]=useState<string|null>(null);const [error,setError]=useState('');const pending=useRef(false);const key=useRef<string>('');
  useEffect(()=>{
    if (!authenticated || service !== 'ROOM') return;
    let active=true;
    privateApi.get('/office/chat-forms/my-latest-room').then(response=>{
      if (!active) return;
      const data=response.data?.data||response.data;
      const form=data?.form;
      if (!form || typeof form.id !== 'string') return;
      const req=form.requirements||{};
      const locationParts=String(form.location||'').split(',');
      const city=locationParts[0]?.trim()||'Pokhara';
      const area=locationParts.slice(1).join(',').trim();
      const details=String(form.details||'');
      const dateMatch=details.match(/^Preferred date: (\\d{4}-\\d{2}-\\d{2})(?:\\n|$)/);
      const callTime=details.match(/^Best time to call: (.+)$/m)?.[1]||'Any time';
      const contactPreference=details.match(/^Preferred contact: (.+)$/m)?.[1]||'Phone call';
      setSubmittedId(form.id);
      setDraft({...blankDraft,name:form.name||'',phone:form.phone||'',city,area,date:dateMatch?.[1]||'',callTime,contactPreference,details:details.replace(/^Preferred date: \\d{4}-\\d{2}-\\d{2}\\n?/,'').replace(/^Preferred contact: .*\\n?/m,'').replace(/^Best time to call: .*\\n?/m,'')});
      setRoomRequirements({...requirementsDraft(req),city:req.city||city,area:req.area||area,roomType:req.roomType||'ANY',people:String(req.people||1),minRent:String(req.minRent||0),maxRent:String(req.maxRent||'')});
      setDone(true);
    }).catch(()=>{/* A missing previous form should not stop a fresh submission. */});
    return()=>{active=false;};
  },[authenticated,service]);
  const update=(name:keyof Draft,value:string)=>setDraft(prev=>({...prev,[name]:value}));
  async function submit(event:FormEvent) {
    event.preventDefault();if(pending.current||!authenticated)return;
    setError('');
    if (service==='ROOM' && (!roomRequirements.city.trim() || Number(roomRequirements.maxRent)<=0 || Number(roomRequirements.minRent)<0 || Number(roomRequirements.minRent)>Number(roomRequirements.maxRent))) {
      setError('कृपया City र सही maximum monthly rent भर्नुहोस्।');return;
    }
    pending.current=true;setBusy(true);
    try {
      key.current ||= crypto.randomUUID();
      const req=service==='ROOM'?requirementsPayload(roomRequirements):undefined;
      const extra=service==='ROOM'?extraRequirementNotes(roomRequirements,draft.callTime,draft.contactPreference):'';
      const details=[draft.date&&`Preferred date: ${draft.date}`,service==='ROOM'?extra:'',draft.details].filter(Boolean).join('\\n');
      const payload={requestKey:key.current,service,name:draft.name,phone:draft.phone,location:[service==='ROOM'?roomRequirements.city:draft.city,service==='ROOM'?roomRequirements.area:draft.area].filter(Boolean).join(', '),details,requirements:req};
      if(editing){if(!submittedId)throw new Error('Existing request ID unavailable. Please refresh and contact reception to update the request.');await privateApi.patch('/office/chat-forms/'+encodeURIComponent(submittedId),payload);}
      else{const response=await privateApi.post('/office/chat-forms',payload);const result=response.data?.data||response.data;setSubmittedId(typeof result?.id==='string'?result.id:typeof result?.form?.id==='string'?result.form.id:null);}
      setEditing(false);setDone(true);
    }catch(e){setError(officeError(e));}finally{pending.current=false;setBusy(false);}
  }
  if(done)return <div className="flex items-start gap-2"><p role="status" className="min-w-0 flex-1 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">✓ {chatServices[service]} reception मा सुरक्षित भयो। Reception ले विवरण हेरेर उपलब्धता जाँच्ने र तपाईंलाई सम्पर्क गर्नेछ।</p>{service==='ROOM'&&<button type="button" onClick={()=>{setEditing(true);setDone(false);setError('');}} className="shrink-0 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700" aria-label="Edit submitted room requirements">✎ Edit</button>}</div>;
  return <form onSubmit={submit} className="my-3 w-full max-w-lg space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-slate-900 motion-safe:animate-in motion-safe:fade-in" aria-label={chatServices[service]}>
    <h3 className="text-sm font-bold">{chatServices[service]}</h3><p className="text-xs leading-4 text-slate-500">विवरण भर्नुहोस् ताकि reception ले पछि तपाईंलाई फोन गरेर मिल्ने room/सेवाबारे कुरा गर्न सकोस्।</p>
    <fieldset disabled={busy} className="grid min-w-0 grid-cols-2 gap-2">
      <label className="text-xs">Full name *<input required maxLength={180} autoComplete="name" className={field} value={draft.name} onChange={e=>update('name',e.target.value)}/></label>
      <label className="text-xs">Phone number *<input required type="tel" maxLength={30} autoComplete="tel" className={field} value={draft.phone} onChange={e=>update('phone',e.target.value)}/></label>
      {service==='ROOM'?<div className="col-span-2"><MatchingFields value={roomRequirements} onChange={setRoomRequirements} tenant /></div>:<>
        <label className="text-xs">City *<input required maxLength={100} className={field} value={draft.city} onChange={e=>update('city',e.target.value)}/></label>
        <label className="text-xs">Area<input maxLength={100} className={field} value={draft.area} onChange={e=>update('area',e.target.value)}/></label>
      </>}
      <label className="col-span-2 text-xs">Preferred date / move-in date<input type="date" className={field} value={draft.date} onChange={e=>update('date',e.target.value)}/></label>
      <label className="text-xs">Best time to call<select className={field} value={draft.callTime} onChange={e=>update('callTime',e.target.value)}>{['Any time','Morning (9–12)','Afternoon (12–5)','Evening (5–8)'].map(v=><option key={v}>{v}</option>)}</select></label>
      <label className="text-xs">Contact preference<select className={field} value={draft.contactPreference} onChange={e=>update('contactPreference',e.target.value)}>{['Phone call','WhatsApp','SMS'].map(v=><option key={v}>{v}</option>)}</select></label>
      <label className="col-span-2 text-xs">{service==='JOB'?'Desired job, skills & experience':'Additional requirements / questions'}<textarea rows={3} maxLength={2800} className={field} value={draft.details} onChange={e=>update('details',e.target.value)} placeholder="Anything else reception should know…"/></label>
    </fieldset>
    {error&&<p role="alert" className="text-xs text-red-700">{error}</p>}
    {!authenticated&&<p className="text-xs">Submit गर्न <a href="/auth/login" className="font-semibold underline">login गर्नुहोस्</a>। Login गरेपछि यो form बाट पठाउन सक्नुहुन्छ।</p>}
    <button disabled={busy||!authenticated} className="w-full rounded-lg bg-emerald-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">{busy?'Saving…':editing?'Save changes':'Send to reception & save client'}</button>
    {editing&&<button type="button" disabled={busy} onClick={()=>{setEditing(false);setDone(true);setError('');}} className="w-full rounded-lg border border-slate-300 py-2 text-sm">Cancel</button>}
  </form>;
}
