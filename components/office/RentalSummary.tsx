"use client";

import { useEffect, useId, useRef, useState } from 'react';
import { officeError, officeService } from '@/http/services/office.service';
import type { OfficeRental, OfficeRoom } from '@/http/services/office.service';
import { PhoneReveal } from './PhoneReveal';

export function RentalSummary({ room, revision, onRecordTenant }: { room: OfficeRoom; revision: number; onRecordTenant: () => void }) {
  const [open,setOpen]=useState(false); const [rentals,setRentals]=useState<OfficeRental[]>([]);
  const [total,setTotal]=useState(0); const [page,setPage]=useState(0); const [loading,setLoading]=useState(false);
  const [error,setError]=useState(''); const [attempt,setAttempt]=useState(0);
  const generation=useRef(0); const pending=useRef(false);const id=useId();
  useEffect(()=>{
    const current=++generation.current;
    if(!open)return;
    pending.current=true;setLoading(true);setError('');setRentals([]);setPage(0);
    officeService.rentals(room.id).then(result=>{if(current===generation.current){setRentals(result.rentals);setTotal(result.total);}})
      .catch(error=>{if(current===generation.current)setError(officeError(error));})
      .finally(()=>{if(current===generation.current){pending.current=false;setLoading(false);}});
    return ()=>{generation.current+=1;};
  },[room.id,open,revision,attempt]);
  async function more(){
    if(pending.current)return;const current=generation.current;pending.current=true;setLoading(true);setError('');
    try{const result=await officeService.rentals(room.id,page+1);if(current===generation.current){setRentals(previous=>[...new Map([...previous,...result.rentals].map(rental=>[rental.id,rental])).values()]);setTotal(result.total);setPage(value=>value+1);}}
    catch(error){if(current===generation.current)setError(officeError(error));}finally{if(current===generation.current){pending.current=false;setLoading(false);}}
  }
  return <section className="space-y-3 border-t bg-blue-50/40 p-4" aria-label="Room rental history">
    <div className="flex flex-wrap items-center gap-3">
      <button type="button" aria-expanded={open} aria-controls={id} aria-label={`View ${room.rentalCount || 0} recorded rentals`}
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-blue-200 bg-blue-100 font-mono text-xl font-bold text-blue-800"
        onClick={()=>setOpen(value=>!value)}>{room.rentalCount || 0}</button>
      <div><p className="font-semibold">Times rented · {room.rentalCount || 0}</p><p className="text-xs text-slate-500">{room.rentalHistoryIncomplete?'Recorded rentals; earlier rental totals are unknown.':'Click the blue square to see the rental history here.'}</p></div>
    </div>
    {room.status==='RENTED'&&<div className="space-y-2 rounded-lg border bg-white p-3 text-sm"><p className="font-semibold">Currently staying: {room.currentRental?.clientName || 'Tenant not confirmed'}</p>{room.currentRental?.clientPhone&&<PhoneReveal phone={room.currentRental.clientPhone} label="Current tenant phone"/>}{!room.currentRental?.clientName&&<button type="button" className="rounded-lg border px-3 py-2" onClick={onRecordTenant}>Record current tenant here</button>}</div>}
    <div id={id} aria-hidden={!open} className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none ${open?'grid-rows-[1fr] opacity-100':'grid-rows-[0fr] opacity-0'}`}><div className="min-h-0 overflow-hidden">{open&&<div className="space-y-3">
      {error&&<p role="alert" className="text-sm text-red-700">{error} <button type="button" className="underline" onClick={()=>rentals.length?void more():setAttempt(value=>value+1)}>Try again</button></p>}
      <ol className="space-y-2">{rentals.map(rental=><li key={rental.id} className="flex gap-3 rounded-xl border bg-white p-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 font-mono font-bold text-blue-800">{rental.number}</span><div className="space-y-1 text-sm"><p className="font-semibold">{rental.clientName || 'Tenant not recorded'}</p>{rental.clientPhone&&<PhoneReveal phone={rental.clientPhone} label="Tenant phone"/>}<p>{rental.endedAt?'Previous rental':'Current rental'} · {new Date(rental.startedAt).toLocaleString()}</p>{rental.endedAt&&<p>Available again: {new Date(rental.endedAt).toLocaleString()}</p>}<p className="text-xs text-slate-500">{rental.staffName || (rental.origin==='LEGACY'?'Existing rental when tracking started':'Staff')}</p></div></li>)}</ol>
      {loading&&<p role="status" className="text-sm">Loading rental history…</p>}
      {!loading&&!error&&rentals.length===0&&<p className="text-sm text-slate-500">No recorded rentals yet.</p>}
      {(page+1)*20<total&&<button type="button" disabled={loading} className="rounded-lg border bg-white px-3 py-2 text-sm" onClick={()=>void more()}>Load more rentals ↓</button>}
    </div>}</div></div>
  </section>;
}
