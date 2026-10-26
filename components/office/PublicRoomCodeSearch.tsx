"use client";

import { useEffect, useState } from "react";
import { api } from "@/http/api/api";
import { officeBackend, officeError } from "@/http/services/office.service";
import { type AvailableRoom } from "./RoomAvailability";
import { PublicRoomDetails } from "./PublicRoomDetails";

function unwrap<T>(value: { data: T | { data: T } }): T {
  const payload = value.data;
  return payload && typeof payload === "object" && "data" in payload ? (payload as { data: T }).data : payload as T;
}

/** Reception room codes are separate from public listing IDs. Only available rooms are searchable. */
export function receptionCode(value: string): string | null {
  const input = value.trim();
  const match = /^(?:RK-?)?(\d{1,6})$/i.exec(input);
  return match ? "RK-" + match[1].padStart(6, "0") : null;
}

export function PublicRoomCodeSearch({ query }: { query: string }) {
  const code = receptionCode(query);
  const [room, setRoom] = useState<AvailableRoom | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!code) { setRoom(null); setError(""); setLoading(false); return; }
    let cancelled = false;
    setRoom(null); setError(""); setLoading(true);
    api.get("/office/availability", { params: { q: code, page: 0 } })
      .then(response => {
        if (cancelled) return;
        const payload = unwrap<{ rooms: AvailableRoom[] }>(response);
        const match = Array.isArray(payload?.rooms)
          ? payload.rooms.find(item => item.code?.toUpperCase() === code && item.status === "AVAILABLE")
          : null;
        setRoom(match || null);
      })
      .catch(cause => { if (!cancelled) setError(officeError(cause)); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [code]);

  if (!code) return null;
  return <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
    <h2 className="mb-3 text-lg font-bold text-slate-950">Reception room · {code}</h2>
    {loading && <p role="status" className="text-sm text-slate-500">Finding room…</p>}
    {error && <p role="alert" className="text-sm text-red-700">Room खोज्न सकिएन: {error}</p>}
    {!loading && !error && !room && <p className="text-sm text-slate-500">यो code को available room भेटिएन।</p>}
    {room && <div className="space-y-3 text-slate-900">
      <video controls playsInline preload="none" className="aspect-video w-full rounded-xl bg-slate-950"
        src={officeBackend + "/office/availability/" + encodeURIComponent(room.id) + "/video"} />
      <h3 className="font-bold">{room.title}</h3>
      <p>📍 {room.location} · रु {Number(room.price).toLocaleString("en-NP")}/month</p>
      <PublicRoomDetails room={room}/>
      {room.tiktokUrl && <a className="text-sm text-blue-700 underline" href={room.tiktokUrl} target="_blank" rel="noopener noreferrer">Watch room video ↗</a>}
      
    </div>}
  </section>;
}
