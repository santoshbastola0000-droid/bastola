"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { officeService, officeError, OfficeRoom } from '@/http/services/office.service';
import { OfficeVideo } from '@/components/office/OfficeVideo';
import { RequirementsPortal } from '@/components/office/RequirementsPortal';
export default function Page() {
  const [rooms,setRooms] = useState<OfficeRoom[]>([]);
  const [staff,setStaff] = useState(false);
  const [loading,setLoading] = useState(true);
  const [error,setError] = useState('');
  const [notice,setNotice] = useState('');
  const [busy,setBusy] = useState<string | null>(null);
  const [messages,setMessages] = useState<Record<string,string>>({});
  useEffect(()=> { let alive=true; Promise.all([officeService.myRooms(),officeService.access()]).then(([r,a])=>{if(alive){setRooms(r);setStaff(a.allowed);}}).catch(e=>{if(alive)setError(officeError(e));}).finally(()=>{if(alive)setLoading(false);});return()=>{alive=false;};},[]);
  async function request(id: string) { setBusy(id);setError('');setNotice('');try{await officeService.myRequest(id,messages[id]||'');setNotice('Room request received. Reception will contact you.');}catch(e){setError(officeError(e));}finally{setBusy(null);} }
  return <div className="space-y-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-2xl font-bold">Office · My shared rooms</h1><p className="text-slate-500">Videos and room details reception shared with your account phone number.</p></div>{staff&&<Link className="rounded-lg bg-slate-900 px-4 py-3 text-white" href="/user/dashboard/office/reception">Open Reception desk →</Link>}</div>{error&&<p role="alert" className="rounded-lg bg-red-50 p-4 text-red-700">{error}</p>}{notice&&<p role="status" className="rounded-lg bg-green-50 p-4 text-green-800">{notice}</p>}<RequirementsPortal/>{loading?<p>Loading your rooms…</p>:!rooms.length?<div className="rounded-xl border bg-white p-8">No active room links yet. Open the link reception sent on WhatsApp, or ask them to share with the phone number on your account.</div>:<div className="grid gap-5 lg:grid-cols-2">{rooms.map(r=><article key={r.id} className="overflow-hidden rounded-2xl border bg-white"><OfficeVideo roomId={r.id} recipient/><div className="space-y-3 p-5"><p className="font-mono text-emerald-700">{r.code}</p><h2 className="text-xl font-semibold">{r.title}</h2><p>{r.location} · रु {Number(r.price).toLocaleString()}/month</p><p className="whitespace-pre-wrap">{r.details}</p><p>{r.ownerName} · <a className="underline" href={`tel:${r.ownerPhone}`}>{r.ownerPhone}</a></p>{r.tiktokUrl&&<a className="block text-blue-700 underline" target="_blank" rel="noopener noreferrer" href={r.tiktokUrl}>Open TikTok ↗</a>}<label className="block text-sm">Room request message<textarea className="mt-1 w-full rounded-lg border p-3" maxLength={5000} value={messages[r.id]||''} onChange={e=>setMessages({...messages,[r.id]:e.target.value})}/></label><button disabled={busy!==null} className="rounded-lg bg-emerald-700 px-4 py-3 text-white disabled:opacity-50" onClick={()=>void request(r.id)}>{busy===r.id?'Sending…':'Request this room'}</button></div></article>)}</div>}</div>;
}

