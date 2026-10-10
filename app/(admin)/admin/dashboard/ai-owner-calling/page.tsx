"use client";

import { useState } from "react";

type CallState = "idle" | "calling" | "complete" | "failed";
type CallResult = { id?: string; status?: string; message?: string };
const API = (process.env.NEXT_PUBLIC_BACKEND_URL || "https://api.roomkhoj.com").replace(/\/$/, "");

export default function OwnerCallingPage() {
  const [phone, setPhone] = useState("+977");
  const [consent, setConsent] = useState(false);
  const [state, setState] = useState<CallState>("idle");
  const [error, setError] = useState("");
  const [result, setResult] = useState<CallResult | null>(null);
  const [simulation, setSimulation] = useState(true);
  const normalized = phone.trim();
  const valid = /^\+?[1-9]\d{7,14}$/.test(normalized);

  async function startCall() {
    if (!valid || !consent || state === "calling") return;
    setError(""); setResult(null); setState("calling");
    try {
      if (simulation) {
        setResult({status:"simulated",message:"No actual call placed. Gateway is not connected."});
        setState("complete");
        return;
      }
      // The backend owns gateway credentials, provider routing and authorization.
      const response = await fetch(`${API}/admin/ai-owner-calls`, {
        method:"POST", credentials:"include",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({to:normalized,consentConfirmed:true})
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
      <p className="text-sm text-muted-foreground">Connect any approved local SIM gateway through the VPS backend. The number alone cannot initiate a call without compatible hardware and operator permission.</p></header>
    <section className="space-y-4 rounded-xl border p-5">
      <label className="block text-sm font-medium" htmlFor="owner-phone">Owner phone number</label>
      <input id="owner-phone" type="tel" value={phone} onChange={e=>setPhone(e.target.value)}
        className="w-full rounded-md border bg-background p-3" placeholder="+97798XXXXXXXX" />
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={simulation} onChange={e=>setSimulation(e.target.checked)} />
        Simulation mode (no real call)
      </label>
      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)} />
        I confirm this owner opted in to RoomKhoj calls and has not opted out.
      </label>
      {!simulation && <p role="note" className="rounded-md bg-amber-50 p-3 text-sm text-amber-900">
        Live calling requires the authorized backend endpoint, a configured gateway, verified consent, and provider compliance. No automatic fallback to a personal SIM.
      </p>}
      <button type="button" onClick={startCall} disabled={!valid || !consent || state==="calling"}
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
      <h2 className="mb-2 font-semibold">Gateway integration contract</h2>
      <p>POST /admin/ai-owner-calls: authenticate admin, verify stored owner opt-in, validate destination, enforce limits, enqueue call and return call ID. Never expose SIM gateway credentials to the browser.</p>
      <p className="mt-2">Backend call events must persist transcript consent, extracted room draft, verification status, matching suggestions, and visit approval. Do not auto-publish unverified rooms.</p>
    </section>
  </main>;
}
