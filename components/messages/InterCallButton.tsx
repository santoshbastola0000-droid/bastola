"use client";

import { useEffect, useRef, useState } from "react";
import { Phone, PhoneOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { interCallService } from "@/http/services/inter-call.service";

declare global {
  interface Window {
    Twilio?: {
      Device: new (token: string, options?: Record<string, unknown>) => {
        connect: (options: { params: Record<string, string> }) => Promise<any>;
        destroy: () => void;
      };
    };
  }
}

const TWILIO_SDK_URL =
  "https://cdn.jsdelivr.net/npm/@twilio/voice-sdk@2.18.3/dist/twilio.min.js";

let twilioSdkPromise: Promise<void> | null = null;

function loadTwilioSdk() {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.Twilio?.Device) return Promise.resolve();
  if (twilioSdkPromise) return twilioSdkPromise;

  twilioSdkPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-roomkhoj-twilio="true"]',
    );

    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Twilio SDK failed to load")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = TWILIO_SDK_URL;
    script.async = true;
    script.dataset.roomkhojTwilio = "true";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Twilio SDK failed to load"));
    document.head.appendChild(script);
  });

  return twilioSdkPromise;
}

type Props = {
  phoneNumber?: string | null;
};

export function InterCallButton({ phoneNumber }: Props) {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [calling, setCalling] = useState(false);
  const [connected, setConnected] = useState(false);
  const deviceRef = useRef<any>(null);
  const callRef = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;

    interCallService
      .getStatus()
      .then((status) => {
        if (!cancelled) setEnabled(Boolean(status.enabled));
      })
      .catch(() => {
        if (!cancelled) setEnabled(false);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      try {
        callRef.current?.disconnect?.();
        deviceRef.current?.destroy?.();
      } catch {}
    };
  }, []);

  const startCall = async () => {
    const to = String(phoneNumber || "").trim();
    if (!/^\+[1-9]\d{7,14}$/.test(to)) {
      toast.error("Valid phone number चाहिन्छ", {
        description: "Number country code सहित हुनुपर्छ, जस्तै +97798XXXXXXXX.",
      });
      return;
    }

    try {
      setCalling(true);
      await loadTwilioSdk();

      if (!window.Twilio?.Device) {
        throw new Error("Twilio Voice SDK unavailable");
      }

      const { token } = await interCallService.getToken();
      const device = new window.Twilio.Device(token, {
        closeProtection: true,
      });
      deviceRef.current = device;

      const call = await device.connect({
        params: { To: to },
      });
      callRef.current = call;

      call.on?.("accept", () => {
        setConnected(true);
        setCalling(false);
      });
      call.on?.("disconnect", () => {
        setConnected(false);
        setCalling(false);
        callRef.current = null;
      });
      call.on?.("cancel", () => {
        setConnected(false);
        setCalling(false);
        callRef.current = null;
      });
      call.on?.("error", (error: any) => {
        toast.error(error?.message || "Inter Call failed");
        setConnected(false);
        setCalling(false);
      });
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Inter Call सुरु गर्न सकिएन",
      );
      setCalling(false);
      setConnected(false);
    }
  };

  const endCall = () => {
    try {
      callRef.current?.disconnect?.();
      deviceRef.current?.destroy?.();
    } finally {
      callRef.current = null;
      deviceRef.current = null;
      setCalling(false);
      setConnected(false);
    }
  };

  if (loading || !enabled) return null;

  if (calling || connected) {
    return (
      <Button
        type="button"
        size="icon"
        variant="destructive"
        className="h-10 w-10 rounded-full"
        onClick={endCall}
        aria-label="End Inter Call"
        title={connected ? "End Inter Call" : "Cancel Inter Call"}
      >
        {calling && !connected ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <PhoneOff className="h-5 w-5" />
        )}
      </Button>
    );
  }

  return (
    <Button
      type="button"
      size="icon"
      variant="ghost"
      className="h-10 w-10 rounded-full text-foreground hover:bg-muted"
      onClick={startCall}
      aria-label="Inter Call"
      title="Inter Call"
    >
      <Phone className="h-5 w-5" />
    </Button>
  );
}
