"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { privateApi } from "@/http/api/privateApi";
import useTokenStore from "@/store";

type Turn = { eventId: string; speaker: "OWNER" | "AI"; text: string; createdAt: string };
type Call = {
  id: string; userName?: string; callerName?: string | null; phoneNumber?: string | null;
  userId?: string | null; status: string; createdAt: string; acceptedAt?: string | null;
  endedAt?: string | null; durationSeconds?: number; transcriptConsentedAt?: string | null;
  turnCount?: number; direction?: string; outcome?: string | null;
  transcript?: { role: "user" | "assistant"; text: string; at: string }[];
};
const labels: Record<string, string> = {
  RINGING: "घण्टी जाँदैछ", ACCEPTED: "Call स्वीकार भयो", DECLINED: "अस्वीकार भयो",
  NO_ANSWER: "उठेन", ENDED: "सकियो", FAILED: "असफल", IN_PROGRESS: "कुराकानी हुँदैछ",
  COMPLETED: "पूरा भयो", "no-answer": "उठेन", completed: "पूरा भयो",
  busy: "व्यस्त", failed: "असफल", ringing: "घण्टी जाँदैछ", "in-progress": "कुराकानी हुँदैछ",
};
function date(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString("en-GB", { timeZone: "Asia/Kathmandu" });
}
function duration(call: Call) {
  let seconds = call.durationSeconds;
  if (seconds === undefined && call.endedAt) seconds = Math.max(0, Math.floor((Date.parse(call.endedAt) - Date.parse(call.createdAt)) / 1000));
  if (seconds === undefined || !Number.isFinite(seconds)) return "—";
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}
function name(call: Call) { return call.userName || call.callerName || call.phoneNumber || "Unknown owner"; }

