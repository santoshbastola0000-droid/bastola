"use client";

import { FormEvent, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Armchair, FolderCheck, FolderClosed, Plus, Search } from 'lucide-react';
import { officeService, officeError, OfficeRoom, OfficeHistory, OfficeStaff, OfficeRequest, OfficeForm, ClientInput } from '@/http/services/office.service';
import { OfficeVideo } from './OfficeVideo';

const field = 'w-full rounded-lg border border-slate-200 bg-white p-3 text-slate-900';
const button = 'rounded-lg bg-slate-900 px-4 py-2.5 text-white disabled:opacity-50 hover:bg-slate-700';
const secondary = 'rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-slate-800 hover:bg-slate-50 disabled:opacity-50';
const blankRoom = { code: '',title: '',location: '',details: '',ownerName: '',ownerPhone: '',tiktokUrl: '',price: '0' };
const blankClient: ClientInput = { clientName: '',clientPhone: '',recordId: '',notes: '' };

function RoomDetails({ room }: { room: OfficeRoom }) {
  return <div className="space-y-2 p-4">
    <div className="flex items-start justify-between gap-3"><h3 className="text-lg font-semibold">{room.title}</h3><span className="rounded-lg bg-slate-100 px-3 py-1 font-mono font-bold">{room.code}</span></div>
    <p className="text-slate-600">📍 {room.location} · रु {Number(room.price).toLocaleString()}/month</p>
    <p className="whitespace-pre-wrap text-sm text-slate-700">{room.details}</p>
    <p className="text-sm">Owner: {room.ownerName || '—'} · <a className="underline" href={`tel:${room.ownerPhone}`}>{room.ownerPhone}</a></p>
    {room.tiktokUrl && <a className="inline-block text-sm text-blue-700 underline" href={room.tiktokUrl} target="_blank" rel="noopener noreferrer">Open TikTok ↗</a>}
  </div>;
}

