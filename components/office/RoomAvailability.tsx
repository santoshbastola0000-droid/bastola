"use client";
import { useUserStore } from "@/stores/user-store";
import { Bookmark, SlidersHorizontal } from "lucide-react";
import { readSaved, SAVE_EVENT } from "./RoomListingActions";
import { loadAvailabilityRooms } from "@/lib/availability-list";
import { FormEvent, useEffect, useId, useRef, useState } from 'react';
import { RoomListingBody, RoomListingDetails, SharedAvailabilityRoom } from './RoomListingDetails';
import { api } from '@/http/api/api';
import { privateApi } from '@/http/api/privateApi';
import { officeBackend, officeError } from '@/http/services/office.service';
export interface AvailableRoom { createdAt?: string; id: string; code: string; title: string; location: string; details: string; price: number | string; ownerName: string; status: string; tiktokUrl?: string; hasVideo?: boolean; matchProfile?: {exactAddress?: string; latitude?: number | null; longitude?: number | null; city?:string;area?:string;roomType?:string;capacity?:number;facilities?:string[];occupancy?:string;parkingVehicles?:string[]}; }
const unwrap = <T,>(r: {data: T | {data:T}}): T => { const d=r.data;return d && typeof d==='object' && 'data' in d ? (d as {data:T}).data : d as T; };
export function RoomContactUnlock({roomId}: {roomId:string}) {
 const [key,setKey]=useState(''), [unlocked,setUnlocked]=useState<{ownerPhone:string;ownerName?:string;exactAddress?:string;latitude?:number|null;longitude?:number|null}|null>(null), [error,setError]=useState(''), [busy,setBusy]=useState(false);
 async function unlock(e:FormEvent) {e.preventDefault();if(busy)return;setBusy(true);setError('');try{const r=unwrap<{ownerPhone:string;ownerName?:string;exactAddress?:string;latitude?:number|null;longitude?:number|null}>(await api.post('/office/availability/'+roomId+'/unlock',{key}));setUnlocked(r);setKey('');}catch(e){setError(officeError(e));}finally{setBusy(false);}}
 return <div className="space-y-2"> {unlocked ? <div role="status" className="contact-reveal space-y-2 rounded-xl bg-emerald-50 p-4 text-emerald-800"><span className="block text-xs font-semibold">Contact and exact location unlocked</span>{unlocked.ownerName&&<p className="text-sm">Owner: {unlocked.ownerName}</p>}{unlocked.ownerPhone ? <a href={'tel:'+unlocked.ownerPhone} className="block text-lg font-bold">{unlocked.ownerPhone}</a> : <p className="text-sm">Owner phone: Not entered</p>}{unlocked.exactAddress&&<p className="text-sm">Exact address: {unlocked.exactAddress}</p>}{unlocked.latitude!=null&&unlocked.longitude!=null&&<a target="_blank" rel="noopener noreferrer" className="block text-sm font-semibold underline" href={"https://www.google.com/maps?q="+encodeURIComponent(unlocked.latitude+","+unlocked.longitude)}>📍 Open exact location in Google Maps ↗</a>}</div> :
 <form onSubmit={unlock} className="rounded-xl bg-slate-50 p-3"><p className="mb-2 text-xs text-slate-600">Owner name: *** · Phone: *** · Exact location: ***</p><label htmlFor={'key-'+roomId} className="mb-2 block text-xs font-semibold">Reception key · Owner contact खोल्नुहोस्</label><div className="flex gap-2"><input id={'key-'+roomId} type="password" autoComplete="off" maxLength={24} required value={key} onChange={e=>setKey(e.target.value)} placeholder="Room key" className="min-w-0 flex-1 rounded-lg border bg-white p-2 text-sm"/><button disabled={busy} className="rounded-lg bg-primary px-3 text-sm font-semibold text-primary-foreground disabled:opacity-50">{busy?'Checking…':'Unlock'}</button></div></form>}
 {error && <p role="alert" className="text-xs text-red-700">{error}</p>}
 <style jsx>{`@keyframes reveal{from{opacity:0;transform:translateY(8px) scale(.97)}to{opacity:1;transform:none}}.contact-reveal{animation:reveal .35s ease-out}@media(prefers-reduced-motion:reduce){.contact-reveal{animation:none}}`}</style></div>;
}
export function AvailabilityCard({room,onSelect}: {room:AvailableRoom;hideContact?:boolean;onSelect?: (room:AvailableRoom)=>void}) {
 return <article data-room-availability className="overflow-hidden rounded-[20px] border border-border bg-card text-card-foreground shadow-[0_4px_20px_rgba(0,0,0,0.06)] transition-shadow hover:shadow-[0_8px_28px_rgba(0,0,0,0.10)]">
   <div className="relative bg-black">
     {room.hasVideo!==false?<video data-video-intent="room" controls playsInline preload="none" aria-label={room.title+" room video"} className="aspect-[4/3] w-full object-contain" src={officeBackend+'/office/availability/'+encodeURIComponent(room.id)+'/video'}/>:<div className="flex aspect-[4/3] items-center justify-center bg-muted"><img src="/roomkhoj-logo-20261030.png" alt="RoomKhoj — no room video available" loading="lazy" className="h-20 w-20 rounded-xl object-contain"/></div>}
     <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between gap-2 bg-gradient-to-b from-black/45 to-transparent p-3 pb-8">
       <span role="img" aria-label="Room available" className="h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-500 ring-2 ring-white/80 shadow-sm"/>
       <span className="rounded-lg border border-white/25 bg-black/60 px-2 py-1 font-mono text-[10px] font-medium tracking-wide text-white">{room.code}</span>
     </div>
   </div>
   <RoomListingBody room={room} compact onDetails={onSelect?()=>onSelect(room):undefined}/>
 </article>;
}
export function RoomAvailability({hideContact=true,embedded=false}: {hideContact?:boolean;embedded?:boolean} = {}) {
 const user=useUserStore(state=>state.user);
 const filterPanelId=useId();
 const [sharedRoomId,setSharedRoomId]=useState('');
 useEffect(()=>{const id=new URL(window.location.href).searchParams.get('room');if(id && /^[0-9a-f-]{36}$/i.test(id))setSharedRoomId(id);},[]);
 const [selectedRoom,setSelectedRoom]=useState<AvailableRoom|null>(null);
 const [q,setQ]=useState(''),[search,setSearch]=useState(''),[page,setPage]=useState(0),[rooms,setRooms]=useState<AvailableRoom[]>([]),[total,setTotal]=useState(0),[loading,setLoading]=useState(true),[error,setError]=useState(''),[retry,setRetry]=useState(0);
 const [savedIds,setSavedIds]=useState<string[]>([]),[savedOnly,setSavedOnly]=useState(false),[filterOpen,setFilterOpen]=useState(false),[maxRent,setMaxRent]=useState(0),[roomType,setRoomType]=useState('');
 useEffect(()=>{
   const sync=()=>setSavedIds(current=>{const ids=readSaved();return JSON.stringify(ids)===JSON.stringify(current)?current:ids;});
   sync();window.addEventListener(SAVE_EVENT,sync);window.addEventListener('storage',sync);
   return()=>{window.removeEventListener(SAVE_EVENT,sync);window.removeEventListener('storage',sync);};
 },[]);
 const savedKey=savedOnly?JSON.stringify(savedIds):'';
 useEffect(()=>{
   const controller=new AbortController();setLoading(true);setError('');
   loadAvailabilityRooms({search,page,savedIds:savedOnly?JSON.parse(savedKey):undefined,maxRent,roomType,signal:controller.signal})
    .then(data=>{if(controller.signal.aborted)return;if(page>0&&page*24>=data.total){setPage(0);return;}setRooms(data.rooms);setTotal(data.total);})
    .catch(e=>{if(!controller.signal.aborted){setRooms([]);setTotal(0);setError(officeError(e));}})
    .finally(()=>{if(!controller.signal.aborted)setLoading(false);});
   return()=>controller.abort();
 },[search,page,savedOnly,savedKey,maxRent,roomType,retry]);
 function openRoom(room:AvailableRoom) {
   if(!user) {
     setSharedRoomId(room.id);
     sessionStorage.setItem("roomkhoj_post_auth_redirect","/rooms?room="+encodeURIComponent(room.id));
     window.dispatchEvent(new Event("roomkhoj:open-login"));
     return;
   }
   setSelectedRoom(room);
 }
 const chip="inline-flex min-h-8 items-center gap-1 rounded-full border px-3 py-1 text-[11px] font-semibold transition-colors";
 const activeChip="border-primary/25 bg-primary/10 text-primary",idleChip="border-border bg-card text-muted-foreground hover:text-primary";
 const filterCount=Number(maxRent>0)+Number(Boolean(roomType));
 return <section data-room-availability className={embedded?"w-full bg-background text-foreground":"min-h-0 flex-1 overflow-y-auto bg-background p-3 text-foreground"}>
  <div className="mx-auto max-w-5xl space-y-3">
   <div><h2 className="text-lg font-bold">Room Availability</h2><p className="text-xs text-muted-foreground">Reception का available rooms</p></div>
   <form onSubmit={e=>{e.preventDefault();setSearch(q.trim());setPage(0);}} className="flex gap-2">
    <input aria-label="Search available rooms" maxLength={300} value={q} onChange={e=>setQ(e.target.value)} placeholder="Room code, location or details…" className="min-w-0 flex-1 rounded-xl border border-input bg-card px-3 py-2 text-[16px] sm:text-sm"/>
    <button className="rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground">Search</button>
   </form>
   <div className="flex flex-wrap items-center gap-1.5" aria-label="Room list controls">
    <button type="button" aria-pressed={!savedOnly} onClick={()=>{setSavedOnly(false);setPage(0);}} className={chip+" "+(!savedOnly?activeChip:idleChip)}>All rooms</button>
    <button type="button" aria-pressed={savedOnly} onClick={()=>{setSavedOnly(true);setPage(0);}} className={chip+" "+(savedOnly?activeChip:idleChip)}><Bookmark className="h-3.5 w-3.5" aria-hidden="true"/>Saved <span className="text-[10px]">({savedIds.length})</span></button>
    <button type="button" aria-expanded={filterOpen} aria-controls={filterPanelId} onClick={()=>setFilterOpen(v=>!v)} className={chip+" "+(filterCount?activeChip:idleChip)}><SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true"/>Filter{filterCount>0?" ("+filterCount+")":""}</button>
    {(filterCount>0||search)&&<button type="button" className="px-1 py-1 text-[10px] text-muted-foreground underline" onClick={()=>{setMaxRent(0);setRoomType('');setQ('');setSearch('');setPage(0);}}>Clear filters</button>}
   </div>
   {filterOpen&&<div id={filterPanelId} className="grid grid-cols-2 gap-2 rounded-xl border border-border bg-card p-2.5">
    <label className="space-y-1 text-[11px] font-medium text-muted-foreground"><span>Maximum rent</span><select value={maxRent} onChange={e=>{setMaxRent(Number(e.target.value));setPage(0);}} className="block w-full rounded-lg border border-input bg-background px-2 py-2 text-xs text-foreground"><option value={0}>Any rent</option>{[5000,10000,15000,20000,30000,50000].map(price=><option key={price} value={price}>रु {price.toLocaleString()} सम्म</option>)}</select></label>
    <label className="space-y-1 text-[11px] font-medium text-muted-foreground"><span>Room type</span><select value={roomType} onChange={e=>{setRoomType(e.target.value);setPage(0);}} className="block w-full rounded-lg border border-input bg-background px-2 py-2 text-xs text-foreground"><option value="">All types</option>{['Single','Double','Flat','Apartment','House','Hostel','Shared','Office','Shutter'].map(type=><option key={type} value={type.toLowerCase()}>{type}</option>)}</select></label>
   </div>}
   {savedOnly&&<p className="text-[10px] text-muted-foreground">यस device मा save गरिएका available rooms</p>}
   {error&&<div role="alert" className="rounded-xl bg-destructive/10 p-3 text-xs text-destructive"><p>{error}</p><button type="button" onClick={()=>setRetry(v=>v+1)} className="mt-2 rounded-lg border px-3 py-1.5">Retry</button></div>}
   {loading?<p role="status" className="py-4 text-xs text-muted-foreground">Loading rooms…</p>:<>
    <p aria-live="polite" className="text-xs text-muted-foreground">{total} {savedOnly?'saved available':'available'} rooms</p>
    <div className="grid gap-3 sm:grid-cols-2">{rooms.map(room=><AvailabilityCard key={room.id} room={room} hideContact={hideContact} onSelect={openRoom}/>)}</div>
    {!rooms.length&&!error&&<p className="rounded-xl border border-dashed p-5 text-center text-xs text-muted-foreground">{savedOnly&&!savedIds.length?'Card को Save थिचेर यहाँ rooms राख्नुहोस्।':'मिल्ने room भेटिएन। Search वा filters परिवर्तन गर्नुहोस्।'}</p>}
    {(page>0||total>24)&&<div className="flex justify-between"><button disabled={page===0} onClick={()=>setPage(p=>p-1)} className="rounded-lg border px-3 py-1.5 text-xs disabled:opacity-40">Previous</button><button disabled={(page+1)*24>=total} onClick={()=>setPage(p=>p+1)} className="rounded-lg border px-3 py-1.5 text-xs disabled:opacity-40">Next</button></div>}
   </>}
   {sharedRoomId&&<SharedAvailabilityRoom id={sharedRoomId}/>}
   {user&&selectedRoom&&<RoomListingDetails key={selectedRoom.id} room={selectedRoom} onClose={()=>setSelectedRoom(null)}/>}
  </div>
 </section>;
}
export function AdminContactKey({roomId}: {roomId:string}) {
 const [key,setKey]=useState(''), [error,setError]=useState(''), [busy,setBusy]=useState(false), [copied,setCopied]=useState(false);
 const generation=useRef(0);
 useEffect(()=>{const ticket=++generation.current;setKey('');setError('');privateApi.post('/office/rooms/'+roomId+'/contact-key',{}).then(r=>{if(ticket===generation.current)setKey(unwrap<{key:string}>(r).key);}).catch(e=>{if(ticket===generation.current)setError(officeError(e));});return()=>{generation.current++;};},[roomId]);
 async function rotate(){setBusy(true);setError('');setCopied(false);try{setKey(unwrap<{key:string}>(await privateApi.post('/office/rooms/'+roomId+'/contact-key',{rotate:true})).key);}catch(e){setError(officeError(e));}finally{setBusy(false);}}
 return <div className="space-y-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-slate-900"><p className="text-sm font-semibold">Owner contact key</p><p className="text-xs">यो room को key client लाई दिएपछि contact खुल्छ। Rotate गर्दा पुरानो key बन्द हुन्छ।</p><code className="block break-all rounded-lg bg-white p-2 text-sm">{key || 'Generating…'}</code><div className="flex gap-2"><button type="button" disabled={!key} onClick={async()=>{try{await navigator.clipboard.writeText(key);setCopied(true);}catch{setError('Copy भएन। Key select गरेर copy गर्नुहोस्।');}}} className="rounded-lg border bg-white px-3 py-2 text-xs">{copied?'Copied':'Copy key'}</button><button type="button" disabled={busy || !key} onClick={()=>void rotate()} className="rounded-lg border bg-white px-3 py-2 text-xs">{busy?'Rotating…':'Rotate key'}</button></div>{error && <p role="alert" className="text-xs text-red-700">{error}</p>}</div>;
}
