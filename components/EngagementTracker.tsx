"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { privateApi } from "@/http/api/privateApi";
import { useUserStore } from "@/stores/user-store";

const SOURCE_KEY = "roomkhoj:entry-source";

function detectSource() {
  const params = new URLSearchParams(window.location.search);
  const explicit = String(params.get("rk_source") || "").toLowerCase();

  if (explicit === "email" || explicit === "push") {
    sessionStorage.setItem(SOURCE_KEY, explicit);
    return explicit;
  }

  const saved = sessionStorage.getItem(SOURCE_KEY);
  if (saved === "email" || saved === "push") return saved;

  try {
    if (document.referrer) {
      const ref = new URL(document.referrer);
      if (ref.origin !== window.location.origin) {
        return "referral";
      }
    }
  } catch {
    // Ignore malformed referrers.
  }

  return "direct";
}

export function EngagementTracker() {
  const userId = useUserStore((state) => state.user?.id);
  const pathname = usePathname();
  const lastTrackedRef = useRef<string>("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const eventId = params.get("rk_event");

    if (eventId) {
      fetch("/api/notifications/engagement/click", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId }),
        keepalive: true,
      }).catch(() => undefined);
    }
  }, []);

  useEffect(() => {
    if (!userId || !pathname) return;

    const path = `${pathname}${window.location.search}`;
    const trackingKey = `${userId}:${path}`;

    // Prevent duplicate React renders of the same route while keeping real page navigations.
    if (lastTrackedRef.current === trackingKey) return;
    lastTrackedRef.current = trackingKey;

    privateApi
      .post("/notifications/engagement/visit", {
        source: detectSource(),
        path,
        referrer: document.referrer || "",
      })
      .catch(() => undefined);
  }, [userId, pathname]);

  return null;
}
