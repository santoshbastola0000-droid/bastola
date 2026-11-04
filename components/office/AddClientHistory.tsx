"use client";

import { FormEvent, useEffect, useRef, useState } from 'react';
import { officeService, officeError, ClientInput, ReceptionClient } from '@/http/services/office.service';

import {findSavedClientsByPhone,normalizeClientLookupPhone} from '@/lib/reception-client-lookup';

const input = 'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm';
const statuses = [
  { value:'SENT',label:'Sent to client' },
  { value:'VISIT_PENDING',label:'Visit pending' },
  { value:'VISITED',label:'Visited' },
  { value:'NOT_MOVED_IN',label:'Not rented' }
];

export function AddClientHistory({roomId,onSaved,onFix,canFix=false}:{roomId:string;onSaved:()=>void;onFix?:(client:ClientInput)=>void;canFix?:boolean}) {
  const [open,setOpen]=useState(false);
  const [name,setName]=useState('');
  const [phone,setPhone]=useState('');
  const [date,setDate]=useState('');
  const [status,setStatus]=useState('SENT');
  const [notes,setNotes]=useState('');
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const [lookup,setLookup]=useState('');
  const [matches,setMatches]=useState<ReceptionClient[]>([]);
  const [searching,setSearching]=useState(false);
  const [lookupMessage,setLookupMessage]=useState('');
  const generation=useRef(0),pending=useRef(false);
  const autoFilled=useRef<{name:string;phone:string}|null>(null);
  function selectClient(client:ReceptionClient){
    autoFilled.current={name:client.name,phone:client.phone};
    setName(client.name);setPhone(client.phone);setLookupMessage('Saved client found. Name and phone filled.');
  }
  function changeLookup(value:string){
    generation.current++;
    const previous=autoFilled.current;
    if(previous){setName(current=>current===previous.name?'':current);setPhone(current=>current===previous.phone?'':current);}
    autoFilled.current=null;setMatches([]);setLookupMessage('');setSearching(false);setLookup(value);
  }
  function manualEntry(){
    generation.current++;autoFilled.current=null;setLookup('');setMatches([]);setLookupMessage('');setSearching(false);
  }
  function resetForm(){
    manualEntry();setName('');setPhone('');setDate('');setStatus('SENT');setNotes('');
  }
  useEffect(()=>{
    let active=true;const ticket=++generation.current;
    const current=()=>active&&ticket===generation.current;
    setMatches([]);setLookupMessage('');
    if(!open||!normalizeClientLookupPhone(lookup)){setSearching(false);return;}
    setSearching(true);
    const timer=window.setTimeout(()=>{
      void findSavedClientsByPhone(lookup,(query,page)=>officeService.clients(query,page),current).then(found=>{
        if(!current())return;
        setMatches(found);
        if(found.length===1)selectClient(found[0]);
        else setLookupMessage(found.length?'Choose the matching saved client.':'No exact saved client found. Enter details below.');
      }).catch(()=>{if(current())setLookupMessage('Could not complete saved-client search. Retry or enter details manually.');}).finally(()=>{if(current())setSearching(false);});
    },350);
    return()=>{active=false;window.clearTimeout(timer);};
  },[lookup,open]);
  async function save(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if(pending.current||searching)return;
    pending.current=true;setBusy(true);setError('');
    try {
      await officeService.visit(roomId,{clientName:name.trim(),clientPhone:phone.trim(),notes:notes.trim()},status,undefined,date?new Date(date).toISOString():undefined);
      onSaved();setOpen(false);resetForm();
    } catch(e) { setError(officeError(e)); }
    finally { pending.current=false;setBusy(false); }
  }
  return <section className="space-y-2">
    <button type="button" disabled={busy} onClick={()=>{generation.current++;if(open)resetForm();setOpen(v=>!v);}} className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">{open?'Cancel':'＋ Add Client History'}</button>
    {open&&<form onSubmit={save} className="space-y-3 rounded-xl border bg-blue-50/50 p-3">
      <label className="block text-xs font-semibold">Search saved client by phone<input className={input} type="tel" value={lookup} onChange={e=>changeLookup(e.target.value)} maxLength={30} placeholder="98XXXXXXXX" disabled={busy}/></label>
      {searching&&<p role="status" className="text-xs">Searching saved clients…</p>}
      {lookupMessage&&<p role="status" className="text-xs text-slate-600">{lookupMessage}</p>}
      {matches.length>1&&<div className="flex flex-wrap gap-1">{matches.map(client=><button type="button" key={client.id} className="rounded border bg-white px-2 py-1 text-xs" onClick={()=>selectClient(client)}>{client.name}</button>)}</div>}
      <label className="block text-xs font-semibold">Client name<input className={input} required maxLength={150} value={name} disabled={busy} onChange={e=>{manualEntry();setName(e.target.value);}}/></label>
      <label className="block text-xs font-semibold">Phone number<input className={input} type="tel" required maxLength={24} value={phone} disabled={busy} onChange={e=>{manualEntry();setPhone(e.target.value);}}/></label>
      <label className="block text-xs font-semibold">Status<select className={input} value={status} onChange={e=>setStatus(e.target.value)}>{statuses.map(s=><option key={s.value} value={s.value}>{s.label}</option>)}</select></label>
      <label className="block text-xs font-semibold">Event date and time (optional)<input className={input} type="datetime-local" value={date} onChange={e=>setDate(e.target.value)}/></label>
      <label className="block text-xs font-semibold">Reception notes<textarea className={input} rows={3} maxLength={5000} value={notes} onChange={e=>setNotes(e.target.value)}/></label>
      {error&&<p role="alert" className="text-sm text-rose-700">{error}</p>}
      {canFix&&onFix&&<button type="button" disabled={busy||searching} className="mr-2 rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50" onClick={event=>{
        const form=event.currentTarget.form;
        if(!form?.reportValidity())return;
        onFix({clientName:name.trim(),clientPhone:phone.trim(),notes:notes.trim()});
      }}>Fix Room to this Client</button>}
      <button disabled={busy||searching} className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{busy?'Saving…':'Save to client history'}</button>
    </form>}
  </section>;
}
