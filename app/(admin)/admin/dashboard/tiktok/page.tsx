"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  CheckCircle2,
  Link2,
  Loader2,
  Music2,
  Plus,
  Power,
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
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null);

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

  const disconnectAccount = async (accountId: string) => {
    try {
      setDisconnectingId(accountId);
      await adminDashboardService.disconnectTikTokAccount(accountId);
      await refetch();
      toast.success("TikTok account disconnected भयो");
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "TikTok disconnect गर्न सकिएन",
      );
    } finally {
      setDisconnectingId(null);
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold md:text-3xl">TikTok Publishing</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Multiple RoomKhoj TikTok accounts connect गरेर approved room photos सबै connected accounts मा publish गर्नुहोस्।
        </p>
      </div>

      <Card className="max-w-3xl border-primary/20">
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Link2 className="h-5 w-5 text-primary" />
                TikTok Accounts
              </CardTitle>
              <CardDescription className="mt-2">
                चाहेको जति TikTok account authorize गरेर जोड्न सक्नुहुन्छ। प्रत्येक account को token server मा मात्र सुरक्षित राखिन्छ।
              </CardDescription>
            </div>
            <Badge variant={status?.connected ? "default" : "secondary"}>
              {status?.connectedCount || 0} connected
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading TikTok accounts...
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed p-4">
                <div>
                  <p className="font-semibold">Add another TikTok account</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Add Account थिचेर अर्को TikTok account मा login गरी Authorize/Continue गर्नुहोस्।
                  </p>
                </div>
                <Button
                  type="button"
                  onClick={connect}
                  disabled={connecting || !status?.configured}
                >
                  {connecting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="mr-2 h-4 w-4" />
                  )}
                  Add Account
                </Button>
              </div>

              {status?.accounts?.length ? (
                <div className="space-y-3">
                  {status.accounts.map((account) => (
                    <div
                      key={account.id}
                      className="rounded-xl border bg-muted/20 p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="flex items-center gap-2 font-semibold">
                            <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
                            <span className="truncate">
                              {account.connectionMode === "legacy_token"
                                ? account.account
                                : `@${account.account.replace(/^@/, "")}`}
                            </span>
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {account.connectionMode === "oauth"
                              ? "OAuth connected • token auto-refresh enabled"
                              : "Legacy server token"}
                          </p>
                          {account.scopes?.length ? (
                            <p className="mt-1 text-xs text-muted-foreground">
                              Scope: {account.scopes.join(", ")}
                            </p>
                          ) : null}
                        </div>

                        {account.connectionMode === "oauth" ? (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => disconnectAccount(account.id)}
                            disabled={disconnectingId === account.id}
                          >
                            {disconnectingId === account.id ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <Unplug className="mr-2 h-4 w-4" />
                            )}
                            Disconnect
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border bg-muted/20 p-5 text-sm text-muted-foreground">
                  अहिलेसम्म कुनै TikTok account connected छैन। माथिको Add Account button बाट पहिलो account जोड्नुहोस्।
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
                ON हुँदा approved room का photos सबै connected TikTok accounts मा publish हुन्छन्।
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
              Auto Publish ON गर्न पहिले कम्तीमा एउटा TikTok account connect गर्नुहोस्।
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
