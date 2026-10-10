"use client";

import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { officeError, officeService } from '@/http/services/office.service';
import type { ReceptionClient } from '@/http/services/office.service';
import { blankMatch, MatchingFields, requirementsPayload, requirementsDraft } from './MatchingFields';
import { PhoneReveal } from './PhoneReveal';

export function ClientSidebar({ revision, onSaved, onView }: { revision: number; onSaved: () => void; onView?: (client: ReceptionClient) => void }) {
  const [name,setName]=useState(''); const [phone,setPhone]=useState(''); const [notes,setNotes]=useState('');
  const [requirements,setRequirements]=useState({...blankMatch,roomType:'ANY'});
  const [clients,setClients]=useState<ReceptionClient[]>([]); const [total,setTotal]=useState(0);
  const [query,setQuery]=useState(''); const [search,setSearch]=useState(''); const [page,setPage]=useState(0);
  const [busy,setBusy]=useState(false); const [loading,setLoading]=useState(false);
  const [error,setError]=useState(''); const [notice,setNotice]=useState('');
  const generation=useRef(0);
  const listRef=useRef<HTMLDivElement>(null);
  useEffect(()=>{
    const current=++generation.current; setLoading(true);setClients([]);setPage(0);
    officeService.clients(search).then(result=>{if(current===generation.current){setClients(result.clients);setTotal(result.total);setError('');}})
      .catch(error=>{if(current===generation.current)setError(officeError(error));})
      .finally(()=>{if(current===generation.current)setLoading(false);});
    return ()=>{generation.current+=1;};
  },[search,revision]);
  async function save(event: FormEvent) {
    event.preventDefault();setBusy(true);setError('');setNotice('');
    try{
      await officeService.saveClient({clientName:name,clientPhone:phone,notes,requirements:requirementsPayload(requirements)});
      setName('');setPhone('');setNotes('');setRequirements({...blankMatch,roomType:'ANY'});
      setNotice('Client saved. Matching lists updated.');onSaved();
    }catch(error){setError(officeError(error));}finally{setBusy(false);}
  }
  async function more(){
    if(loading)return;const current=generation.current;setLoading(true);
    try{const result=await officeService.clients(search,page+1);if(current===generation.current){setClients(previous=>[...new Map([...previous,...result.clients].map(client=>[client.id,client])).values()]);setTotal(result.total);setPage(value=>value+1);}}
    catch(error){if(current===generation.current)setError(officeError(error));}finally{if(current===generation.current)setLoading(false);}
  }
  function edit(client:ReceptionClient){
    setName(client.name);setPhone(client.phone);setNotes(client.notes||'');
    setRequirements(requirementsDraft(client.requirements));
    listRef.current?.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});
  }
  async function toggle(client:ReceptionClient){
    setBusy(true);setError('');
    try{await officeService.clientActive(client.id,!client.active);onSaved();}
    catch(error){setError(officeError(error));}finally{setBusy(false);}
  }
  return <aside className="space-y-4 self-start lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto" ref={listRef}>
    <form onSubmit={save} className="space-y-3 rounded-2xl border bg-white p-4">
      <h2 className="text-lg font-semibold">New client details</h2><p className="text-xs text-slate-500">Save or update a client by phone number. Rooms are ranked by location, budget and people; parking differences are shown.</p>
      {error&&<p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {notice&&<p role="status" className="text-sm text-emerald-700">{notice}</p>}
      <label className="block text-sm">Client name *<input required maxLength={180} className="mt-1 w-full rounded-lg border p-2.5" value={name} onChange={event=>setName(event.target.value)}/></label>
      <label className="block text-sm">Phone number *<input required type="tel" maxLength={30} className="mt-1 w-full rounded-lg border p-2.5" value={phone} onChange={event=>setPhone(event.target.value)}/></label>
      <MatchingFields value={requirements} onChange={setRequirements} tenant/>
      <label className="block text-sm">Client notes<textarea className="mt-1 w-full rounded-lg border p-2.5" rows={2} maxLength={5000} value={notes} onChange={event=>setNotes(event.target.value)}/></label>
      <button type="submit" disabled={busy} className="w-full rounded-lg bg-emerald-700 px-4 py-2.5 text-white disabled:opacity-50">{busy?'Saving…':'Save client & match rooms'}</button>
    </form>
    <section className="space-y-3 rounded-2xl border bg-white p-4">
      <h2 className="font-semibold">Reception clients ({total})</h2>
      <form className="flex gap-2" onSubmit={event=>{event.preventDefault();setSearch(query);}}><input className="min-w-0 flex-1 rounded-lg border p-2 text-sm" aria-label="Search Reception clients" placeholder="Name, phone, location or move-in date" value={query} onChange={event=>setQuery(event.target.value)}/><button className="rounded-lg border px-3 text-sm">Find</button></form>
      {clients.map(client=><article key={client.id} className="space-y-2 rounded-xl border p-3 text-sm"><p className="font-semibold">{client.name}</p><PhoneReveal phone={client.phone} label="Client phone"/><p>{client.requirements?.city||'Requirements not recorded'}{client.requirements?.area?' · '+client.requirements.area:''}</p><p>{client.active?'Looking for a room':'Handled / matching paused'}</p><p className="text-xs">Moving: {client.requirements?.moveInDate||'—'} · Rental ends: {client.requirements?.rentalEndsOn||'—'}</p><div className="flex flex-wrap gap-2">{onView&&<button type="button" className="rounded-lg border px-3 py-1.5" onClick={()=>onView(client)}>Matching rooms</button>}<button type="button" className="rounded-lg border px-3 py-1.5" onClick={()=>edit(client)}>Edit here</button><button type="button" disabled={busy} className="rounded-lg border px-3 py-1.5 disabled:opacity-50" onClick={()=>void toggle(client)}>{client.active?'Mark handled':'Reactivate'}</button></div></article>)}
      {loading&&<p role="status" className="text-sm">Loading clients…</p>}
      {!loading&&clients.length===0&&<p className="text-sm text-slate-500">No clients found.</p>}
      {(page+1)*20<total&&<button type="button" disabled={loading} className="rounded-lg border px-3 py-2 text-sm" onClick={()=>void more()}>Load more clients ↓</button>}
    </section>
  </aside>;
}

