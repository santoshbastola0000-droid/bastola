"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  CheckCircle2,
  Link2,
  Loader2,
  Music2,
  Power,
  RefreshCw,
  ShieldCheck,
  Unplug,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { adminDashboardService } from "@/http/services/admin-dashboard.service";

export default function TikTokPublishingPage() {
  const [saving, setSaving] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  const {
    data: status,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["admin-tiktok-publishing-status"],
    queryFn: () => adminDashboardService.getTikTokPublishingStatus(),
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const result = params.get("tiktok");
    if (result === "connected") {
      toast.success("TikTok account successfully connected भयो");
      void refetch();
      window.history.replaceState({}, "", window.location.pathname);
    } else if (result === "error") {
      const reason = params.get("reason") || "authorization_failed";
      toast.error(`TikTok connect हुन सकेन: ${reason}`);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [refetch]);

  const toggle = async () => {
    try {
      setSaving(true);
      const next = !Boolean(status?.enabled);
      await adminDashboardService.setTikTokPublishingEnabled(next);
      await refetch();
      toast.success(`TikTok auto publish ${next ? "ON" : "OFF"} भयो`);
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          "TikTok auto publish setting update गर्न सकिएन",
      );
    } finally {
      setSaving(false);
    }
  };

  const connect = async () => {
    try {
      setConnecting(true);
      const { url } = await adminDashboardService.getTikTokConnectUrl();
      window.location.assign(url);
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          "TikTok authorization सुरु गर्न सकिएन",
      );
      setConnecting(false);
    }
  };

  const disconnect = async () => {
    try {
      setDisconnecting(true);
      await adminDashboardService.disconnectTikTok();
      await refetch();
      toast.success("TikTok account disconnected भयो");
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "TikTok disconnect गर्न सकिएन",
      );
    } finally {
      setDisconnecting(false);
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold md:text-3xl">TikTok Publishing</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          RoomKhoj TikTok account connect गर्नुहोस् र approved room का photo post manage गर्नुहोस्।
        </p>
      </div>

      <Card className="max-w-3xl border-primary/20">
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Link2 className="h-5 w-5 text-primary" />
                TikTok Account
              </CardTitle>
              <CardDescription className="mt-2">
                TikTok मा login गरेर RoomKhoj लाई posting permission दिनुहोस्। Access token र refresh token server मा मात्र राखिन्छ।
              </CardDescription>
            </div>
            <Badge variant={status?.connected ? "default" : "secondary"}>
              {status?.connected ? "Connected" : "Not connected"}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading TikTok status...
            </div>
          ) : (
            <>
              {status?.connected ? (
                <div className="rounded-xl border bg-muted/30 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Connected account</p>
                      <p className="mt-1 flex items-center gap-2 font-semibold">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        {status.account ? `@${status.account.replace(/^@/, "")}` : "TikTok account"}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {status.connectionMode === "oauth"
                          ? "OAuth connected • token auto-refresh enabled"
                          : "Legacy server token"}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={connect}
                        disabled={connecting}
                      >
                        {connecting ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCw className="mr-2 h-4 w-4" />
                        )}
                        Reconnect
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={disconnect}
                        disabled={disconnecting}
                      >
                        {disconnecting ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Unplug className="mr-2 h-4 w-4" />
                        )}
                        Disconnect
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 rounded-xl border border-dashed p-5">
                  <p className="font-semibold">RoomKhoj TikTok account connect गर्नुहोस्</p>
                  <p className="text-sm text-muted-foreground">
                    Connect TikTok थिचेपछि TikTok खुल्छ। RoomKhoj को TikTok account login गरेर Authorize/Continue गर्नुहोस्।
                  </p>
                  <Button
                    type="button"
                    onClick={connect}
                    disabled={connecting || !status?.configured}
                  >
                    {connecting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Link2 className="mr-2 h-4 w-4" />
                    )}
                    Connect TikTok
                  </Button>
                </div>
              )}

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg border p-4">
                  <p className="text-xs text-muted-foreground">Developer API</p>
                  <p className="mt-1 font-semibold">
                    {status?.configured ? "Configured" : "Not configured"}
                  </p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-xs text-muted-foreground">Auto Music</p>
                  <p className="mt-1 flex items-center gap-1 font-semibold">
                    <Music2 className="h-4 w-4" />
                    {status?.autoMusic ? "Enabled" : "Disabled"}
                  </p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-xs text-muted-foreground">Privacy</p>
                  <p className="mt-1 font-semibold">
                    {status?.privacyLevel || "SELF_ONLY"}
                  </p>
                </div>
              </div>

              {!status?.configured && (
                <div className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                  <ShieldCheck className="mt-0.5 h-5 w-5 flex-shrink-0" />
                  <div>
                    Server मा TikTok Client Key र Client Secret configure गर्न बाँकी छ। Secret वा token admin browser मा देखाइँदैन।
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Card className="max-w-3xl border-primary/20">
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Power className="h-5 w-5 text-primary" />
                TikTok Auto Publish
              </CardTitle>
              <CardDescription className="mt-2">
                ON हुँदा approved room का photos connected TikTok account मा publish हुन्छन्।
              </CardDescription>
            </div>
            <Badge variant={status?.enabled ? "default" : "secondary"}>
              {status?.enabled ? "ON" : "OFF"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Button
            type="button"
            onClick={toggle}
            disabled={saving || !status?.connected}
            variant={status?.enabled ? "destructive" : "default"}
            className="min-w-44"
          >
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {status?.enabled ? "Turn OFF" : "Turn ON"}
          </Button>
          {!status?.connected && (
            <p className="mt-2 text-xs text-muted-foreground">
              Auto Publish ON गर्न पहिले TikTok account connect गर्नुहोस्।
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
