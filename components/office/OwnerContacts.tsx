"use client";

import { useEffect, useMemo, useState } from 'react';
import { Search, Plus, ArrowUpDown, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { officeService, officeError, OwnerContact } from '@/http/services/office.service';
import { OfficeVideo } from './OfficeVideo';

const input='w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900';
type SortKey='createdAt'|'ownerName'|'ownerPhone'|'location'|'roomType'|'matchedRoomCount'|'duplicateCount';

export function OwnerContacts() {
  const [items,setItems]=useState<OwnerContact[]>([]);
  const [q,setQ]=useState('');
  const [sort,setSort]=useState<SortKey>('createdAt');
  const [ascending,setAscending]=useState(false);
  const [showForm,setShowForm]=useState(false);
  const [ownerName,setOwnerName]=useState('');
  const [ownerPhone,setOwnerPhone]=useState('');
  const [location,setLocation]=useState('');
  const [roomType,setRoomType]=useState('');
  const [notes,setNotes]=useState('');
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const [notice,setNotice]=useState('');
  const [expanded,setExpanded]=useState<string|null>(null);

  async function load(search=q){
    const result=await officeService.ownerContacts(search);
    setItems(result.contacts||[]);
  }
  useEffect(()=>{let active=true;officeService.ownerContacts('').then(r=>{if(active)setItems(r.contacts||[]);}).catch(e=>{if(active)setError(officeError(e));});return()=>{active=false;};},[]);

  const visible=useMemo(()=>{
    const filtered=items.filter(x=>!q.trim()||[x.ownerName,x.ownerPhone,x.location,x.roomType,x.notes].some(v=>v?.toLowerCase().includes(q.trim().toLowerCase())));
    return filtered.sort((a,b)=>{
      const av=a[sort] as string|number, bv=b[sort] as string|number;
      const cmp=typeof av==='number'&&typeof bv==='number'?av-bv:String(av??'').localeCompare(String(bv??''));
      return ascending?cmp:-cmp;
    });
  },[items,q,sort,ascending]);

  async function submit(e:React.FormEvent){
    e.preventDefault();setBusy(true);setError('');setNotice('');
    try{
      await officeService.createOwnerContact({ownerName:ownerName.trim(),ownerPhone:ownerPhone.trim(),location:location.trim(),roomType:roomType.trim(),notes:notes.trim()});
      await load('');setQ('');setOwnerName('');setOwnerPhone('');setLocation('');setRoomType('');setNotes('');setShowForm(false);
      setNotice('Owner contact सुरक्षित भयो। Duplicate र पुराना Reception matches जाँच गरियो।');
    }catch(e){setError(officeError(e));}finally{setBusy(false);}
  }

  function sortBy(key:SortKey){if(sort===key)setAscending(v=>!v);else{setSort(key);setAscending(true);}}
  const th='px-3 py-2 text-left text-xs font-bold uppercase tracking-wide text-slate-600 whitespace-nowrap';
  const td='px-3 py-2 align-top text-sm text-slate-800';

  return <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4" aria-label="Owner Contact Details">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div><h2 className="text-lg font-bold">Owner Contact Details</h2><p className="text-xs text-slate-500">Owner नम्बर, duplicate र पुरानो Reception सँगको मिलान एउटै तालिकामा।</p></div>
      <button type="button" onClick={()=>setShowForm(v=>!v)} className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white"><Plus className="h-4 w-4"/>Add Owner</button>
    </div>
    {error&&<p role="alert" className="rounded-lg bg-red-50 p-2 text-sm text-red-700">{error}</p>}
    {notice&&<p role="status" className="rounded-lg bg-emerald-50 p-2 text-sm text-emerald-700">{notice}</p>}
    {showForm&&<form onSubmit={submit} className="grid grid-cols-1 gap-2 rounded-xl border border-blue-100 bg-blue-50/50 p-3 sm:grid-cols-2">
      <label className="text-xs font-semibold text-slate-700">Owner Name (optional)<input className={input+' mt-1'} value={ownerName} onChange={e=>setOwnerName(e.target.value)} maxLength={180} placeholder="Owner name"/></label>
      <label className="text-xs font-semibold text-slate-700">Owner Number *<input className={input+' mt-1'} type="tel" value={ownerPhone} onChange={e=>setOwnerPhone(e.target.value)} maxLength={30} required placeholder="98XXXXXXXX / +977..."/></label>
      <label className="text-xs font-semibold text-slate-700">Location *<input className={input+' mt-1'} value={location} onChange={e=>setLocation(e.target.value)} maxLength={300} required placeholder="Area / City"/></label>
      <label className="text-xs font-semibold text-slate-700">Room Type *<input className={input+' mt-1'} value={roomType} onChange={e=>setRoomType(e.target.value)} maxLength={80} required placeholder="Room / Flat / Shutter..."/></label>
      <label className="text-xs font-semibold text-slate-700 sm:col-span-2">Notes (optional)<textarea className={input+' mt-1'} rows={2} value={notes} onChange={e=>setNotes(e.target.value)} maxLength={2000} placeholder="Additional details"/></label>
      <div className="flex gap-2 sm:col-span-2"><button disabled={busy} className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50">{busy?'Saving…':'Save Owner Contact'}</button><button type="button" onClick={()=>setShowForm(false)} className="rounded-lg border px-4 py-2 text-xs font-semibold">Cancel</button></div>
    </form>}
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative min-w-[180px] flex-1"><Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400"/><input className={input+' pl-9'} value={q} onChange={e=>setQ(e.target.value)} placeholder="Search number, owner, location, room type…"/></div>
      <button type="button" onClick={()=>void load(q).catch(e=>setError(officeError(e)))} className="rounded-lg border px-3 py-2 text-xs font-semibold">Refresh</button>
      <span className="text-xs text-slate-500">{visible.length} records</span>
    </div>
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="w-full min-w-[900px] border-collapse">
        <thead className="bg-slate-50"><tr>
          {([['ownerName','Owner'],['ownerPhone','Contact Number'],['location','Location'],['roomType','Room Type'],['duplicateCount','Duplicate'],['matchedRoomCount','Old Reception Match']] as [SortKey,string][]).map(([key,label])=><th key={key} className={th}><button type="button" onClick={()=>sortBy(key)} className="inline-flex items-center gap-1">{label}<ArrowUpDown className="h-3 w-3"/></button></th>)}
          <th className={th}>Preview</th>
        </tr></thead>
        <tbody className="divide-y divide-slate-100">
          {visible.map(item=><tr key={item.id} className="hover:bg-slate-50">
            <td className={td}><span className="font-semibold">{item.ownerName||'—'}</span></td>
            <td className={td}><span className="font-semibold tabular-nums">{item.ownerPhone}</span></td>
            <td className={td}>{item.location}</td>
            <td className={td}>{item.roomType}</td>
            <td className={td}>{item.duplicateCount>1?<span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-xs font-bold text-amber-800"><AlertTriangle className="h-3 w-3"/>DUPLICATE · {item.duplicateCount}</span>:<span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700"><CheckCircle2 className="h-3 w-3"/>Unique</span>}</td>
            <td className={td}><span className={item.matchedRoomCount?'font-bold text-blue-700':'text-slate-400'}>{item.matchedRoomCount} room{item.matchedRoomCount===1?'':'s'}</span></td>
            <td className={td}><button type="button" onClick={()=>setExpanded(v=>v===item.id?null:item.id)} className="rounded-md border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-800">{expanded===item.id?'Hide matches':'View matches'}</button></td>
          </tr>)}
          {visible.length===0&&<tr><td colSpan={7} className="p-8 text-center text-sm text-slate-500">No owner contact records found. Add the first owner contact.</td></tr>}
        </tbody>
      </table>
    </div>
    {visible.filter(x=>expanded===x.id).map(item=><div key={item.id} className="space-y-3 rounded-lg border border-blue-100 bg-blue-50/40 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2"><div><h3 className="text-sm font-bold">Previous Reception / Office matches</h3><p className="text-xs text-slate-600">{item.ownerPhone} · {item.matchedRoomCount} matching room records</p></div><span className="rounded-full bg-white px-2 py-1 text-xs font-semibold">{item.matches.length} shown</span></div>
      {item.matches.length===0?<p className="text-xs text-slate-500">यो नम्बर पुरानो Reception room records मा भेटिएन।</p>:<div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">{item.matches.map(room=><article key={room.id} className="overflow-hidden rounded-lg border bg-white">
        {room.hasVideo?<OfficeVideo roomId={room.id} compact/>:<div className="flex aspect-video items-center justify-center bg-slate-100 text-xs text-slate-400">No video saved</div>}
        <div className="space-y-1 p-2"><div className="flex items-center justify-between gap-2"><strong className="text-xs">{room.code}</strong><span className="text-[10px] font-semibold text-slate-500">{room.status}</span></div><p className="text-xs font-medium">{room.title} · {room.roomType}</p><p className="text-xs text-slate-500">{room.location}</p></div>
      </article>)}</div>}
    </div>)}
  </section>;
}
