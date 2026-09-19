"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Camera, Loader2, Radio, Share2, Square } from "lucide-react";
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

    if (previewRef.current) previewRef.current.srcObject = null;
    setLive(false);
  };

  useEffect(() => () => {
    void stopLive();
  }, []);

  const startLive = async () => {
    if (starting || live) return;
    setStarting(true);

    try {
      const input = await socialService.createLiveInput(
        `${user?.name || "RoomKhoj user"} Live`,
      );

      if (!input.publishUrl || !input.uid) {
        throw new Error("Live input तयार भएन।");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
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

      mediaRef.current = stream;
      if (previewRef.current) {
        previewRef.current.srcObject = stream;
        await previewRef.current.play().catch(() => undefined);
      }

      const pc = new RTCPeerConnection();
      pcRef.current = pc;
      stream.getTracks().forEach((track) => {
        pc.addTransceiver(track, { direction: "sendonly" });
      });

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const response = await fetch(input.publishUrl, {
        method: "POST",
        headers: { "Content-Type": "application/sdp" },
        body: offer.sdp || "",
      });

      if (!response.ok) {
        throw new Error(`Live connection failed (${response.status})`);
      }

      const answer = await response.text();
      await pc.setRemoteDescription({ type: "answer", sdp: answer });

      const location = response.headers.get("Location");
      if (location) {
        sessionUrlRef.current = new URL(location, input.publishUrl).toString();
      }

      setLiveId(input.uid);
      setLive(true);
      toast.success("You are live");
    } catch (error: any) {
      await stopLive();
      toast.error(error?.message || "Live सुरु गर्न सकिएन।");
    } finally {
      setStarting(false);
    }
  };

  const shareLive = async () => {
    if (!liveId) return;
    const url = `${window.location.origin}/live/${liveId}`;
    if (navigator.share) {
      await navigator.share({ title: "RoomKhoj Live", url }).catch(() => undefined);
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Live link copied");
    }
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

      {!live && !starting && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-black/40 via-black/20 to-black/75 px-6 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-600 shadow-2xl">
            <Radio className="h-10 w-10" />
          </div>
          <h1 className="mt-5 text-3xl font-black">Go Live</h1>
          <p className="mt-2 max-w-sm text-sm text-white/70">
            Camera र microphone बाट RoomKhoj मा live broadcast सुरु गर्नुहोस्।
          </p>
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
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/75">
          <Loader2 className="h-9 w-9 animate-spin" />
          <div className="mt-3 text-sm font-bold">Connecting live…</div>
        </div>
      )}

      {live && (
        <>
          <div className="absolute left-4 top-[calc(1rem+env(safe-area-inset-top))] rounded-full bg-red-600 px-3 py-1.5 text-xs font-black tracking-wide">
            LIVE
          </div>

          <div className="absolute bottom-[calc(6rem+env(safe-area-inset-bottom))] left-4 right-4 flex items-center justify-between gap-3">
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
