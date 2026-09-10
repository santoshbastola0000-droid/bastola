"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Mic, MicOff, PhoneOff, Sparkles, Volume2 } from "lucide-react";
import useTokenStore from "@/store";

const API = "https://api.roomkhoj.com";
const BACKCHANNELS = ["हजुर", "अँ", "उम्", "अहा"];

type VoicePhase = "idle" | "listening" | "thinking" | "speaking" | "interrupted" | "error";

function makeId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

function guestId() {
  if (typeof window === "undefined") return "";
  const key = "roomkhoj_guest_session_id";
  const existing = localStorage.getItem(key);
  if (existing) return existing;
  const value = makeId();
  localStorage.setItem(key, value);
  return value;
}

export default function LiveVoicePage() {
  const router = useRouter();
  const token = useTokenStore((state) => state.token);
  const conversationId = useMemo(() => makeId(), []);
  const [guestSessionId] = useState(() => guestId());
  const [phase, setPhase] = useState<VoicePhase>("idle");
  const [status, setStatus] = useState("Tap the mic to start");
  const [lastHeard, setLastHeard] = useState("");
  const [lastReply, setLastReply] = useState("");
  const [active, setActive] = useState(false);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const contextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const vadFrameRef = useRef<number | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const bargeStreamRef = useRef<MediaStream | null>(null);
  const bargeContextRef = useRef<AudioContext | null>(null);
  const bargeFrameRef = useRef<number | null>(null);
  const activeRef = useRef(false);
  const processingRef = useRef(false);
  const backchannelAtRef = useRef(0);

  const stopTracks = (stream: MediaStream | null) => {
    stream?.getTracks().forEach((track) => track.stop());
  };

  const stopVad = useCallback(() => {
    if (vadFrameRef.current !== null) cancelAnimationFrame(vadFrameRef.current);
    vadFrameRef.current = null;
    if (contextRef.current) void contextRef.current.close().catch(() => undefined);
    contextRef.current = null;
    analyserRef.current = null;
    stopTracks(streamRef.current);
    streamRef.current = null;
  }, []);

  const stopBargeMonitor = useCallback(() => {
    if (bargeFrameRef.current !== null) cancelAnimationFrame(bargeFrameRef.current);
    bargeFrameRef.current = null;
    stopTracks(bargeStreamRef.current);
    bargeStreamRef.current = null;
    if (bargeContextRef.current) void bargeContextRef.current.close().catch(() => undefined);
    bargeContextRef.current = null;
  }, []);

  const fadeStopAssistant = useCallback(async () => {
    stopBargeMonitor();
    const audio = audioRef.current;
    if (audio) {
      const startVolume = audio.volume;
      const started = performance.now();
      await new Promise<void>((resolve) => {
        const fade = () => {
          const p = Math.min(1, (performance.now() - started) / 220);
          audio.volume = Math.max(0, startVolume * (1 - p));
          if (p < 1 && !audio.paused) requestAnimationFrame(fade);
          else resolve();
        };
        requestAnimationFrame(fade);
      });
      audio.pause();
      audio.src = "";
      audioRef.current = null;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setPhase("interrupted");
    setStatus("सुन्दैछु…");
  }, [stopBargeMonitor]);

  const speakBackchannel = useCallback(() => {
    const now = performance.now();
    if (now - backchannelAtRef.current < 2600) return;
    backchannelAtRef.current = now;
    const word = BACKCHANNELS[Math.floor(Math.random() * BACKCHANNELS.length)];
    // Visual backchannel only while recording. Audible filler can leak into the mic
    // and be transcribed as caller speech even with echo cancellation enabled.
    setStatus(`${word}… सुन्दैछु, बोलिरहनुहोस्`);
  }, []);

  const startBargeMonitor = useCallback(async () => {
    if (!activeRef.current || !navigator.mediaDevices?.getUserMedia) return;
    stopBargeMonitor();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      bargeStreamRef.current = stream;
      const AC = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AC();
      bargeContextRef.current = ctx;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      ctx.createMediaStreamSource(stream).connect(analyser);
      const buf = new Uint8Array(analyser.fftSize);
      let loudSince = 0;
      let noiseFloor = 0.012;
      const loop = () => {
        if (!activeRef.current || (!audioRef.current && !("speechSynthesis" in window && window.speechSynthesis.speaking))) {
          stopBargeMonitor();
          return;
        }
        analyser.getByteTimeDomainData(buf);
        let sum = 0;
        for (const value of buf) {
          const n = (value - 128) / 128;
          sum += n * n;
        }
        const rms = Math.sqrt(sum / buf.length);
        const now = performance.now();
        noiseFloor = noiseFloor * 0.985 + Math.min(rms, 0.08) * 0.015;
        const bargeThreshold = Math.max(0.035, Math.min(0.10, noiseFloor * 2.8));
        if (rms > bargeThreshold) {
          if (!loudSince) loudSince = now;
          if (now - loudSince > 170) {
            void fadeStopAssistant().then(() => startListening());
            return;
          }
        } else {
          loudSince = 0;
        }
        bargeFrameRef.current = requestAnimationFrame(loop);
      };
      bargeFrameRef.current = requestAnimationFrame(loop);
    } catch {
      stopBargeMonitor();
    }
  }, [fadeStopAssistant, stopBargeMonitor]);

  const speakBrowser = useCallback((text: string) => {
    if (!("speechSynthesis" in window)) {
      setPhase("error");
      setStatus("Voice playback यो browser मा उपलब्ध छैन");
      return;
    }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text.slice(0, 1400));
    const voices = window.speechSynthesis.getVoices();
    u.voice = voices.find((v) => v.lang.toLowerCase().startsWith("ne")) ||
      voices.find((v) => v.lang.toLowerCase().startsWith("hi")) || voices[0] || null;
    u.lang = u.voice?.lang || "ne-NP";
    u.rate = 0.94;
    u.onstart = () => { setPhase("speaking"); setStatus("RoomKhoj AI बोल्दैछ…"); void startBargeMonitor(); };
    u.onend = () => { stopBargeMonitor(); if (activeRef.current) void startListening(); };
    u.onerror = () => { stopBargeMonitor(); if (activeRef.current) void startListening(); };
    window.speechSynthesis.speak(u);
  }, [startBargeMonitor, stopBargeMonitor]);

  const speakReply = useCallback(async (text: string) => {
    if (!activeRef.current || !text.trim()) return;
    setLastReply(text);
    if (!token) {
      speakBrowser(text);
      return;
    }
    try {
      setPhase("thinking");
      setStatus("आवाज तयार हुँदैछ…");
      const res = await fetch(`${API}/ai-call/speak`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.slice(0, 1400) }),
      });
      if (!res.ok) throw new Error("tts");
      const url = URL.createObjectURL(await res.blob());
      const audio = new Audio(url);
      audio.volume = 1;
      audioRef.current = audio;
      audio.onplay = () => { setPhase("speaking"); setStatus("RoomKhoj AI बोल्दैछ…"); void startBargeMonitor(); };
      audio.onended = () => {
        stopBargeMonitor();
        URL.revokeObjectURL(url);
        if (audioRef.current === audio) audioRef.current = null;
        if (activeRef.current) void startListening();
      };
      audio.onerror = () => {
        stopBargeMonitor();
        URL.revokeObjectURL(url);
        if (audioRef.current === audio) audioRef.current = null;
        speakBrowser(text);
      };
      await audio.play();
    } catch {
      speakBrowser(text);
    }
  }, [speakBrowser, startBargeMonitor, stopBargeMonitor, token]);

  const askAI = useCallback(async (transcript: string) => {
    processingRef.current = true;
    setLastHeard(transcript);
    setPhase("thinking");
    setStatus("बुझ्दैछु…");
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch(`${API}/ai-v3/chat`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          message: transcript.slice(0, 2000),
          conversationId,
          guestSessionId: token ? undefined : guestSessionId,
          source: "LIVE_VOICE",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Voice assistant error");
      const reply = String(data?.reply?.reply || data?.reply || data?.response?.reply || data?.message || "").trim();
      await speakReply(reply || "हजुर, फेरि एकपटक भन्नुहोस्।");
    } catch (error) {
      setPhase("error");
      setStatus(error instanceof Error ? error.message : "Connection problem");
      if (activeRef.current) window.setTimeout(() => void startListening(), 800);
    } finally {
      processingRef.current = false;
    }
  }, [conversationId, guestSessionId, speakReply, token]);

  const transcribeBlob = useCallback(async (blob: Blob) => {
    if (!token) throw new Error("Login गरेर Live Voice प्रयोग गर्नुहोस्।");
    const form = new FormData();
    form.append("audio", blob, "roomkhoj-live.webm");
    const res = await fetch(`${API}/ai-call/transcribe`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message || "आवाज बुझ्न सकिएन");
    return String(data?.data?.text || data?.text || "").trim();
  }, [token]);

  const startListening = useCallback(async () => {
    if (!activeRef.current || processingRef.current || recorderRef.current?.state === "recording") return;
    if (!navigator.mediaDevices?.getUserMedia) {
      setPhase("error");
      setStatus("Microphone उपलब्ध छैन");
      return;
    }
    if (!token) {
      setPhase("error");
      setStatus("Live Voice का लागि login आवश्यक छ");
      return;
    }
    try {
      stopVad();
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1 },
      });
      streamRef.current = stream;
      const AC = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AC();
      contextRef.current = ctx;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.62;
      ctx.createMediaStreamSource(stream).connect(analyser);
      analyserRef.current = analyser;

      const types = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus"];
      const mime = types.find((t) => MediaRecorder.isTypeSupported(t)) || "";
      const recorder = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
      recorderRef.current = recorder;
      chunksRef.current = [];
      let speechStarted = false;
      let speechStartAt = 0;
      let lastSpeechAt = performance.now();
      let pauseBackchannelPlayed = false;
      let noiseFloor = 0.007;
      let voiceRunMs = 0;
      let previousFrameAt = performance.now();

      recorder.ondataavailable = (e) => { if (e.data.size) chunksRef.current.push(e.data); };
      recorder.onstop = async () => {
        stopVad();
        recorderRef.current = null;
        if (!activeRef.current || !speechStarted) return;
        try {
          setPhase("thinking");
          setStatus("आवाज बुझ्दैछु…");
          const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
          chunksRef.current = [];
          const text = await transcribeBlob(blob);
          if (text) await askAI(text);
          else if (activeRef.current) void startListening();
        } catch (error) {
          setPhase("error");
          setStatus(error instanceof Error ? error.message : "आवाज बुझ्न सकिएन");
          if (activeRef.current) window.setTimeout(() => void startListening(), 700);
        }
      };

      recorder.start(250);
      setPhase("listening");
      setStatus("सुन्दैछु… बोल्नुहोस्");
      const buf = new Uint8Array(analyser.fftSize);
      const listenStart = performance.now();
      const loop = () => {
        if (!activeRef.current || recorder.state !== "recording") return;
        analyser.getByteTimeDomainData(buf);
        let sum = 0;
        for (const value of buf) {
          const n = (value - 128) / 128;
          sum += n * n;
        }
        const rms = Math.sqrt(sum / buf.length);
        const now = performance.now();
        const frameMs = Math.max(8, Math.min(80, now - previousFrameAt));
        previousFrameAt = now;
        if (!speechStarted) noiseFloor = noiseFloor * 0.965 + Math.min(rms, 0.05) * 0.035;
        const speechThreshold = Math.max(0.012, Math.min(0.045, noiseFloor * 2.25));
        if (rms >= speechThreshold) {
          voiceRunMs += frameMs;
          if (!speechStarted && voiceRunMs < 80) {
            vadFrameRef.current = requestAnimationFrame(loop);
            return;
          }
          if (!speechStarted) { speechStarted = true; speechStartAt = now; }
          lastSpeechAt = now;
          pauseBackchannelPlayed = false;
          if ("speechSynthesis" in window && window.speechSynthesis.speaking) window.speechSynthesis.cancel();
          setStatus("सुन्दैछु… बोलिरहनुहोस्");
        } else if (speechStarted) {
          voiceRunMs = 0;
          const pause = now - lastSpeechAt;
          if (pause > 700 && pause < 1350 && !pauseBackchannelPlayed && now - speechStartAt > 1100) {
            pauseBackchannelPlayed = true;
            speakBackchannel();
          }
          if (pause >= 1550 && now - speechStartAt > 350) {
            recorder.stop();
            return;
          }
        }
        if (!speechStarted && now - listenStart > 10000) {
          recorder.stop();
          if (activeRef.current) window.setTimeout(() => void startListening(), 250);
          return;
        }
        if (speechStarted && now - speechStartAt > 25000) {
          recorder.stop();
          return;
        }
        vadFrameRef.current = requestAnimationFrame(loop);
      };
      vadFrameRef.current = requestAnimationFrame(loop);
    } catch {
      setPhase("error");
      setStatus("Microphone permission चाहिन्छ");
      stopVad();
    }
  }, [askAI, speakBackchannel, stopVad, token, transcribeBlob]);

  const startConversation = useCallback(async () => {
    activeRef.current = true;
    setActive(true);
    setStatus("Live Voice सुरु हुँदैछ…");
    await speakReply("नमस्कार। म RoomKhoj AI हुँ। तपाईंको कुरा पहिले सुन्छु। भन्नुहोस्, के सहयोग चाहिएको हो?");
  }, [speakReply]);

  const stopConversation = useCallback(() => {
    activeRef.current = false;
    setActive(false);
    processingRef.current = false;
    if (recorderRef.current?.state === "recording") {
      try { recorderRef.current.stop(); } catch {}
    }
    recorderRef.current = null;
    stopVad();
    stopBargeMonitor();
    const audio = audioRef.current;
    if (audio) { audio.pause(); audio.src = ""; audioRef.current = null; }
    if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
    setPhase("idle");
    setStatus("Voice session ended");
  }, [stopBargeMonitor, stopVad]);

  useEffect(() => () => stopConversation(), [stopConversation]);

  const orbScale = phase === "listening" ? "scale-110" : phase === "speaking" ? "scale-105" : "scale-100";

  return (
    <main className="min-h-[100dvh] overflow-hidden bg-[#0b0b0d] text-white">
      <div className="mx-auto flex min-h-[100dvh] max-w-3xl flex-col px-5 pb-[max(24px,env(safe-area-inset-bottom))] pt-5 sm:px-8">
        <header className="flex items-center justify-between">
          <button onClick={() => { stopConversation(); router.back(); }} className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 hover:bg-white/15" aria-label="Back">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="text-center">
            <p className="text-sm font-semibold">RoomKhoj Live Voice</p>
            <p className="text-[11px] text-white/45">Rooms • Jobs • Career</p>
          </div>
          <button onClick={stopConversation} className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 hover:bg-white/15" aria-label="End voice">
            <PhoneOff className="h-5 w-5" />
          </button>
        </header>

        <section className="flex flex-1 flex-col items-center justify-center py-8 text-center">
          <div className="relative mb-10 flex h-64 w-64 items-center justify-center sm:h-72 sm:w-72">
            <div className={`absolute inset-0 rounded-full bg-gradient-to-br from-cyan-400/30 via-violet-500/30 to-fuchsia-500/30 blur-3xl transition-transform duration-500 ${orbScale}`} />
            <div className={`absolute inset-6 rounded-full border border-white/10 bg-[radial-gradient(circle_at_35%_25%,rgba(255,255,255,.24),rgba(116,72,255,.18)_35%,rgba(0,0,0,.3)_72%)] shadow-[0_0_80px_rgba(114,73,255,.24)] transition-all duration-500 ${orbScale}`} />
            <div className="relative flex h-28 w-28 items-center justify-center rounded-full bg-white/10 backdrop-blur-xl">
              {phase === "speaking" ? <Volume2 className="h-12 w-12" /> : phase === "listening" ? <Mic className="h-12 w-12" /> : <Sparkles className="h-12 w-12" />}
            </div>
          </div>

          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{status}</h1>
          <p className="mt-3 max-w-lg text-sm leading-6 text-white/50">
            तपाईं बोल्दा AI चुप लागेर सुन्छ। बीचमा सानो pause हुँदा मात्र हल्का “हजुर/उम्” backchannel दिन सक्छ। तपाईं AI बोलिरहँदा बोल्न थाल्नुभयो भने AI आवाज fade भएर रोकिन्छ र फेरि तपाईंलाई सुन्छ।
          </p>

          {(lastHeard || lastReply) && (
            <div className="mt-8 w-full max-w-xl rounded-3xl border border-white/10 bg-white/[0.04] p-4 text-left backdrop-blur-xl">
              {lastHeard && <p className="text-xs leading-5 text-white/55"><span className="font-semibold text-white/80">You:</span> {lastHeard}</p>}
              {lastReply && <p className="mt-2 line-clamp-3 text-xs leading-5 text-white/45"><span className="font-semibold text-white/70">AI:</span> {lastReply}</p>}
            </div>
          )}
        </section>

        <footer className="flex items-center justify-center gap-5">
          <button
            type="button"
            onClick={active ? stopConversation : () => void startConversation()}
            className={`flex h-20 w-20 items-center justify-center rounded-full shadow-2xl transition active:scale-95 ${active ? "bg-white text-black" : "bg-white text-black"}`}
            aria-label={active ? "End voice" : "Start voice"}
          >
            {active ? <MicOff className="h-8 w-8" /> : <Mic className="h-8 w-8" />}
          </button>
        </footer>
      </div>
    </main>
  );
}
