import { useEffect, useState } from 'react';
import { officeService, officeError } from '@/http/services/office.service';
import type { OfficeRoom } from '@/http/services/office.service';
import { PhoneReveal } from './PhoneReveal';

export function RoomDetails({ room }: { room: OfficeRoom }) {
  const [admin, setAdmin] = useState(false);
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(room.details || '');
  const [saved, setSaved] = useState(room.details || '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { let mounted = true; officeService.access().then(a => { if (mounted) setAdmin(a.isAdmin === true); }).catch(() => {}); return () => { mounted = false; }; }, []);
  useEffect(() => { setValue(room.details || ''); setSaved(room.details || ''); setEditing(false); }, [room.id, room.details]);
  async function save() {
    if (!admin || busy) return;
    setBusy(true); setError('');
    try {
      const latest = await officeService.room(room.id);
      await officeService.update(room.id, { ...latest, details: value.trim() });
      setSaved(value.trim()); setEditing(false);
    } catch (e) { setError(officeError(e)); }
    finally { setBusy(false); }
  }
  return <div className="space-y-1 p-3">
    <div className="flex items-start justify-between gap-3"><h3 className="text-base font-semibold">{room.title}</h3><span className="rounded-lg bg-slate-100 px-3 py-1 font-mono font-bold">{room.code}</span></div>
    <p className="text-slate-600">📍 {room.location} · रु {Number(room.price).toLocaleString()}/month</p>
    <details className="text-sm text-slate-700"><summary className="cursor-pointer">Room details</summary><p className="whitespace-pre-wrap">{saved || 'No details added yet.'}</p>
      {admin && !editing && <button type="button" className="mt-2 rounded border px-3 py-2" onClick={() => setEditing(true)}>{saved ? 'Edit details' : '+ Add details'}</button>}
      {admin && editing && <div className="mt-2 space-y-2"><textarea aria-label="Room details" rows={7} maxLength={10000} className="w-full rounded border p-2" value={value} onChange={e => setValue(e.target.value)} /><div className="flex gap-2"><button type="button" disabled={busy} className="rounded bg-blue-700 px-3 py-2 text-white" onClick={() => void save()}>{busy ? 'Saving…' : 'Save'}</button><button type="button" disabled={busy} className="rounded border px-3 py-2" onClick={() => { setEditing(false); setValue(saved); }}>Cancel</button></div></div>}
      {error && <p role="alert" className="text-red-700">{error}</p>}
    </details>
    <div className="flex flex-wrap items-center gap-2 text-sm"><span>Owner: {room.ownerName || '—'}</span><PhoneReveal phone={room.ownerPhone} label="Owner phone"/></div>
    {room.tiktokUrl && <a className="inline-block text-sm text-blue-700 underline" href={room.tiktokUrl} target="_blank" rel="noopener noreferrer">Open TikTok ↗</a>}
  </div>;
}

