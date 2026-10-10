"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import useTokenStore from "@/store";

type Turn = { role: "user" | "assistant"; content: string };
const API = (process.env.NEXT_PUBLIC_BACKEND_URL || "https://api.roomkhoj.com").replace(/\/$/, "");

export function AiOwnerIncomingVoice() {
  const token = useTokenStore(s => s.token);
  const socket = useRef<Socket | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const audio = useRef<HTMLAudioElement | null>(null);
  const history = useRef<Turn[]>([]);
  const active = useRef("");
  const [callId, setCallId] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [lastReply, setLastReply] = useState("");
  const [consentSave, setConsentSave] = useState(false);

  const stopMedia = useCallback(() => {
    recorder.current?.state === "recording" && recorder.current.stop();
    recorder.current = null;
    stream.current?.getTracks().forEach(t => t.stop());
    stream.current = null;
    if (audio.current) { audio.current.pause(); audio.current.src = ""; }
  }, []);
  const finish = useCallback((notify = true) => {
    if (notify && active.current) socket.current?.emit("ai-owner:end", { callId: active.current });
    active.current = ""; stopMedia(); history.current = []; setCallId(""); setAccepted(false);
    setBusy(false); setLastReply(""); setConsentSave(false); setStatus("");
  }, [stopMedia]);

  useEffect(() => {
    if (!token) return;
    const s = io(API + "/messages", { auth: { token }, transports: ["polling", "websocket"], withCredentials: true });
    socket.current = s;
    s.on("ai-owner:incoming", (data: { callId?: string }) => {
      if (!data?.callId || active.current) return;
      active.current = data.callId; setCallId(data.callId); setStatus("RoomKhoj AI बाट call आएको छ");
    });
    s.on("ai-owner:ended", (data: { callId?: string }) => {
      if (data.callId === active.current) finish(false);
    });
    return () => { s.disconnect(); socket.current = null; finish(false); };
  }, [token, finish]);

  const request = useCallback(async (path: string, init: RequestInit) => {
    const response = await fetch(API + path, {
      ...init, credentials: "include",
      headers: { Authorization: `Bearer ${token}`, ...(init.headers || {}) },
    });
    if (!response.ok) throw new Error("AI service unavailable (" + response.status + ")");
    return response;
  }, [token]);

  const speak = useCallback(async (text: string) => {
    setLastReply(text);
    const res = await request("/ai-call/speak", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text }),
    });
    const url = URL.createObjectURL(await res.blob());
    try {
      const player = audio.current;
      if (!player) return;
      player.src = url;
      await player.play();
      await new Promise<void>(resolve => {
        player.onended = () => resolve();
        player.onerror = () => resolve();
      });
    } finally { URL.revokeObjectURL(url); }
  }, [request]);

  const reply = useCallback(async (next: Turn[]) => {
    const res = await request("/ai-call/owner-dialogue", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ history: next }),
    });
    const result = await res.json();
    const text = String(result?.data?.reply || "").trim();
    if (!text) throw new Error("AI did not respond");
    history.current = [...next, { role: "assistant", content: text }];
    await speak(text);
  }, [request, speak]);

  const accept = async () => {
    try {
      // iOS needs microphone and playback permission inside a user gesture.
      const mic = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.current = mic;
      const player = audio.current;
      if (player) { player.muted = false; }
      socket.current?.emit("ai-owner:respond", { callId: active.current, accept: true });
      setAccepted(true); setBusy(true); setStatus("AI सँग जोडिँदैछ…");
      await reply([]);
      setStatus("आफ्नो उत्तर बोल्न Record थिच्नुहोस्");
    } catch (error) { setStatus(error instanceof Error ? error.message : "Microphone access denied"); }
    finally { setBusy(false); }
  };

  const record = async () => {
    if (busy || !stream.current || !active.current) return;
    try {
      const parts: BlobPart[] = [];
      const r = new MediaRecorder(stream.current);
      recorder.current = r;
      r.ondataavailable = event => { if (event.data.size) parts.push(event.data); };
      r.onstop = async () => {
        if (!active.current) return;
        setBusy(true); setStatus("AI ले सुनिरहेको छ…");
        try {
          const file = new Blob(parts, { type: r.mimeType || "audio/webm" });
          const form = new FormData();
          form.append("audio", file, "roomkhoj-owner-voice.webm");
          const response = await request("/ai-call/transcribe", { method: "POST", body: form });
          const result = await response.json();
          const words = String(result?.data?.text || "").trim();
          if (!words) { setStatus("आवाज बुझिएन, फेरि बोल्नुहोस्"); return; }
          const next: Turn[] = [...history.current, { role: "user", content: words }];
          await reply(next);
          setStatus("अर्को उत्तर बोल्न Record थिच्नुहोस्");
        } catch (error) { setStatus(error instanceof Error ? error.message : "Voice processing failed"); }
        finally { setBusy(false); }
      };
      r.start(); setStatus("बोल्नुहोस्… सकिएपछि Stop थिच्नुहोस्");
    } catch { setStatus("Recording unavailable in this browser"); }
  };

  if (!callId) return null;
  return <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/70 p-4">
    <div className="w-full max-w-md space-y-4 rounded-2xl bg-background p-6 text-center shadow-xl">
      <h2 className="text-xl font-bold">RoomKhoj AI Voice Call</h2>
      <p className="text-sm">RoomKhoj को AI सहायक बोल्दैछ। यो मानव कर्मचारी होइन।</p>
      <p role="status" className="text-sm">{status}</p>
      <audio ref={audio} controls playsInline className="w-full" />
      {lastReply && <p className="rounded-lg border p-3 text-left text-sm">{lastReply}</p>}
      {!accepted ? <div className="flex justify-center gap-3">
        <button onClick={() => void accept()} className="rounded-lg bg-green-700 px-5 py-3 text-white">Accept</button>
        <button onClick={() => { socket.current?.emit("ai-owner:respond", { callId, accept: false }); finish(false); }} className="rounded-lg bg-red-700 px-5 py-3 text-white">Decline</button>
      </div> : <>
        <label className="flex items-center justify-center gap-2 text-xs">
          <input type="checkbox" checked={consentSave} onChange={e => setConsentSave(e.target.checked)} />
          म transcript सुरक्षित राख्न अनुमति दिन्छु (अहिले transcript save हुँदैन)
        </label>
        <div className="flex justify-center gap-3">
          <button disabled={busy} onClick={() => recorder.current?.state === "recording" ? recorder.current.stop() : void record()} className="rounded-lg bg-blue-700 px-5 py-3 text-white disabled:opacity-50">
            {recorder.current?.state === "recording" ? "Stop" : "Record answer"}
          </button>
          <button onClick={() => finish()} className="rounded-lg bg-red-700 px-5 py-3 text-white">End Call</button>
        </div>
      </>}
      <p className="text-xs text-muted-foreground">यो browser voice turn-taking हो; continuous full-duplex call होइन।</p>
    </div>
  </div>;
}
