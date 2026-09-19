"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Camera,
  Loader2,
  Radio,
  Share2,
  Square,
} from "lucide-react";
import { toast } from "sonner";

import { socialService } from "@/http/services/social.service";
import { useUserStore } from "@/stores/user-store";

export default function LiveBroadcastPage() {
  const { user, isLoaded } = useUserStore();
  const previewRef = useRef<HTMLVideoElement | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const mediaRef = useRef<MediaStream | null>(null);
  const sessionUrlRef = useRef("");

  const [starting, setStarting] = useState(false);
  const [liveId, setLiveId] = useState("");
  const [live, setLive] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [errorText, setErrorText] = useState("");

  const stopLive = async () => {
    const sessionUrl = sessionUrlRef.current;
    sessionUrlRef.current = "";

    if (sessionUrl) {
      await fetch(sessionUrl, { method: "DELETE" }).catch(() => undefined);
    }

    pcRef.current?.close();
    pcRef.current = null;

    mediaRef.current?.getTracks().forEach((track) => track.stop());
    mediaRef.current = null;

    if (previewRef.current) {
      previewRef.current.srcObject = null;
    }

    setLive(false);
    setLiveId("");
    setStatusText("");
  };

  useEffect(
    () => () => {
      void stopLive();
    },
    [],
  );

  const requestMedia = async () => {
    if (!window.isSecureContext) {
      throw new Error("Live चलाउन HTTPS secure connection चाहिन्छ।");
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error("यो browser मा camera/microphone live support छैन।");
    }

    try {
      return await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30, max: 30 },
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
    } catch (error: any) {
      if (
        error?.name === "OverconstrainedError" ||
        error?.name === "NotFoundError"
      ) {
        return navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
      }
      if (
        error?.name === "NotAllowedError" ||
        error?.name === "SecurityError"
      ) {
        throw new Error(
          "Camera र Microphone permission Allow गरेर फेरि Start Live गर्नुहोस्।",
        );
      }
      throw error;
    }
  };

  const startLive = async () => {
    if (starting || live) return;

    setStarting(true);
    setErrorText("");
    setStatusText("Camera र microphone खोल्दै…");

    try {
      // Ask for device permission first. This avoids creating orphaned
      // Cloudflare live inputs when the user blocks camera/microphone access.
      const stream = await requestMedia();
      mediaRef.current = stream;

      if (previewRef.current) {
        previewRef.current.srcObject = stream;
        await previewRef.current.play().catch(() => undefined);
      }

      setStatusText("Live channel तयार गर्दै…");
      const input = await socialService.createLiveInput(
        `${user?.name || "RoomKhoj user"} Live`,
      );

      if (!input.publishUrl || !input.uid) {
        throw new Error("Live input तयार भएन।");
      }

      setStatusText("Cloudflare Live सँग जोडिँदै…");

      const pc = new RTCPeerConnection();
      pcRef.current = pc;

      stream.getTracks().forEach((track) => {
        pc.addTransceiver(track, { direction: "sendonly" });
      });

      pc.onconnectionstatechange = () => {
        const state = pc.connectionState;
        if (state === "connected") {
          setLive(true);
          setStatusText("You are live");
        } else if (state === "connecting") {
          setStatusText("Connecting live…");
        } else if (state === "disconnected") {
          setStatusText("Live connection interrupted…");
        } else if (state === "failed") {
          setErrorText("Live connection failed. फेरि Start Live गर्नुहोस्।");
          setLive(false);
        }
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const response = await fetch(input.publishUrl, {
        method: "POST",
        headers: { "Content-Type": "application/sdp" },
        body: offer.sdp || pc.localDescription?.sdp || "",
      });

      if (!response.ok) {
        const detail = await response.text().catch(() => "");
        throw new Error(
          detail
            ? `Live connection failed (${response.status}): ${detail.slice(0, 160)}`
            : `Live connection failed (${response.status})`,
        );
      }

      const answer = await response.text();
      if (!answer.trim()) {
        throw new Error("Live server ले WebRTC answer दिएन।");
      }

      await pc.setRemoteDescription({ type: "answer", sdp: answer });

      const location = response.headers.get("Location");
      if (location) {
        sessionUrlRef.current = new URL(location, input.publishUrl).toString();
      }

      setLiveId(input.uid);
      setLive(true);
      setStatusText("You are live");
      toast.success("You are live");
    } catch (error: any) {
      const apiMessage = error?.response?.data?.message;
      const message = Array.isArray(apiMessage)
        ? apiMessage.join(", ")
        : String(apiMessage || error?.message || "Live सुरु गर्न सकिएन।");

      setErrorText(message);
      toast.error(message);
      await stopLive();
      // stopLive clears status but not the error message.
      setErrorText(message);
    } finally {
      setStarting(false);
    }
  };

  const shareLive = async () => {
    if (!liveId) return;

    const url = `${window.location.origin}/live/${liveId}`;
    if (navigator.share) {
      await navigator
        .share({ title: "RoomKhoj Live", text: "Watch my RoomKhoj Live", url })
        .catch(() => undefined);
      return;
    }

    await navigator.clipboard.writeText(url);
    toast.success("Live link copied");
  };

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
        <p className="mt-2 text-white/60">Go Live गर्न login गर्नुहोस्।</p>
        <Link
          href="/auth/login?redirect=%2Flive"
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
        ref={previewRef}
        autoPlay
        muted
        playsInline
        className="h-full w-full object-cover"
      />

      <Link
        href="/reels"
        className="absolute left-3 top-[calc(0.8rem+env(safe-area-inset-top))] z-20 flex h-10 w-10 items-center justify-center rounded-full bg-black/55 backdrop-blur"
        aria-label="Back to Reels"
      >
        <ArrowLeft className="h-5 w-5" />
      </Link>

      {!live && !starting && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-black/40 via-black/20 to-black/75 px-6 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-600 shadow-2xl">
            <Radio className="h-10 w-10" />
          </div>
          <h1 className="mt-5 text-3xl font-black">Go Live</h1>
          <p className="mt-2 max-w-sm text-sm text-white/70">
            Camera र microphone बाट RoomKhoj मा ultra-low-latency live
            broadcast सुरु गर्नुहोस्।
          </p>

          {errorText && (
            <div className="mt-4 max-w-md rounded-xl border border-red-400/30 bg-red-500/15 px-4 py-3 text-sm font-semibold text-red-200">
              {errorText}
            </div>
          )}

          <button
            type="button"
            onClick={() => void startLive()}
            className="mt-6 flex items-center gap-2 rounded-full bg-red-600 px-7 py-3.5 text-base font-black shadow-xl"
          >
            <Camera className="h-5 w-5" />
            Start Live
          </button>
        </div>
      )}

      {starting && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/75 px-6 text-center">
          <Loader2 className="h-9 w-9 animate-spin" />
          <div className="mt-3 text-sm font-bold">
            {statusText || "Connecting live…"}
          </div>
        </div>
      )}

      {live && (
        <>
          <div className="absolute right-4 top-[calc(1rem+env(safe-area-inset-top))] rounded-full bg-red-600 px-3 py-1.5 text-xs font-black tracking-wide">
            LIVE
          </div>

          {statusText && (
            <div className="absolute left-1/2 top-[calc(4.5rem+env(safe-area-inset-top))] -translate-x-1/2 rounded-full bg-black/55 px-3 py-1.5 text-xs font-semibold backdrop-blur">
              {statusText}
            </div>
          )}

          <div className="absolute bottom-[calc(2rem+env(safe-area-inset-bottom))] left-4 right-4 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => void shareLive()}
              className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-white/15 font-bold backdrop-blur"
            >
              <Share2 className="h-5 w-5" />
              Share Live
            </button>
            <button
              type="button"
              onClick={() => void stopLive()}
              className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-red-600 font-black"
            >
              <Square className="h-5 w-5 fill-current" />
              End Live
            </button>
          </div>
        </>
      )}
    </main>
  );
}
