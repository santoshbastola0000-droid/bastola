"use client";

import { FormEvent, useState } from 'react';
import { officeService, officeError } from '@/http/services/office.service';

const input = 'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm';
const statuses = [
  { value:'SENT',label:'Sent to client' },
  { value:'VISIT_PENDING',label:'Visit pending' },
  { value:'VISITED',label:'Visited' },
  { value:'NOT_MOVED_IN',label:'Not rented' }
];

export function AddClientHistory({roomId,onSaved}:{roomId:string;onSaved:()=>void}) {
  const [open,setOpen]=useState(false);
  const [name,setName]=useState('');
  const [phone,setPhone]=useState('');
  const [date,setDate]=useState('');
  const [status,setStatus]=useState('SENT');
  const [notes,setNotes]=useState('');
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  async function save(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);setError('');
    try {
      await officeService.visit(roomId,{clientName:name.trim(),clientPhone:phone.trim(),notes:notes.trim()},status,undefined,date?new Date(date).toISOString():undefined);
      onSaved();setOpen(false);setName('');setPhone('');setDate('');setStatus('SENT');setNotes('');
    } catch(e) { setError(officeError(e)); }
    finally { setBusy(false); }
  }
  return <section className="space-y-2">
    <button type="button" onClick={()=>setOpen(v=>!v)} className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">{open?'Cancel':'＋ Add Client History'}</button>
    {open&&<form onSubmit={save} className="space-y-3 rounded-xl border bg-blue-50/50 p-3">
      <label className="block text-xs font-semibold">Client name<input className={input} required maxLength={150} value={name} onChange={e=>setName(e.target.value)}/></label>
      <label className="block text-xs font-semibold">Phone number<input className={input} type="tel" required maxLength={24} value={phone} onChange={e=>setPhone(e.target.value)}/></label>
      <label className="block text-xs font-semibold">Status<select className={input} value={status} onChange={e=>setStatus(e.target.value)}>{statuses.map(s=><option key={s.value} value={s.value}>{s.label}</option>)}</select></label>
      <label className="block text-xs font-semibold">Event date and time (optional)<input className={input} type="datetime-local" value={date} onChange={e=>setDate(e.target.value)}/></label>
      <label className="block text-xs font-semibold">Reception notes<textarea className={input} rows={3} maxLength={5000} value={notes} onChange={e=>setNotes(e.target.value)}/></label>
      {error&&<p role="alert" className="text-sm text-rose-700">{error}</p>}
      <button disabled={busy} className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{busy?'Saving…':'Save to client history'}</button>
    </form>}
  </section>;
}
