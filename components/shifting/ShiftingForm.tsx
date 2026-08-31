"use client";

import { useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Truck, MapPin, Package, CalendarClock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { shiftingService } from '@/http/services/shifting.service';
import type { MovingAddress, ShiftingBooking, ShiftingRequest } from '@/types/shifting.types';
import { isAxiosError } from 'axios';

export function errorText(error: unknown) {
  if (isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (Array.isArray(message)) return message.join(' · ');
    if (typeof message === 'string') return message;
    if (error.response?.status === 404 || error.response?.status === 502) return 'Room Shifting is temporarily unavailable. Please try again later.';
  }
  return error instanceof Error ? error.message : 'Could not save. Please try again.';
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block space-y-1.5 text-sm font-medium text-slate-700">{label}{children}</label>;
}
export function Choice({ name, label, options, defaultValue }: { name: string; label: string; options: [string, string][]; defaultValue: string }) {
  return <Field label={label}><Select name={name} defaultValue={defaultValue}><SelectTrigger aria-label={label}><SelectValue /></SelectTrigger><SelectContent>{options.map(([value, text]) => <SelectItem key={value} value={value}>{text}</SelectItem>)}</SelectContent></Select></Field>;
}
function Check({ name, children }: { name: string; children: ReactNode }) {
  return <label className="flex items-center gap-2 text-sm"><Checkbox name={name} value="yes" />{children}</label>;
}
function AddressFields({ prefix, title }: { prefix: string; title: string }) {
  return <fieldset className="space-y-4 rounded-2xl border border-slate-200 p-4"><legend className="px-2 font-semibold">{title}</legend>
    <Field label="Address / पूरा ठेगाना *"><Input name={`${prefix}Address`} required minLength={3} maxLength={300} placeholder="Area, street, nearby landmark" /></Field>
    <div className="grid grid-cols-2 gap-3"><Field label="City / शहर"><Input value="Pokhara" readOnly /></Field><Field label="Floor / तला *"><Input name={`${prefix}Floor`} type="number" min={0} max={50} defaultValue={0} required /></Field></div>
    <Check name={`${prefix}Lift`}>Lift available / लिफ्ट छ</Check><Check name={`${prefix}Access`}>Vehicle reaches entrance / गाडी ढोकासम्म पुग्छ</Check>
    <details className="text-sm"><summary className="cursor-pointer text-slate-500">Optional map coordinates / चाहिँदा मात्र</summary><div className="mt-3 grid grid-cols-2 gap-3"><Field label="Latitude"><Input name={`${prefix}Lat`} type="number" min={-90} max={90} step="any" /></Field><Field label="Longitude"><Input name={`${prefix}Lng`} type="number" min={-180} max={180} step="any" /></Field></div></details>
  </fieldset>;
}

export function ShiftingForm({ onCreated }: { onCreated: (booking: ShiftingBooking) => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [photos, setPhotos] = useState<File[]>([]);
  const requestId = useRef('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const str = (key: string) => String(data.get(key) ?? '').trim();
    setError('');
    try {
      const address = (prefix: string): MovingAddress => {
        const lat = str(`${prefix}Lat`), lng = str(`${prefix}Lng`);
        if (Boolean(lat) !== Boolean(lng)) throw new Error('Enter both latitude and longitude, or leave both blank.');
        return { address: str(`${prefix}Address`), city: 'Pokhara', floor: Number(str(`${prefix}Floor`)), lift: data.has(`${prefix}Lift`), vehicleAccess: data.has(`${prefix}Access`), ...(lat && lng ? { latitude: Number(lat), longitude: Number(lng) } : {}) };
      };
      const moveAt = new Date(`${str('moveAt')}:00+05:45`);
      if (!Number.isFinite(moveAt.getTime()) || moveAt.getTime() <= Date.now() || moveAt.getTime() > Date.now() + 366 * 86400000) throw new Error('Choose a future moving date within one year (Nepal time).');
      if (!requestId.current) requestId.current = crypto.randomUUID();
      const payload: ShiftingRequest = { clientRequestId: requestId.current, from: address('from'), to: address('to'), moveAt: moveAt.toISOString(), rooms: Number(str('rooms')), items: str('items'), service: str('service') as ShiftingRequest['service'], extras: ['PACKING', 'UNPACKING', 'FURNITURE'].filter(x => data.has(x)), phone: str('phone'), notes: str('notes') };
      setBusy(true);
      const booking = await shiftingService.create(payload, photos);
      requestId.current = ''; form.reset(); setPhotos([]); onCreated(booking);
    } catch (err) { setError(errorText(err)); } finally { setBusy(false); }
  }

  return <form onSubmit={submit} className="space-y-6">
    <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-slate-700"><strong>Request a quote / मूल्य सोध्नुहोस्</strong><p className="mt-1">Pokhara service requests only. No fixed price or automatic confirmation. We confirm availability and send the total price for you to accept.</p></div>
    <fieldset disabled={busy} className="space-y-6">
      <h2 className="flex items-center gap-2 text-lg font-semibold"><MapPin className="h-5 w-5 text-red-600" /> Moving route / कहाँबाट कहाँसम्म</h2>
      <div className="grid gap-4 md:grid-cols-2"><AddressFields prefix="from" title="Pickup / पुरानो घर" /><AddressFields prefix="to" title="Drop-off / नयाँ घर" /></div>
      <h2 className="flex items-center gap-2 text-lg font-semibold"><CalendarClock className="h-5 w-5 text-red-600" /> When & what / समय र सामान</h2>
      <div className="grid gap-4 sm:grid-cols-2"><Field label="Moving date & time (Nepal) *"><Input name="moveAt" type="datetime-local" required /></Field><Field label="Number of rooms / कोठा संख्या *"><Input name="rooms" type="number" min={1} max={30} defaultValue={1} required /></Field></div>
      <Field label="Items / सामानको विवरण *"><Textarea name="items" required minLength={3} maxLength={2000} placeholder="e.g. 1 bed, 1 cupboard, fridge, 6 boxes / खाट, दराज, फ्रिज, बाकस…" /></Field>
      <Field label="Photos (optional, 3 maximum; JPEG/PNG/WebP, 1 MB each)"><Input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={event => { const next = Array.from(event.target.files ?? []); if (next.length > 3 || next.some(f => f.size > 1024 * 1024 || !['image/jpeg', 'image/png', 'image/webp'].includes(f.type))) { setError('Choose up to 3 JPEG/PNG/WebP photos, at most 1 MB each.'); event.target.value = ''; setPhotos([]); } else { setPhotos(next); setError(''); } }} /></Field>
      {photos.length > 0 && <p className="text-sm text-slate-500">{photos.map(p => p.name).join(', ')}</p>}
      <h2 className="flex items-center gap-2 text-lg font-semibold"><Truck className="h-5 w-5 text-red-600" /> Service / चाहिएको सेवा</h2>
      <Choice name="service" label="Service type *" defaultValue="BOTH" options={[["BOTH", "Vehicle + workers / गाडी + कामदार"], ["VEHICLE", "Vehicle only / गाडी मात्र"], ["LABOUR", "Workers only / कामदार मात्र"]]} />
      <div className="grid gap-3 sm:grid-cols-3"><Check name="PACKING">Packing / प्याकिङ</Check><Check name="UNPACKING">Unpacking / सामान खोल्ने</Check><Check name="FURNITURE">Furniture disassembly / assembly</Check></div>
      <Field label="Contact phone / सम्पर्क नम्बर *"><Input name="phone" type="tel" required pattern="\+?[0-9][0-9 \-]{6,19}" maxLength={21} placeholder="98XXXXXXXX" /></Field>
      <Field label="Special instructions / थप जानकारी"><Textarea name="notes" maxLength={1000} placeholder="Fragile items, narrow stairs, parking restrictions…" /></Field>
      <p className="text-xs text-slate-500">Your addresses, phone and photos are visible only to you and RoomKhoj admins. There is no online payment in this first version.</p>
      <Button type="submit" className="w-full sm:w-auto"><Package className="mr-2 h-4 w-4" />{busy ? 'Sending…' : 'Request a quote / मूल्य माग्नुहोस्'}</Button>
    </fieldset>
    {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
  </form>;
}
