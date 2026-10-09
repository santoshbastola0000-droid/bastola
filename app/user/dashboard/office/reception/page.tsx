import { Suspense } from 'react';
import { OfficeDashboard } from '@/components/office/OfficeDashboard';
export default function Page() { return <Suspense fallback={<p>Loading reception…</p>}><OfficeDashboard/></Suspense>; }
