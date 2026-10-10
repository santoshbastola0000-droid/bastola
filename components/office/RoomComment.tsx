"use client";
import {useState} from 'react';
import {officeService,officeError} from '@/http/services/office.service';
import type {OfficeRoom} from '@/http/services/office.service';
const marker='\n[Reception Comment]\n';
export function RoomComment({room,onSaved}:{room:OfficeRoom;onSaved:()=>Promise<void>}){
 const original=room.details||'';
 const index=original.lastIndexOf(marker);
 const [comment,setComment]=useState(index<0?'':original.slice(index+marker.length));
 const [editing,setEditing]=useState(false);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 async function save(){
  setBusy(true);setError('');
  try{
   const base=index<0?original:original.slice(0,index);
   const details=base+(comment.trim()?marker+comment.trim():'');
   await officeService.update(room.id,{...room,details});
   await onSaved();setEditing(false);
  }catch(e){setError(officeError(e));}finally{setBusy(false);}
 }
 return <div className="px-3 pb-2 sm:px-4" onClick={e=>e.stopPropagation()}>
  <button type="button" className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-700" onClick={()=>setEditing(v=>!v)}>Comment {comment.trim()?'✎':'＋'}</button>
  {comment.trim()&&!editing&&<p className="mt-1 whitespace-pre-wrap text-xs text-slate-600">{comment}</p>}
  {editing&&<div className="mt-2 flex flex-col gap-2"><textarea aria-label="Reception room comment" maxLength={400} rows={2} className="w-full rounded-lg border p-2 text-sm" placeholder="Short reception note…" value={comment} onChange={e=>setComment(e.target.value)}/><button type="button" disabled={busy} className="self-end rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50" onClick={()=>void save()}>{busy?'Saving…':'Save Comment'}</button></div>}
  {error&&<p role="alert" className="text-xs text-red-600">{error}</p>}
 </div>;
}
