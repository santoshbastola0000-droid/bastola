"use client";
import { FormEvent, useEffect, useRef, useState } from 'react';
import { ClientInput, OfficeRoom, officeService, officeError, TenantDetails } from '@/http/services/office.service';

export function TenantForm({room,source,onClose,onSaved}:{room:OfficeRoom;source?:ClientInput;onClose:()=>void;onSaved:()=>Promise<void>}) {
  const dialog=useRef<HTMLDialogElement>(null); const pending=useRef(false);
  const [tenant,setTenant]=useState<TenantDetails>({name:source?.clientName||'',phone:source?.clientPhone||'',people:1,moveInDate:'',address:'',occupation:'',emergencyContact:'',notes:''});
  const [file,setFile]=useState<File|null>(null); const [busy,setBusy]=useState(false);const [error,setError]=useState('');
  useEffect(()=>{const node=dialog.current;node?.showModal();return()=>node?.close();},[]);
  async function save(e:FormEvent){
    e.preventDefault();if(pending.current)return;pending.current=true;setBusy(true);setError('');
    try{
      let documentId=tenant.documentId;
      if(file){if(file.size>5*1024*1024)throw new Error('Citizenship copy must be 5 MB or smaller');documentId=(await officeService.uploadDocument(file)).id;setTenant(prev=>({...prev,documentId}));setFile(null);}
      await officeService.status(room.id,'RENTED',{...tenant,documentId},source?.clientId);
      await onSaved();onClose();
    }catch(e){setError(officeError(e));}finally{pending.current=false;setBusy(false);}
  }
  const field='mt-1 w-full rounded-lg border p-2.5';
  return <dialog ref={dialog} className="max-h-[90vh] w-[calc(100%-1.5rem)] max-w-xl overflow-y-auto rounded-xl p-5 backdrop:bg-black/60" onCancel={e=>{e.preventDefault();if(!busy)onClose();}}><form onSubmit={save} className="space-y-3"><div className="flex items-center justify-between gap-3"><h2 className="text-lg font-bold">{room.code} · Save tenant & mark rented</h2><button type="button" disabled={busy} onClick={onClose}>Close ✕</button></div><p className="text-sm text-slate-600">Room changes to Rented only after these details save successfully.</p>{error&&<p role="alert" className="text-red-700">{error}</p>}
    <div className="grid gap-3 sm:grid-cols-2"><label>Name *<input autoFocus required maxLength={180} className={field} value={tenant.name} onChange={e=>setTenant({...tenant,name:e.target.value})}/></label><label>Phone *<input required type="tel" maxLength={30} className={field} value={tenant.phone} onChange={e=>setTenant({...tenant,phone:e.target.value})}/></label><label>People staying *<input required type="number" min={1} max={room.matchProfile?.capacity||100} className={field} value={tenant.people} onChange={e=>setTenant({...tenant,people:Number(e.target.value)})}/></label><label>Move-in date *<input required type="date" className={field} value={tenant.moveInDate} onChange={e=>setTenant({...tenant,moveInDate:e.target.value})}/></label></div>
    {(['address','occupation','emergencyContact'] as const).map(key=><label className="block text-sm" key={key}>{key==='emergencyContact'?'Emergency contact':key}<input maxLength={key==='address'?500:180} className={field} value={tenant[key]||''} onChange={e=>setTenant({...tenant,[key]:e.target.value})}/></label>)}
    <label className="block text-sm">Citizenship photocopy / photo (optional, private)<input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className={field} onChange={e=>setFile(e.target.files?.[0]||null)}/></label>{tenant.documentId&&!file&&<p className="text-xs text-emerald-700">Private document uploaded.</p>}
    <label className="block text-sm">Other tenant details<textarea maxLength={5000} className={field} value={tenant.notes||''} onChange={e=>setTenant({...tenant,notes:e.target.value})}/></label><button disabled={busy} className="rounded-lg bg-emerald-700 px-4 py-2.5 text-white disabled:opacity-50">{busy?'Saving…':'Save tenant & mark Rented'}</button>
  </form></dialog>;
}
