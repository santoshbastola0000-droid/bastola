"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { api } from "@/http/api/api";
import { privateApi } from "@/http/api/privateApi";
import { useUserStore } from "@/stores/user-store";

const SOURCE_KEY = "roomkhoj:entry-source";
const INTENT_KEY = "roomkhoj:entry-intent";
const TRAFFIC_CONTEXT_KEY = "roomkhoj:traffic-context";
const TRAFFIC_SESSION_KEY = "roomkhoj:traffic-session";
const TRAFFIC_ENTRY_SENT_KEY = "roomkhoj:traffic-entry-sent";

type TrafficContext = {
  source: string;
  landingPath: string;
  referrerHost: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
};

function detectIntent() {
  const params = new URLSearchParams(window.location.search);
  const explicit = String(params.get("intent") || "").toLowerCase();

  const normalized =
    explicit === "post-vacancy"
      ? "POST_JOB"
      : explicit === "find-job"
        ? "FIND_JOB"
        : explicit === "list-room"
          ? "POST_ROOM"
          : explicit === "find-room"
            ? "FIND_ROOM"
            : "";

  if (normalized) {
    sessionStorage.setItem(INTENT_KEY, normalized);
    return normalized;
  }

  const path = window.location.pathname.toLowerCase();
  const inferred =
    path.includes("/jobs/post") || path.includes("/jobs/candidates")
      ? "POST_JOB"
      : path.includes("/user/dashboard/rooms/create")
        ? "POST_ROOM"
        : path.includes("/jobs") || path.includes("/job/")
          ? "FIND_JOB"
          : path.includes("/rooms") || path.includes("/property/")
            ? "FIND_ROOM"
            : "";

  if (inferred) {
    sessionStorage.setItem(INTENT_KEY, inferred);
    return inferred;
  }

  return sessionStorage.getItem(INTENT_KEY) || "";
}

function classifyEntrySource(
  explicit: string,
  utmSource: string,
  referrerHost: string,
) {
  const haystack = `${explicit} ${utmSource} ${referrerHost}`.toLowerCase();
  const rules: Array<[string, string[]]> = [
    ["chatgpt", ["chatgpt", "chat.openai.com", "openai"]],
    ["google", ["google"]],
    ["facebook", ["facebook", "fb.com"]],
    ["instagram", ["instagram"]],
    ["tiktok", ["tiktok"]],
    ["youtube", ["youtube", "youtu.be"]],
    ["bing", ["bing"]],
    ["yahoo", ["yahoo"]],
    ["linkedin", ["linkedin"]],
    ["x", ["twitter", "x.com", "t.co"]],
    ["whatsapp", ["whatsapp", "wa.me"]],
    ["reddit", ["reddit"]],
    ["threads", ["threads.net"]],
    ["email", ["email", "newsletter"]],
    ["push", ["push"]],
  ];

  for (const [source, terms] of rules) {
    if (terms.some((term) => haystack.includes(term))) return source;
  }

  if (explicit) return explicit.toLowerCase();
  if (referrerHost) return "referral";
  return "direct";
}

function getTrafficContext(): TrafficContext {
  const saved = sessionStorage.getItem(TRAFFIC_CONTEXT_KEY);
  if (saved) {
    try {
      return JSON.parse(saved) as TrafficContext;
    } catch {
      sessionStorage.removeItem(TRAFFIC_CONTEXT_KEY);
    }
  }

  const params = new URLSearchParams(window.location.search);
  const utmSource = String(params.get("utm_source") || "").trim().toLowerCase();
  const utmMedium = String(params.get("utm_medium") || "").trim().toLowerCase();
  const utmCampaign = String(params.get("utm_campaign") || "").trim();
  const explicit = String(
    params.get("rk_source") || sessionStorage.getItem(SOURCE_KEY) || "",
  ).trim().toLowerCase();

  let referrerHost = "";
  try {
    if (document.referrer) {
      const referrer = new URL(document.referrer);
      if (referrer.origin !== window.location.origin) {
        referrerHost = referrer.hostname.toLowerCase();
      }
    }
  } catch {
    referrerHost = "";
  }

  const context: TrafficContext = {
    source: classifyEntrySource(explicit, utmSource, referrerHost),
    landingPath: `${window.location.pathname}${window.location.search}`.slice(0, 500),
    referrerHost,
    utmSource,
    utmMedium,
    utmCampaign,
  };

  sessionStorage.setItem(TRAFFIC_CONTEXT_KEY, JSON.stringify(context));
  sessionStorage.setItem(SOURCE_KEY, context.source);
  return context;
}

function getTrafficSessionId() {
  const saved = sessionStorage.getItem(TRAFFIC_SESSION_KEY);
  if (saved) return saved;

  const fallback =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `rk-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;

  const sessionId = fallback.replace(/[^A-Za-z0-9:_-]/g, "").slice(0, 80);
  sessionStorage.setItem(TRAFFIC_SESSION_KEY, sessionId);
  return sessionId;
}

export function EngagementTracker() {
  const userId = useUserStore((state) => state.user?.id);
  const pathname = usePathname();
  const lastTrackedRef = useRef<string>("");

  useEffect(() => {
    detectIntent();

    const params = new URLSearchParams(window.location.search);
    const eventId = params.get("rk_event");
    const signature = params.get("rk_sig");

    if (eventId && signature) {
      fetch("/api/notifications/engagement/click", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, signature }),
        keepalive: true,
      }).catch(() => undefined);
    }
  }, []);

  useEffect(() => {
    if (!pathname) return;

    const path = `${pathname}${window.location.search}`;
    const sessionId = getTrafficSessionId();
    const trackingKey = `${sessionId}:${path}`;

    if (lastTrackedRef.current === trackingKey) return;
    lastTrackedRef.current = trackingKey;

    const context = getTrafficContext();
    const isEntry = sessionStorage.getItem(TRAFFIC_ENTRY_SENT_KEY) !== "1";
    if (isEntry) sessionStorage.setItem(TRAFFIC_ENTRY_SENT_KEY, "1");

    api
      .post("/notifications/traffic/visit", {
        sessionId,
        source: context.source,
        path,
        landingPath: context.landingPath,
        referrerHost: context.referrerHost,
        utmSource: context.utmSource,
        utmMedium: context.utmMedium,
        utmCampaign: context.utmCampaign,
        isEntry,
      })
      .catch(() => undefined);

    if (!userId) return;

    privateApi
      .post("/notifications/engagement/visit", {
        source: context.source,
        path,
        referrer: document.referrer || "",
        intent: detectIntent(),
      })
      .catch(() => undefined);
  }, [userId, pathname]);

  return null;
}
