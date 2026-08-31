"use client";

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { isAxiosError } from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { shiftingService } from '@/http/services/shifting.service';
import type { ShiftingBooking, ShiftingList } from '@/types/shifting.types';
import { Choice, errorText, Field } from './ShiftingForm';

const statuses = ['REQUESTED', 'QUOTED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
const statusText: Record<string, string> = { REQUESTED: 'Request received / अनुरोध आयो', QUOTED: 'Quote ready / मूल्य प्रस्ताव', CONFIRMED: 'Confirmed / पक्का भयो', IN_PROGRESS: 'Moving / सार्दै', COMPLETED: 'Completed / सम्पन्न', CANCELLED: 'Cancelled / रद्द' };
const time = (value: string) => new Date(value).toLocaleString('en-GB', { timeZone: 'Asia/Kathmandu' });

function BookingDetail({ row, admin, changed }: { row: ShiftingBooking; admin: boolean; changed: (next: ShiftingBooking) => void }) {
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [confirm, setConfirm] = useState(false);
  const [urls, setUrls] = useState<string[]>([]), [photosBusy, setPhotosBusy] = useState(false);
  const photoUrls = useRef<string[]>([]);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; photoUrls.current.forEach(URL.revokeObjectURL); photoUrls.current = []; }; }, []);
  const active = !['COMPLETED', 'CANCELLED'].includes(row.status);
  async function action(action: Parameters<typeof shiftingService.action>[1], payload: object) {
    if (busy) return false;
    setBusy(true); setError('');
    try { changed(await shiftingService.action(row.id, action, payload)); return true; }
    catch (err) { setError(errorText(err)); return false; } finally { setBusy(false); }
  }
  async function submit(event: FormEvent<HTMLFormElement>, kind: 'quote' | 'messages' | 'cancel' | 'review') {
    event.preventDefault(); const form = event.currentTarget; const fd = new FormData(form);
    const get = (key: string) => String(fd.get(key) ?? '').trim();
    const payload = kind === 'quote' ? { amount: Number(get('amount')), inclusions: get('inclusions'), team: get('team'), vehicle: get('vehicle'), contactPhone: get('contactPhone'), availabilityConfirmed: fd.has('availability') }
      : kind === 'cancel' ? { reason: get('reason') } : kind === 'review' ? { rating: Number(get('rating')), text: get('text') } : { text: get('text') };
    if (await action(kind, payload)) form.reset();
  }
  async function showPhotos() {
    if (photosBusy) return;
    setPhotosBusy(true); setError('');
    try {
      const blobs = await Promise.all(Array.from({ length: row.photoCount }, (_, index) => shiftingService.photo(row.id, index)));
      if (!mounted.current) return;
      photoUrls.current.forEach(URL.revokeObjectURL);
      photoUrls.current = blobs.map(blob => URL.createObjectURL(blob)); setUrls(photoUrls.current);
    } catch (err) { if (mounted.current) setError(errorText(err)); } finally { if (mounted.current) setPhotosBusy(false); }
  }
  return <div className="space-y-5 border-t pt-4">
    <div className="grid gap-3 text-sm sm:grid-cols-2">{(['from', 'to'] as const).map(key => <div key={key} className="rounded-xl bg-slate-50 p-3"><strong>{key === 'from' ? 'Pickup / पुरानो घर' : 'Drop-off / नयाँ घर'}</strong><p>{row.details[key].address}, {row.details[key].city}</p><p>Floor {row.details[key].floor} · Lift: {row.details[key].lift ? 'Yes' : 'No'} · Vehicle access: {row.details[key].vehicleAccess ? 'Yes' : 'No'}</p>{row.details[key].latitude != null && row.details[key].longitude != null && <p>Pin: {row.details[key].latitude}, {row.details[key].longitude}</p>}</div>)}</div>
    <p className="text-sm">{row.details.rooms} room(s) · {row.details.service} · Extras: {row.details.extras.join(', ') || 'None'}</p>
    <p className="whitespace-pre-wrap text-sm"><strong>Items: </strong>{row.details.items}</p>
    {row.details.notes && <p className="whitespace-pre-wrap text-sm"><strong>Instructions: </strong>{row.details.notes}</p>}
    {admin && <a className="inline-block text-sm font-semibold text-red-600" href={`tel:${row.details.phone.replace(/[^+0-9]/g, '')}`}>Call customer: {row.details.phone}</a>}
    {row.photoCount > 0 && urls.length === 0 && <Button variant="outline" disabled={photosBusy} onClick={showPhotos}>{photosBusy ? 'Loading…' : `View ${row.photoCount} private photo(s)`}</Button>}
    {urls.length > 0 && <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{urls.map((url, i) => <img key={url} src={url} alt={`Moving items ${i + 1}`} className="h-40 w-full rounded-xl object-contain bg-slate-100" />)}</div>}
    {row.quote && <section className="space-y-3 rounded-2xl border border-red-100 bg-red-50 p-4"><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-semibold">Total quote / कुल मूल्य</h3><strong className="text-2xl text-red-600">रू {row.quote.amount.toLocaleString('en-NP')}</strong></div><p className="whitespace-pre-wrap text-sm">{row.quote.inclusions}</p><p className="text-sm">Team: {row.quote.team} · Vehicle: {row.quote.vehicle}</p><p className="text-xs text-slate-500">Version {row.quote.version} · Price is confirmed only after your acceptance. No wallet deduction.</p>
      {['CONFIRMED', 'IN_PROGRESS'].includes(row.status) && <a className="inline-block font-semibold text-red-600" href={`tel:${row.quote.contactPhone.replace(/[^+0-9]/g, '')}`}>Call moving team / टोलीलाई फोन: {row.quote.contactPhone}</a>}
      {!admin && row.status === 'QUOTED' && <Button disabled={busy} onClick={() => setConfirm(true)}>Accept quote / मूल्य स्वीकार्नुहोस्</Button>}
    </section>}
    <AlertDialog open={confirm} onOpenChange={setConfirm}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Confirm moving booking?</AlertDialogTitle><AlertDialogDescription>Accept total NPR {row.quote?.amount.toLocaleString('en-NP')} for {time(row.details.moveAt)} Nepal time. This confirms the displayed services; no online payment is taken.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Back</AlertDialogCancel><AlertDialogAction disabled={busy} onClick={() => { if (row.quote) void action('accept', { version: row.quote.version }); }}>Accept & confirm</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    {admin && ['REQUESTED', 'QUOTED'].includes(row.status) && <form onSubmit={e => submit(e, 'quote')} className="space-y-3 rounded-xl border p-4"><h3 className="font-semibold">{row.quote ? 'Revise quote' : 'Send quote'} / मूल्य पठाउनुहोस्</h3><fieldset disabled={busy} className="space-y-3"><Field label="Total NPR (all quoted services) *"><Input name="amount" type="number" min={1} max={1000000} required defaultValue={row.quote?.amount} /></Field><Field label="Inclusions, exclusions & agreed terms *"><Textarea name="inclusions" required minLength={5} maxLength={2000} defaultValue={row.quote?.inclusions} /></Field><div className="grid gap-3 sm:grid-cols-2"><Field label="Assigned team / worker names *"><Input name="team" required minLength={2} maxLength={200} defaultValue={row.quote?.team} /></Field><Field label="Vehicle details (or 'Not needed') *"><Input name="vehicle" required minLength={2} maxLength={200} defaultValue={row.quote?.vehicle} /></Field></div><Field label="Team contact phone *"><Input name="contactPhone" type="tel" required maxLength={21} defaultValue={row.quote?.contactPhone} /></Field><label className="flex items-center gap-2 text-sm"><Checkbox name="availability" value="yes" required />I verified availability for this time, route and service.</label><Button type="submit">Send quote</Button></fieldset></form>}
    {admin && row.status === 'CONFIRMED' && <Button disabled={busy} onClick={() => void action('status', { status: 'IN_PROGRESS' })}>Mark moving started</Button>}
    {admin && row.status === 'IN_PROGRESS' && <Button disabled={busy} onClick={() => void action('status', { status: 'COMPLETED' })}>Mark completed</Button>}
    <section className="space-y-3"><h3 className="font-semibold">Booking messages / बुकिङबारे कुराकानी</h3>{row.messages.length === 0 && <p className="text-sm text-slate-500">No messages yet. Ask a question about this move.</p>}<div className="max-h-72 space-y-2 overflow-y-auto">{row.messages.map((message, i) => <div key={`${message.at}-${i}`} className={`rounded-xl p-3 text-sm ${message.by === 'ADMIN' ? 'bg-red-50' : 'bg-slate-100'}`}><p className="text-xs font-semibold text-slate-500">{message.by === 'ADMIN' ? 'RoomKhoj team' : 'Customer'} · {time(message.at)}</p><p className="whitespace-pre-wrap break-words">{message.text}</p></div>)}</div>{active && <form onSubmit={e => submit(e, 'messages')} className="flex items-end gap-2"><Field label="Your message"><Textarea name="text" required maxLength={1000} /></Field><Button type="submit" disabled={busy}>Send</Button></form>}</section>
    {['REQUESTED', 'QUOTED', 'CONFIRMED'].includes(row.status) && <details className="rounded-xl border p-3"><summary className="cursor-pointer text-sm font-semibold text-red-600">Cancel booking / बुकिङ रद्द गर्नुहोस्</summary><form onSubmit={e => submit(e, 'cancel')} className="mt-3 space-y-3"><Field label="Cancellation reason *"><Textarea name="reason" required minLength={3} maxLength={500} /></Field><p className="text-xs text-slate-500">This closes the request. For another move, submit a new request.</p><Button variant="destructive" type="submit" disabled={busy}>Confirm cancellation</Button></form></details>}
    {!admin && row.status === 'COMPLETED' && !row.review && <form onSubmit={e => submit(e, 'review')} className="space-y-3 rounded-xl border p-4"><h3 className="font-semibold">Review this move / अनुभव लेख्नुहोस्</h3><Choice name="rating" label="Rating" defaultValue="5" options={[["5", "5 — Excellent"], ["4", "4 — Good"], ["3", "3 — Okay"], ["2", "2 — Poor"], ["1", "1 — Very poor"]]} /><Field label="Your feedback"><Textarea name="text" maxLength={1000} /></Field><Button type="submit" disabled={busy}>Submit review</Button></form>}
    {row.review && <p className="rounded-xl bg-slate-50 p-3 text-sm">Review: {row.review.rating}/5 · {row.review.text}</p>}
    <details className="text-sm"><summary className="cursor-pointer text-slate-500">Booking history</summary><ol className="mt-3 space-y-2">{row.history.map((event, i) => <li key={i}>{time(event.at)} · {event.action}{event.note ? ` — ${event.note}` : ''}</li>)}</ol></details>
    {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
  </div>;
}

