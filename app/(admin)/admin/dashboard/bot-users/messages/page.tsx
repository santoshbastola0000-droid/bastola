import Link from "next/link";
import { BotInbox } from "@/components/admin/BotInbox";

export default function BotMessagesPage() {
  return <main className="space-y-5 p-4 md:p-6">
    <Link href="/admin/dashboard/bot-users" className="text-sm text-muted-foreground hover:underline">← Bot Users</Link>
    <div><h1 className="text-2xl font-bold">Bot Messages</h1><p className="mt-1 text-sm text-muted-foreground">सबै bot लाई आएका messages र admin replies एकै ठाउँमा।</p></div>
    <BotInbox />
  </main>;
}
