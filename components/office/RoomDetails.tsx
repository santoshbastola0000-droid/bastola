import type { OfficeRoom } from '@/http/services/office.service';
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

