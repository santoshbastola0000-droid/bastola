"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Packet = { type: string; callId?: string; reason?: string; signal?: RTCSessionDescriptionInit | RTCIceCandidateInit; message?: string };
const backend = (process.env.NEXT_PUBLIC_BACKEND_URL || "https://api.roomkhoj.com").replace(/^http/, "ws").replace(/\/$/, "");
const rtc: RTCConfiguration = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };

export function useAccountBrowserCall() {
  const socket = useRef<WebSocket | null>(null);
  const peer = useRef<RTCPeerConnection | null>(null);
  const local = useRef<MediaStream | null>(null);
  const audio = useRef<HTMLAudioElement | null>(null);
  const active = useRef("");
  const caller = useRef(false);
  const [status, setStatus] = useState("Connecting…");
  const [incoming, setIncoming] = useState(false);
  const [callId, setCallId] = useState("");
  const send = useCallback((message: Packet & { phone?: string }) => {
    if (socket.current?.readyState === WebSocket.OPEN) socket.current.send(JSON.stringify(message));
  }, []);
  const cleanup = useCallback(() => {
    peer.current?.close(); peer.current = null;
    local.current?.getTracks().forEach(t => t.stop()); local.current = null;
    if (audio.current) audio.current.srcObject = null;
    active.current = ""; setCallId(""); setIncoming(false);
  }, []);
  const startMedia = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
    local.current = stream;
    const pc = new RTCPeerConnection(rtc); peer.current = pc;
    stream.getTracks().forEach(t => pc.addTrack(t, stream));
    pc.onicecandidate = e => { if (e.candidate && active.current) send({ type: "candidate", callId: active.current, signal: e.candidate.toJSON() }); };
    pc.ontrack = e => { if (audio.current) { audio.current.srcObject = e.streams[0]; void audio.current.play().catch(() => setStatus("Tap Play audio to hear the call")); } };
    pc.onconnectionstatechange = () => { if (pc.connectionState === "connected") setStatus("Connected"); if (pc.connectionState === "failed") setStatus("Connection failed: TURN server may be required"); };
    return pc;
  }, [send]);
  useEffect(() => {
    let disposed = false;
    const ws = new WebSocket(backend + "/account-browser-call/ws");
    socket.current = ws;
    ws.onopen = () => { if (!disposed) setStatus("Online — ready for calls"); };
    ws.onerror = () => { if (!disposed) setStatus("Calling server unavailable"); };
    ws.onclose = () => { if (!disposed) { cleanup(); setStatus("Offline — sign in to RoomKhoj and refresh"); } };
    ws.onmessage = e => { void (async () => {
      const m = JSON.parse(e.data) as Packet;
      if (m.type === "incoming" && m.callId && !active.current) { active.current = m.callId; caller.current = false; setCallId(m.callId); setIncoming(true); setStatus("Incoming RoomKhoj call"); }
      if (m.type === "ringing" && m.callId) { active.current = m.callId; caller.current = true; setCallId(m.callId); setStatus("Ringing…"); }
      if (m.type === "accepted" && m.callId === active.current) {
        setIncoming(false); setStatus("Connecting audio…");
        if (caller.current) {
          try { const pc = await startMedia(); const offer = await pc.createOffer(); await pc.setLocalDescription(offer); send({type:"offer",callId:m.callId,signal:offer}); }
          catch { send({type:"hangup",callId:m.callId}); cleanup(); setStatus("Microphone permission denied"); }
        }
      }
      if (m.type === "offer" && m.callId === active.current && !caller.current && m.signal) {
        try { const pc = await startMedia(); await pc.setRemoteDescription(m.signal as RTCSessionDescriptionInit); const answer = await pc.createAnswer(); await pc.setLocalDescription(answer); send({type:"answer",callId:m.callId,signal:answer}); }
        catch { send({type:"hangup",callId:m.callId}); cleanup(); setStatus("Could not answer audio call"); }
      }
      if (m.type === "answer" && m.callId === active.current && caller.current && m.signal) await peer.current?.setRemoteDescription(m.signal as RTCSessionDescriptionInit).catch(() => setStatus("Invalid answer"));
      if (m.type === "candidate" && m.callId === active.current && m.signal) await peer.current?.addIceCandidate(m.signal as RTCIceCandidateInit).catch(() => {});
      if (m.type === "ended" && m.callId === active.current) { cleanup(); setStatus("Call ended: " + (m.reason || "ended")); }
      if (["offline","busy","unavailable","error"].includes(m.type)) { cleanup(); setStatus(m.message || m.type); }
    })().catch(() => setStatus("Call signaling error")); };
    return () => { disposed = true; ws.close(); cleanup(); };
  }, [cleanup, send, startMedia]);
  const call = (phone: string) => {
    if (active.current) return; caller.current = true; setStatus("Calling account…"); send({ type: "call", phone });
  };
  const accept = async () => {
    if (!active.current) return;
    try { // User-gesture permission and audio playback are required on mobile browsers.
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(t => t.stop());
      send({ type: "accept", callId: active.current }); setIncoming(false); setStatus("Answering…");
    } catch { setStatus("Allow microphone permission before accepting"); }
  };
  const reject = () => { if (active.current) send({ type: "reject", callId: active.current }); cleanup(); setStatus("Rejected"); };
  const hangup = () => { if (active.current) send({ type: "hangup", callId: active.current }); cleanup(); setStatus("Call ended"); };
  return { status, incoming, callId, call, accept, reject, hangup, audio };
}
