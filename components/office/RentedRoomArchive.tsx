"use client";

import { FormEvent, useEffect, useState } from "react";
import { officeError, officeService } from "@/http/services/office.service";
import type { OfficeRental, OfficeRoom } from "@/http/services/office.service";
import { PhoneReveal } from "./PhoneReveal";

function dateLabel(value?: string | null) {
  if (!value) return "Not recorded";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Not recorded" : date.toLocaleString("en-NP");
}

function RentedArchiveDetails({ room, onClose }: { room: OfficeRoom; onClose: () => void }) {
  const [rentals, setRentals] = useState<OfficeRental[]>([]);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    setPage(0);
    setRentals([]);
    setLoading(true);
    setError("");
    officeService.rentals(room.id, 0)
      .then(result => {
        if (!alive) return;
        setRentals(result.rentals);
        setTotal(result.total);
      })
      .catch(err => { if (alive) setError(officeError(err)); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [room.id]);

  async function more() {
    setLoading(true);
    setError("");
    try {
      const result = await officeService.rentals(room.id, page + 1);
      setRentals(current => [...current, ...result.rentals]);
      setTotal(result.total);
      setPage(current => current + 1);
    } catch (err) {
      setError(officeError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex justify-end bg-slate-950/50" onClick={onClose}>
      <section
        role="dialog"
        aria-modal="true"
        aria-label="Previous rental records"
        onClick={event => event.stopPropagation()}
        className="h-full w-full max-w-lg space-y-3 overflow-y-auto bg-white p-4 shadow-2xl"
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b bg-white pb-3">
          <div>
            <h3 className="text-lg font-bold">{room.code} · {room.title}</h3>
            <p className="text-xs text-slate-500">{room.location} · Current status: {room.status}</p>
          </div>
          <button type="button" className="rounded-lg border px-3 py-2 text-sm" onClick={onClose}>Close ×</button>
        </div>
        <p className="text-sm font-semibold">Recorded rentals: {total}</p>
        {room.rentalHistoryIncomplete && <p className="text-xs text-amber-700">Rental tracking started after this room was created; earlier counts may be incomplete.</p>}
        {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-red-700">{error}</p>}
        {rentals.map(rental => (
          <article key={rental.id} className="space-y-1 rounded-xl border p-3 text-sm">
            <p className="font-semibold">Rental #{rental.number} · {rental.clientName || "Tenant not recorded"}</p>
            {rental.clientPhone && <PhoneReveal phone={rental.clientPhone} label="Tenant phone" />}
            <p>Moved in: {dateLabel(rental.startedAt)}</p>
            <p>{rental.endedAt ? "Ended: " + dateLabel(rental.endedAt) : "End date not recorded"}</p>
            <p className="text-xs text-slate-500">Handled by: {rental.staffName || "Not recorded"}</p>
          </article>
        ))}
        {loading && <p role="status" className="text-sm text-slate-500">Loading records…</p>}
        {!loading && !error && rentals.length === 0 && <p className="text-sm text-slate-500">No rental records found.</p>}
        {rentals.length < total && <button type="button" disabled={loading} onClick={() => void more()} className="w-full rounded-lg border px-3 py-2 text-sm disabled:opacity-50">Load more rental records</button>}
        {error && rentals.length === 0 && <button type="button" className="rounded-lg border px-3 py-2 text-sm" onClick={() => void more()}>Retry</button>}
      </section>
    </div>
  );
}

export function RentedRoomArchive() {
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rooms, setRooms] = useState<OfficeRoom[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<OfficeRoom | null>(null);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError("");
    officeService.rooms(search, "ALL", page)
      .then(result => {
        if (!alive) return;
        setRooms(result.rooms);
        setTotal(result.total);
      })
      .catch(err => { if (alive) setError(officeError(err)); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [page, search, revision]);

  const historicalRooms = rooms.filter(room => Number(room.rentalCount || 0) > 0);
  const totalPages = Math.max(1, Math.ceil(total / 24));

  function submit(event: FormEvent) {
    event.preventDefault();
    setSearch(query.trim());
    setPage(0);
  }

  return (
    <section className="space-y-4" aria-label="Previously rented room archive">
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
        <h2 className="text-lg font-bold text-slate-900">Previously Rented Rooms</h2>
        <p className="text-sm text-slate-600">
          Rooms with saved rental records appear here even after they become Available again.
          This is a read-only archive; it will not change a room's availability.
        </p>
      </div>
      <form onSubmit={submit} className="flex flex-wrap gap-2">
        <input
          aria-label="Search old rented rooms"
          placeholder="Room code, location, owner or client…"
          className="min-w-0 flex-1 rounded-lg border bg-white p-3 text-sm"
          value={query}
          onChange={event => setQuery(event.target.value)}
        />
        <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white">Search</button>
        <button type="button" className="rounded-lg border bg-white px-4 py-2 text-sm" onClick={() => setRevision(value => value + 1)}>Refresh</button>
      </form>
      {error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-700">{error}</p>}
      {loading ? <p role="status" className="text-slate-500">Loading room archive…</p> :
        historicalRooms.length ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {historicalRooms.map(room => (
              <article key={room.id} className="space-y-2 rounded-xl border bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-mono text-xs text-blue-700">{room.code}</p>
                    <h3 className="font-bold">{room.title}</h3>
                  </div>
                  <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-800">Rented before</span>
                </div>
                <p className="text-sm text-slate-600">{room.location}</p>
                <p className="text-sm">Rs. {Number(room.price || 0).toLocaleString("en-NP")} / month</p>
                <p className="text-sm">Currently: <b>{room.status}</b></p>
                <p className="text-sm">Recorded times rented: <b>{room.rentalCount}</b></p>
                <button type="button" className="w-full rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-800" onClick={() => setSelected(room)}>View old tenants & dates</button>
              </article>
            ))}
          </div>
        ) : !error ? (
          <p className="rounded-xl border bg-white p-5 text-sm text-slate-500">
            No rooms with recorded rentals on this page. Check the next page for older rooms.
          </p>
        ) : null}
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button type="button" disabled={page === 0 || loading} onClick={() => setPage(current => Math.max(0, current - 1))} className="rounded-lg border bg-white px-3 py-2 text-sm disabled:opacity-40">← Previous</button>
        <span className="text-sm text-slate-600">Room page {page + 1} / {totalPages}</span>
        <button type="button" disabled={loading || page + 1 >= totalPages} onClick={() => setPage(current => current + 1)} className="rounded-lg border bg-white px-3 py-2 text-sm disabled:opacity-40">Next →</button>
      </div>
      <p className="text-center text-xs text-slate-500">Page navigation scans 24 rooms at a time; the archive includes only rentals actually saved in the system.</p>
      {selected && <RentedArchiveDetails room={selected} onClose={() => setSelected(null)} />}
    </section>
  );
}
