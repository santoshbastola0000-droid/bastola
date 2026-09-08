"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AudioLines, Mic, MicOff, X } from "lucide-react";
import useTokenStore from "@/store";
import { cn } from "@/lib/utils";

const API_BASE = "https://api.roomkhoj.com";
type ModeState = "idle" | "listening" | "thinking" | "speaking" | "muted" | "error";

export function ChatGPTStyleVoiceMode() {
  const token = useTokenStore((state) => state.token);
  const [chatOpen, setChatOpen] = useState(false);
  const [open, setOpen] = useState(false);
  const [muted, setMuted] = useState(false);
  const [state, setState] = useState<ModeState>("idle");
  const [status, setStatus] = useState("RoomKhoj AI सँग कुरा गर्नुहोस्");

  const openRef = useRef(false);
  const mutedRef = useRef(false);
  const busyRef = useRef(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const contextRef = useRef<AudioContext | null>(null);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const onOpen = () => setChatOpen(true);
    const onClose = () => setChatOpen(false);
    window.addEventListener("open-roomkhoj-chatbot", onOpen);
    window.addEventListener("close-roomkhoj-chatbot", onClose);
    return () => {
      window.removeEventListener("open-roomkhoj-chatbot", onOpen);
      window.removeEventListener("close-roomkhoj-chatbot", onClose);
    };
  }, []);

  const stopCapture = useCallback(() => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
    if (contextRef.current) {
      void contextRef.current.close().catch(() => undefined);
      contextRef.current = null;
    }
    if (recorderRef.current?.state === "recording") {
      try { recorderRef.current.stop(); } catch {}
    }
    recorderRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const stopPlayback = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
  }, []);

  const endMode = useCallback(() => {
    openRef.current = false;
    mutedRef.current = false;
    busyRef.current = false;
    setOpen(false);
    setMuted(false);
    setState("idle");
    setStatus("RoomKhoj AI सँग कुरा गर्नुहोस्");
    stopCapture();
    stopPlayback();
  }, [stopCapture, stopPlayback]);

  const startListening = useCallback(async () => {
    if (!openRef.current || mutedRef.current || busyRef.current) return;
    if (!token) {
      setState("error");
      setStatus("Live conversation चलाउन login गर्नुहोस्");
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setState("error");
      setStatus("यो browser मा microphone उपलब्ध छैन");
      return;
    }

    stopCapture();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1 },
      });
      if (!openRef.current || mutedRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      streamRef.current = stream;

      const preferred = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"];
      const mimeType = preferred.find((type) => MediaRecorder.isTypeSupported(type)) || "";
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      recorderRef.current = recorder;
      chunksRef.current = [];

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const context = new AudioContextClass();
      contextRef.current = context;
      const source = context.createMediaStreamSource(stream);
      const analyser = context.createAnalyser();
      analyser.fftSize = 1024;
      analyser.smoothingTimeConstant = 0.58;
      source.connect(analyser);

      let speechStarted = false;
      let speechStart = 0;
      let lastVoice = performance.now();
      const listenStart = performance.now();
      let validTurn = false;

      recorder.ondataavailable = (event) => {
        if (event.data?.size) chunksRef.current.push(event.data);
      };

      recorder.onstop = async () => {
        if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
        if (contextRef.current) void contextRef.current.close().catch(() => undefined);
        contextRef.current = null;
        stream.getTracks().forEach((track) => track.stop());
        if (streamRef.current === stream) streamRef.current = null;
        if (recorderRef.current === recorder) recorderRef.current = null;

        const parts = chunksRef.current;
        chunksRef.current = [];
        if (!validTurn || !openRef.current || mutedRef.current) {
          if (openRef.current && !mutedRef.current && !busyRef.current) window.setTimeout(() => void startListening(), 150);
          return;
        }

        const blob = new Blob(parts, { type: recorder.mimeType || "audio/webm" });
        if (blob.size < 800) {
          window.setTimeout(() => void startListening(), 150);
          return;
        }

        busyRef.current = true;
        setState("thinking");
        setStatus("बुझ्दैछु...");

        try {
          const form = new FormData();
          const ext = blob.type.includes("mp4") ? "m4a" : blob.type.includes("ogg") ? "ogg" : "webm";
          form.append("audio", blob, `roomkhoj-natural-talk.${ext}`);
          const t = await fetch(`${API_BASE}/ai-call/transcribe`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            body: form,
          });
          const td = await t.json().catch(() => ({}));
          if (!t.ok) throw new Error("transcription failed");
          const transcript = String(td?.data?.text || td?.text || "").trim();
          if (!transcript) throw new Error("empty transcript");

          const c = await fetch(`${API_BASE}/ai-v3/chat`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
            body: JSON.stringify({ message: transcript.slice(0, 1800) }),
          });
          const cd = await c.json().catch(() => ({}));
          if (!c.ok) throw new Error("chat failed");
          const obj = typeof cd?.reply === "object" && cd.reply !== null ? cd.reply : cd;
          const reply = typeof obj === "string" ? obj : String(obj?.reply || obj?.text || obj?.message || obj?.content || "").trim();
          if (!reply) throw new Error("empty reply");

          setState("speaking");
          setStatus("RoomKhoj AI बोल्दैछ...");
          const s = await fetch(`${API_BASE}/ai-call/speak`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
            body: JSON.stringify({ text: reply.slice(0, 1100) }),
          });
          if (!s.ok) throw new Error("speech failed");
          const audioBlob = await s.blob();
          const url = URL.createObjectURL(audioBlob);
          const audio = new Audio(url);
          audioRef.current = audio;
          audio.onended = () => {
            URL.revokeObjectURL(url);
            if (audioRef.current === audio) audioRef.current = null;
            busyRef.current = false;
            if (openRef.current && !mutedRef.current) void startListening();
          };
          audio.onerror = () => {
            URL.revokeObjectURL(url);
            if (audioRef.current === audio) audioRef.current = null;
            busyRef.current = false;
            if (openRef.current && !mutedRef.current) void startListening();
          };
          await audio.play();
        } catch {
          busyRef.current = false;
          setState("error");
          setStatus("फेरि एकपटक बोल्नुहोस्");
          if (openRef.current && !mutedRef.current) window.setTimeout(() => void startListening(), 500);
        }
      };

      recorder.start(200);
      setState("listening");
      setStatus("सुन्दैछु...");
      const samples = new Uint8Array(analyser.fftSize);
      const monitor = () => {
        if (recorder.state !== "recording" || !openRef.current || mutedRef.current) return;
        analyser.getByteTimeDomainData(samples);
        let sum = 0;
        for (const sample of samples) {
          const n = (sample - 128) / 128;
          sum += n * n;
        }
        const rms = Math.sqrt(sum / samples.length);
        const now = performance.now();
        if (rms >= 0.021) {
          if (!speechStarted) { speechStarted = true; speechStart = now; }
          lastVoice = now;
        }
        if (speechStarted && now - lastVoice >= 720 && now - speechStart >= 220) {
          validTurn = true;
          recorder.stop();
          return;
        }
        if (!speechStarted && now - listenStart > 7000) {
          recorder.stop();
          return;
        }
        if (speechStarted && now - speechStart > 16000) {
          validTurn = true;
          recorder.stop();
          return;
        }
        frameRef.current = requestAnimationFrame(monitor);
      };
      frameRef.current = requestAnimationFrame(monitor);
    } catch {
      setState("error");
      setStatus("Microphone permission दिनुहोस्");
    }
  }, [token, stopCapture]);

  const startMode = useCallback(async () => {
    setOpen(true);
    openRef.current = true;
    setMuted(false);
    mutedRef.current = false;
    busyRef.current = false;
    setState("listening");
    setStatus("सुन्दैछु...");
    await startListening();
  }, [startListening]);

  const toggleMute = useCallback(() => {
    const next = !mutedRef.current;
    mutedRef.current = next;
    setMuted(next);
    if (next) {
      stopCapture();
      setState("muted");
      setStatus("Mic muted");
    } else {
      setStatus("सुन्दैछु...");
      void startListening();
    }
  }, [startListening, stopCapture]);

  useEffect(() => () => {
    openRef.current = false;
    stopCapture();
    stopPlayback();
  }, [stopCapture, stopPlayback]);

  return (
    <>
      {chatOpen && !open && (
        <button
          type="button"
          onClick={() => void startMode()}
          className="fixed bottom-[34px] right-[82px] z-[10020] flex h-11 w-11 items-center justify-center rounded-full bg-slate-950 text-white shadow-lg transition active:scale-95 dark:bg-white dark:text-black md:bottom-[34px] md:right-[84px]"
          aria-label="Start ChatGPT-style live conversation"
          title="Live conversation"
        >
          <AudioLines className="h-5 w-5" />
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-[10060] flex h-[100dvh] flex-col overflow-hidden bg-white text-slate-950 dark:bg-[#111] dark:text-white">
          <div className="relative z-10 flex items-center justify-between px-5 pt-[max(26px,env(safe-area-inset-top))]">
            <button type="button" onClick={endMode} className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-white/10" aria-label="Close live conversation">
              <X className="h-6 w-6" />
            </button>
            <div className="text-center">
              <div className="text-sm font-semibold">RoomKhoj AI</div>
              <div className="mt-1 text-[11px] text-slate-500 dark:text-white/55">Natural conversation</div>
            </div>
            <div className="h-12 w-12" />
          </div>

          <div className="relative flex flex-1 flex-col items-center justify-center px-6 text-center">
            <div className={cn(
              "relative h-64 w-64 rounded-full bg-[radial-gradient(circle_at_40%_35%,#fff_0%,#d9ddff_35%,#8b87f4_68%,#5751db_100%)] shadow-[0_0_90px_rgba(99,102,241,.28)] transition-all duration-300",
              state === "listening" && "animate-pulse scale-100",
              state === "speaking" && "scale-110",
              state === "thinking" && "scale-95 opacity-90",
            )} />
            <div className="mt-8 min-h-6 text-sm font-medium text-slate-500 dark:text-white/60">{status}</div>
          </div>

          <div className="mx-auto flex w-full max-w-md items-center justify-center gap-4 px-6 pb-[max(24px,env(safe-area-inset-bottom))]">
            <button type="button" onClick={toggleMute} className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-white/10" aria-label={muted ? "Unmute" : "Mute"}>
              {muted ? <MicOff className="h-7 w-7" /> : <Mic className="h-7 w-7" />}
            </button>
            <button type="button" onClick={endMode} className="flex h-16 w-16 items-center justify-center rounded-full bg-black text-white dark:bg-white dark:text-black" aria-label="End conversation">
              <X className="h-7 w-7" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
