"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Mic, MicOff, PhoneOff, Sparkles, Volume2 } from "lucide-react";
import useTokenStore from "@/store";
import { recordingExtension, speechChunks, VoiceSession } from "@/lib/voice/voice-utils";

const API = "https://api.roomkhoj.com";
type VoicePhase = "idle" | "listening" | "thinking" | "speaking" | "error";
type Turn = ReturnType<VoiceSession['next']>;

export default function LiveVoicePage() {
  const router = useRouter();
  const token = useTokenStore((state) => state.token);
  const [phase, setPhase] = useState<VoicePhase>("idle");
  const [status, setStatus] = useState("Tap the mic to start");
  const [lastHeard, setLastHeard] = useState("");
  const [lastReply, setLastReply] = useState("");
  const [active, setActive] = useState(false);
  const activeRef = useRef(false);
  const session = useRef(new VoiceSession());
  const conversationId = useRef("");
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const contextRef = useRef<AudioContext | null>(null);
  const frameRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playerRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const manualSendRef = useRef(false);

  const stopPlayback = useCallback(() => {
    const audio = audioRef.current;
    if (audio) { audio.pause(); audio.removeAttribute('src'); audio.load(); }
    audioRef.current = null;
    if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
    audioUrlRef.current = null;
    window.speechSynthesis?.cancel();
  }, []);

  const cleanup = useCallback(() => {
    activeRef.current = false;
    session.current.stop();
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
    const recorder = recorderRef.current;
    recorderRef.current = null;
    if (recorder && recorder.state !== 'inactive') recorder.stop();
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
    void contextRef.current?.close().catch(() => undefined);
    contextRef.current = null;
    stopPlayback();
  }, [stopPlayback]);

  const stopConversation = useCallback(() => {
    cleanup(); setActive(false); setPhase('idle'); setStatus('Voice session ended');
  }, [cleanup]);
  // A sign-out/account change must also end all microphone and network work.
  useEffect(() => { stopConversation(); return cleanup; }, [token, cleanup, stopConversation]);

  function fail(error: unknown, turn: Turn) {
    if (!turn.current()) return;
    cleanup(); setActive(false); setPhase('error');
    setStatus(error instanceof Error ? error.message : 'Voice connection problem. फेरि Start थिच्नुहोस्।');
  }

  async function request(path: string, init: RequestInit, turn: Turn) {
    if (!turn.current()) throw new DOMException('Stopped', 'AbortError');
    const controller = new AbortController();
    const abort = () => controller.abort();
    turn.signal.addEventListener('abort', abort, { once: true });
    const timeout = window.setTimeout(abort, 45000);
    try {
      const res = await fetch(`${API}${path}`, { ...init, signal: controller.signal,
        headers: { ...init.headers, Authorization: `Bearer ${token}` } });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(typeof data.message === 'string' ? data.message : `Voice request failed (${res.status}). फेरि प्रयास गर्नुहोस्।`);
      }
      // Consume the body within the timeout and cancellation window.
      return path.endsWith('/speak') ? await res.blob() : await res.json();
    } catch (error) {
      if (turn.current() && controller.signal.aborted) throw new Error('Request समयमै पूरा भएन। फेरि Start थिच्नुहोस्।');
      throw error;
    } finally {
      clearTimeout(timeout); turn.signal.removeEventListener('abort', abort);
    }
  }

  function play(blob: Blob, turn: Turn) {
    return new Promise<void>((resolve, reject) => {
      if (!turn.current()) { reject(new DOMException('Stopped', 'AbortError')); return; }
      const audio = playerRef.current || new Audio();
      audioRef.current = audio;
      const url = URL.createObjectURL(blob);
      audioUrlRef.current = url;
      let settled = false;
      const finish = (error?: Error) => {
        if (settled) return;
        settled = true; clearTimeout(timer); turn.signal.removeEventListener('abort', aborted);
        audio.onended = null; audio.onerror = null;
        audio.pause(); audio.removeAttribute('src');
        URL.revokeObjectURL(url);
        if (audioRef.current === audio) audioRef.current = null;
        if (audioUrlRef.current === url) audioUrlRef.current = null;
        if (error) reject(error); else resolve();
      };
      const aborted = () => finish(new DOMException('Stopped', 'AbortError'));
      const timer = window.setTimeout(() => finish(new Error('Audio playback timed out')), 120000);
      turn.signal.addEventListener('abort', aborted, { once: true });
      audio.onended = () => finish();
      audio.onerror = () => finish(new Error('Audio playback failed'));
      audio.src = url;
      void audio.play().catch(() => finish(new Error('Audio चल्न सकेन। जवाफ तल पढ्न सक्नुहुन्छ; फेरि Start थिच्नुहोस्।')));
    });
  }

  async function processRecording(blob: Blob, turn: Turn) {
    try {
      if (!turn.current()) return;
      setPhase('thinking'); setStatus('आवाज बुझ्दैछु…');
      const form = new FormData();
      form.append('audio', blob, `roomkhoj-live.${recordingExtension(blob.type)}`);
      const transcript = await request('/ai-call/transcribe', { method: 'POST', body: form }, turn);
      if (!turn.current()) return;
      const text = String(transcript?.data?.text || transcript?.text || '').trim();
      if (!text) { listen(turn); return; }
      setLastHeard(text); setStatus('जवाफ तयार हुँदैछ…');
      const data = await request('/ai-v3/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: text.slice(0, 2000), conversationId: conversationId.current, source: 'LIVE_VOICE' }) }, turn);
      if (!turn.current()) return;
      const result = data?.reply?.reply ?? data?.reply ?? data?.response?.reply ?? data?.message;
      const reply = typeof result === 'string' ? result.trim() : '';
      if (!reply) throw new Error('जवाफ प्राप्त भएन। फेरि प्रयास गर्नुहोस्।');
      setLastReply(reply);
      for (const chunk of speechChunks(reply)) {
        if (!turn.current()) return;
        setPhase('thinking'); setStatus('आवाज तयार हुँदैछ…');
        const audio = await request('/ai-call/speak', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: chunk }) }, turn);
        if (!turn.current()) return;
        setPhase('speaking'); setStatus('RoomKhoj AI बोल्दैछ…');
        await play(audio, turn);
      }
      if (turn.current()) listen(turn);
    } catch (error) { fail(error, turn); }
  }

  function listen(turn: Turn) {
    if (!turn.current() || !activeRef.current || !streamRef.current || !contextRef.current) return;
    try {
      const stream = streamRef.current;
      stream.getAudioTracks().forEach(track => { track.enabled = true; });
      const ctx = contextRef.current;
      const analyser = ctx.createAnalyser(); analyser.fftSize = 2048;
      const source = ctx.createMediaStreamSource(stream); source.connect(analyser);
      const mime = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/ogg;codecs=opus', 'audio/webm'].find(type => MediaRecorder.isTypeSupported(type));
      const recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      recorderRef.current = recorder; manualSendRef.current = false;
      const chunks: BlobPart[] = [];
      let voicedMs = 0, lastVoice = 0, previous = performance.now();
      const started = previous;
      recorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
      recorder.onerror = () => fail(new Error('Microphone recording failed. फेरि Start थिच्नुहोस्।'), turn);
      recorder.onstop = () => {
        source.disconnect(); analyser.disconnect();
        if (!turn.current()) return;
        if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
        frameRef.current = null; recorderRef.current = null;
        stream.getAudioTracks().forEach(track => { track.enabled = false; });
        if (voicedMs < 200 && !manualSendRef.current) {
          cleanup(); setActive(false); setPhase('idle'); setStatus('आवाज सुनिएन। फेरि Start थिच्नुहोस्।'); return;
        }
        void processRecording(new Blob(chunks, { type: recorder.mimeType || mime || 'audio/webm' }), turn);
      };
      recorder.start(250); setPhase('listening'); setStatus('सुन्दैछु… बोल्नुहोस्');
      const buffer = new Uint8Array(analyser.fftSize);
      const monitor = () => {
        if (!turn.current() || recorder.state !== 'recording') return;
        analyser.getByteTimeDomainData(buffer);
        const now = performance.now();
        let power = 0;
        for (const value of buffer) power += ((value - 128) / 128) ** 2;
        if (Math.sqrt(power / buffer.length) > 0.018) { voicedMs += Math.min(now - previous, 100); lastVoice = now; }
        previous = now;
        if ((voicedMs >= 200 && now - lastVoice > 1400) || now - started > 25000 || (!lastVoice && now - started > 15000)) { recorder.stop(); return; }
        frameRef.current = requestAnimationFrame(monitor);
      };
      frameRef.current = requestAnimationFrame(monitor);
    } catch (error) { fail(error, turn); }
  }

  async function startConversation() {
    if (activeRef.current) return;
    if (!token) { setPhase('error'); setStatus('Live Voice का लागि login आवश्यक छ'); return; }
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') { setPhase('error'); setStatus('यो browser मा microphone recording उपलब्ध छैन। अर्को browser प्रयोग गर्नुहोस्।'); return; }
    // Prime the same media element during the Start gesture for mobile playback.
    const player = playerRef.current;
    if (player) {
      player.src = 'data:audio/wav;base64,UklGRsQAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YaAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
      void player.play().then(() => player.pause()).catch(() => undefined);
    }
    const turn = session.current.next();
    activeRef.current = true; setActive(true); setPhase('thinking'); setStatus('Microphone खोल्दैछु…');
    try {
      if (!conversationId.current) {
        const fromChat = new URLSearchParams(window.location.search).get('conversationId');
        conversationId.current = fromChat && /^[A-Za-z0-9_-]{8,128}$/.test(fromChat) ? fromChat : crypto.randomUUID();
      }
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AC(); contextRef.current = ctx;
      await ctx.resume();
      if (!turn.current()) return;
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1 } });
      if (!turn.current()) { stream.getTracks().forEach(track => track.stop()); return; }
      streamRef.current = stream;
      listen(turn);
    } catch (error) {
      fail(error instanceof DOMException && error.name === 'NotAllowedError' ? new Error('Microphone permission दिनुहोस् र फेरि Start थिच्नुहोस्।') : error, turn);
    }
  }

  function interrupt() {
    const turn = session.current.next(); stopPlayback(); listen(turn);
  }
  const orbScale = phase === "listening" ? "scale-110" : phase === "speaking" ? "scale-105" : "scale-100";

  return (
    <main className="min-h-[100dvh] overflow-hidden bg-[#0b0b0d] text-white">
      <audio ref={playerRef} preload="auto" className="hidden" />
      <div className="mx-auto flex min-h-[100dvh] max-w-3xl flex-col px-5 pb-[max(24px,env(safe-area-inset-bottom))] pt-5 sm:px-8">
        <header className="flex items-center justify-between">
          <button onClick={() => { stopConversation(); router.back(); }} className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 hover:bg-white/15" aria-label="Back">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="text-center">
            <p className="text-sm font-semibold">RoomKhoj Live Voice</p>
            <p className="text-[11px] text-white/45">Rooms • Jobs • RoomKhoj help</p>
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

          <h1 role="status" aria-live="polite" className="text-2xl font-semibold tracking-tight sm:text-3xl">{status}</h1>
          <p className="mt-3 max-w-lg text-sm leading-6 text-white/50">
            बोलिसकेपछि छोटो pause दिनुहोस् वा “पठाउनुहोस्” थिच्नुहोस्। AI बोलिरहेको बेला “रोक्नुहोस्, म बोल्छु” थिचेर आफ्नो कुरा भन्न सक्नुहुन्छ। End गर्दा microphone बन्द हुन्छ।
          </p>

          {(lastHeard || lastReply) && (
            <div className="mt-8 w-full max-w-xl rounded-3xl border border-white/10 bg-white/[0.04] p-4 text-left backdrop-blur-xl">
              {lastHeard && <p className="text-xs leading-5 text-white/55"><span className="font-semibold text-white/80">You:</span> {lastHeard}</p>}
              {lastReply && <p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-white/45"><span className="font-semibold text-white/70">AI:</span> {lastReply}</p>}
            </div>
          )}
        </section>

        <footer className="flex flex-wrap items-center justify-center gap-5">
          {active && phase === "listening" && <button onClick={() => { manualSendRef.current = true; recorderRef.current?.stop(); }} className="rounded-full bg-white/15 px-5 py-3">पठाउनुहोस्</button>}
          {active && phase === "speaking" && <button onClick={interrupt} className="rounded-full bg-white/15 px-5 py-3">रोक्नुहोस्, म बोल्छु</button>}
          {!token && <button onClick={() => router.push('/auth/login')} className="rounded-full bg-white/15 px-5 py-3">Login for Live Voice</button>}
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
