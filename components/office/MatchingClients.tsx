"use client";

import { useEffect, useRef, useState } from 'react';
import { officeError, officeService } from '@/http/services/office.service';
import type { ClientInput, OfficeRoom, ReceptionClient } from '@/http/services/office.service';
import { PhoneReveal } from './PhoneReveal';

export function MatchingClients({ room, revision, onSend, onEdit }: {
  room: OfficeRoom; revision: number;
  onSend: (room: OfficeRoom, client: ClientInput) => void; onEdit: () => void;
}) {
  const [clients,setClients]=useState<ReceptionClient[]>([]); const [total,setTotal]=useState(0);
  const [page,setPage]=useState(0); const [loading,setLoading]=useState(true);
  const [needsDetails,setNeedsDetails]=useState(false); const [error,setError]=useState('');
  const [attempt,setAttempt]=useState(0); const generation=useRef(0); const pending=useRef(false);
  useEffect(()=>{
    const current=++generation.current;pending.current=true;setLoading(true);setError('');setClients([]);setPage(0);setTotal(0);setNeedsDetails(false);
    officeService.matchingClients(room.id).then(result=>{
      if(current===generation.current){setClients(result.clients);setTotal(result.total);setNeedsDetails(result.needsRoomDetails);}
    }).catch(error=>{if(current===generation.current)setError(officeError(error));})
      .finally(()=>{if(current===generation.current){pending.current=false;setLoading(false);}});
    return ()=>{generation.current+=1;};
  },[room.id,room.status,revision,attempt]);
  async function more(){
    if(pending.current)return;const current=generation.current;pending.current=true;setLoading(true);setError('');
    try{const result=await officeService.matchingClients(room.id,page+1);if(current===generation.current){setClients(previous=>[...new Map([...previous,...result.clients].map(client=>[client.id,client])).values()]);setTotal(result.total);setPage(value=>value+1);}}
    catch(error){if(current===generation.current)setError(officeError(error));}finally{if(current===generation.current){pending.current=false;setLoading(false);}}
  }
  return <section className="space-y-3 border-t bg-emerald-50/50 p-4" aria-label="New matching clients">
    <div><h3 className="font-semibold">New matching clients ({total})</h3><p className="text-xs text-slate-600">Location, budget, room type, people and every required facility must all match.</p></div>
    {error&&<p role="alert" className="text-sm text-red-700">{error} <button type="button" className="underline" onClick={()=>clients.length?void more():setAttempt(value=>value+1)}>Try again</button></p>}
    {needsDetails&&<div className="space-y-2 text-sm"><p>Add verified room matching details and rent to find clients accurately.</p><button type="button" className="rounded-lg border bg-white px-3 py-2" onClick={onEdit}>Add room matching details here</button></div>}
    {clients.map((client,index)=><article key={client.id} className="space-y-2 rounded-xl border bg-white p-3 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2"><p className="font-semibold">{index+1}. {client.name}</p><PhoneReveal phone={client.phone} label="Client phone"/></div>
      <p className="font-semibold text-emerald-700">All recorded requirements match ✓</p>
      <ul className="list-disc space-y-1 pl-5 text-xs text-slate-600">{client.reasons?.map(reason=><li key={reason}>{reason}</li>)}</ul>
      <button type="button" className="rounded-lg bg-emerald-700 px-3 py-2 text-white" onClick={()=>onSend(room,{clientName:client.name,clientPhone:client.phone,notes:client.notes||''})}>Send this matching room</button>
    </article>)}
    {loading&&<p role="status" className="text-sm">Checking client requirements…</p>}
    {!loading&&!error&&!needsDetails&&clients.length===0&&<p className="text-sm text-slate-500">{room.status==='RENTED'?'Rented room · matching paused.':'No clients meet all recorded requirements yet.'}</p>}
    {(page+1)*20<total&&<button type="button" disabled={loading} className="rounded-lg border bg-white px-3 py-2 text-sm" onClick={()=>void more()}>Load more matching clients ↓</button>}
  </section>;
}
