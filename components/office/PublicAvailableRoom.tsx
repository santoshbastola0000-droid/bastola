"use client";

import { useEffect, useState } from "react";
import { api } from "@/http/api/api";
import { officeError } from "@/http/services/office.service";
import { AvailabilityCard, type AvailableRoom } from "./RoomAvailability";

export function PublicAvailableRoom({ code }: { code: string }) {
  const [room, setRoom] = useState<AvailableRoom | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const normalized = code.trim().toUpperCase();
  useEffect(() => {
    let alive = true;
    setLoading(true); setError(""); setRoom(null);
    if (!/^RK-\d{6}$/.test(normalized)) { setLoading(false); return; }
    api.get("/office/availability", { params: { q: normalized, page: 0 } })
      .then(response => {
        if (!alive) return;
        const payload = response.data?.data ?? response.data;
        const items: AvailableRoom[] = Array.isArray(payload?.rooms) ? payload.rooms : Array.isArray(payload) ? payload : [];
        setRoom(items.find(item => item.code?.toUpperCase() === normalized && item.status?.toUpperCase() === "AVAILABLE") ?? null);
      })
      .catch(cause => { if (alive) setError(officeError(cause)); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [normalized, retry]);
  if (loading) return <p role="status">Loading room…</p>;
  if (error) return <div role="alert" className="space-y-3 rounded-xl border border-red-200 bg-white p-5"><p>Room load भएन: {error}</p><button type="button" onClick={() => setRetry(value => value + 1)} className="rounded-lg border px-4 py-2">Retry</button></div>;
  if (!room) return <p className="rounded-xl border bg-white p-5">यो room अहिले available छैन वा link मिलेन। अर्को room हेर्नुहोस्।</p>;
  return <AvailabilityCard key={room.id} room={room} />;
}