export function OfficeDashboard() {
  const params = useSearchParams();
  const [access,setAccess] = useState<{ allowed: boolean; isAdmin: boolean } | null>(null);
  const [accessFailed,setAccessFailed] = useState(false);
  const [tab,setTab] = useState('rooms');
  const [folder,setFolder] = useState<'AVAILABLE'|'RENTED'>('AVAILABLE');
  const [query,setQuery] = useState(params.get('q') || '');
  const [search,setSearch] = useState(params.get('q') || '');
  const [rooms,setRooms] = useState<OfficeRoom[]>([]);
  const [total,setTotal] = useState(0);
  const [counts,setCounts] = useState<{ status: string; total: number }[]>([]);
  const [page,setPage] = useState(0);
  const [history,setHistory] = useState<OfficeHistory[]>([]);
  const [historyTotal,setHistoryTotal] = useState(0);
  const [historyPage,setHistoryPage] = useState(0);
  const [historyRoom,setHistoryRoom] = useState<string | undefined>();
  const [requests,setRequests] = useState<OfficeRequest[]>([]);
  const [requestTotal,setRequestTotal] = useState(0);
  const [requestPage,setRequestPage] = useState(0);
  const [staff,setStaff] = useState<OfficeStaff[]>([]);
  const [staffSearch,setStaffSearch] = useState('');
  const [editing,setEditing] = useState<OfficeRoom | null>(null);
  const [showEditor,setShowEditor] = useState(false);
  const [draft,setDraft] = useState(blankRoom);
  const [video,setVideo] = useState<File | null>(null);
  const [progress,setProgress] = useState(0);
  const [selected,setSelected] = useState<OfficeRoom | null>(null);
  const [client,setClient] = useState<ClientInput>(blankClient);
  const [forms,setForms] = useState<OfficeForm[]>([]);
  const [share,setShare] = useState<{ url: string; shareId: string; expiresAt: string } | null>(null);
  const [shareClient,setShareClient] = useState<ClientInput | null>(null);
  const [busy,setBusy] = useState(false);
  const [loading,setLoading] = useState(false);
  const [error,setError] = useState('');
  const [notice,setNotice] = useState('');

  useEffect(() => { let alive=true; officeService.access().then(a => { if (alive) setAccess(a); }).catch(e => { if (alive) { setError(officeError(e)); setAccessFailed(true); } }); return () => { alive=false; }; },[]);
  useEffect(() => { const q=params.get('q') || ''; setQuery(q); setSearch(q); setPage(0); setHistoryPage(0); setHistoryRoom(undefined); setTab(['history','requests'].includes(params.get('tab') || '') ? params.get('tab')! : 'rooms'); },[params]);

  const reloadRooms = useCallback(async () => {
    const result = await officeService.rooms(search,folder,page); setRooms(result.rooms); setTotal(result.total); setCounts(result.counts);
  },[search,folder,page]);
  useEffect(() => {
    if (!access?.allowed) return;
    let alive=true;
    setLoading(true); setError('');
    const load = async () => {
      try {
        if (tab==='rooms') { const r=await officeService.rooms(search,folder,page); if (alive) { setRooms(r.rooms); setTotal(r.total); setCounts(r.counts); } }
        if (tab==='history') { const r=await officeService.history(search,historyRoom,historyPage); if (alive) { setHistory(r.history); setHistoryTotal(r.total); } }
        if (tab==='requests') { const r=await officeService.requests(requestPage); if (alive) { setRequests(r.requests); setRequestTotal(r.total); } }
        if (tab==='staff' && access.isAdmin) { const r=await officeService.staff(staffSearch); if (alive) setStaff(r); }
      } catch (e) { if (alive) setError(officeError(e)); }
      finally { if (alive) setLoading(false); }
    };
    void load(); return () => { alive=false; };
  },[access,tab,search,folder,page,historyPage,historyRoom,requestPage,staffSearch]);

  async function action(fn: () => Promise<void>) { setBusy(true); setError(''); setNotice(''); try { await fn(); } catch(e) { setError(officeError(e)); } finally { setBusy(false); } }
  function openEditor(room?: OfficeRoom) {
    setEditing(room || null); setDraft(room ? { ...blankRoom,...room,price:String(room.price) } : blankRoom);
    setVideo(null); setShowEditor(true); setProgress(0);
  }
  async function saveRoom(e: FormEvent) {
    e.preventDefault();
    await action(async () => {
      if (editing) await officeService.update(editing.id,draft);
      else {
        if (!video) throw new Error('Choose a room video');
        if (video.size>150*1024*1024) throw new Error('Video must be 150 MB or smaller');
        const data=new FormData(); Object.entries(draft).forEach(([k,v]) => data.append(k,v)); data.append('video',video);
        await officeService.create(data,setProgress);
      }
      setShowEditor(false); await reloadRooms(); setNotice('Room saved. The video is private.');
    });
  }
  function openClient(room: OfficeRoom) { setSelected(room); setClient(blankClient); setForms([]); setShare(null); setShareClient(null); setError(''); }
  async function clientAction(kind: 'share'|'VISITED') {
    if (!selected) return;
    await action(async () => {
      if (kind==='share') {
        const s=await officeService.share(selected.id,client);
        setShare({ url: `${window.location.origin}/office/room/${s.token}`,shareId:s.shareId,expiresAt:s.expiresAt }); setShareClient({ ...client });
        setNotice('Link prepared. Open WhatsApp, send it, then confirm “Mark as sent”.');
      } else { await officeService.visit(selected.id,client,'VISITED'); setNotice('Client visit recorded.'); }
    });
  }
  function historyFor(room: OfficeRoom) { setHistoryRoom(room.id); setSearch(''); setQuery(''); setHistoryPage(0); setTab('history'); }
  if (!access) return <div className="p-8">{accessFailed ? <p role="alert">{error} <Link href="/auth/login" className="underline">Log in</Link></p> : 'Checking Office access…'}</div>;
  if (!access.allowed) return <div className="rounded-xl border bg-white p-8"><h1 className="text-2xl font-bold">Office / Reception</h1><p className="mt-3">Ask an admin to grant your account Office access. To view a room, open the link reception shared with you.</p><Link className="mt-4 inline-block underline" href="/user/dashboard/office">View my shared rooms</Link></div>;

  return <div className="space-y-5 text-slate-900">
    <div className="flex flex-wrap items-center justify-between gap-4"><div className="flex items-center gap-3"><Armchair className="h-9 w-9 text-emerald-700"/><div><h1 className="text-2xl font-bold">Office / Reception</h1><p className="text-sm text-slate-500">Private room videos · clients · visits</p></div></div><button className={button} onClick={() => openEditor()}><Plus className="mr-2 inline h-4 w-4"/>Add room video</button></div>
    <div className="flex flex-wrap gap-2">{[['rooms','Rooms'],['history','Client & owner history'],['requests','Room requests'],...(access.isAdmin ? [['staff','Staff access']] : [])].map(([id,label]) => <button key={id} className={tab===id ? button : secondary} onClick={() => { setTab(id); setNotice(''); }}>{label}</button>)}</div>
    {error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-700">{error}</p>}{notice && <p role="status" className="rounded-xl bg-emerald-50 p-4 text-emerald-800">{notice}</p>}
    {(tab==='rooms'||tab==='history') && <form className="flex gap-2" onSubmit={e => { e.preventDefault(); setSearch(query); setPage(0); setHistoryPage(0); setHistoryRoom(undefined); if (query.replace(/\D/g,'').length>=7) setTab('history'); }}><input className={field} aria-label="Search rooms or client history" placeholder="Owner number, client number, name, room code or location…" value={query} onChange={e => setQuery(e.target.value)} /><button className={button}><Search className="h-5 w-5"/></button></form>}
    {tab==='rooms' && <>
      <div className="grid grid-cols-2 gap-3">{(['AVAILABLE','RENTED'] as const).map(s => <button key={s} onClick={() => { setFolder(s); setPage(0); }} className={`flex items-center gap-3 rounded-xl border p-4 text-left ${folder===s?'border-emerald-600 bg-emerald-50':'bg-white'}`}>{s==='AVAILABLE'?<FolderCheck/>:<FolderClosed/>}<div className="font-semibold">{s==='AVAILABLE'?'Available':'Rented'}<p className="text-xs font-normal text-slate-500">{counts.find(c=>c.status===s)?.total || 0} rooms</p></div></button>)}</div>
      {loading ? <p>Loading rooms…</p> : rooms.length===0 ? <div className="rounded-xl border border-dashed p-10 text-center">No rooms in this folder. Add a video or change your search.</div> : <div className="grid gap-5 lg:grid-cols-2">{rooms.map(room => <article key={room.id} className="overflow-hidden rounded-2xl border bg-white shadow-sm"><OfficeVideo roomId={room.id}/><RoomDetails room={room}/><div className="flex flex-wrap gap-2 border-t p-4"><button className={button} disabled={busy||room.status==='RENTED'} onClick={() => openClient(room)}>Share / send client</button><button className={secondary} onClick={() => historyFor(room)}>Client history</button><button className={secondary} onClick={() => openEditor(room)}>Edit details</button><button disabled={busy} className={secondary} onClick={() => { if (window.confirm(room.status==='AVAILABLE'?'Mark rented? Existing share links will stop working.':'Move this room to Available?')) void action(async () => { await officeService.status(room.id,room.status==='AVAILABLE'?'RENTED':'AVAILABLE'); await reloadRooms(); }); }}>Mark {room.status==='AVAILABLE'?'Rented':'Available'}</button><button disabled={busy} className={secondary} onClick={() => { if (window.confirm('Disable all shared links for this room?')) void action(async () => { await officeService.revoke(room.id); setNotice('All room links revoked.'); }); }}>Revoke links</button></div></article>)}</div>}
      <Pagination page={page} total={total} size={24} change={setPage}/>
    </>}
    {tab==='history' && <>
      <p className="text-sm text-slate-500">{historyTotal} records. Each room sent or visited is listed separately with its video and client form. {historyRoom && <button className="underline" onClick={() => setHistoryRoom(undefined)}>Show all rooms</button>}</p>
      {loading ? <p>Loading history…</p> : !history.length ? <p>No matching client history.</p> : <div className="grid gap-5 lg:grid-cols-2">{history.map(h => <article key={h.id} className="overflow-hidden rounded-2xl border bg-white"><OfficeVideo roomId={h.roomId}/><RoomDetails room={{ ...h,id:h.roomId }}/><div className="space-y-2 border-t bg-slate-50 p-4"><p className="font-semibold">{h.clientName} · <a className="underline" href={`tel:${h.clientPhone}`}>{h.clientPhone}</a></p><p className="text-sm">{h.action.replaceAll('_',' ')} · {new Date(h.createdAt).toLocaleString()} · {h.staffName || 'Client'}</p><p className="whitespace-pre-wrap text-sm">{h.notes}</p>{h.recordId && <div className="rounded-lg border bg-white p-3 text-sm"><p>Form: {h.formName} · {h.formPhone}</p><p>{h.formStatus} · {h.formDestination}</p>{access.isAdmin && <Link className="text-blue-700 underline" href={`/admin/dashboard/records/${h.recordId}/edit`}>Open client form</Link>}</div>}<button className={secondary} onClick={() => openClient({ ...h,id:h.roomId })}>Send this room again</button></div></article>)}</div>}
      <Pagination page={historyPage} total={historyTotal} size={50} change={setHistoryPage}/>
    </>}
    {tab==='requests' && <><h2 className="font-semibold">Incoming room requests ({requestTotal})</h2>{loading?<p>Loading requests…</p>:requests.length===0?<p>No room requests yet.</p>:requests.map(r => <article key={r.id} className="space-y-3 rounded-xl border bg-white p-4"><p className="font-semibold">{r.clientName} · <a className="underline" href={`tel:${r.clientPhone}`}>{r.clientPhone}</a></p><p>{r.code} · {r.title} · {r.location}</p><p className="whitespace-pre-wrap text-sm">{r.message}</p><p className="text-xs text-slate-500">{new Date(r.createdAt).toLocaleString()}</p><label className="flex items-center gap-3">Request status<select disabled={busy} className="rounded-lg border p-2" value={r.status} onChange={e => { const s=e.target.value; void action(async()=> { await officeService.requestStatus(r.id,s); setRequests(prev=>prev.map(x=>x.id===r.id?{...x,status:s}:x)); }); }}>{['NEW','CONTACTED','VISITED','CLOSED'].map(s=><option key={s}>{s}</option>)}</select></label><button className={secondary} onClick={() => { setQuery(r.clientPhone); setSearch(r.clientPhone); setHistoryRoom(undefined); setHistoryPage(0); setTab('history'); }}>View client rooms & videos</button></article>)}<Pagination page={requestPage} total={requestTotal} size={50} change={setRequestPage}/></>}
    {tab==='staff' && access.isAdmin && <div className="space-y-4 rounded-xl border bg-white p-5"><h2 className="text-xl font-semibold">Assign reception access</h2><p className="text-sm text-slate-500">Grant staff permission to upload videos, manage room status, share links and record clients. Only admins can assign or revoke access.</p><input className={field} placeholder="Search staff by name, phone or email" aria-label="Find staff" value={staffSearch} onChange={e=>setStaffSearch(e.target.value)}/>{loading?<p>Loading…</p>:staff.length===0?<p>Search for an existing user account to grant access.</p>:staff.map(s=><div key={s.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"><div><p className="font-semibold">{s.name}</p><p className="text-sm text-slate-500">{s.email} · {s.phoneNumber}</p></div><button className={s.officeAccess?secondary:button} disabled={busy} onClick={()=>void action(async()=>{await officeService.grant(s.id,!s.officeAccess);setStaff(await officeService.staff(staffSearch));setNotice('Staff Office access updated.');})}>{s.officeAccess?'Revoke access':'Grant reception role'}</button></div>)}</div>}

    {showEditor && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3" role="dialog" aria-modal="true" aria-label="Room video form"><form onSubmit={saveRoom} className="max-h-[90vh] w-full max-w-2xl space-y-4 overflow-y-auto rounded-2xl bg-white p-6"><div className="flex justify-between"><h2 className="text-xl font-bold">{editing?'Edit room details':'Add private room video'}</h2><button type="button" disabled={busy} onClick={()=>setShowEditor(false)}>Close ✕</button></div>{error&&<p role="alert" className="text-red-700">{error}</p>}<div className="grid gap-3 sm:grid-cols-2">{[['code','Manual room code *'],['title','Room title *'],['location','Location *'],['ownerName','Owner name'],['ownerPhone','Owner phone *'],['price','Monthly rent (NPR)'],['tiktokUrl','TikTok link (optional)']].map(([key,label])=><label key={key} className="space-y-1 text-sm">{label}<input className={field} required={['code','title','location','ownerPhone'].includes(key)} type={key==='price'?'number':key==='tiktokUrl'?'url':key==='ownerPhone'?'tel':'text'} min={key==='price'?0:undefined} step={key==='price'?'0.01':undefined} value={draft[key as keyof typeof draft]} onChange={e=>setDraft({...draft,[key]:e.target.value})}/></label>)}</div><label className="block space-y-1 text-sm">Room details / facilities<textarea className={field} rows={4} maxLength={5000} value={draft.details} onChange={e=>setDraft({...draft,details:e.target.value})}/></label>{!editing&&<label className="block space-y-2 text-sm">Room video * (MP4 / MOV, max 150 MB)<input className={field} type="file" required accept="video/mp4,video/quicktime,.mp4,.mov" onChange={e=>setVideo(e.target.files?.[0]||null)}/><span className="block text-slate-500">Use a browser-compatible MP4 for reliable playback. This video will not appear in public room listings.</span></label>}<button className={button} disabled={busy}>{busy?`Saving… ${progress>0?progress+'%':''}`:'Save room'}</button></form></div>}
    {selected && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3" role="dialog" aria-modal="true" aria-label="Share room with client"><div className="max-h-[90vh] w-full max-w-xl space-y-4 overflow-y-auto rounded-2xl bg-white p-6"><div className="flex justify-between"><h2 className="text-xl font-bold">{selected.code} · Send client</h2><button disabled={busy} onClick={()=>setSelected(null)}>Close ✕</button></div>{error&&<p role="alert" className="text-red-700">{error}</p>}{notice&&<p role="status" className="text-emerald-700">{notice}</p>}<label className="block text-sm">Client name *<input required className={field} value={client.clientName} onChange={e=>{setClient({...client,clientName:e.target.value});setShare(null);}}/></label><label className="block text-sm">Client phone *<input required className={field} type="tel" value={client.clientPhone} onChange={e=>{setClient({...client,clientPhone:e.target.value,recordId:''});setForms([]);setShare(null);}}/></label><button disabled={busy||!client.clientPhone} className={secondary} onClick={()=>void action(async()=>{setForms(await officeService.forms(client.clientPhone));})}>Find client forms</button><label className="block text-sm">Link client form (optional)<select className={field} value={client.recordId} onChange={e=>setClient({...client,recordId:e.target.value})}><option value="">No linked form</option>{forms.map(f=><option key={f.id} value={f.id}>{f.name} · {f.customerNumber} · {f.status}</option>)}</select></label><label className="block text-sm">Visit / reception notes<textarea className={field} rows={3} value={client.notes} onChange={e=>setClient({...client,notes:e.target.value})}/></label><div className="flex flex-wrap gap-2"><button disabled={busy||selected.status==='RENTED'||!client.clientName||!client.clientPhone} className={button} onClick={()=>void clientAction('share')}>Create private share link</button><button disabled={busy||!client.clientName||!client.clientPhone} className={secondary} onClick={()=>void clientAction('VISITED')}>Record client visit</button></div>{share&&shareClient&&<div className="space-y-3 rounded-xl bg-emerald-50 p-4"><p className="text-sm">Expires {new Date(share.expiresAt).toLocaleDateString()}. Anyone with this link can view this room. It never exposes client history.</p><input readOnly className={field} value={share.url} aria-label="Private room link"/><div className="flex flex-wrap gap-2"><button className={secondary} onClick={()=>void action(async()=>{await navigator.clipboard.writeText(share.url);setNotice('Link copied.');})}>Copy link</button><a className={button} target="_blank" rel="noopener noreferrer" href={`https://wa.me/${whatsappPhone(shareClient.clientPhone)}?text=${encodeURIComponent(`${selected.code} · ${selected.title}\n${selected.location}\n${share.url}`)}`}>Open WhatsApp ↗</a><button disabled={busy} className={secondary} onClick={()=>void action(async()=>{await officeService.visit(selected.id,shareClient,'SENT',share.shareId);setNotice('Recorded as sent to this client.');setShare(null);})}>Mark as sent</button></div></div>}</div></div>}
  </div>;
}

function Pagination({ page,total,size,change }: { page: number; total: number; size: number; change: (page: number)=>void }) { return <div className="flex items-center justify-between gap-3 text-sm"><span>{total} results · Page {page+1}</span><div className="flex gap-2"><button className={secondary} disabled={page===0} onClick={()=>change(page-1)}>Previous</button><button className={secondary} disabled={(page+1)*size>=total} onClick={()=>change(page+1)}>Next</button></div></div>; }
function whatsappPhone(phone: string) { const d=phone.replace(/\D/g,'').replace(/^00/,''); return d.length===10?'977'+d:d; }
