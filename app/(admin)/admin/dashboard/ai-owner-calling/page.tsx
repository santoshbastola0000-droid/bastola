"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
const DeveloperVoiceTraining = dynamic(() => import("@/components/DeveloperVoiceTraining"), { ssr: false });
const OwnerRealtimeVoice = dynamic(() => import("@/components/OwnerRealtimeVoice"), { ssr: false });
import { io, type Socket } from "socket.io-client";
import useTokenStore from "@/store";
import { AiOwnerUserSelector } from "@/components/AiOwnerUserSelector";
import { AiAutoCalling } from "@/components/admin/AiAutoCalling";
import { OwnerVoiceMemory } from "@/components/admin/OwnerVoiceMemory";
import { OwnerRequiredDetails } from "@/components/OwnerRequiredDetails";
import { AiOwnerDraftReview } from "@/components/AiOwnerDraftReview";
import { OwnerCollectedData } from '@/components/OwnerCollectedData';
import { OwnerKnowledgeEditor } from '@/components/OwnerKnowledgeEditor';

const API = (process.env.NEXT_PUBLIC_BACKEND_URL || "https://api.roomkhoj.com").replace(/\/$/, "");

export default function OwnerCallingPage() {
  const token = useTokenStore(s => s.token);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [eligibility,setEligibility]=useState<{optedIn:boolean;online:boolean}|null>(null);
  const [eligibilityError,setEligibilityError]=useState("");
  const [browserStatus, setBrowserStatus] = useState("");
  const [websiteCallId, setWebsiteCallId] = useState("");
  const websiteSocket = useRef<Socket | null>(null);
  const [websiteCalling, setWebsiteCalling] = useState(false);
  const [dialStartedAt, setDialStartedAt] = useState<number | null>(null);
  const [dialSeconds, setDialSeconds] = useState(0);
  const [websiteCallPhase, setWebsiteCallPhase] = useState<"idle" | "connecting" | "dialing" | "ringing" | "connected" | "ended" | "failed">("idle");
  useEffect(() => {
    if (!dialStartedAt || !["connecting","dialing","ringing"].includes(websiteCallPhase)) return;
    const tick = () => setDialSeconds(Math.floor((Date.now() - dialStartedAt) / 1000));
    tick(); const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [dialStartedAt, websiteCallPhase]);
  useEffect(() => {
    setEligibility(null); setEligibilityError("");
    if (!selectedUserId || !token) return;
    let active = true;
    void fetch(API + "/ai-owner/admin/users/" + encodeURIComponent(selectedUserId) + "/eligibility", {
      credentials:"include",headers:{Authorization:`Bearer ${token}`},
    }).then(async response => {
      if(!response.ok)throw new Error("Could not verify call eligibility");
      return response.json();
    }).then(data => {if(active)setEligibility({optedIn:data.optedIn===true,online:data.online===true});})
    .catch(e => {if(active)setEligibilityError(String(e));});
    return ()=>{active=false;};
  },[selectedUserId,token]);
  useEffect(() => () => { websiteSocket.current?.disconnect(); websiteSocket.current = null; }, []);
  const [phone, setPhone] = useState("+977");
  const [ownerName, setOwnerName] = useState("");
  function endWebsiteAiCall() {
    if (websiteCallId) websiteSocket.current?.emit("ai-owner:end", {callId:websiteCallId});
    websiteSocket.current?.disconnect();
    websiteSocket.current = null;
    setWebsiteCallId(""); setWebsiteCalling(false);
    setBrowserStatus("Call ended by admin"); setWebsiteCallPhase("ended"); setDialStartedAt(null);
  }

  function startWebsiteAiCall() {
    if (!token || !selectedUserId || !eligibility?.optedIn || !eligibility.online || websiteCalling) return;
    websiteSocket.current?.disconnect();
    const socket = io(API + "/messages", {
      auth: { token }, transports: ["polling", "websocket"], withCredentials: true,
    });
    websiteSocket.current=socket;
    setWebsiteCalling(true);
    setDialStartedAt(Date.now()); setDialSeconds(0); setWebsiteCallPhase("connecting");
    setBrowserStatus("Connecting to RoomKhoj…");
    socket.once("connect", () => {
      socket.timeout(12000).emit("ai-owner:call",
        {targetUserId:selectedUserId,consentConfirmed:true},
        (error: Error | null, response: {success?:boolean;error?:string;callId?:string}) => {
          if (error || !response?.success || !response.callId) {
            setBrowserStatus(response?.error || "Calling unavailable");
            setWebsiteCalling(false); setWebsiteCallPhase("failed"); setDialStartedAt(null); socket.disconnect(); return;
          }
          setWebsiteCallId(response.callId);
          setWebsiteCallPhase("ringing");
          setBrowserStatus("Ringing user's RoomKhoj account…");
        });
    });
    socket.on("ai-owner:status",(event:{callId?:string;status?:string})=>{
      if (!event?.status) return;
      setBrowserStatus("Website AI call: " + event.status);
      if (["accepted","connected","active","in-progress"].includes(event.status)) { setWebsiteCallPhase("connected"); setDialStartedAt(null); }
      else if (["ringing","calling","dialing"].includes(event.status)) setWebsiteCallPhase("ringing");
      if (["ended","declined","no-answer","failed"].includes(event.status)) {
        setWebsiteCallId(""); setWebsiteCalling(false); setWebsiteCallPhase(event.status === "ended" ? "ended" : "failed"); setDialStartedAt(null); socket.disconnect();
      }
    });
    socket.on("connect_error", () => {
      setBrowserStatus("Calling server unavailable");
      setWebsiteCalling(false); setWebsiteCallPhase("failed"); setDialStartedAt(null); socket.disconnect();
    });
  }

  return <main className="mx-auto max-w-7xl space-y-6 p-4 md:p-8">
    <header><h1 className="text-2xl font-bold">AI Owner Calling</h1>
      <p className="text-sm text-muted-foreground">Owner छानेर website call गर्नुहोस् वा अनुमति भएका नम्बर auto-call queue मा राख्नुहोस्। प्रश्न र बोल्ने शैली तल मिलाउन सकिन्छ।</p></header>
    <OwnerRequiredDetails />
    <OwnerKnowledgeEditor />
    <AiOwnerUserSelector onSelect={user => { setOwnerName(user.name); setPhone(user.phone || ""); setSelectedUserId(user.id); }} />
    <OwnerVoiceMemory userId={selectedUserId} />
    <DeveloperVoiceTraining />
    <AiAutoCalling selectedPhone={phone} selectedName={ownerName} />
    <section className="rounded-xl border p-5 space-y-3">
      <h2 className="font-semibold">Website AI Voice Call (Beta)</h2>
      <p className="text-sm">Select an online registered user above. The user must first enable AI calling in their privacy settings, remain logged in, and accept the incoming call. Continuous Nepali voice uses WebRTC.</p>
      <p className="text-sm">Calls are permitted only when the selected user's recorded opt-in is active.</p>
      {selectedUserId && <p className="text-sm">{eligibilityError || (eligibility ? `Calling consent: ${eligibility.optedIn?"Enabled":"Disabled"} · User: ${eligibility.online?"Online":"Offline"}` : "Checking consent and presence…")}</p>}
      <button disabled={!selectedUserId || !eligibility?.optedIn || !eligibility.online || websiteCalling} onClick={() => startWebsiteAiCall()} className="rounded-lg bg-green-700 px-5 py-3 text-white disabled:opacity-50">Call selected user with AI</button>
      {websiteCallPhase !== "idle" && <div role="status" aria-live="polite" className="rounded-xl border bg-background p-4 space-y-2"><div className="flex items-center gap-3"><span className={`h-3 w-3 rounded-full ${["connecting","dialing","ringing"].includes(websiteCallPhase) ? "animate-pulse bg-amber-500" : websiteCallPhase === "connected" ? "bg-green-500" : "bg-gray-400"}`} /><strong>{websiteCallPhase === "connecting" ? "Connecting to server…" : websiteCallPhase === "ringing" ? "Dialing… Ringing user" : websiteCallPhase === "connected" ? "Call accepted / connected" : websiteCallPhase === "ended" ? "Call ended" : "Call failed or not answered"}</strong></div>{["connecting","dialing","ringing"].includes(websiteCallPhase) && <p className="text-sm tabular-nums">Waiting {Math.floor(dialSeconds / 60).toString().padStart(2,"0")}:{(dialSeconds % 60).toString().padStart(2,"0")} · Awaiting user acceptance</p>}<p className="text-xs text-muted-foreground">Ringing means the server accepted the call request; it does not confirm the user answered.</p></div>}
      {websiteCallId && <button type="button" onClick={endWebsiteAiCall} className="rounded-lg bg-red-700 px-5 py-3 text-white">End website AI call</button>}
      <p className="text-sm">User opt-in settings: <Link className="underline" href="/ai-call-privacy">roomkhoj.com/ai-call-privacy</Link></p>
      {browserStatus && <p role="status" className="text-sm">{browserStatus}</p>}
    </section>
    <OwnerCollectedData />
    <AiOwnerDraftReview />
    <details className="space-y-4 rounded-xl border p-5">
      <summary className="cursor-pointer font-semibold">परीक्षण र Diagnostics</summary>
      <section className="mt-4 space-y-3">
        <h2 className="font-semibold">Owner AI सँग अभ्यास</h2>
        <p className="text-sm text-muted-foreground">आफैँ owner बनेर प्रश्न र बोल्ने शैली जाँच्नुहोस्। यस अभ्यासले कोठा save वा publish गर्दैन।</p>
        <OwnerRealtimeVoice />
      </section>
      <div className="mt-4 flex flex-wrap gap-3 text-sm">
        <Link className="rounded border px-3 py-2" href="/messages">Messages audio test</Link>
        <Link className="rounded border px-3 py-2" href="/admin/dashboard/ai-owner-calling/browser-test">Browser audio test</Link>
      </div>
    </details>
  </main>;
}