export default function AiLiveChatboxPage() {
  const token = useTokenStore(s => s.token);
  const [channel, setChannel] = useState<"website" | "phone">("website");
  const [offset, setOffset] = useState(0);
  const [calls, setCalls] = useState<Call[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [listError, setListError] = useState("");
  const [detailError, setDetailError] = useState("");
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [transcriptCallId,setTranscriptCallId] = useState("");
  const [consented, setConsented] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [updatedAt, setUpdatedAt] = useState("");

  useEffect(() => {
    if (!token) { setCalls([]); setSelectedId(""); setLoading(false); return; }
    let active = true;
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    setLoading(true); setCalls([]); setSelectedId(""); setListError(""); setHasMore(false);
    async function load() {
      try {
        const response = await privateApi.get(channel === "website" ? "/ai-owner/admin/calls" : "/admin/ai-call/sessions", {
          params: { offset, limit: 51 }, signal: controller.signal,
        });
        if (!active) return;
        const payload = response.data;
        const data = payload?.data ?? payload;
        const rows: Call[] = channel === "website" ? data.items : data;
        if (!Array.isArray(rows)) throw new Error("Invalid call history response");
        setCalls(rows.slice(0, 50));
        setHasMore(channel === "website" ? Boolean(data.hasMore) : rows.length > 50);
        setSelectedId(id => rows.some(row => row.id === id) ? id : rows[0]?.id || "");
        setListError(""); setUpdatedAt(new Date().toISOString());
      } catch {
        if (active) setListError("Call history लोड भएन। Backend उपलब्ध र admin access भएको पुष्टि गर्नुहोस्।");
      } finally {
        if (active) { setLoading(false); timer = setTimeout(() => void load(), 5000); }
      }
    }
    void load();
    return () => { active = false; controller.abort(); clearTimeout(timer); };
  }, [channel, offset, token, refresh]);

  const selected = calls.find(call => call.id === selectedId);
  useEffect(() => {
    setTurns([]); setConsented(false); setDetailError("");
    if (channel !== "website" || !selectedId || !token) { setDetailLoading(false); return; }
    let active = true;
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    setDetailLoading(true);
    async function load() {
      try {
        const response = await privateApi.get(`/ai-owner/admin/calls/${encodeURIComponent(selectedId)}/transcript`, { signal: controller.signal });
        if (!active) return;
        const data = response.data?.data ?? response.data;
        if (!Array.isArray(data.turns)) throw new Error("Invalid transcript response");
        setTranscriptCallId(selectedId); setTurns(data.turns); setConsented(data.consented === true); setDetailError("");
      } catch {
        if (active) setDetailError("कुराकानी लोड भएन। फेरि प्रयास गर्दैछौँ।");
      } finally {
        if (active) { setDetailLoading(false); timer = setTimeout(() => void load(), 5000); }
      }
    }
    void load();
    return () => { active = false; controller.abort(); clearTimeout(timer); };
  }, [channel, selectedId, token, refresh]);

  const visible = useMemo(() => calls.filter(call => {
    const text = [name(call), call.phoneNumber, call.userId, call.id, call.outcome].filter(Boolean).join(" ").toLowerCase();
    return text.includes(query.toLowerCase()) && (status === "all" || call.status === status);
  }), [calls, query, status]);
  const conversation: Turn[] = channel === "website" ? (transcriptCallId === selectedId ? turns : []) : (selected?.transcript || []).map((turn, index) => ({
    eventId: String(index), speaker: turn.role === "assistant" ? "AI" : "OWNER", text: turn.text, createdAt: turn.at,
  }));
  function changeChannel(value: "website" | "phone") {
    setChannel(value); setCalls([]); setTurns([]); setOffset(0); setSelectedId(""); setQuery(""); setStatus("all");
  }

  return <main className="mx-auto max-w-7xl space-y-5 p-4 md:p-6">
    <header className="flex flex-wrap items-center justify-between gap-3">
      <div><h1 className="text-2xl font-bold">AI Live Chatbox</h1>
        <p className="text-sm text-muted-foreground">कसलाई call भयो र कसले के भन्यो — call history र कुराकानी।</p></div>
      <Link href="/admin/dashboard/ai-owner-calling" className="rounded-lg bg-blue-700 px-4 py-2 text-sm text-white">AI Owner Calling खोल्नुहोस्</Link>
    </header>
    <div className="flex flex-wrap items-center gap-2">
      <button aria-pressed={channel === "website"} className={`rounded-lg border px-4 py-2 ${channel === "website" ? "bg-blue-700 text-white" : ""}`} onClick={() => changeChannel("website")}>Website calls</button>
      <button aria-pressed={channel === "phone"} className={`rounded-lg border px-4 py-2 ${channel === "phone" ? "bg-blue-700 text-white" : ""}`} onClick={() => changeChannel("phone")}>Phone calls</button>
      <button className="rounded-lg border px-3 py-2" onClick={() => setRefresh(n => n + 1)}>Refresh</button>
      <p className="text-xs text-muted-foreground">हरेक ५ सेकेन्डमा refresh · समय: नेपाल {updatedAt && `· ${date(updatedAt)}`}</p>
    </div>
    <div className="flex flex-wrap gap-3">
      <input aria-label="Search current page" className="min-w-0 flex-1 rounded-lg border bg-background px-3 py-2" placeholder="यो page मा नाम, नम्बर वा Call ID खोज्नुहोस्…" value={query} onChange={e => setQuery(e.target.value)} />
      <select aria-label="Filter status on current page" className="rounded-lg border bg-background px-3 py-2" value={status} onChange={e => setStatus(e.target.value)}>
        <option value="all">सबै status</option>
        {[...new Set(calls.map(call => call.status))].sort().map(value => <option key={value} value={value}>{labels[value] || value}</option>)}
      </select>
    </div>
    {!token && <p role="alert">Admin account बाट login गर्नुहोस्।</p>}
    {listError && <p role="alert" className="rounded-lg border border-red-400 p-3 text-red-600">{listError}</p>}
    <div className="grid gap-4 lg:grid-cols-[minmax(260px,360px)_1fr]">
      <section aria-label="Call history" className="rounded-xl border p-3">
        <h2 className="mb-3 font-semibold">Call history · {visible.length}</h2>
        {loading ? <p role="status">लोड हुँदैछ…</p> : visible.length === 0 && <p className="p-4 text-sm text-muted-foreground">{calls.length ? "खोजसँग मिल्ने call छैन।" : "यस page मा call history छैन।"}</p>}
        <div className="max-h-[680px] space-y-2 overflow-y-auto">
          {visible.map(call => <button key={call.id} aria-pressed={selectedId === call.id} onClick={() => setSelectedId(call.id)} className={`w-full rounded-lg border p-3 text-left ${selectedId === call.id ? "border-blue-600 bg-blue-500/10" : "hover:bg-muted"}`}>
            <div className="flex justify-between gap-2"><span className="break-words font-semibold">{name(call)}</span><span className="shrink-0 text-xs">{labels[call.status] || call.status}</span></div>
            <p className="text-xs text-muted-foreground">{date(call.createdAt)} · {duration(call)}</p>
            <p className="mt-1 text-xs">{channel === "website" ? `${call.turnCount || 0} संवाद` : call.direction === "OUTBOUND" ? "AI ले गरेको call" : "आएको call"}</p>
          </button>)}
        </div>
        <div className="mt-4 flex items-center justify-between gap-2 text-sm">
          <button className="rounded border p-2 disabled:opacity-40" disabled={offset === 0 || loading} onClick={() => setOffset(n => Math.max(0, n - 50))}>Previous</button>
          <span>Page {offset / 50 + 1}</span>
          <button className="rounded border p-2 disabled:opacity-40" disabled={!hasMore || loading} onClick={() => setOffset(n => n + 50)}>Next</button>
        </div>
      </section>
      <section aria-label="Selected call conversation" className="min-w-0 rounded-xl border p-4">
        {!selected ? <p className="py-12 text-center text-muted-foreground">कुराकानी हेर्न call छान्नुहोस्।</p> : <>
          <h2 className="text-xl font-semibold">{name(selected)}</h2>
          <dl className="my-4 grid grid-cols-2 gap-3 rounded-lg bg-muted/50 p-3 text-sm md:grid-cols-3">
            <div><dt className="text-muted-foreground">Status</dt><dd>{labels[selected.status] || selected.status}</dd></div>
            <div><dt className="text-muted-foreground">सुरु</dt><dd>{date(selected.createdAt)}</dd></div>
            <div><dt className="text-muted-foreground">अन्त्य</dt><dd>{date(selected.endedAt)}</dd></div>
            <div><dt className="text-muted-foreground">अवधि</dt><dd>{duration(selected)}</dd></div>
            {selected.phoneNumber && <div><dt className="text-muted-foreground">नम्बर</dt><dd>{selected.phoneNumber}</dd></div>}
            {selected.outcome && <div><dt className="text-muted-foreground">नतिजा</dt><dd>{selected.outcome}</dd></div>}
          </dl>
          <p className="mb-3 break-all text-xs text-muted-foreground">Call ID: {selected.id}</p>
          <h3 className="font-semibold">कसले के भन्यो</h3>
          {channel === "website" && <p className="my-2 text-xs text-muted-foreground">अनुमति दिएर browser बाट पठाइएको transcript; स्वतन्त्र रूपमा प्रमाणित audio recording होइन।</p>}
          {detailError && <p role="alert" className="py-3 text-sm text-red-600">{detailError}</p>}
          {detailLoading ? <p role="status">कुराकानी लोड हुँदैछ…</p> : conversation.length === 0 ? <p className="py-10 text-center text-sm text-muted-foreground">{channel === "website" && !consented ? "Transcript राख्ने अनुमति छैन वा यो पुरानो call हो। Call को अवस्था मात्र उपलब्ध छ।" : "अहिलेसम्म सुरक्षित गरिएको संवाद छैन।"}</p> :
            <ol className="max-h-[560px] space-y-3 overflow-y-auto py-4" aria-label="Conversation transcript">
              {conversation.map(turn => <li key={turn.eventId} className={`flex ${turn.speaker === "AI" ? "justify-start" : "justify-end"}`}>
                <article className={`max-w-[90%] rounded-xl border p-3 ${turn.speaker === "AI" ? "bg-blue-500/10" : "bg-emerald-500/10"}`}>
                  <p className="mb-1 text-xs font-semibold">{turn.speaker === "AI" ? "RoomKhoj AI" : name(selected)} · {date(turn.createdAt)}</p>
                  <p className="whitespace-pre-wrap break-words text-sm leading-6">{turn.text}</p>
                </article>
              </li>)}
            </ol>}
        </>}
      </section>
    </div>
    <p className="text-xs text-muted-foreground">Website calls मा तपाईंले सुरु गरेका calls देखिन्छन्। पुराना calls को नसुरक्षित गरिएको संवाद फेरि बनाउन सकिँदैन। Phone call history मा provider बाट सुरक्षित भएका transcript देखिन्छन्।</p>
  </main>;
}
