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
  const [callId, setCallId] = useState("");
  const [connected, setConnected] = useState(false);
  const [status, setStatus] = useState("");

  const cleanup = useCallback(() => {
    peer.current?.close(); peer.current = null;
    mic.current?.getTracks().forEach(track => track.stop()); mic.current = null;
    if (audio.current) { audio.current.pause(); audio.current.srcObject = null; }
    active.current = ""; setCallId(""); setConnected(false); setStatus("");
  }, []);

  useEffect(() => {
    if (!token) return;
    const s = io(API + "/messages", { auth: { token }, transports: ["polling", "websocket"], withCredentials: true });
    socket.current = s;
    s.on("ai-owner:incoming", (data: { callId?: string }) => {
      if (!data.callId || active.current) return;
      active.current = data.callId;
      setCallId(data.callId);
      setStatus("RoomKhoj AI बाट incoming call");
    });
    s.on("ai-owner:ended", (data: { callId?: string }) => {
      if (data.callId === active.current) cleanup();
    });
    return () => { s.disconnect(); socket.current = null; cleanup(); };
  }, [token, cleanup]);

  const end = () => {
    if (active.current) socket.current?.emit("ai-owner:end", { callId: active.current });
    cleanup();
  };

  const accept = async () => {
    const id = active.current;
    if (!id || !socket.current) return;
    setStatus("Connecting real-time AI voice…");
    try {
      // iOS Safari requires microphone capture following an explicit tap.
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      mic.current = stream;
      const accepted = await socket.current.timeout(12000).emitWithAck("ai-owner:respond", { callId: id, accept: true }) as { success?: boolean };
      if (!accepted?.success) throw new Error("Call acceptance failed");
      const result = await socket.current.timeout(15000).emitWithAck("ai-owner:realtime-token", { callId: id }) as TokenResult;
      if (!result.success || !result.token) throw new Error(result.error || "Realtime AI unavailable");
      if (active.current !== id) return;
      const pc = new RTCPeerConnection();
      peer.current = pc;
      stream.getAudioTracks().forEach(track => pc.addTrack(track, stream));
      pc.ontrack = event => {
        if (audio.current) {
          audio.current.srcObject = event.streams[0];
          void audio.current.play().catch(() => setStatus("Tap the audio player to hear AI"));
        }
      };
      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "connected") { setConnected(true); setStatus("AI सँग live कुरा गर्नुहोस्"); }
        if (["failed", "closed"].includes(pc.connectionState)) setStatus("AI audio connection ended");
      };
      const channel = pc.createDataChannel("oai-events");
      channel.onopen = () => {
        channel.send(JSON.stringify({ type: "response.create", response: { instructions: "Greet the caller in Nepali, identify yourself as RoomKhoj AI, then ask whether now is a good time to talk." } }));
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
      peer.current?.close(); peer.current = null;
      mic.current?.getTracks().forEach(track => track.stop()); mic.current = null;
      if (id === active.current) socket.current?.emit("ai-owner:end", { callId: id });
    }
  };

  if (!callId) return null;
  return <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/70 p-4">
    <div className="w-full max-w-md space-y-4 rounded-2xl bg-background p-6 text-center shadow-xl">
      <h2 className="text-xl font-bold">RoomKhoj AI Live Call</h2>
      <p className="text-sm">यो RoomKhoj को AI सहायक हो, मानव कर्मचारी होइन।</p>
      <p role="status" className="text-sm">{status}</p>
      <audio ref={audio} autoPlay controls playsInline className="w-full" />
      {!connected && <button onClick={() => void accept()} disabled={status.startsWith("Connecting")} className="rounded-lg bg-green-700 px-5 py-3 text-white disabled:opacity-50">Accept AI Call</button>}
      <button onClick={end} className="ml-2 rounded-lg bg-red-700 px-5 py-3 text-white">{connected ? "End Call" : "Decline"}</button>
      <p className="text-xs text-muted-foreground">Live two-way voice via WebRTC. No call transcript is saved by this feature.</p>
    </div>
  </div>;
}
