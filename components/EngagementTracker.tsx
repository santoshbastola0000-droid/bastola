"use client";

import { useEffect } from "react";
import { privateApi } from "@/http/api/privateApi";
import { useUserStore } from "@/stores/user-store";

const VISIT_KEY = "roomkhoj:engagement-visit";
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
    if (!userId) return;

    const source = detectSource();
    const sessionKey = `${VISIT_KEY}:${userId}:${source}`;

    if (sessionStorage.getItem(sessionKey)) return;

    privateApi
      .post("/notifications/engagement/visit", {
        source,
        path: `${window.location.pathname}${window.location.search}`,
        referrer: document.referrer || "",
      })
      .then(() => {
        sessionStorage.setItem(sessionKey, "1");
      })
      .catch(() => undefined);
  }, [userId]);

  return null;
}
