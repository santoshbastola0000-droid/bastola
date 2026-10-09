import type { Metadata } from 'next';
import { SharedRoom } from '@/components/office/SharedRoom';
export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Shared room | RoomKhoj', robots: { index:false,follow:false,noarchive:true },referrer:'no-referrer' };
export default async function Page({ params }: { params: Promise<{ token: string }> }) { const { token }=await params;return <SharedRoom token={token}/>; }
