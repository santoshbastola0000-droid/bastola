"use client";
import { useEffect, useState, type FormEvent } from 'react';
import { officeService, officeError, type OfficeRoom } from '@/http/services/office.service';
import { PhoneReveal } from './PhoneReveal';

export function RoomDetails({ room }: { room: OfficeRoom }) {
  return <div className="space-y-1 p-3">
    <div className="flex items-start justify-between gap-3"><h3 className="text-base font-semibold">{room.title}</h3><span className="rounded-lg bg-slate-100 px-3 py-1 font-mono font-bold">{room.code}</span></div>
    <p className="text-slate-600">📍 {room.location} · रु {Number(room.price).toLocaleString()}/month</p>
    <details className="text-sm text-slate-700"><summary className="cursor-pointer">Room details</summary><p className="whitespace-pre-wrap">{room.details}</p></details>
    <div className="flex flex-wrap items-center gap-2 text-sm"><span>Owner: {room.ownerName || '—'}</span><PhoneReveal phone={room.ownerPhone} label="Owner phone"/></div>
    {room.tiktokUrl && <a className="inline-block text-sm text-blue-700 underline" href={room.tiktokUrl} target="_blank" rel="noopener noreferrer">Open TikTok ↗</a>}
  </div>;
}


/** Admin-only inline editor; writes to the existing room details column. */
export function RoomDetailsEditor({ room, onSaved }: { room: OfficeRoom; onSaved: () => Promise<void> }) {
  const [details, setDetails] = useState(room.details || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  useEffect(() => { setDetails(room.details || ''); setError(''); setSaved(false); }, [room.id, room.details]);
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    setSaving(true); setError(''); setSaved(false);
    try {
      await officeService.update(room.id, {
        code: room.code, title: room.title, location: room.location,
        details: details.trim(), ownerName: room.ownerName, ownerPhone: room.ownerPhone,
        tiktokUrl: room.tiktokUrl, price: room.price, matchProfile: room.matchProfile,
      });
      await onSaved();
      setSaved(true);
    } catch (cause) { setError(officeError(cause)); }
    finally { setSaving(false); }
  }
  return <form onSubmit={save} className="space-y-2 rounded-xl border border-blue-100 bg-blue-50/50 p-3">
    <label htmlFor={'room-details-edit-'+room.id} className="block text-sm font-semibold text-slate-900">Add / edit room details (Admin only)</label>
    <textarea id={'room-details-edit-'+room.id} rows={5} maxLength={5000} value={details}
      onChange={event=>{setDetails(event.target.value);setSaved(false);}}
      placeholder="Room size, floor, kitchen, bathroom, water, Wi-Fi, rules and other details..."
      className="w-full rounded-lg border border-slate-300 bg-white p-3 text-sm text-slate-900" />
    <div className="flex items-center gap-3">
      <button type="submit" disabled={saving || details.trim()===(room.details || '').trim()}
        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
        {saving?'Saving…':'Save details'}
      </button>
      {saved && <span role="status" className="text-sm text-emerald-700">Details saved</span>}
    </div>
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
  </form>;
}
