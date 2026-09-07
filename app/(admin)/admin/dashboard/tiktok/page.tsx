"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Music2, Power, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { adminDashboardService } from "@/http/services/admin-dashboard.service";

export default function TikTokPublishingPage() {
  const [saving, setSaving] = useState(false);

  const {
    data: status,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["admin-tiktok-publishing-status"],
    queryFn: () => adminDashboardService.getTikTokPublishingStatus(),
  });

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

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold md:text-3xl">TikTok Publishing</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Room approve भएपछि TikTok मा automatic photo post पठाउने setting।
        </p>
      </div>

      <Card className="max-w-3xl border-primary/20">
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Power className="h-5 w-5 text-primary" />
                TikTok Auto Publish
              </CardTitle>
              <CardDescription className="mt-2">
                ON हुँदा approved room का photos TikTok Content Posting API मार्फत publish हुन्छन्।
              </CardDescription>
            </div>
            <Badge variant={status?.enabled ? "default" : "secondary"}>
              {status?.enabled ? "ON" : "OFF"}
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
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg border p-4">
                  <p className="text-xs text-muted-foreground">API Status</p>
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
                    TikTok access token server मा configure नभएसम्म ON गरे पनि post जान सक्दैन।
                    Client Secret वा access token admin UI मा देखाइँदैन।
                  </div>
                </div>
              )}

              <Button
                type="button"
                onClick={toggle}
                disabled={saving}
                variant={status?.enabled ? "destructive" : "default"}
                className="min-w-44"
              >
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {status?.enabled ? "Turn OFF" : "Turn ON"}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
