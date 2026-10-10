"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { io, type Socket } from "socket.io-client";
import useTokenStore from "@/store";
import { AiOwnerUserSelector } from "@/components/AiOwnerUserSelector";
import { AiOwnerDraftReview } from "@/components/AiOwnerDraftReview";

type CallState = "idle" | "calling" | "complete" | "failed";
type CallResult = { id?: string; status?: string; message?: string };
const API = (process.env.NEXT_PUBLIC_BACKEND_URL || "https://api.roomkhoj.com").replace(/\/$/, "");

export default function OwnerCallingPage() {
  const token = useTokenStore(s => s.token);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [browserStatus, setBrowserStatus] = useState("");
  const [websiteCallId, setWebsiteCallId] = useState("");
  const websiteSocket = useRef<Socket | null>(null);
  const [websiteCalling, setWebsiteCalling] = useState(false);
  useEffect(() => () => { websiteSocket.current?.disconnect(); websiteSocket.current = null; }, []);
  const [phone, setPhone] = useState("+977");
  const [ownerName, setOwnerName] = useState("");
  const [location, setLocation] = useState("");
  const [rent, setRent] = useState("");
  const [roomType, setRoomType] = useState("");
  const [notes, setNotes] = useState("");
  const [consent, setConsent] = useState(false);
  const [state, setState] = useState<CallState>("idle");
  const [error, setError] = useState("");
  const [result, setResult] = useState<CallResult | null>(null);
  const [simulation, setSimulation] = useState(true);
  const normalized = phone.trim();
  const valid = /^\+?[1-9]\d{7,14}$/.test(normalized);

  function endWebsiteAiCall() {
    if (websiteCallId) websiteSocket.current?.emit("ai-owner:end", {callId:websiteCallId});
    websiteSocket.current?.disconnect();
    websiteSocket.current = null;
    setWebsiteCallId(""); setWebsiteCalling(false);
    setBrowserStatus("Call ended by admin");
  }

  function startWebsiteAiCall() {
    if (!token || !selectedUserId || websiteCalling) return;
    websiteSocket.current?.disconnect();
    const socket = io(API + "/messages", {
      auth: { token }, transports: ["polling", "websocket"], withCredentials: true,
    });
    websiteSocket.current=socket;
    setWebsiteCalling(true);
    setBrowserStatus("Connecting to RoomKhoj…");
    socket.once("connect", () => {
      socket.timeout(12000).emit("ai-owner:call",
        {targetUserId:selectedUserId,consentConfirmed:true},
        (error: Error | null, response: {success?:boolean;error?:string;callId?:string}) => {
          if (error || !response?.success || !response.callId) {
            setBrowserStatus(response?.error || "Calling unavailable");
            setWebsiteCalling(false); socket.disconnect(); return;
          }
          setWebsiteCallId(response.callId);
          setBrowserStatus("Ringing user's RoomKhoj account…");
        });
    });
    socket.on("ai-owner:status",(event:{callId?:string;status?:string})=>{
      if (!event?.status) return;
      setBrowserStatus("Website AI call: " + event.status);
      if (["ended","declined","no-answer","failed"].includes(event.status)) {
        setWebsiteCallId(""); setWebsiteCalling(false); socket.disconnect();
      }
    });
    socket.on("connect_error", () => {
      setBrowserStatus("Calling server unavailable");
      setWebsiteCalling(false); socket.disconnect();
    });
  }

  async function startCall() {
    if (!valid || !consent || state === "calling") return;
    setError(""); setResult(null); setState("calling");
    try {
      if (simulation) {
        setResult({status:"simulated",message:"No actual call placed. SIP/VoIP live mode requires provider configuration."});
        setState("complete");
        return;
      }
      // The backend owns gateway credentials, provider routing and authorization.
      const response = await fetch(`${API}/admin/owner-voice/calls`, {
        method:"POST", credentials:"include",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({to:normalized,consentConfirmed:true,owner:{name:ownerName.trim(),location:location.trim(),rent:rent.trim(),roomType:roomType.trim(),notes:notes.trim()}})
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.message || "Calling service unavailable");
      setResult(payload.data || payload);
      setState("complete");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start call");
      setState("failed");
    }
  }

  return <main className="mx-auto max-w-3xl space-y-6 p-4 md:p-8">
    <header><h1 className="text-2xl font-bold">AI Owner Calling</h1>
      <p className="text-sm text-muted-foreground">Connect a supported SIP/VoIP provider through the VPS voice bridge. Provider credentials must remain server-side.</p></header>
    <AiOwnerUserSelector onSelect={user => { setOwnerName(user.name); setPhone(user.phone || ""); setSelectedUserId(user.id); setError(""); setResult(null); }} />
    <section className="rounded-xl border p-5 space-y-3">
      <h2 className="font-semibold">Website AI Voice Call (Beta)</h2>
      <p className="text-sm">Select an online registered user above. The user must first enable AI calling in their privacy settings, remain logged in, and accept the incoming call. Continuous Nepali voice uses WebRTC.</p>
      <p className="text-sm">Calls are permitted only when the selected user's recorded opt-in is active.</p>
      <button disabled={!selectedUserId || websiteCalling} onClick={() => startWebsiteAiCall()} className="rounded-lg bg-green-700 px-5 py-3 text-white disabled:opacity-50">Call selected user with AI</button>
      {websiteCallId && <button type="button" onClick={endWebsiteAiCall} className="rounded-lg bg-red-700 px-5 py-3 text-white">End website AI call</button>}
      <p className="text-sm">User opt-in settings: <Link className="underline" href="/ai-call-privacy">roomkhoj.com/ai-call-privacy</Link></p>
      {browserStatus && <p role="status" className="text-sm">{browserStatus}</p>}
    </section>
    <AiOwnerDraftReview />
    <section className="rounded-xl border p-5 space-y-3"><h2 className="font-semibold">Live Audio Test — Messages</h2><p className="text-sm">Use the existing website-to-website calling in Messages. Both RoomKhoj accounts must be logged in and have a conversation.</p><Link href="/messages" className="inline-block rounded bg-green-700 px-4 py-2 text-white">Open Messages and Call</Link></section>
    <section className="rounded-xl border p-5 space-y-2"><h2 className="font-semibold">Website-to-Website Test Call</h2><p className="text-sm">Test real microphone audio between two browsers without a SIP provider.</p><Link className="inline-block rounded bg-blue-700 px-4 py-2 text-white" href="/admin/dashboard/ai-owner-calling/browser-test">Open Browser Call Test</Link></section>
    <section className="space-y-4 rounded-xl border p-5">
      <label className="block text-sm font-medium" htmlFor="owner-name">Owner name (admin provided)</label>
      <input id="owner-name" value={ownerName} onChange={e=>setOwnerName(e.target.value)} className="w-full rounded-md border bg-background p-3" placeholder="Owner name" />
      <label className="block text-sm font-medium" htmlFor="owner-phone">Owner phone number</label>
      <input id="owner-phone" type="tel" value={phone} onChange={e=>setPhone(e.target.value)}
        className="w-full rounded-md border bg-background p-3" placeholder="+97798XXXXXXXX" />
      <label className="block text-sm font-medium" htmlFor="owner-location">Room location (optional)</label>
      <input id="owner-location" value={location} onChange={e=>setLocation(e.target.value)} className="w-full rounded-md border bg-background p-3" placeholder="Pokhara, Lakeside" />
      <label className="block text-sm font-medium" htmlFor="owner-rent">Rent (optional)</label>
      <input id="owner-rent" value={rent} onChange={e=>setRent(e.target.value)} className="w-full rounded-md border bg-background p-3" placeholder="Monthly NPR" />
      <label className="block text-sm font-medium" htmlFor="owner-type">Room type (optional)</label>
      <input id="owner-type" value={roomType} onChange={e=>setRoomType(e.target.value)} className="w-full rounded-md border bg-background p-3" placeholder="Single room / flat" />
      <label className="block text-sm font-medium" htmlFor="owner-notes">Known details (optional)</label>
      <textarea id="owner-notes" value={notes} onChange={e=>setNotes(e.target.value)} className="w-full rounded-md border bg-background p-3" rows={3} placeholder="Facilities, preferred calling time, room availability…" />
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={simulation} onChange={e=>setSimulation(e.target.checked)} />
        Simulation mode (no real call)
      </label>
      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)} />
        I confirm this owner opted in to RoomKhoj calls and has not opted out.
      </label>
      {!simulation && <p role="note" className="rounded-md bg-amber-50 p-3 text-sm text-amber-900">
        Live calling requires a configured Twilio-compatible SIP voice path, stored owner consent verification, and provider authorization.
      </p>}
      <button type="button" onClick={startCall} disabled={!valid || !ownerName.trim() || !consent || state==="calling"}
        className="rounded-lg bg-blue-700 px-5 py-3 font-medium text-white disabled:opacity-50">
        {state==="calling" ? "Starting…" : simulation ? "Run simulation" : "Start approved call"}
      </button>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      {result && <div className="rounded-md border p-3 text-sm">
        <p>Status: {result.status || "queued"}</p>
        {result.id && <p>Call ID: {result.id}</p>}
        {result.message && <p>{result.message}</p>}
      </div>}
    </section>
    <section className="rounded-xl border p-5 text-sm">
      <h2 className="mb-2 font-semibold">SIP/VoIP integration contract</h2>
      <p>POST /admin/ai-owner-calls: authenticate admin, verify stored owner opt-in, validate destination, enforce limits, enqueue call and return call ID. Never expose SIP/VoIP credentials to the browser.</p>
      <p className="mt-2">Backend call events must persist transcript consent, extracted room draft, verification status, matching suggestions, and visit approval. Do not auto-publish unverified rooms.</p>
    </section>
  </main>;
}
