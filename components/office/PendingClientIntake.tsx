"use client";
import {useEffect,useRef,useState} from 'react';
import type {FormEvent} from 'react';
import {officeService,officeError} from '@/http/services/office.service';
import {MatchingFields,blankMatch,requirementsPayload} from './MatchingFields';
export function PendingClientIntake(){
 const [access,setAccess]=useState<{allowed:boolean;pendingClientIntake?:boolean}|null>(null);
 const [open,setOpen]=useState(false),[name,setName]=useState(''),[phone,setPhone]=useState(''),[notes,setNotes]=useState('');
 const [requirements,setRequirements]=useState({...blankMatch,roomType:'ANY'});
 const [confirmed,setConfirmed]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
 const inFlight=useRef(false),mounted=useRef(true);
 useEffect(()=>{let active=true;mounted.current=true;officeService.access().then(value=>{if(active)setAccess(value);}).catch(()=>{if(active)setAccess(null);});return()=>{active=false;mounted.current=false;};},[]);
 async function save(e:FormEvent){
  e.preventDefault();if(inFlight.current||!confirmed||!access?.allowed||!access.pendingClientIntake)return;
  inFlight.current=true;setBusy(true);setError('');setNotice('');
  try{
   await officeService.createPendingClient({clientName:name,clientPhone:phone,notes,requirements:requirementsPayload(requirements),confirmedUnpaid:true});
   if(!mounted.current)return;
   setOpen(false);setName('');setPhone('');setNotes('');setRequirements({...blankMatch,roomType:'ANY'});setConfirmed(false);
   setNotice('Client Saved Clients मा पहेंलो “भुक्तानी बाँकी” marker सहित save भयो।');
  }catch(e){if(mounted.current)setError(officeError(e));}finally{inFlight.current=false;if(mounted.current)setBusy(false);}
 }
 if(!access?.allowed)return null;
 return <div className="contents">
  <button type="button" disabled={!access.pendingClientIntake} title={access.pendingClientIntake?'भुक्तानी नलिएको नयाँ client थप्नुहोस्':'Backend intake update is required'} onClick={()=>{setOpen(true);setError('');setNotice('');}} className="inline-flex min-h-8 items-center rounded-full border border-yellow-400 bg-yellow-100 px-3 py-1 text-[11px] font-semibold text-yellow-950 disabled:opacity-60">＋ Add Client Details</button>
  {notice&&<p role="status" className="w-full text-xs text-yellow-900">{notice}</p>}
  {open&&<div role="dialog" aria-modal="true" aria-label="Add unpaid client details" className="fixed inset-0 z-[120] overflow-y-auto bg-black/60 p-3"><form onSubmit={save} className="mx-auto max-w-lg space-y-3 rounded-xl border border-yellow-300 bg-white p-4 text-slate-900">
   <div className="flex items-center justify-between gap-2"><h3 className="font-bold">Add Client Details · भुक्तानी बाँकी</h3><button type="button" disabled={busy} onClick={()=>setOpen(false)} className="rounded border p-2">Close ✕</button></div>
   <p className="rounded bg-yellow-100 p-2 text-xs">यो staff ले राख्ने pending intake marker हो। Payment ledger परिवर्तन वा payment verify हुँदैन। Existing client भए overwrite हुँदैन।</p>
   {error&&<p role="alert" className="text-sm text-red-700">{error}</p>}
   <label className="block text-sm">Client name<input autoFocus required maxLength={180} disabled={busy} value={name} onChange={e=>setName(e.target.value)} className="mt-1 w-full rounded border p-2"/></label>
   <label className="block text-sm">Phone number<input required type="tel" maxLength={30} disabled={busy} value={phone} onChange={e=>setPhone(e.target.value)} className="mt-1 w-full rounded border p-2"/></label>
   <fieldset disabled={busy}><MatchingFields tenant value={requirements} onChange={setRequirements}/></fieldset>
   <label className="block text-sm">Notes<textarea maxLength={5000} disabled={busy} value={notes} onChange={e=>setNotes(e.target.value)} className="mt-1 w-full rounded border p-2"/></label>
   <label className="flex gap-2 text-sm"><input required type="checkbox" checked={confirmed} disabled={busy} onChange={e=>setConfirmed(e.target.checked)}/>यस client बाट भुक्तानी लिएको छैन।</label>
   <button disabled={busy||!confirmed} className="w-full rounded bg-yellow-300 p-2 font-semibold text-yellow-950 disabled:opacity-50">{busy?'Saving…':'Save pending client'}</button>
  </form></div>}
 </div>;
}