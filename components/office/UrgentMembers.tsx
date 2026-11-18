"use client";

import { useEffect, useState } from 'react';
import { officeError, officeService, ReceptionClient, OfficeRoom, UrgentMember } from '@/http/services/office.service';

const blankRequirements = { city:'Any',area:'',roomType:'ANY',people:1,minRent:0,maxRent:9999999999,facilities:[] as string[] };
const input = 'w-full rounded-lg border border-slate-200 bg-white p-3 text-slate-900';

export function UrgentMembers({ revision=0, onChanged }: { revision?:number; onChanged?:()=>void }) {
  const [items,setItems]=useState<UrgentMember[]>([]);
  const [clients,setClients]=useState<ReceptionClient[]>([]);
  const [rooms,setRooms]=useState<OfficeRoom[]>([]);
  const [clientId,setClientId]=useState('');
  const [name,setName]=useState('');
  const [phone,setPhone]=useState('');
  const [notes,setNotes]=useState('');
  const [newMode,setNewMode]=useState(false);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const [notice,setNotice]=useState('');

  async function load(){
    const [urgent,clientResult,roomResult]=await Promise.all([
      officeService.urgentMembers(),officeService.clients('',0),officeService.rooms('','AVAILABLE',0)
    ]);
    setItems(urgent);setClients(clientResult.clients);setRooms(roomResult.rooms.filter(r=>r.status==='AVAILABLE'));
  }
  useEffect(()=>{let alive=true;Promise.all([officeService.urgentMembers(),officeService.clients('',0),officeService.rooms('','AVAILABLE',0)]).then(([u,c,r])=>{if(alive){setItems(u);setClients(c.clients);setRooms(r.rooms.filter(x=>x.status==='AVAILABLE'));}}).catch(e=>{if(alive)setError(officeError(e));});return()=>{alive=false;};},[revision]);

  async function run(fn:()=>Promise<void>){setBusy(true);setError('');setNotice('');try{await fn();await load();onChanged?.();}catch(e){setError(officeError(e));}finally{setBusy(false);}}
  async function add(){
    await run(async()=>{
      let id=clientId;
      if(newMode){
        const c=await officeService.saveClient({clientName:name.trim(),clientPhone:phone.trim(),notes,requirements:blankRequirements});
        id=c.id;
      }
      if(!id)throw new Error('Saved Client छान्नुहोस् वा नयाँ सदस्यको विवरण भर्नुहोस्');
      await officeService.createUrgent(id);
      setClientId('');setName('');setPhone('');setNotes('');setNewMode(false);
      setNotice('सदस्य Urgent सूचीमा थपियो।');
    });
  }

  return <section className="space-y-4 rounded-xl border border-rose-200 bg-white p-3 sm:p-4" aria-label="Urgent members">
    <div className="flex flex-wrap items-center justify-between gap-2"><div><h2 className="text-xl font-bold text-rose-700">🚨 Urgent Members ({items.filter(x=>x.status==='URGENT').length})</h2><p className="text-sm text-slate-500">छिटो कोठा चाहिएका ग्राहकहरू व्यवस्थापन गर्नुहोस्।</p></div><span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">Fixed: {items.filter(x=>x.status==='FIXED').length}</span></div>
    {error&&<p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}{notice&&<p role="status" className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{notice}</p>}
    <div className="space-y-3 rounded-xl border bg-rose-50/50 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-semibold">＋ Urgent मा नयाँ सदस्य थप्नुहोस्</h3><button type="button" className="text-sm font-semibold text-blue-700 underline" onClick={()=>setNewMode(v=>!v)}>{newMode?'Saved Client बाट छान्ने':'नयाँ सदस्य बनाउने'}</button></div>
      {newMode?<div className="grid gap-2 sm:grid-cols-2"><label className="text-sm">नाम *<input className={input} value={name} onChange={e=>setName(e.target.value)} maxLength={180} required placeholder="ग्राहकको नाम"/></label><label className="text-sm">फोन नम्बर *<input className={input} type="tel" value={phone} onChange={e=>setPhone(e.target.value)} maxLength={30} required placeholder="98XXXXXXXX"/></label><label className="text-sm sm:col-span-2">आवश्यकता / नोट<textarea className={input} rows={2} value={notes} onChange={e=>setNotes(e.target.value)} maxLength={5000} placeholder="कस्तो कोठा चाहिएको हो?"/></label></div>:<label className="block text-sm">Saved Client छान्नुहोस्<select className={input} value={clientId} onChange={e=>setClientId(e.target.value)}><option value="">ग्राहक छान्नुहोस्</option>{clients.filter(c=>c.active).map(c=><option key={c.id} value={c.id}>{c.name} · {c.phone}</option>)}</select></label>}
      <button type="button" disabled={busy||(newMode?(!name.trim()||!phone.trim()):!clientId)} onClick={()=>void add()} className="w-full rounded-lg bg-rose-600 px-4 py-3 font-semibold text-white disabled:opacity-50">Urgent सूचीमा थप्नुहोस्</button>
    </div>
    <div className="space-y-3">{items.length===0&&<p className="rounded-lg border border-dashed p-4 text-center text-sm text-slate-500">अहिलेसम्म Urgent सदस्य छैनन्।</p>}
      {items.map(item=><article key={item.id} className="space-y-3 rounded-xl border p-3">
        <div className="flex flex-wrap items-start justify-between gap-2"><div><h3 className="font-bold">{item.name}</h3><p className="text-sm text-slate-600">{item.phone}</p>{item.notes&&<p className="mt-1 whitespace-pre-wrap text-sm text-slate-500">{item.notes}</p>}</div><span className={item.status==='FIXED'?'rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800':'rounded-full bg-rose-100 px-3 py-1 text-xs font-bold text-rose-800'}>{item.status==='FIXED'?'✓ FIXED':'● URGENT'}</span></div>
        {item.status==='FIXED'?<p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">कोठा: {item.roomCode||'—'} · {item.roomTitle||''} · {item.roomLocation||''}<br/>Fixed: {item.fixedAt?new Date(item.fixedAt).toLocaleString():''}</p>:<div className="flex flex-col gap-2 sm:flex-row"><select aria-label={item.name+' कोठा तोक्नुहोस्'} className={input+' min-w-0 flex-1'} defaultValue={item.roomId||''} onChange={e=>{const roomId=e.target.value;if(roomId)void run(async()=>{await officeService.assignUrgentRoom(item.id,roomId);setNotice('कोठा तोकियो। अब Fixed गर्न सक्नुहुन्छ।');});}}><option value="">उपलब्ध कोठा छान्नुहोस्</option>{rooms.map(r=><option key={r.id} value={r.id}>{r.code} · {r.title||'Room'} · {r.location}</option>)}</select><button type="button" disabled={busy||!item.roomId} onClick={()=>{if(window.confirm(item.name+' लाई '+(item.roomCode||'यो कोठा')+' मा Fixed गर्ने?'))void run(async()=>{await officeService.fixUrgent(item.id);setNotice('सदस्य Fixed भयो।');});}} className="rounded-lg bg-emerald-600 px-4 py-3 font-semibold text-white disabled:opacity-40">Fixed गर्नुहोस्</button></div>}
      </article>)}
    </div>
  </section>;
}
