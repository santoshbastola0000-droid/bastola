"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, Loader2, Radio, RefreshCw, Volume2, VolumeX } from "lucide-react";

import { socialService } from "@/http/services/social.service";
import { useUserStore } from "@/stores/user-store";

export default function LiveViewerPage() {
  const params = useParams<{ uid: string }>();
  const uid = String(params?.uid || "").trim();
  const { user, isLoaded } = useUserStore();

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const sessionUrlRef = useRef("");
  const retryRef = useRef<number | null>(null);

  const [connecting, setConnecting] = useState(true);
  const [waiting, setWaiting] = useState(false);
  const [error, setError] = useState("");
  const [connected, setConnected] = useState(false);
  const [muted, setMuted] = useState(true);

  const stopPlayback = useCallback(async () => {
    if (retryRef.current) {
      window.clearTimeout(retryRef.current);
      retryRef.current = null;
    }

    const sessionUrl = sessionUrlRef.current;
    sessionUrlRef.current = "";
    if (sessionUrl) {
      await fetch(sessionUrl, { method: "DELETE" }).catch(() => undefined);
    }

    pcRef.current?.close();
    pcRef.current = null;

    const video = videoRef.current;
    if (video) {
      video.srcObject = null;
      video.removeAttribute("src");
      video.load();
    }
    setConnected(false);
  }, []);

  const playHlsFallback = useCallback(async (hlsUrl: string) => {
    const video = videoRef.current;
    if (!video || !hlsUrl) return false;

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.srcObject = null;
      video.src = hlsUrl;
      video.muted = true;
      setMuted(true);
      await video.play().catch(() => undefined);
      setConnected(true);
      setWaiting(false);
      setConnecting(false);
      return true;
    }

    return false;
  }, []);

  const connect = useCallback(
    async (attempt = 0) => {
      if (!uid || !user) return;

      setConnecting(true);
      setError("");

      try {
        const live = await socialService.liveInput(uid);

        if (!live.playbackUrl) {
          if (await playHlsFallback(live.hlsUrl)) return;
          throw new Error("Live playback URL उपलब्ध छैन।");
        }

        await stopPlayback();

        const pc = new RTCPeerConnection();
        pcRef.current = pc;

        pc.addTransceiver("video", { direction: "recvonly" });
        pc.addTransceiver("audio", { direction: "recvonly" });

        const stream = new MediaStream();
        const video = videoRef.current;
        if (video) video.srcObject = stream;

        pc.ontrack = (event) => {
          stream.addTrack(event.track);
          if (video) {
            video.muted = true;
            setMuted(true);
            void video.play().catch(() => undefined);
          }
        };

        pc.onconnectionstatechange = () => {
          if (pc.connectionState === "connected") {
            setConnected(true);
            setWaiting(false);
            setConnecting(false);
          }
          if (
            pc.connectionState === "failed" ||
            pc.connectionState === "disconnected"
          ) {
            setConnected(false);
          }
        };

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        const response = await fetch(live.playbackUrl, {
          method: "POST",
          headers: { "Content-Type": "application/sdp" },
          body: offer.sdp || "",
        });

        if (!response.ok) {
          pc.close();
          pcRef.current = null;

          if (attempt < 20) {
            setWaiting(true);
            setConnecting(false);
            retryRef.current = window.setTimeout(
              () => void connect(attempt + 1),
              3000,
            );
            return;
          }

          if (await playHlsFallback(live.hlsUrl)) return;
          throw new Error(`Live playback failed (${response.status})`);
        }

        const answer = await response.text();
        await pc.setRemoteDescription({ type: "answer", sdp: answer });

        const location = response.headers.get("Location");
        if (location) {
          sessionUrlRef.current = new URL(location, live.playbackUrl).toString();
        }

        setWaiting(false);
        setConnecting(false);
      } catch (err: any) {
        if (attempt < 20) {
          setWaiting(true);
          setConnecting(false);
          retryRef.current = window.setTimeout(
            () => void connect(attempt + 1),
            3000,
          );
          return;
        }

        setConnecting(false);
        setWaiting(false);
        setError(err?.message || "Live खोल्न सकिएन।");
      }
    },
    [playHlsFallback, stopPlayback, uid, user],
  );

  useEffect(() => {
    if (!isLoaded || !user || !uid) return;
    void connect();
    return () => {
      void stopPlayback();
    };
  }, [connect, isLoaded, stopPlayback, uid, user]);

  if (!isLoaded) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black text-white">
        <Loader2 className="h-7 w-7 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-black px-6 py-16 text-center text-white">
        <h1 className="text-2xl font-black">RoomKhoj Live</h1>
        <p className="mt-2 text-white/60">Live हेर्न login गर्नुहोस्।</p>
        <Link
          href={`/auth/login?redirect=${encodeURIComponent(`/live/${uid}`)}`}
          className="mt-5 inline-flex rounded-full bg-white px-5 py-2.5 font-bold text-black"
        >
          Log in
        </Link>
      </main>
    );
  }

  return (
    <main className="fixed inset-0 z-30 bg-black text-white">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        controls={false}
        muted={muted}
        preload="auto"
        onLoadedMetadata={() => {
          const video = videoRef.current;
          if (!video) return;
          video.muted = true;
          setMuted(true);
          void video.play().catch(() => undefined);
        }}
        onCanPlay={() => {
          const video = videoRef.current;
          if (!video || !video.paused) return;
          void video.play().catch(() => undefined);
        }}
        className="h-full w-full bg-black object-contain"
      />

      <div className="absolute left-3 top-[calc(0.8rem+env(safe-area-inset-top))] z-20 flex items-center gap-2">
        <Link
          href="/reels"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-black/55 backdrop-blur"
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex items-center gap-2 rounded-full bg-red-600 px-3 py-2 text-xs font-black">
          <Radio className="h-4 w-4" />
          LIVE
        </div>
      </div>

      {(connecting || waiting) && !connected && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/75 px-6 text-center">
          <Loader2 className="h-9 w-9 animate-spin" />
          <div className="mt-4 text-base font-black">
            {waiting ? "Broadcaster सुरु हुन कुर्दै…" : "Connecting live…"}
          </div>
          <div className="mt-2 max-w-sm text-sm text-white/60">
            Live सुरु हुनेबित्तिकै video automatically play हुन्छ।
          </div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 px-6 text-center">
          <p className="max-w-sm text-sm font-bold text-red-300">{error}</p>
          <button
            type="button"
            onClick={() => void connect()}
            className="mt-5 flex items-center gap-2 rounded-full bg-white px-5 py-3 font-black text-black"
          >
            <RefreshCw className="h-4 w-4" />
            Try again
          </button>
        </div>
      )}

      {connected && (
        <button
          type="button"
          onClick={async () => {
            const video = videoRef.current;
            if (!video) return;
            const nextMuted = !muted;
            video.muted = nextMuted;
            setMuted(nextMuted);
            if (!nextMuted) {
              await video.play().catch(() => undefined);
            }
          }}
          className="absolute bottom-[calc(1rem+env(safe-area-inset-bottom))] left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full bg-black/55 px-4 py-2 text-xs font-bold backdrop-blur"
        >
          {muted ? (
            <VolumeX className="h-4 w-4" />
          ) : (
            <Volume2 className="h-4 w-4" />
          )}
          {muted ? "Tap for sound" : "Sound on"}
        </button>
      )}
    </main>
  );
}