export function ShiftingBookings({ admin = false, refreshKey = 0 }: { admin?: boolean; refreshKey?: number }) {
  const [page, setPage] = useState(1), [status, setStatus] = useState('ALL'), [reload, setReload] = useState(0);
  const [list, setList] = useState<ShiftingList | null>(null), [loading, setLoading] = useState(true), [error, setError] = useState(''), [open, setOpen] = useState<string | null>(null);
  useEffect(() => {
    let active = true; setLoading(true); setError(''); setOpen(null);
    shiftingService.list(admin, page, status === 'ALL' ? '' : status).then(result => { if (active) setList(result); }).catch(err => { if (active) { setList(null); setError(isAxiosError(err) && err.response?.status === 404 ? 'Room Shifting is not available yet. Please try later.' : errorText(err)); } }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [admin, page, status, reload, refreshKey]);
  return <div className="space-y-4"><div className="flex flex-wrap items-center gap-3"><Select value={status} onValueChange={value => { setStatus(value); setPage(1); }}><SelectTrigger className="w-64" aria-label="Filter booking status"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ALL">All bookings / सबै बुकिङ</SelectItem>{statuses.map(s => <SelectItem key={s} value={s}>{statusText[s]}</SelectItem>)}</SelectContent></Select><Button variant="outline" disabled={loading} onClick={() => setReload(n => n + 1)}>Refresh / अपडेट</Button></div>
    {loading ? <p role="status" className="py-8 text-center text-slate-500">Loading bookings…</p> : error ? <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-700">{error}</p> : <>
      {list?.data.length === 0 && <p className="rounded-2xl border border-dashed p-8 text-center text-slate-500">No bookings here yet / अहिलेसम्म बुकिङ छैन।</p>}
      {list?.data.map(row => <article key={row.id} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5"><button className="w-full space-y-2 text-left" aria-expanded={open === row.id} onClick={() => setOpen(open === row.id ? null : row.id)}><div className="flex flex-wrap items-center justify-between gap-2"><span className="text-xs font-semibold text-slate-500">#{row.id.slice(0, 8).toUpperCase()}</span><Badge variant="outline">{statusText[row.status]}</Badge></div><h3 className="font-semibold">{row.details.from.address} → {row.details.to.address}</h3><p className="text-sm text-slate-500">{time(row.details.moveAt)} Nepal time · {row.details.rooms} room(s)</p><p className="text-sm font-semibold text-red-600">{open === row.id ? 'Close details' : 'View details & messages →'}</p></button>{open === row.id && <BookingDetail row={row} admin={admin} changed={next => setList(current => current ? { ...current, data: current.data.map(item => item.id === next.id ? next : item) } : current)} />}</article>)}
      {list && list.total > list.pageSize && <div className="flex items-center justify-between"><Button variant="outline" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button><span className="text-sm">Page {page} / {Math.ceil(list.total / list.pageSize)}</span><Button variant="outline" disabled={page * list.pageSize >= list.total} onClick={() => setPage(p => p + 1)}>Next</Button></div>}
    </>}</div>;
}
