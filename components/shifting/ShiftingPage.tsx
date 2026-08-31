"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Truck } from 'lucide-react';
import { useUserStore } from '@/stores/user-store';
import { UserRole } from '@/types/user.types';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ShiftingForm } from './ShiftingForm';
import { ShiftingBookings } from './ShiftingBookings';

export default function ShiftingPage({ admin = false }: { admin?: boolean }) {
  const user = useUserStore(state => state.user);
  const [mounted, setMounted] = useState(false), [tab, setTab] = useState('request'), [refresh, setRefresh] = useState(0), [success, setSuccess] = useState('');
  useEffect(() => setMounted(true), []);
  return <main className="mx-auto max-w-5xl space-y-6 px-4 py-6 pb-28 text-slate-900 sm:px-6 md:pb-8"><header className="flex items-start gap-3"><div className="rounded-2xl bg-red-50 p-3 text-red-600"><Truck className="h-7 w-7" /></div><div><h1 className="text-2xl font-bold">{admin ? 'Manage Room Shifting' : 'Room Shifting / कोठा सार्ने सेवा'}</h1><p className="mt-1 text-sm text-slate-500">{admin ? 'Review requests, confirm availability and send a total quote.' : 'Plan your Pokhara move. Ask for a quote, then choose whether to book.'}</p></div></header>
    {!mounted ? <p>Loading…</p> : !user ? <div className="space-y-4 rounded-2xl border p-6"><p>Sign in to request a move and track your bookings / बुकिङ गर्न लगइन गर्नुहोस्।</p><Button asChild><Link href="/auth/login?redirect=%2Froom-shifting">Sign in / लगइन</Link></Button></div> : admin && user.role !== UserRole.ADMIN ? <p role="alert">Admin access required.</p> : admin ? <ShiftingBookings key={user.id} admin /> : <>
      {success && <p role="status" className="rounded-xl bg-green-50 p-4 text-sm text-green-800">{success}</p>}
      <Tabs value={tab} onValueChange={setTab}><TabsList className="mb-5"><TabsTrigger value="request">New request / नयाँ अनुरोध</TabsTrigger><TabsTrigger value="bookings">My bookings / मेरा बुकिङ</TabsTrigger></TabsList><TabsContent value="request"><ShiftingForm key={user.id} onCreated={row => { setSuccess(`Request #${row.id.slice(0, 8).toUpperCase()} received. Booking is not confirmed yet; check My bookings for your quote.`); setRefresh(n => n + 1); setTab('bookings'); }} /></TabsContent><TabsContent value="bookings"><ShiftingBookings key={user.id} refreshKey={refresh} /></TabsContent></Tabs>
    </>}
  </main>;
}
