"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import useTokenStore from "@/store";

const API = (process.env.NEXT_PUBLIC_BACKEND_URL || "https://api.roomkhoj.com").replace(/\/$/, "");
type TokenResult = { success?: boolean; token?: string; model?: string; error?: string };

export function AiOwnerIncomingVoice() {
  const token = useTokenStore(s => s.token);
  const socket = useRef<Socket | null>(null);
  const peer = useRef<RTCPeerConnection | null>(null);
  const mic = useRef<MediaStream | null>(null);
  const audio = useRef<HTMLAudioElement | null>(null);
  const active = useRef("");
  const utterances = useRef<string[]>([]);
  const [callId, setCallId] = useState("");
  const [connected, setConnected] = useState(false);
  const [finished, setFinished] = useState(false);
  const [status, setStatus] = useState("");
  const [consentSave, setConsentSave] = useState(false);
  const [saving, setSaving] = useState(false);
  const [captured, setCaptured] = useState(0);

  const stopAudio = useCallback(() => {
    peer.current?.close(); peer.current = null;
    mic.current?.getTracks().forEach(track => track.stop()); mic.current = null;
    if (audio.current) { audio.current.pause(); audio.current.srcObject = null; }
    setConnected(false);
  }, []);

  const close = useCallback(() => {
    stopAudio(); active.current = ""; utterances.current = [];
    setCallId(""); setFinished(false); setCaptured(0); setConsentSave(false); setStatus("");
  }, [stopAudio]);

  useEffect(() => {
    if (!token) return;
    const s = io(API + "/messages", { auth: { token }, transports: ["polling", "websocket"], withCredentials: true });
    socket.current = s;
    s.on("ai-owner:incoming", (data: { callId?: string }) => {
      if (!data.callId || active.current) return;
      active.current = data.callId;
      utterances.current = [];
      setCaptured(0);
      setCallId(data.callId);
      setFinished(false);
      setStatus("RoomKhoj AI बाट incoming call");
    });
    s.on("ai-owner:ended", (data: { callId?: string }) => {
      if (data.callId !== active.current) return;
      stopAudio();
      setFinished(true);
      setStatus("Call सकियो। चाहनुहुन्छ भने room draft सुरक्षित गर्न अनुमति दिनुहोस्।");
    });
    return () => { s.disconnect(); socket.current = null; stopAudio(); };
  }, [token, stopAudio]);

  const end = () => {
    if (active.current) socket.current?.emit("ai-owner:end", { callId: active.current });
    stopAudio();
    setFinished(true);
    setStatus("Call सकियो। Draft save गर्न छुट्टै अनुमति चाहिन्छ।");
  };

  const accept = async () => {
    const id = active.current;
    if (!id || !socket.current) return;
    setStatus("Connecting real-time AI voice…");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      mic.current = stream;
      const accepted = await socket.current.timeout(12000).emitWithAck("ai-owner:respond", { callId: id, accept: true }) as { success?: boolean; error?: string };
      if (!accepted?.success) throw new Error(accepted?.error || "Call acceptance failed");
      const result = await socket.current.timeout(15000).emitWithAck("ai-owner:realtime-token", { callId: id }) as TokenResult;
      if (!result.success || !result.token) throw new Error(result.error || "Realtime AI unavailable");
      if (active.current !== id) { stream.getTracks().forEach(track => track.stop()); return; }
      const pc = new RTCPeerConnection();
      peer.current = pc;
      stream.getAudioTracks().forEach(track => pc.addTrack(track, stream));
      pc.ontrack = event => {
        if (audio.current) {
          audio.current.srcObject = event.streams[0];
          void audio.current.play().catch(() => setStatus("AI सुन्न audio player थिच्नुहोस्"));
        }
      };
      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "connected") {
          setConnected(true);
          setStatus("AI सँग live कुरा गर्नुहोस्");
        }
        if (["failed", "disconnected"].includes(pc.connectionState)) {
          setStatus("Audio connection interrupted; please end and retry");
        }
      };
      const channel = pc.createDataChannel("oai-events");
      channel.onmessage = event => {
        try {
          const message = JSON.parse(event.data) as { type?: string; transcript?: string };
          if (message.type === "conversation.item.input_audio_transcription.completed") {
            const words = String(message.transcript || "").trim();
            if (words && words.length <= 700 && utterances.current.length < 50) {
              utterances.current.push(words);
              setCaptured(utterances.current.length);
            }
          }
        } catch { /* Ignore malformed realtime events */ }
      };
      channel.onopen = () => {
        channel.send(JSON.stringify({
          type: "response.create",
          response: { instructions: "Greet the caller in Nepali, identify yourself as RoomKhoj AI, and politely ask permission to discuss available rental rooms." },
        }));
      };
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      const response = await fetch("https://api.openai.com/v1/realtime/calls", {
        method: "POST",
        headers: { Authorization: `Bearer ${result.token}`, "Content-Type": "application/sdp" },
        body: offer.sdp,
      });
      if (!response.ok) throw new Error("OpenAI audio negotiation failed: " + response.status);
      await pc.setRemoteDescription({ type: "answer", sdp: await response.text() });
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Realtime voice failed");
      stopAudio();
      if (id === active.current) socket.current?.emit("ai-owner:end", { callId: id });
      setFinished(true);
    }
  };

  const saveDraft = async () => {
    if (!consentSave || !token || !callId || !utterances.current.length || saving) return;
    setSaving(true);
    setStatus("Room information तयार हुँदैछ…");
    try {
      const response = await fetch(API + "/ai-owner/calls/" + encodeURIComponent(callId) + "/draft", {
        method: "POST", credentials: "include",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ saveConsent: true, turns: utterances.current }),
      });
      if (!response.ok) throw new Error("Cannot save draft (" + response.status + ")");
      utterances.current = [];
      setStatus("Room draft सुरक्षित भयो। Admin ले review गर्नेछन्।");
      setConsentSave(false);
      setCaptured(0);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Draft saving failed");
    } finally { setSaving(false); }
  };

  if (!callId) return null;
  return <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/70 p-4">
    <div className="w-full max-w-md space-y-4 rounded-2xl bg-background p-6 text-center shadow-xl">
      <h2 className="text-xl font-bold">RoomKhoj AI Live Call</h2>
      <p className="text-sm">यो RoomKhoj को AI सहायक हो, मानव कर्मचारी होइन।</p>
      <p role="status" className="text-sm">{status}</p>
      <audio ref={audio} autoPlay controls playsInline className="w-full" />
      {!connected && !finished && <button onClick={() => void accept()} disabled={status.startsWith("Connecting")} className="rounded-lg bg-green-700 px-5 py-3 text-white disabled:opacity-50">Accept AI Call</button>}
      {!finished && <button onClick={connected ? end : () => {
        socket.current?.emit("ai-owner:respond", { callId, accept: false }); close();
      }} className="ml-2 rounded-lg bg-red-700 px-5 py-3 text-white">{connected ? "End Call" : "Decline"}</button>}
      {finished && <>
        <p className="text-xs">तपाईंको बोलीबाट {captured} उत्तर स्थानीय रूपमा राखिएको छ। तपाईंले अनुमति नदिएसम्म server मा draft पठाइँदैन।</p>
        {captured > 0 && <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={consentSave} onChange={e => setConsentSave(e.target.checked)} />
          मेरो room जानकारीबाट draft बनाउन र PostgreSQL मा सुरक्षित गर्न अनुमति छ।
        </label>}
        <div className="flex justify-center gap-2">
          {captured > 0 && <button disabled={!consentSave || saving} onClick={() => void saveDraft()} className="rounded-lg bg-green-700 px-4 py-2 text-white disabled:opacity-50">Save room draft</button>}
          <button onClick={close} className="rounded-lg border px-4 py-2">Close without saving</button>
        </div>
      </>}
      <p className="text-xs text-muted-foreground">Realtime WebRTC voice. Raw audio is not saved by RoomKhoj AI Calling.</p>
    </div>
  </div>;
}
