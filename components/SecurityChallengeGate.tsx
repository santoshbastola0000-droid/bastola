"use client";

import { useCallback, useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          action?: string;
          theme?: "light" | "dark" | "auto";
          callback: (token: string) => void;
          "error-callback"?: () => void;
          "expired-callback"?: () => void;
        },
      ) => string;
      remove?: (widgetId: string) => void;
      reset?: (widgetId: string) => void;
    };
  }
}

type TurnstileConfig = {
  enabled: boolean;
  siteKey: string | null;
  action?: string;
};

const SCRIPT_ID = "roomkhoj-turnstile-script";

async function loadTurnstileScript() {
  if (window.turnstile) return;

  await new Promise<void>((resolve, reject) => {
    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Turnstile failed to load")), {
        once: true,
      });
      return;
    }

    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src =
      "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Turnstile failed to load"));
    document.head.appendChild(script);
  });
}

export function SecurityChallengeGate() {
  const [open, setOpen] = useState(false);
  const [config, setConfig] = useState<TurnstileConfig | null>(null);
  const [status, setStatus] = useState("RoomKhoj security check loading…");
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const verifyingRef = useRef(false);

  const verify = useCallback(async (token: string) => {
    if (verifyingRef.current) return;
    verifyingRef.current = true;
    setStatus("Security check verifying…");

    try {
      const response = await fetch("/api/security/turnstile/verify", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      if (!response.ok) {
        throw new Error("Verification failed");
      }

      setStatus("Verified. Reloading…");
      window.setTimeout(() => window.location.reload(), 250);
    } catch {
      verifyingRef.current = false;
      setStatus("Verification failed. Please try again.");
      if (widgetIdRef.current && window.turnstile?.reset) {
        window.turnstile.reset(widgetIdRef.current);
      }
    }
  }, []);

  useEffect(() => {
    const openChallenge = () => {
      setOpen(true);
      setStatus("RoomKhoj security check loading…");
    };

    window.addEventListener("roomkhoj:security-challenge", openChallenge);
    return () =>
      window.removeEventListener("roomkhoj:security-challenge", openChallenge);
  }, []);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    (async () => {
      try {
        const response = await fetch("/api/security/turnstile/config", {
          credentials: "include",
          cache: "no-store",
        });
        if (!response.ok) throw new Error("Could not load security config");

        const nextConfig = (await response.json()) as TurnstileConfig;
        if (cancelled) return;

        if (!nextConfig.enabled || !nextConfig.siteKey) {
          setOpen(false);
          return;
        }

        setConfig(nextConfig);
        await loadTurnstileScript();
        if (cancelled || !containerRef.current || !window.turnstile) return;

        if (widgetIdRef.current && window.turnstile.remove) {
          window.turnstile.remove(widgetIdRef.current);
          widgetIdRef.current = null;
        }

        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: nextConfig.siteKey,
          action: nextConfig.action || "security_challenge",
          theme: "auto",
          callback: verify,
          "error-callback": () =>
            setStatus("Security check could not load. Please refresh and retry."),
          "expired-callback": () =>
            setStatus("Security check expired. Please complete it again."),
        });

        setStatus("Please complete the security check.");
      } catch {
        if (!cancelled) {
          setStatus("Security check unavailable. Please refresh and try again.");
        }
      }
    })();

    return () => {
      cancelled = true;
      if (widgetIdRef.current && window.turnstile?.remove) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [open, verify]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl dark:bg-zinc-950">
        <img
          src="/roomkhoj-logo.png"
          alt="RoomKhoj"
          className="mx-auto mb-3 h-14 w-14 rounded-xl object-cover"
        />
        <h2 className="text-lg font-bold">Security check</h2>
        <p className="mt-2 text-sm text-muted-foreground">{status}</p>
        <div
          ref={containerRef}
          className="mt-5 flex min-h-[70px] items-center justify-center"
          data-enabled={config?.enabled ? "true" : "false"}
        />
        <p className="mt-4 text-xs text-muted-foreground">
          यो check bot र abusive traffic रोक्नका लागि मात्र हो।
        </p>
      </div>
    </div>
  );
}
