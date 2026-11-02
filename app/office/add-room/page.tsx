import { Suspense } from 'react';
import { OfficeDashboard } from '@/components/office/OfficeDashboard';

export const metadata = { title: 'Add Room | RoomKhoj', robots: { index: false, follow: false } };

export default function Page() {
  return <main className="mx-auto max-w-7xl p-3 sm:p-6"><Suspense fallback={<p>Checking staff access…</p>}><OfficeDashboard addRoomOnOpen/></Suspense></main>;
}
