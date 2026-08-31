"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRightLeft,
  Bot,
  Database,
  Loader2,
  Mic2,
  PhoneCall,
  Save,
  TimerReset,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AiVoiceCloneRecorder } from "@/components/admin/AiVoiceCloneRecorder";
import {
  AiCallSettings,
  aiCallService,
} from "@/http/services/ai-call.service";

const toggleClass = (on: boolean) =>
  on ? "default" : "outline";

export default function AiCallAdminPage() {
  const { data: settings, refetch: refetchSettings } = useQuery({
    queryKey: ["admin-ai-call-settings"],
    queryFn: () => aiCallService.getSettings(),
  });

  const { data: sessions, refetch: refetchSessions } = useQuery({
    queryKey: ["admin-ai-call-sessions"],
    queryFn: () => aiCallService.getSessions(50),
    refetchInterval: 15_000,
  });

  const [form, setForm] = useState<Partial<AiCallSettings>>({});
  const [saving, setSaving] = useState(false);
  const [outboundNumber, setOutboundNumber] = useState("+977");
  const [calling, setCalling] = useState(false);

  useEffect(() => {
    if (!settings) return;
    setForm({ ...settings });
  }, [settings]);

  const saveSettings = async () => {
    try {
      setSaving(true);
      await aiCallService.updateSettings({
        enabled: Boolean(form.enabled),
        assistantName: String(form.assistantName || "RoomKhoj AI"),
        humanTransferNumber:
          String(form.humanTransferNumber || "").trim() || null,
        systemPrompt: String(form.systemPrompt || "").trim() || null,
        greetingMessage: String(form.greetingMessage || "").trim() || null,
        goodbyeMessage: String(form.goodbyeMessage || "").trim() || null,
        silenceTimeoutSeconds: Math.max(
          3,
          Math.min(30, Number(form.silenceTimeoutSeconds || 10)),
        ),
        silenceRetries: Math.max(
          0,
          Math.min(3, Number(form.silenceRetries || 0)),
        ),
        captureCallerDetails: Boolean(form.captureCallerDetails),
        useKnownName: Boolean(form.useKnownName),
        autoTransferOnFailure: Boolean(form.autoTransferOnFailure),
        voiceProvider:
          form.voiceProvider === "elevenlabs" ? "elevenlabs" : "twilio",
        voiceId: String(form.voiceId || "").trim() || null,
      });
      await refetchSettings();
      toast.success("AI Training settings saved");
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "AI Training settings save गर्न सकिएन",
      );
    } finally {
      setSaving(false);
    }
  };

  const startCall = async () => {
    try {
      setCalling(true);
      const call = await aiCallService.startOutbound(outboundNumber.trim());
      toast.success("AI call started", {
        description: `${call.to} · ${call.status}`,
      });
      await refetchSessions();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Outbound AI call सुरु गर्न सकिएन",
      );
    } finally {
      setCalling(false);
    }
  };

  const setBoolean = (
    key:
      | "enabled"
      | "captureCallerDetails"
      | "useKnownName"
      | "autoTransferOnFailure",
  ) =>
    setForm((current) => ({
      ...current,
      [key]: !Boolean(current[key]),
    }));

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          AI Training & Call Center
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          AI को बोल्ने तरिका, silence handling, caller details, human transfer र cloned voice यहींबाट control गर्नुहोस्।
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              Core AI Training
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex items-center justify-between rounded-xl border p-4">
                <div>
                  <p className="font-semibold">AI Call</p>
                  <p className="text-xs text-muted-foreground">Master ON/OFF</p>
                </div>
                <Button
                  type="button"
                  variant={toggleClass(Boolean(form.enabled))}
                  onClick={() => setBoolean("enabled")}
                >
                  {form.enabled ? "ON" : "OFF"}
                </Button>
              </div>

              <div className="flex items-center justify-between rounded-xl border p-4">
                <div>
                  <p className="font-semibold">Known name</p>
                  <p className="text-xs text-muted-foreground">
                    DB मा name भए नाम लिएर बोलाउने
                  </p>
                </div>
                <Button
                  type="button"
                  variant={toggleClass(Boolean(form.useKnownName))}
                  onClick={() => setBoolean("useKnownName")}
                >
                  {form.useKnownName ? "ON" : "OFF"}
                </Button>
              </div>

              <div className="flex items-center justify-between rounded-xl border p-4">
                <div>
                  <p className="font-semibold">Save caller details</p>
                  <p className="text-xs text-muted-foreground">
                    Call बाट relevant details structure मा save
                  </p>
                </div>
                <Button
                  type="button"
                  variant={toggleClass(Boolean(form.captureCallerDetails))}
                  onClick={() => setBoolean("captureCallerDetails")}
                >
                  {form.captureCallerDetails ? "ON" : "OFF"}
                </Button>
              </div>

              <div className="flex items-center justify-between rounded-xl border p-4">
                <div>
                  <p className="font-semibold">Auto transfer</p>
                  <p className="text-xs text-muted-foreground">
                    AI fail हुँदा staff मा transfer
                  </p>
                </div>
                <Button
                  type="button"
                  variant={toggleClass(Boolean(form.autoTransferOnFailure))}
                  onClick={() => setBoolean("autoTransferOnFailure")}
                >
                  {form.autoTransferOnFailure ? "ON" : "OFF"}
                </Button>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Assistant name
              </label>
              <Input
                value={String(form.assistantName || "")}
                onChange={(e) =>
                  setForm((current) => ({
                    ...current,
                    assistantName: e.target.value,
                  }))
                }
                placeholder="RoomKhoj AI"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Human transfer number
              </label>
              <Input
                type="tel"
                value={String(form.humanTransferNumber || "")}
                onChange={(e) =>
                  setForm((current) => ({
                    ...current,
                    humanTransferNumber: e.target.value,
                  }))
                }
                placeholder="+97798XXXXXXXX"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Greeting message
              </label>
              <textarea
                value={String(form.greetingMessage || "")}
                onChange={(e) =>
                  setForm((current) => ({
                    ...current,
                    greetingMessage: e.target.value,
                  }))
                }
                className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="Optional. {{name}} र {{assistantName}} प्रयोग गर्न मिल्छ।"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Goodbye message
              </label>
              <textarea
                value={String(form.goodbyeMessage || "")}
                onChange={(e) =>
                  setForm((current) => ({
                    ...current,
                    goodbyeMessage: e.target.value,
                  }))
                }
                className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="Call काट्दा AI ले बोल्ने अन्तिम message"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                AI Training Instructions
              </label>
              <textarea
                value={String(form.systemPrompt || "")}
                onChange={(e) =>
                  setForm((current) => ({
                    ...current,
                    systemPrompt: e.target.value,
                  }))
                }
                className="min-h-40 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="उदाहरण: छोटो, नम्र Roman Nepali/Nepali मा बोल; user ले room सोधे real DB data मात्र भन; निर्णय चाहिने कुरा staff मा transfer गर..."
              />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TimerReset className="h-5 w-5" />
                Silence & Hang-up
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Wait for voice (seconds)
                  </label>
                  <Input
                    type="number"
                    min={3}
                    max={30}
                    value={Number(form.silenceTimeoutSeconds || 10)}
                    onChange={(e) =>
                      setForm((current) => ({
                        ...current,
                        silenceTimeoutSeconds: Number(e.target.value),
                      }))
                    }
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Recommended: 10 seconds
                  </p>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Hello retry count
                  </label>
                  <Input
                    type="number"
                    min={0}
                    max={3}
                    value={Number(form.silenceRetries ?? 1)}
                    onChange={(e) =>
                      setForm((current) => ({
                        ...current,
                        silenceRetries: Number(e.target.value),
                      }))
                    }
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Name भए “name जी, सुन्नु हुँदैछ?”, नभए “hello hello”
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mic2 className="h-5 w-5" />
                Voice / Clone
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Voice provider
                </label>
                <select
                  value={form.voiceProvider || "twilio"}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      voiceProvider:
                        e.target.value === "elevenlabs"
                          ? "elevenlabs"
                          : "twilio",
                    }))
                  }
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="twilio">Twilio standard voice</option>
                  <option value="elevenlabs">
                    ElevenLabs cloned voice
                  </option>
                </select>
              </div>

              {form.voiceProvider === "elevenlabs" && (
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    ElevenLabs Voice ID
                  </label>
                  <Input
                    value={String(form.voiceId || "")}
                    onChange={(e) =>
                      setForm((current) => ({
                        ...current,
                        voiceId: e.target.value,
                      }))
                    }
                    placeholder="voice_xxxxxxxxx"
                  />
                  <p className="mt-2 text-xs text-muted-foreground">
                    Staff को स्पष्ट consent भएको cloned voice ID मात्र प्रयोग गर्नुहोस्।
                  </p>
                </div>
              )}

              <AiVoiceCloneRecorder
                activeProvider={settings?.voiceProvider}
                activeVoiceId={settings?.voiceId}
                onCreated={async () => {
                  const result = await refetchSettings();
                  if (result.data) setForm({ ...result.data });
                }}
              />

              <div className="rounded-xl border bg-muted/40 p-4 text-xs text-muted-foreground">
                Cloned voice चल्न backend मा ELEVENLABS_API_KEY र AI_CALL_MEDIA_SECRET चाहिन्छ। नभए Twilio standard voice fallback हुन्छ।
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PhoneCall className="h-5 w-5" />
                Outbound AI Call
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                type="tel"
                value={outboundNumber}
                onChange={(e) => setOutboundNumber(e.target.value)}
                placeholder="+97798XXXXXXXX"
              />
              <Button
                onClick={startCall}
                disabled={calling || !form.enabled}
                className="w-full"
              >
                {calling ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <PhoneCall className="mr-2 h-4 w-4" />
                )}
                Start AI Call
              </Button>
              <div className="rounded-xl border bg-muted/40 p-4 text-sm">
                <p className="font-semibold">Incoming webhook</p>
                <p className="mt-1 break-all text-xs text-muted-foreground">
                  https://api.roomkhoj.com/ai-call/inbound
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Twilio number मा HTTP POST राख्नुहोस्।
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Button onClick={saveSettings} disabled={saving} className="w-full md:w-auto">
        {saving ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Save className="mr-2 h-4 w-4" />
        )}
        Save AI Training
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5" />
            Recent AI Calls & Saved Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!sessions?.length ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              AI call history छैन।
            </p>
          ) : (
            <div className="space-y-3">
              {sessions.map((session) => (
                <div key={session.id} className="rounded-xl border p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="flex items-center gap-2 font-semibold">
                        <UserRound className="h-4 w-4" />
                        {session.callerName || session.phoneNumber || "Unknown caller"}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {session.direction} · {session.phoneNumber || "Unknown"} ·{" "}
                        {new Date(session.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{session.status}</p>
                      {session.outcome && (
                        <p className="text-xs text-muted-foreground">
                          {session.outcome}
                        </p>
                      )}
                      {session.transferredToHuman && (
                        <p className="text-xs text-primary">
                          Transferred to staff
                        </p>
                      )}
                    </div>
                  </div>

                  {Object.keys(session.callerDetails || {}).length > 0 && (
                    <details className="mt-3">
                      <summary className="flex cursor-pointer items-center gap-2 text-sm font-medium">
                        <Database className="h-4 w-4" />
                        Saved caller details
                      </summary>
                      <div className="mt-2 grid gap-2 rounded-lg bg-muted/40 p-3 sm:grid-cols-2">
                        {Object.entries(session.callerDetails || {}).map(
                          ([key, value]) => (
                            <p key={key} className="text-sm">
                              <span className="font-semibold">{key}:</span>{" "}
                              {String(value)}
                            </p>
                          ),
                        )}
                      </div>
                    </details>
                  )}

                  {!!session.transcript?.length && (
                    <details className="mt-3">
                      <summary className="cursor-pointer text-sm font-medium">
                        Transcript
                      </summary>
                      <div className="mt-2 space-y-2 rounded-lg bg-muted/40 p-3">
                        {session.transcript.map((turn, index) => (
                          <p key={index} className="text-sm">
                            <span className="font-semibold">
                              {turn.role === "user" ? "Caller" : "AI"}:
                            </span>{" "}
                            {turn.text}
                          </p>
                        ))}
                      </div>
                    </details>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
