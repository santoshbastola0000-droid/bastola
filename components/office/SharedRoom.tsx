"use client";

import { FormEvent, useEffect, useState } from "react";
import { PublicRoomDetails } from "@/components/office/PublicRoomDetails";
import {
  officeService,
  officeBackend,
  officeError,
  type SharedOfficeRoom,
} from "@/http/services/office.service";

export function SharedRoom({ token }: { token: string }) {
  const [room, setRoom] = useState<SharedOfficeRoom | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", message: "" });

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError("");
    officeService.shared(token)
      .then(result => { if (alive) setRoom(result); })
      .catch(err => { if (alive) setError(officeError(err)); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [token]);

  const alreadyRented = room?.status === "RENTED";
  const unavailable = !!room && (room.status !== "AVAILABLE" || !!room.availabilityExpired);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (unavailable || !room) return;
    setBusy(true);
    setError("");
    try {
      await officeService.request(token, form);
      setNotice("Request received. Reception will contact you.");
    } catch (err) {
      setError(officeError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 px-3 py-8 text-slate-900">
      <div className="mx-auto max-w-3xl space-y-5">
        <div>
          <p className="text-sm font-semibold text-emerald-700">RoomKhoj · Office</p>
          <h1 className="text-2xl font-bold">Your shared room</h1>
        </div>
        {loading ? (
          <p>Loading room…</p>
        ) : !room ? (
          <div className="space-y-3 rounded-xl bg-white p-8">
            <p role="alert" className="font-semibold text-slate-800">
              This private link is expired, revoked or unavailable.
            </p>
            <p className="text-sm text-slate-600">Ask Reception to share a new link, or browse currently available rooms.</p>
            <a href="/rooms" className="inline-block rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white">
              Find available rooms
            </a>
          </div>
        ) : (
          <>
            {unavailable && (
              <section role="status" className="space-y-2 rounded-xl border border-amber-200 bg-amber-50 p-5">
                <h2 className="text-lg font-bold text-amber-900">
                  {alreadyRented ? "Already Rented · यो कोठा भाडामा गइसकेको छ" : "Room availability needs confirmation"}
                </h2>
                <p className="text-sm text-slate-700">
                  {alreadyRented
                    ? "यो कोठा अब उपलब्ध छैन। पुरानो link मा विवरण हेर्न मिल्छ, तर यो कोठाको नयाँ request गर्न मिल्दैन।"
                    : "यो कोठा हाल उपलब्ध छ कि छैन Reception ले पुष्टि गर्न बाँकी छ।"}
                </p>
                <a href="/rooms" className="inline-block rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white">
                  View other available rooms
                </a>
              </section>
            )}
            <article className="overflow-hidden rounded-2xl border bg-white shadow-sm">
              <video
                data-video-intent="room"
                controls
                playsInline
                preload="none"
                className="aspect-video w-full bg-black"
                src={`${officeBackend}/office/shared/${encodeURIComponent(token)}/video`}
                onError={() => setError("Video is unavailable. Contact Reception for more information.")}
              />
              <div className="space-y-3 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <h2 className="text-2xl font-bold">{room.title}</h2>
                  <span className="rounded-lg bg-emerald-50 p-2 font-mono font-bold">{room.code}</span>
                </div>
                <p>📍 {room.location} · रु {Number(room.price).toLocaleString()}/month</p>
                <details className="rounded-xl border border-slate-200 bg-white">
                  <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-blue-700">
                    📋 View room details
                  </summary>
                  <div className="border-t border-slate-100 p-2">
                    <PublicRoomDetails room={room} />
                  </div>
                </details>
                {room.tiktokUrl && (
                  <a
                    className="inline-block text-blue-700 underline"
                    target="_blank"
                    rel="noopener noreferrer"
                    href={room.tiktokUrl}
                  >
                    Open TikTok ↗
                  </a>
                )}
              </div>
            </article>
            {!unavailable && (
              <form onSubmit={submit} className="space-y-4 rounded-2xl bg-white p-5">
                <h2 className="text-xl font-semibold">Request this room</h2>
                {notice ? (
                  <p role="status" className="text-emerald-700">{notice}</p>
                ) : (
                  <>
                    <label className="block text-sm">
                      Your name
                      <input
                        required
                        maxLength={180}
                        className="mt-1 w-full rounded-lg border p-3"
                        value={form.name}
                        onChange={event => setForm({ ...form, name: event.target.value })}
                      />
                    </label>
                    <label className="block text-sm">
                      Phone number
                      <input
                        type="tel"
                        required
                        maxLength={30}
                        className="mt-1 w-full rounded-lg border p-3"
                        value={form.phone}
                        onChange={event => setForm({ ...form, phone: event.target.value })}
                      />
                    </label>
                    <label className="block text-sm">
                      Message / preferred visit time
                      <textarea
                        maxLength={5000}
                        className="mt-1 w-full rounded-lg border p-3"
                        rows={3}
                        value={form.message}
                        onChange={event => setForm({ ...form, message: event.target.value })}
                      />
                    </label>
                    <button disabled={busy} className="rounded-lg bg-emerald-700 px-5 py-3 text-white disabled:opacity-50">
                      {busy ? "Sending…" : "Send room request"}
                    </button>
                  </>
                )}
              </form>
            )}
          </>
        )}
        {error && <p role="alert" className="rounded-lg bg-red-50 p-4 text-red-700">{error}</p>}
      </div>
    </main>
  );
}
