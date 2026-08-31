"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bot, PhoneCall, Save, Loader2, ArrowRightLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  AiCallSettings,
  aiCallService,
} from "@/http/services/ai-call.service";

export default function AiCallAdminPage() {
  const { data: settings, refetch: refetchSettings } = useQuery({
    queryKey: ["admin-ai-call-settings"],
    queryFn: () => aiCallService.getSettings(),
  });

  const { data: sessions, refetch: refetchSessions } = useQuery({
    queryKey: ["admin-ai-call-sessions"],
    queryFn: () => aiCallService.getSessions(30),
    refetchInterval: 15_000,
  });

  const [form, setForm] = useState<Partial<AiCallSettings>>({});
  const [saving, setSaving] = useState(false);
  const [outboundNumber, setOutboundNumber] = useState("+977");
  const [calling, setCalling] = useState(false);

  useEffect(() => {
    if (!settings) return;
    setForm({
      enabled: settings.enabled,
      assistantName: settings.assistantName,
      humanTransferNumber: settings.humanTransferNumber || "",
      systemPrompt: settings.systemPrompt || "",
    });
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
      });
      await refetchSettings();
      toast.success("AI Call settings saved");
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "AI Call settings save गर्न सकिएन",
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

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">AI Call Center</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Incoming वा outgoing call मा AI ले पहिले कुरा गर्छ र आवश्यक परे staff मा transfer गर्छ।
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              AI Agent Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-xl border p-4">
              <div>
                <p className="font-semibold">AI Call</p>
                <p className="text-xs text-muted-foreground">
                  Incoming/outgoing AI agent enable वा disable
                </p>
              </div>
              <Button
                type="button"
                variant={form.enabled ? "default" : "outline"}
                onClick={() =>
                  setForm((current) => ({
                    ...current,
                    enabled: !Boolean(current.enabled),
                  }))
                }
              >
                {form.enabled ? "ON" : "OFF"}
              </Button>
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
              <p className="mt-1 text-xs text-muted-foreground">
                AI ले solve गर्न नसके वा caller ले staff मागे यही number मा transfer हुन्छ।
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Custom AI instructions (optional)
              </label>
              <textarea
                value={String(form.systemPrompt || "")}
                onChange={(e) =>
                  setForm((current) => ({
                    ...current,
                    systemPrompt: e.target.value,
                  }))
                }
                className="min-h-32 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="RoomKhoj को phone assistant कसरी बोल्ने र के-के सम्हाल्ने..."
              />
            </div>

            <Button onClick={saveSettings} disabled={saving} className="w-full">
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save settings
            </Button>
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
            <div>
              <label className="mb-2 block text-sm font-medium">
                User / owner phone
              </label>
              <Input
                type="tel"
                value={outboundNumber}
                onChange={(e) => setOutboundNumber(e.target.value)}
                placeholder="+97798XXXXXXXX"
              />
            </div>
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
              <p className="font-semibold">Incoming call webhook</p>
              <p className="mt-1 break-all text-xs text-muted-foreground">
                https://api.roomkhoj.com/ai-call/inbound
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                Twilio number को Voice webhook मा POST method सहित यही URL राख्नुपर्छ।
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5" />
            Recent AI Calls
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
                <div
                  key={session.id}
                  className="rounded-xl border p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold">
                        {session.direction} · {session.phoneNumber || "Unknown"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(session.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{session.status}</p>
                      {session.transferredToHuman && (
                        <p className="text-xs text-primary">
                          Transferred to staff
                        </p>
                      )}
                    </div>
                  </div>

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
