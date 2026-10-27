"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Home, Loader2, LogIn, PlusCircle } from "lucide-react";
import { officeService, officeError, OfficeRoom } from "@/http/services/office.service";
import { blankMatch, MatchingFields } from "@/components/office/MatchingFields";

const field = "mt-1 w-full rounded-lg border border-slate-200 bg-white p-3 text-slate-900";
const button = "inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-3 font-semibold text-white hover:bg-emerald-700 disabled:opacity-50";
const blankRoom = { title: "", location: "", price: "", details: "", ownerName: "", ownerPhone: "", tiktokUrl: "" };

export default function StaffRoomAdPage() {
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [draft, setDraft] = useState(blankRoom);
  const [matchDraft, setMatchDraft] = useState(blankMatch);
  const [exactAddress, setExactAddress] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [video, setVideo] = useState<File | null>(null);
  const [rooms, setRooms] = useState<OfficeRoom[]>([]);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const reloadAvailable = useCallback(async () => {
    const result = await officeService.rooms("", "AVAILABLE", 0);
    setRooms(result.rooms || []);
  }, []);

  useEffect(() => {
    let alive = true;
    officeService.access().then(async access => {
      if (!alive) return;
      setAllowed(Boolean(access.allowed));
      if (access.allowed) {
        try {
          const result = await officeService.rooms("", "AVAILABLE", 0);
          if (alive) setRooms(result.rooms || []);
        } catch (e) {
          if (alive) setError(officeError(e));
        }
      }
    }).catch(e => {
      if (alive) {
        setAllowed(false);
        setError(officeError(e));
      }
    });
    return () => { alive = false; };
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      if (video && video.size > 150 * 1024 * 1024) throw new Error("Video must be 150 MB or smaller.");
      const matchProfile = {
        city: matchDraft.city,
        area: matchDraft.area,
        roomType: matchDraft.roomType,
        capacity: matchDraft.capacity.trim() === "" ? undefined : Number(matchDraft.capacity),
        facilities: matchDraft.facilities,
        occupancy: matchDraft.occupancy,
        parkingVehicles: matchDraft.parkingVehicles,
        exactAddress,
        latitude: latitude.trim() === "" ? null : Number(latitude),
        longitude: longitude.trim() === "" ? null : Number(longitude),
      };
      const data = new FormData();
      Object.entries(draft).forEach(([key, value]) => data.append(key, value));
      if (video) data.append("video", video);
      data.append("matchProfile", JSON.stringify(matchProfile));
      const saved = await officeService.create(data, setProgress);
      await reloadAvailable();
      setDraft(blankRoom);
      setMatchDraft(blankMatch);
      setExactAddress("");
      setLatitude("");
      setLongitude("");
      setVideo(null);
      const fileInput = document.getElementById("staff-room-video") as HTMLInputElement | null;
      if (fileInput) fileInput.value = "";
      setNotice(`Room ${saved.code} saved successfully and added to Available Rooms.`);
    } catch (e) {
      setError(officeError(e));
    } finally {
      setBusy(false);
      setProgress(0);
    }
  }

  if (allowed === null) {
    return <main className="flex min-h-[70vh] items-center justify-center p-6"><p className="flex items-center gap-2 text-slate-600"><Loader2 className="h-5 w-5 animate-spin" />Checking staff access…</p></main>;
  }

  if (!allowed) {
    return <main className="mx-auto max-w-xl space-y-4 p-5 sm:p-8">
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
        <h1 className="text-xl font-bold text-slate-900">Staff Room Ad Form</h1>
        <p className="mt-2 text-sm text-slate-700">Please log in with your RoomKhoj staff account. If you are already logged in, ask an admin to enable your Office access.</p>
        {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
        <Link className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 font-semibold text-white" href="/auth/login"><LogIn className="h-4 w-4" />Log in</Link>
      </div>
    </main>;
  }

  return <main className="mx-auto max-w-5xl space-y-6 p-4 pb-12 sm:p-7">
    <header className="rounded-2xl bg-gradient-to-r from-emerald-700 to-teal-600 p-5 text-white sm:p-7">
      <div className="flex items-center gap-3"><div className="rounded-xl bg-white/15 p-3"><Home className="h-7 w-7" /></div><div><p className="text-sm text-emerald-50">RoomKhoj · Staff workspace</p><h1 className="text-2xl font-bold sm:text-3xl">Add a Room Ad</h1></div></div>
      <p className="mt-3 max-w-2xl text-sm text-emerald-50">Enter the room information and save it. The room will be added to the Available Rooms list automatically. Unknown fields can be left blank and filled later.</p>
    </header>

    {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    {notice && <p role="status" className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-emerald-800"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />{notice}</p>}

    <form onSubmit={submit} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <div><h2 className="text-lg font-bold text-slate-900">Room information</h2><p className="text-sm text-slate-500">All fields are optional. The room code is generated automatically.</p></div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium text-slate-700">Room title<input maxLength={180} className={field} placeholder="Single room, flat…" value={draft.title} onChange={e=>setDraft({...draft,title:e.target.value})} /></label>
        <label className="text-sm font-medium text-slate-700">Area / public location<input maxLength={300} className={field} placeholder="Lakeside, Mahendrapul…" value={draft.location} onChange={e=>setDraft({...draft,location:e.target.value})} /></label>
        <label className="text-sm font-medium text-slate-700">Monthly rent (NPR)<input type="number" min={0} step="0.01" className={field} placeholder="Leave blank if unknown" value={draft.price} onChange={e=>setDraft({...draft,price:e.target.value})} /></label>
        <label className="text-sm font-medium text-slate-700">Owner name<input maxLength={180} className={field} value={draft.ownerName} onChange={e=>setDraft({...draft,ownerName:e.target.value})} /></label>
        <label className="text-sm font-medium text-slate-700">Owner phone (optional)<input type="tel" maxLength={30} className={field} value={draft.ownerPhone} onChange={e=>setDraft({...draft,ownerPhone:e.target.value})} /></label>
        <label className="text-sm font-medium text-slate-700">TikTok link (optional)<input type="url" maxLength={1000} className={field} placeholder="https://www.tiktok.com/…" value={draft.tiktokUrl} onChange={e=>setDraft({...draft,tiktokUrl:e.target.value})} /></label>
      </div>

      <MatchingFields value={matchDraft} onChange={setMatchDraft} />

      <fieldset className="space-y-3 rounded-xl border border-blue-200 bg-blue-50/40 p-4">
        <legend className="px-1 text-sm font-semibold text-slate-800">Exact location (optional)</legend>
        <label className="block text-sm font-medium text-slate-700">Exact address / landmark<input maxLength={300} className={field} value={exactAddress} onChange={e=>setExactAddress(e.target.value)} placeholder="For staff records; do not put private details in public location." /></label>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="text-sm font-medium text-slate-700">Latitude<input type="number" step="any" min={-90} max={90} className={field} value={latitude} onChange={e=>setLatitude(e.target.value)} placeholder="Optional" /></label>
          <label className="text-sm font-medium text-slate-700">Longitude<input type="number" step="any" min={-180} max={180} className={field} value={longitude} onChange={e=>setLongitude(e.target.value)} placeholder="Optional" /></label>
        </div>
        <button type="button" className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold" onClick={()=>{if(!navigator.geolocation){setError("GPS is not available in this browser.");return;}navigator.geolocation.getCurrentPosition(p=>{setLatitude(String(p.coords.latitude));setLongitude(String(p.coords.longitude));setError("");},()=>setError("Location permission denied or unavailable."));}}>📍 Use current GPS</button>
      </fieldset>

      <label className="block text-sm font-medium text-slate-700">Room details / facilities notes<textarea maxLength={5000} rows={4} className={field} value={draft.details} onChange={e=>setDraft({...draft,details:e.target.value})} placeholder="Water, electricity, rules, nearby facilities…" /></label>
      <label className="block text-sm font-medium text-slate-700">Room video (optional · MP4/MOV · max 150 MB)<input id="staff-room-video" type="file" accept="video/mp4,video/quicktime,.mp4,.mov" className={field} onChange={e=>setVideo(e.target.files?.[0] || null)} /><span className="mt-1 block text-xs text-slate-500">The uploaded video is stored privately for the office.</span></label>

      <button type="submit" disabled={busy} className={button}>{busy ? <><Loader2 className="h-5 w-5 animate-spin" />Saving… {progress}%</> : <><PlusCircle className="h-5 w-5" />Save to Available Rooms</>}</button>
    </form>

    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3"><h2 className="text-lg font-bold text-slate-900">Recently available rooms</h2><button type="button" onClick={()=>void reloadAvailable().catch(e=>setError(officeError(e)))} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700">Refresh</button></div>
      {rooms.length===0 ? <p className="rounded-xl border border-dashed p-5 text-sm text-slate-500">No available rooms found yet.</p> : <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{rooms.slice(0,12).map(room=><article key={room.id} className="rounded-xl border border-emerald-100 bg-white p-4 shadow-sm"><div className="flex items-start justify-between gap-2"><h3 className="font-semibold text-slate-900">{room.title || "Untitled room"}</h3><span className="shrink-0 rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-800">Available</span></div><p className="mt-1 text-sm text-slate-600">{room.location || "Location not specified"}</p><p className="mt-2 font-bold text-blue-700">Rs. {Number(room.price || 0).toLocaleString("en-US")} / month</p><p className="mt-1 text-xs text-slate-500">Code: {room.code}</p></article>)}</div>}
    </section>
  </main>;
}
