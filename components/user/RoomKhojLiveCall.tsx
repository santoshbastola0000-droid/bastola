"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Mic, MicOff, Phone, SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";
import useTokenStore from "@/store";

type VoiceState = "idle" | "listening" | "thinking" | "speaking" | "muted" | "error";

const API_BASE = "https://api.roomkhoj.com";

export function RoomKhojLiveCall() {
  const token = useTokenStore((state) => state.token);
  const [open, setOpen] = useState(false);
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [status, setStatus] = useState("RoomKhoj AI सँग कुरा गर्नुहोस्");
  const [muted, setMuted] = useState(false);

  const mountedRef = useRef(true);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const analyserContextRef = useRef<AudioContext | null>(null);
  const vadFrameRef = useRef<number | null>(null);
  const inFlightRef = useRef(false);
  const openRef = useRef(false);
  const mutedRef = useRef(false);

  useEffect(() => {
    openRef.current = open;
  }, [open]);

  useEffect(() => {
    mutedRef.current = muted;
  }, [muted]);

  const stopVad = useCallback(() => {
    if (vadFrameRef.current !== null) {
      cancelAnimationFrame(vadFrameRef.current);
      vadFrameRef.current = null;
    }
    if (analyserContextRef.current) {
      void analyserContextRef.current.close().catch(() => undefined);
      analyserContextRef.current = null;
    }
  }, []);

  const stopCapture = useCallback(() => {
    stopVad();
    if (recorderRef.current?.state === "recording") {
      try {
        recorderRef.current.stop();
      } catch {}
    }
    recorderRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, [stopVad]);

  const stopPlayback = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
  }, []);

  const endCall = useCallback(() => {
    openRef.current = false;
    setOpen(false);
    setMuted(false);
    setVoiceState("idle");
    setStatus("RoomKhoj AI सँग कुरा गर्नुहोस्");
    inFlightRef.current = false;
    stopCapture();
    stopPlayback();
  }, [stopCapture, stopPlayback]);

  const speak = useCallback(async (text: string) => {
    if (!token || !openRef.current || !text.trim()) return;

    stopCapture();
    stopPlayback();
    setVoiceState("speaking");
    setStatus("RoomKhoj AI बोल्दैछ...");

    try {
      const response = await fetch(`${API_BASE}/ai-call/speak`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: text.slice(0, 1400) }),
      });

      if (!response.ok) throw new Error(`TTS ${response.status}`);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;

      audio.onended = () => {
        URL.revokeObjectURL(url);
        if (audioRef.current === audio) audioRef.current = null;
        inFlightRef.current = false;
        if (openRef.current && !mutedRef.current) void startListening();
      };
      audio.onerror = () => {
        URL.revokeObjectURL(url);
        if (audioRef.current === audio) audioRef.current = null;
        inFlightRef.current = false;
        if (openRef.current && !mutedRef.current) void startListening();
      };

      await audio.play();
    } catch {
      inFlightRef.current = false;
      setVoiceState("error");
      setStatus("AI आवाज चलाउन समस्या आयो");
      if (openRef.current && !mutedRef.current) {
        window.setTimeout(() => void startListening(), 700);
      }
    }
  // startListening is defined below and intentionally resolved at runtime.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, stopCapture, stopPlayback]);

  const processAudio = useCallback(async (blob: Blob) => {
    if (!token || !openRef.current || inFlightRef.current) return;
    inFlightRef.current = true;
    setVoiceState("thinking");
    setStatus("तपाईंको कुरा बुझ्दैछु...");

    try {
      const form = new FormData();
      const ext = blob.type.includes("mp4") ? "m4a" : blob.type.includes("ogg") ? "ogg" : "webm";
      form.append("audio", blob, `roomkhoj-call.${ext}`);

      const transcribe = await fetch(`${API_BASE}/ai-call/transcribe`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      const transcriptData = await transcribe.json().catch(() => ({}));
      if (!transcribe.ok) throw new Error("transcribe failed");
      const transcript = String(transcriptData?.data?.text || transcriptData?.text || "").trim();

      if (!transcript) {
        inFlightRef.current = false;
        setStatus("आवाज स्पष्ट भएन, फेरि बोल्नुहोस्");
        if (openRef.current && !mutedRef.current) void startListening();
        return;
      }

      setStatus(`सुनेँ: ${transcript}`);
      const chat = await fetch(`${API_BASE}/ai-v3/chat`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: transcript.slice(0, 2000) }),
      });
      const data = await chat.json().catch(() => ({}));
      if (!chat.ok) throw new Error(data?.message || "chat failed");

      const obj =
        typeof data?.reply === "object" && data.reply !== null ? data.reply :
        typeof data?.response === "object" && data.response !== null ? data.response :
        typeof data?.data === "object" && data.data !== null ? data.data : data;
      const reply = typeof obj === "string"
        ? obj
        : String(obj?.reply || obj?.text || obj?.message || obj?.content || data?.reply || "").trim();

      if (!reply) {
        inFlightRef.current = false;
        setStatus("जवाफ तयार भएन, फेरि बोल्नुहोस्");
        if (openRef.current && !mutedRef.current) void startListening();
        return;
      }

      await speak(reply);
    } catch (error) {
      console.error("RoomKhoj live call error", error);
      inFlightRef.current = false;
      setVoiceState("error");
      setStatus("Connection problem. फेरि प्रयास गर्दैछु...");
      if (openRef.current && !mutedRef.current) {
        window.setTimeout(() => void startListening(), 800);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, speak]);

  const startListening = useCallback(async () => {
    if (!openRef.current || mutedRef.current || inFlightRef.current) return;
    if (!token) {
      setVoiceState("error");
      setStatus("Live AI Call चलाउन login गर्नुहोस्");
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setVoiceState("error");
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
      analyserContextRef.current = context;
      const source = context.createMediaStreamSource(stream);
      const analyser = context.createAnalyser();
      analyser.fftSize = 1024;
      analyser.smoothingTimeConstant = 0.6;
      source.connect(analyser);

      let speechStarted = false;
      let speechAt = 0;
      let lastVoiceAt = performance.now();
      const listeningAt = performance.now();
      let validTurn = false;

      recorder.ondataavailable = (event) => {
        if (event.data?.size) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        stopVad();
        stream.getTracks().forEach((track) => track.stop());
        if (streamRef.current === stream) streamRef.current = null;
        if (recorderRef.current === recorder) recorderRef.current = null;
        const parts = chunksRef.current;
        chunksRef.current = [];
        if (!validTurn || !openRef.current || mutedRef.current) {
          if (openRef.current && !mutedRef.current && !inFlightRef.current) {
            window.setTimeout(() => void startListening(), 180);
          }
          return;
        }
        const blob = new Blob(parts, { type: recorder.mimeType || "audio/webm" });
        if (blob.size > 900) void processAudio(blob);
      };

      recorder.start(250);
      setVoiceState("listening");
      setStatus("सुन्दैछु... बोल्नुहोस्");

      const samples = new Uint8Array(analyser.fftSize);
      const monitor = () => {
        if (recorder.state !== "recording" || !openRef.current || mutedRef.current) return;
        analyser.getByteTimeDomainData(samples);
        let sum = 0;
        for (const sample of samples) {
          const value = (sample - 128) / 128;
          sum += value * value;
        }
        const rms = Math.sqrt(sum / samples.length);
        const now = performance.now();
        if (rms >= 0.024) {
          if (!speechStarted) {
            speechStarted = true;
            speechAt = now;
          }
          lastVoiceAt = now;
        }
        if (speechStarted && now - lastVoiceAt > 950 && now - speechAt > 300) {
          validTurn = true;
          recorder.stop();
          return;
        }
        if (!speechStarted && now - listeningAt > 8000) {
          recorder.stop();
          return;
        }
        if (speechStarted && now - speechAt > 18000) {
          validTurn = true;
          recorder.stop();
          return;
        }
        vadFrameRef.current = requestAnimationFrame(monitor);
      };
      vadFrameRef.current = requestAnimationFrame(monitor);
    } catch {
      setVoiceState("error");
      setStatus("Microphone permission दिनुहोस्");
    }
  }, [token, processAudio, stopCapture, stopVad]);

  const startCall = useCallback(async () => {
    setOpen(true);
    openRef.current = true;
    setMuted(false);
    mutedRef.current = false;
    setVoiceState("thinking");
    setStatus("RoomKhoj AI जोडिँदैछ...");

    if (!token) {
      setVoiceState("error");
      setStatus("Live AI Call चलाउन login गर्नुहोस्");
      return;
    }

    inFlightRef.current = true;
    await speak("नमस्कार! म RoomKhoj AI हुँ। तपाईंलाई कोठा, जागिर वा RoomKhoj सम्बन्धी के सहयोग गरौँ?");
  }, [token, speak]);

  const toggleMute = useCallback(() => {
    const next = !mutedRef.current;
    mutedRef.current = next;
    setMuted(next);
    if (next) {
      stopCapture();
      setVoiceState("muted");
      setStatus("Microphone muted");
    } else {
      setStatus("सुन्दैछु... बोल्नुहोस्");
      void startListening();
    }
  }, [startListening, stopCapture]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      openRef.current = false;
      stopCapture();
      stopPlayback();
    };
  }, [stopCapture, stopPlayback]);

  return (
    <>
      <button
        type="button"
        onClick={() => void startCall()}
        className="fixed bottom-[86px] right-5 z-[9998] flex h-12 w-12 items-center justify-center rounded-full bg-slate-950 text-white shadow-xl transition hover:scale-105 md:bottom-[84px] md:right-6"
        aria-label="Call RoomKhoj AI"
        title="Call RoomKhoj AI"
      >
        <Phone className="h-5 w-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-[10050] flex h-[100dvh] flex-col overflow-hidden bg-white text-slate-950 dark:bg-[#111] dark:text-white">
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className={cn(
              "absolute left-1/2 top-[31%] h-[34vh] w-[34vh] min-h-[220px] min-w-[220px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_38%_34%,rgba(255,255,255,0.98),rgba(190,196,255,0.92)_38%,rgba(113,108,247,0.96)_68%,rgba(66,60,220,0.99)_100%)] shadow-[0_0_100px_rgba(99,102,241,0.24)] transition-transform duration-500",
              voiceState === "speaking" && "scale-105",
              voiceState === "listening" && "animate-pulse",
            )} />
            <div className="absolute left-1/2 top-[38%] h-[17vh] w-[26vh] -translate-x-1/2 rounded-full bg-white/65 blur-3xl dark:bg-white/15" />
          </div>

          <div className="relative z-10 flex items-center justify-between px-6 pt-[max(28px,env(safe-area-inset-top))] sm:px-8">
            <button type="button" onClick={endCall} className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 shadow-lg ring-1 ring-black/5 dark:bg-white/10 dark:ring-white/10" aria-label="Close live call">
              <X className="h-7 w-7" />
            </button>
            <div className="text-center">
              <div className="text-sm font-semibold">RoomKhoj AI</div>
              <div className="mt-1 flex items-center justify-center gap-1.5 text-[11px] text-slate-500 dark:text-white/55">
                <span className={cn("h-1.5 w-1.5 rounded-full", voiceState === "error" ? "bg-red-500" : "bg-emerald-500", voiceState === "listening" && "animate-pulse")} />
                Live voice
              </div>
            </div>
            <button type="button" className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 shadow-lg ring-1 ring-black/5 dark:bg-white/10 dark:ring-white/10" aria-label="Voice settings" title="Voice settings">
              <SlidersHorizontal className="h-6 w-6" />
            </button>
          </div>

          <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 pb-28 text-center">
            <div className="mb-7 min-h-6 max-w-[85vw] truncate text-sm font-medium text-slate-500 dark:text-white/55">{status}</div>
            <div className="h-[34vh] w-[34vh] min-h-[220px] min-w-[220px]" aria-hidden="true" />
          </div>

          <div className="relative z-10 mx-auto w-full max-w-[760px] px-5 pb-[max(22px,env(safe-area-inset-bottom))] sm:px-7">
            <div className="flex items-center gap-3">
              <div className="flex h-[72px] flex-1 items-center rounded-full bg-white/94 px-5 shadow-[0_16px_50px_rgba(15,23,42,0.12)] ring-1 ring-black/5 backdrop-blur-2xl dark:bg-white/10 dark:ring-white/10">
                <span className="text-[17px] text-slate-400 dark:text-white/45">Talk to RoomKhoj AI</span>
              </div>
              <button type="button" onClick={toggleMute} className={cn("flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-full shadow-xl ring-1 ring-black/5 transition", muted ? "bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-white/60" : "bg-white text-slate-950 dark:bg-white dark:text-black")} aria-label={muted ? "Unmute microphone" : "Mute microphone"}>
                {muted ? <MicOff className="h-7 w-7" /> : <Mic className="h-7 w-7" />}
              </button>
              <button type="button" onClick={endCall} className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-full bg-[#171717] text-white shadow-xl transition hover:bg-black" aria-label="End RoomKhoj AI call">
                <X className="h-8 w-8" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
