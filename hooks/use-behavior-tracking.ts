"use client";

import { useCallback } from "react";
import { userService } from "@/http/services/user.service";

const STORAGE_KEY = "roomkhoj.behavior-queue";
const MAX_QUEUE = 50;

type BehaviorEvent =
  | { type: "room_view"; roomId: string; title: string; city?: string; price?: number }
  | { type: "room_search"; query: string; filters?: Record<string, unknown> }
  | { type: "filter_applied"; key: string; value: unknown }
  | { type: "category_view"; category: string }
  | { type: "chat_intent"; intent: string };

function readQueue(): BehaviorEvent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as BehaviorEvent[]) : [];
  } catch {
    return [];
  }
}

function writeQueue(queue: BehaviorEvent[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(queue.slice(-MAX_QUEUE)));
}

export function useBehaviorTracking() {
  const track = useCallback((event: BehaviorEvent) => {
    const queue = readQueue();
    queue.push({ ...event, timestamp: Date.now() } as unknown as BehaviorEvent);
    writeQueue(queue);

    // Best-effort server sync; failures are queued for next time
    userService.heartbeat().catch(() => {
      // silent fail
    });
  }, []);

  const trackRoomView = useCallback(
    (roomId: string, title: string, city?: string, price?: number) => {
      track({ type: "room_view", roomId, title, city, price });
    },
    [track],
  );

  const trackSearch = useCallback(
    (query: string, filters?: Record<string, unknown>) => {
      track({ type: "room_search", query, filters });
    },
    [track],
  );

  const trackFilter = useCallback(
    (key: string, value: unknown) => {
      track({ type: "filter_applied", key, value });
    },
    [track],
  );

  return { track, trackRoomView, trackSearch, trackFilter };
}

export function getBehaviorQueue(): BehaviorEvent[] {
  return readQueue();
}
