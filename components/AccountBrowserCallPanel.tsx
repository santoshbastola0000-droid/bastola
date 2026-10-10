"use client";

import { useState } from "react";
import { useAccountBrowserCall } from "@/components/useAccountBrowserCall";

export function AccountBrowserCallPanel({ admin = false }: { admin?: boolean }) {
  const { status, incoming, callId, call, accept, reject, hangup, audio } = useAccountBrowserCall();
  const [phone, setPhone] = useState("");
  if (!admin && !incoming && !callId) return null;
  return <section className="rounded-xl border bg-background p-4 space-y-3">
    <h2 className="text-lg font-semibold">RoomKhoj Website Calling</h2>
    <p role="status" className="text-sm">{status}</p>
    {admin && <div className="flex flex-wrap gap-2">
      <input aria-label="RoomKhoj account phone number" type="tel" placeholder="RoomKhoj account phone number" value={phone} onChange={e => setPhone(e.target.value)} className="min-w-0 flex-1 rounded-md border p-2" />
      <button className="rounded bg-blue-700 px-4 py-2 text-white disabled:opacity-50" disabled={!/^\+?\d{10,15}$/.test(phone.replace(/\s/g, "")) || Boolean(callId)} onClick={() => call(phone)}>Call ON</button>
    </div>}
    {incoming && <div role="alert" className="rounded-lg border p-3 space-y-3">
      <p className="font-semibold">Incoming RoomKhoj call</p>
      <div className="flex gap-2"><button className="rounded bg-green-700 px-4 py-2 text-white" onClick={() => void accept()}>Accept</button><button className="rounded bg-red-700 px-4 py-2 text-white" onClick={reject}>Reject</button></div>
    </div>}
    {callId && !incoming && <button className="rounded bg-red-700 px-4 py-2 text-white" onClick={hangup}>End Call</button>}
    <audio ref={audio} controls autoPlay playsInline className="w-full" aria-label="Call audio" />
    <p className="text-xs text-muted-foreground">Both users must be logged in with RoomKhoj open. This is browser audio, not a SIM call.</p>
  </section>;
}
