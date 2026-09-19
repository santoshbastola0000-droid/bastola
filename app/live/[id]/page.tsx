"use client";

import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Loader2, Volume2, VolumeX } from "lucide-react";

import { socialService } from "@/http/services/social.service";

export default function LiveViewerPage() {
  const params = useParams<{ id: string }>();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const sessionUrlRef = useRef("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const connect = async () => {
      setLoading(true);
      setError("");

      try {
        const input = await socialService.liveInput(String(params.id || ""));
        if (!input.playbackUrl) throw new Error("Live stream उपलब्ध छैन।");

        const pc = new RTCPeerConnection();
        pcRef.current = pc;

        const remote = new MediaStream();
        if (videoRef.current) videoRef.current.srcObject = remote;

        pc.addTransceiver("video", { direction: "recvonly" });
        pc.addTransceiver("audio", { direction: "recvonly" });
        pc.ontrack = (event) => {
          event.streams[0]?.getTracks().forEach((track) => {
            if (!remote.getTracks().some((item) => item.id === track.id)) {
              remote.addTrack(track);
            }
          });
          if (videoRef.current) {
            void videoRef.current.play().catch(() => undefined);
          }
        };

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        const response = await fetch(input.playbackUrl, {
          method: "POST",
          headers: { "Content-Type": "application/sdp" },
          body: offer.sdp || "",
        });

        if (!response.ok) {
          throw new Error(`Live playback failed (${response.status})`);
        }

        const answer = await response.text();
        await pc.setRemoteDescription({ type: "answer", sdp: answer });

        const location = response.headers.get("Location");
        if (location) {
          sessionUrlRef.current = new URL(location, input.playbackUrl).toString();
        }

        if (!cancelled && videoRef.current) {
          videoRef.current.muted = true;
          void videoRef.current.play().catch(() => undefined);
        }
      } catch (err: any) {
        if (!cancelled) setError(err?.message || "Live stream connect भएन।");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void connect();

    return () => {
      cancelled = true;
      const sessionUrl = sessionUrlRef.current;
      if (sessionUrl) {
        void fetch(sessionUrl, { method: "DELETE" }).catch(() => undefined);
      }
      pcRef.current?.close();
    };
  }, [params.id]);

  return (
    <main className="fixed inset-0 z-30 bg-black text-white">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={muted}
        className="h-full w-full object-contain"
      />

      <div className="absolute left-4 top-[calc(1rem+env(safe-area-inset-top))] rounded-full bg-red-600 px-3 py-1.5 text-xs font-black">
        LIVE
      </div>

      <button
        type="button"
        onClick={() => {
          const next = !muted;
          setMuted(next);
          if (videoRef.current) videoRef.current.muted = next;
        }}
        className="absolute right-4 top-[calc(1rem+env(safe-area-inset-top))] flex h-10 w-10 items-center justify-center rounded-full bg-black/50 backdrop-blur"
        aria-label={muted ? "Unmute live" : "Mute live"}
      >
        {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
      </button>

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black px-6 text-center">
          <div>
            <div className="text-xl font-black">Live unavailable</div>
            <p className="mt-2 text-sm text-white/65">{error}</p>
          </div>
        </div>
      )}
    </main>
  );
}
