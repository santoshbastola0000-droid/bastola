"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Mic, MicOff, Phone, PhoneCall, PhoneIncoming, PhoneOff } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { twilioCallService } from "@/http/services/twilio-call.service";

declare global {
  interface Window {
    Twilio?: {
      Device: new (token: string, options?: Record<string, unknown>) => any;
    };
  }
}

function normaliseNumber(value: string) {
  const raw = value.trim().replace(/[\s()-]/g, "");
  if (raw.startsWith("+")) return raw;
  if (raw.startsWith("00")) return "+" + raw.slice(2);
  if (/^9\d{9}$/.test(raw)) return "+977" + raw;
  if (/^\d{10}$/.test(raw)) return "+1" + raw;
  return raw;
}

export default function TwilioCallPage() {
  const deviceRef = useRef<any>(null);
  const callRef = useRef<any>(null);
  const incomingRef = useRef<any>(null);

  const [loading, setLoading] = useState(true);
  const [configured, setConfigured] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null);
  const [destination, setDestination] = useState("");
  const [status, setStatus] = useState("Starting Twilio phone…");
  const [activeCall, setActiveCall] = useState(false);
  const [incoming, setIncoming] = useState(false);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadSdk = () =>
      new Promise<void>((resolve, reject) => {
        if (window.Twilio?.Device) return resolve();

        const existing = document.querySelector<HTMLScriptElement>('script[data-roomkhoj-twilio="true"]');
        if (existing) {
          existing.addEventListener("load", () => resolve(), { once: true });
          existing.addEventListener("error", () => reject(new Error("Twilio SDK failed to load")), { once: true });
          return;
        }

        const script = document.createElement("script");
        script.src = "https://unpkg.com/@twilio/voice-sdk@2.18.3/dist/twilio.min.js";
        script.async = true;
        script.dataset.roomkhojTwilio = "true";
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Twilio SDK failed to load"));
        document.head.appendChild(script);
      });

    const attachCallEvents = (call: any) => {
      call.on("accept", () => {
        if (cancelled) return;
        setActiveCall(true);
        setStatus("Call connected");
      });
      call.on("disconnect", () => {
        if (cancelled) return;
        callRef.current = null;
        incomingRef.current = null;
        setActiveCall(false);
        setIncoming(false);
        setMuted(false);
        setStatus("Ready");
      });
      call.on("cancel", () => {
        if (cancelled) return;
        incomingRef.current = null;
        setIncoming(false);
        setStatus("Ready");
      });
      call.on("reject", () => {
        if (cancelled) return;
        setActiveCall(false);
        setIncoming(false);
        setStatus("Call rejected");
      });
      call.on("error", (error: any) => {
        if (cancelled) return;
        toast.error(error?.message || "Call error");
        setStatus("Call error");
      });
    };

    const start = async () => {
      try {
        const config = await twilioCallService.getConfig();
        if (cancelled) return;
        setConfigured(config.configured);
        setPhoneNumber(config.phoneNumber);

        if (!config.configured) {
          setStatus("Twilio credentials are not configured on the server");
          return;
        }

        await loadSdk();
        const auth = await twilioCallService.getToken();
        const Device = window.Twilio?.Device;
        if (!Device) throw new Error("Twilio Device SDK is unavailable");

        const device = new Device(auth.token, {
          closeProtection: true,
          codecPreferences: ["opus", "pcmu"],
        });

        device.on("registered", () => {
          if (cancelled) return;
          setRegistered(true);
          setStatus("Ready");
        });

        device.on("unregistered", () => {
          if (cancelled) return;
          setRegistered(false);
          setStatus("Disconnected");
        });

        device.on("incoming", (call: any) => {
          if (cancelled) return;
          incomingRef.current = call;
          attachCallEvents(call);
          setIncoming(true);
          setStatus("Incoming call");
        });

        device.on("error", (error: any) => {
          if (cancelled) return;
          toast.error(error?.message || "Twilio device error");
          setStatus("Twilio error");
        });

        device.on("tokenWillExpire", async () => {
          try {
            const fresh = await twilioCallService.getToken();
            device.updateToken(fresh.token);
          } catch {
            // A failed refresh will surface through the Device error/unregistered events.
          }
        });

        deviceRef.current = device;
        await device.register();
      } catch (error: any) {
        toast.error(error?.response?.data?.message || error?.message || "Twilio phone सुरु गर्न सकिएन");
        setStatus("Unable to start Twilio phone");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    start();

    return () => {
      cancelled = true;
      try {
        callRef.current?.disconnect();
        incomingRef.current?.reject();
        deviceRef.current?.destroy();
      } catch {}
      callRef.current = null;
      incomingRef.current = null;
      deviceRef.current = null;
    };
  }, []);

  const makeCall = async () => {
    const to = normaliseNumber(destination);
    if (!/^\+[1-9]\d{7,14}$/.test(to)) {
      toast.error("Number +97798XXXXXXXX वा +1XXXXXXXXXX format मा राख्नुहोस्");
      return;
    }

    try {
      setStatus("Calling…");
      const call = await deviceRef.current?.connect({ params: { To: to } });
      if (!call) throw new Error("Twilio device is not ready");
      callRef.current = call;
      call.on("accept", () => {
        setActiveCall(true);
        setStatus("Call connected");
      });
      call.on("disconnect", () => {
        callRef.current = null;
        setActiveCall(false);
        setMuted(false);
        setStatus("Ready");
      });
      call.on("error", (error: any) => {
        toast.error(error?.message || "Call failed");
        setStatus("Call failed");
      });
    } catch (error: any) {
      toast.error(error?.message || "Call गर्न सकिएन");
      setStatus("Call failed");
    }
  };

  const answer = () => {
    const call = incomingRef.current;
    if (!call) return;
    call.accept();
    callRef.current = call;
    setIncoming(false);
    setActiveCall(true);
    setStatus("Call connected");
  };

  const decline = () => {
    incomingRef.current?.reject();
    incomingRef.current = null;
    setIncoming(false);
    setStatus("Ready");
  };

  const hangup = () => {
    callRef.current?.disconnect();
    callRef.current = null;
    setActiveCall(false);
    setMuted(false);
    setStatus("Ready");
  };

  const toggleMute = () => {
    if (!callRef.current) return;
    const next = !muted;
    callRef.current.mute(next);
    setMuted(next);
  };

  return (
    <div className="mx-auto w-full max-w-5xl p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Twilio Phone</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Separate browser softphone for incoming and outgoing phone calls.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.2fr_.8fr]">
        <section className="rounded-2xl border bg-card p-5 shadow-sm">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <div className="text-sm text-muted-foreground">Twilio number</div>
              <div className="text-lg font-semibold">{phoneNumber || "Not configured"}</div>
            </div>
            <div className="rounded-full border px-3 py-1 text-xs">
              {loading ? "Starting…" : registered ? "Online" : configured ? "Offline" : "Setup required"}
            </div>
          </div>

          <label className="mb-2 block text-sm font-medium">Call number</label>
          <Input
            value={destination}
            onChange={(event) => setDestination(event.target.value)}
            placeholder="+97798XXXXXXXX"
            className="h-12 text-base"
            disabled={!registered || activeCall || incoming}
          />

          <div className="mt-4 grid grid-cols-3 gap-2">
            {["1","2","3","4","5","6","7","8","9","+","0","⌫"].map((key) => (
              <Button
                key={key}
                type="button"
                variant="outline"
                className="h-12 text-lg"
                disabled={activeCall || incoming}
                onClick={() =>
                  setDestination((current) =>
                    key === "⌫" ? current.slice(0, -1) : current + key
                  )
                }
              >
                {key}
              </Button>
            ))}
          </div>

          <div className="mt-5 flex justify-center gap-3">
            {!activeCall ? (
              <Button
                className="h-12 min-w-40 rounded-full"
                onClick={makeCall}
                disabled={!registered || incoming || !destination.trim()}
              >
                <PhoneCall className="mr-2 h-5 w-5" />
                Call
              </Button>
            ) : (
              <>
                <Button variant="outline" size="icon" className="h-12 w-12 rounded-full" onClick={toggleMute}>
                  {muted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                </Button>
                <Button variant="destructive" className="h-12 min-w-40 rounded-full" onClick={hangup}>
                  <PhoneOff className="mr-2 h-5 w-5" />
                  Hang up
                </Button>
              </>
            )}
          </div>
        </section>

        <aside className="rounded-2xl border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-3">
            {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Phone className="h-6 w-6" />}
            <div>
              <div className="font-semibold">Status</div>
              <div className="text-sm text-muted-foreground">{status}</div>
            </div>
          </div>

          <div className="mt-5 rounded-xl bg-muted p-4 text-sm text-muted-foreground">
            Nepal mobile number बिना country code लेख्दा system ले +977 automatically थप्छ।
            Other countries का लागि +countrycode सहित number राख्नुहोस्।
          </div>
        </aside>
      </div>

      {incoming && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-background p-6 text-center shadow-2xl">
            <PhoneIncoming className="mx-auto h-12 w-12" />
            <h2 className="mt-3 text-xl font-bold">Incoming Twilio call</h2>
            <p className="mt-1 text-sm text-muted-foreground">Call is ringing on your RoomKhoj softphone.</p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <Button onClick={answer}>Answer</Button>
              <Button variant="destructive" onClick={decline}>Decline</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
