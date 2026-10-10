"use client";

import { useEffect, useRef, useState } from "react";

type Signal = { type: "offer" | "answer"; sdp: string; candidates: RTCIceCandidateInit[] };

export default function BrowserCallTestPage() {
  const peer = useRef<RTCPeerConnection | null>(null);
  const local = useRef<MediaStream | null>(null);
  const remoteAudio = useRef<HTMLAudioElement | null>(null);
  const [outgoing, setOutgoing] = useState("");
  const [incoming, setIncoming] = useState("");
  const [status, setStatus] = useState("Idle");
  const [busy, setBusy] = useState(false);

  function cleanup() {
    peer.current?.close(); peer.current = null;
    local.current?.getTracks().forEach(track => track.stop()); local.current = null;
    if (remoteAudio.current) remoteAudio.current.srcObject = null;
    setBusy(false);
  }
  useEffect(() => () => { peer.current?.close(); local.current?.getTracks().forEach(t => t.stop()); }, []);

  async function setup() {
    cleanup();
    const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true }, video: false });
    local.current = stream;
    const pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
    peer.current = pc;
    stream.getTracks().forEach(track => pc.addTrack(track, stream));
    pc.ontrack = event => { if (remoteAudio.current) remoteAudio.current.srcObject = event.streams[0]; };
    pc.onconnectionstatechange = () => setStatus("Connection: " + pc.connectionState);
    pc.oniceconnectionstatechange = () => setStatus("ICE: " + pc.iceConnectionState);
    setBusy(true);
    return pc;
  }

  async function gather(pc: RTCPeerConnection) {
    if (pc.iceGatheringState !== "complete") {
      await new Promise<void>((resolve, reject) => {
        const timeout = window.setTimeout(() => { pc.removeEventListener("icegatheringstatechange", done); reject(new Error("ICE gathering timed out")); }, 15000);
        const done = () => { if (pc.iceGatheringState === "complete") { window.clearTimeout(timeout); pc.removeEventListener("icegatheringstatechange", done); resolve(); } };
        pc.addEventListener("icegatheringstatechange", done);
        done();
      });
    }
    const description = pc.localDescription;
    if (!description?.sdp || (description.type !== "offer" && description.type !== "answer")) throw new Error("No local SDP");
    const payload: Signal = { type: description.type, sdp: description.sdp, candidates: [] };
    setOutgoing(JSON.stringify(payload));
  }

  function parseSignal(type: "offer" | "answer"): Signal {
    if (incoming.length > 250000) throw new Error("Signal is too large");
    const value = JSON.parse(incoming) as Signal;
    if (value.type !== type || typeof value.sdp !== "string" || value.sdp.length > 200000) throw new Error("Invalid " + type + " signal");
    return value;
  }

  async function run(action: "offer" | "answer" | "connect") {
    try {
      setStatus("Preparing microphone and connection…");
      if (action === "offer") {
        const pc = await setup();
        await pc.setLocalDescription(await pc.createOffer());
        await gather(pc);
        setStatus("Copy offer to the other browser");
      } else if (action === "answer") {
        const signal = parseSignal("offer");
        const pc = await setup();
        await pc.setRemoteDescription({ type: "offer", sdp: signal.sdp });
        await pc.setLocalDescription(await pc.createAnswer());
        await gather(pc);
        setStatus("Copy answer back to the first browser");
      } else {
        const signal = parseSignal("answer");
        if (!peer.current || peer.current.signalingState !== "have-local-offer") throw new Error("Create an offer first");
        await peer.current.setRemoteDescription({ type: "answer", sdp: signal.sdp });
        setStatus("Connecting audio…");
      }
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Connection failed");
      if (action !== "connect") cleanup();
    }
  }

  return <main className="mx-auto max-w-3xl space-y-5 p-4 md:p-8">
    <h1 className="text-2xl font-bold">Website-to-Website Audio Test</h1>
    <p className="text-sm text-muted-foreground">Two browsers can make a direct microphone call without SIM or SIP. Use HTTPS. This is human-to-human audio, not an AI conversation. No call is recorded.</p>
    <div className="rounded-lg border p-4 space-y-3">
      <p className="font-medium">Step 1 — Browser A</p>
      <button className="rounded bg-blue-700 px-4 py-2 text-white" onClick={() => void run("offer")}>Create call offer</button>
      <p className="text-sm">Copy the offer below and send it privately to Browser B.</p>
    </div>
    <div className="rounded-lg border p-4 space-y-3">
      <p className="font-medium">Step 2 — Browser B</p>
      <label htmlFor="signal" className="block text-sm">Paste offer from A, or answer from B (on A)</label>
      <textarea id="signal" className="w-full rounded border bg-background p-2 font-mono text-xs" rows={5} value={incoming} onChange={e => setIncoming(e.target.value)} placeholder="Paste signaling JSON here" />
      <button className="rounded bg-blue-700 px-4 py-2 text-white" onClick={() => void run("answer")}>Accept offer and create answer</button>
      <p className="text-sm">Copy the answer below and send it privately to Browser A.</p>
    </div>
    <div className="rounded-lg border p-4 space-y-3">
      <p className="font-medium">Step 3 — Browser A</p>
      <button className="rounded bg-blue-700 px-4 py-2 text-white" onClick={() => void run("connect")}>Connect using pasted answer</button>
      <p className="text-sm">Once connected, talk normally through the two devices.</p>
    </div>
    <div className="rounded-lg border p-4 space-y-3">
      <label htmlFor="outgoing" className="font-medium">Your offer / answer</label>
      <textarea id="outgoing" readOnly className="w-full rounded border bg-background p-2 font-mono text-xs" rows={5} value={outgoing} />
      <button className="rounded border px-4 py-2" disabled={!outgoing} onClick={() => void navigator.clipboard.writeText(outgoing)}>Copy signal</button>
      <p role="status" className="text-sm">Status: {status}</p>
      <audio ref={remoteAudio} autoPlay controls playsInline className="w-full" />
      <button className="rounded bg-red-700 px-4 py-2 text-white disabled:opacity-50" disabled={!busy} onClick={() => { cleanup(); setStatus("Call ended"); }}>Hang up</button>
    </div>
    <p className="text-xs text-muted-foreground">Direct WebRTC can fail behind restrictive NAT/firewalls without a TURN relay. Do not publish SDP publicly; it may contain network information.</p>
  </main>;
}
