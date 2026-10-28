import Link from "next/link";
import { PublicAvailableRoom } from "@/components/office/PublicAvailableRoom";

export const metadata = {
  title: "Shared room | RoomKhoj",
  description: "View this RoomKhoj room, its video, rent and details.",
};

export default async function SharedAvailableRoomPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return <main className="min-h-screen bg-slate-50 px-3 py-8 text-slate-900">
    <div className="mx-auto max-w-2xl space-y-5">
      <Link href="/" className="text-xl font-bold">RoomKhoj</Link>
      <h1 className="text-2xl font-bold">Shared room · {code}</h1>
      <PublicAvailableRoom code={code} />
      <Link href="/rooms" className="inline-block rounded-xl border bg-white px-4 py-3 text-sm font-semibold">Browse more rooms →</Link>
    </div>
  </main>;
}
