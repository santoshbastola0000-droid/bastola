"use client";

import { useEffect, useRef, useState } from "react";
import { Phone, PhoneOff, Video } from "lucide-react";
import { io, Socket } from "socket.io-client";
import { usePathname, useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import useTokenStore from "@/store";

type IncomingSignal = {
  callId: string;
  fromUserId: string;
  mode: "audio" | "video";
  payload: RTCSessionDescriptionInit;
};

const storageKey = (callId: string) =>
  `roomkhoj:incoming-call:${callId}`;

export function GlobalIncomingCall() {
  const router = useRouter();
  const pathname = usePathname();
  const token = useTokenStore((state) => state.token);
  const [incoming, setIncoming] =
    useState<IncomingSignal | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    /*
     * Messages page has its own WebRTC handler.  Every other page
     * keeps this lightweight listener so a newly opened site still
     * receives the incoming-call prompt.
     */
    if (!token || pathname === "/messages") return;

    const socket: Socket = io(
      "https://api.roomkhoj.com/messages",
      {
        /*
         * Keep a connection on every page.  Polling fallback is important
         * on networks where a fresh WebSocket is delayed or blocked.
         */
        transports: ["polling", "websocket"],
        upgrade: true,
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 800,
        withCredentials: true,
        auth: { token },
      },
    );

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("[GLOBAL CALL] connected", socket.id);
    });

    socket.on("connect_error", (error) => {
      console.warn("[GLOBAL CALL] connection error", error.message);
    });

    socket.on("call:signal", (signal: any) => {
      if (signal?.type === "offer" && signal?.callId) {
        const saved = {
          callId: String(signal.callId),
          fromUserId: String(signal.fromUserId || ""),
          mode: signal.mode === "video" ? "video" : "audio",
          payload: signal.payload,
          candidates: [],
        };

        sessionStorage.setItem(
          storageKey(saved.callId),
          JSON.stringify(saved),
        );
        setIncoming(saved);
        return;
      }

      if (signal?.type === "candidate" && signal?.callId) {
        const raw = sessionStorage.getItem(storageKey(signal.callId));
        if (!raw) return;

        try {
          const saved = JSON.parse(raw);
          saved.candidates = [
            ...(Array.isArray(saved.candidates) ? saved.candidates : []),
            signal.payload,
          ];
          sessionStorage.setItem(
            storageKey(signal.callId),
            JSON.stringify(saved),
          );
        } catch {
          // Invalid temporary call data is ignored safely.
        }
        return;
      }

      if (signal?.type === "end" && signal?.callId) {
        sessionStorage.removeItem(storageKey(signal.callId));
        setIncoming((current) =>
          current?.callId === signal.callId ? null : current,
        );
      }
    });

    return () => {
      socketRef.current = null;
      socket.disconnect();
    };
  }, [pathname, token]);

  if (!incoming) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-background p-6 text-center shadow-2xl">
        {incoming.mode === "video" ? (
          <Video className="mx-auto h-10 w-10 text-primary" />
        ) : (
          <Phone className="mx-auto h-10 w-10 text-primary" />
        )}

        <h2 className="mt-3 text-xl font-bold">
          Incoming {incoming.mode === "video" ? "video" : "audio"} call
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          RoomKhoj user is calling you
        </p>

        <div className="mt-6 flex gap-3">
          <Button
            className="flex-1"
            onClick={() =>
              router.push(
                `/messages?incomingCall=${encodeURIComponent(incoming.callId)}`,
              )
            }
          >
            Open call
          </Button>
          <Button
            className="flex-1"
            variant="destructive"
            onClick={() => {
              socketRef.current?.emit("call:signal", {
                targetUserId: incoming.fromUserId,
                callId: incoming.callId,
                type: "end",
                mode: incoming.mode,
                payload: { reason: "declined" },
              });
              sessionStorage.removeItem(storageKey(incoming.callId));
              setIncoming(null);
            }}
          >
            <PhoneOff className="mr-2 h-4 w-4" />
            Decline
          </Button>
        </div>
      </div>
    </div>
  );
}
