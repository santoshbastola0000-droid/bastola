"use client";

import { useCallback, useEffect, useState } from "react";
import { privateApi } from "@/http/api/privateApi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CircleDollarSign, Video, UserRound, ShieldCheck, Clock3 } from "lucide-react";

type Application = {
  id?: string;
  status: "NOT_APPLIED" | "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED";
  providerPreference?: "BOTH" | "ROOMKHOJ_ADSENSE" | "CREATOR_AFP";
  profileAdsRequested?: boolean;
  videoAdsRequested?: boolean;
  adminNote?: string | null;
  createdAt?: string;
};

const statusLabel: Record<Application["status"], string> = {
  NOT_APPLIED: "Not applied",
  PENDING: "Pending admin review",
  APPROVED: "Application approved",
  REJECTED: "Application rejected",
  SUSPENDED: "Suspended",
};

export default function CreatorMonetizationPage() {
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const loadApplication = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await privateApi.get("/creator-monetization/me");
      setApplication(response.data as Application);
    } catch {
      setError("Could not load your creator monetization status. Please sign in and try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadApplication();
  }, [loadApplication]);

  const apply = async () => {
    setSubmitting(true);
    setError("");
    try {
      const response = await privateApi.post("/creator-monetization/apply");
      setApplication(response.data as Application);
    } catch {
      setError("Application could not be submitted. Please try again later.");
    } finally {
      setSubmitting(false);
    }
  };

  const status = application?.status || "NOT_APPLIED";
  const canApply = status === "NOT_APPLIED" || status === "REJECTED" || status === "SUSPENDED";

  return (
    <main className="mx-auto w-full max-w-4xl space-y-6 px-4 py-8">
      <header className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-wide text-red-600">RoomKhoj Creator</p>
        <h1 className="text-2xl font-bold md:text-3xl">Creator Monetization</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Apply to be considered for future profile and video monetization on RoomKhoj.
        </p>
      </header>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2"><CircleDollarSign className="h-5 w-5" /> Application status</CardTitle>
            {!loading && <Badge variant={status === "APPROVED" ? "default" : "secondary"}>{statusLabel[status]}</Badge>}
          </div>
          <CardDescription>Approval does not mean ads or earnings are active yet.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading status…</div>
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border p-4">
                  <div className="mb-2 flex items-center gap-2 font-medium"><UserRound className="h-4 w-4" /> Profile ads</div>
                  <p className="text-sm text-muted-foreground">Requested for eligible creator profile pages.</p>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="mb-2 flex items-center gap-2 font-medium"><Video className="h-4 w-4" /> Video ads</div>
                  <p className="text-sm text-muted-foreground">Requested for eligible videos using an approved video-ad setup.</p>
                </div>
              </div>
              <div className="rounded-lg bg-muted/50 p-4 text-sm">
                <div className="mb-2 flex items-center gap-2 font-semibold"><ShieldCheck className="h-4 w-4" /> Monetization model requested</div>
                RoomKhoj-managed ads and a future creator-owned Google AdSense for Platforms option.
              </div>
              {application?.adminNote && (
                <div className="rounded-lg border p-3 text-sm"><strong>Admin note:</strong> {application.adminNote}</div>
              )}
              {canApply && (
                <Button onClick={apply} disabled={submitting} className="w-full sm:w-auto">
                  {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting…</> : "Apply for monetization"}
                </Button>
              )}
              {status === "PENDING" && <p className="flex items-center gap-2 text-sm text-muted-foreground"><Clock3 className="h-4 w-4" /> Your application is waiting for admin review.</p>}
              {status === "APPROVED" && <p className="text-sm text-muted-foreground">Your application is approved. Provider onboarding, Google approval, ad serving, and payout setup are separate steps and are not active yet.</p>}
            </>
          )}
          {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Before monetization starts</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>• Publish original videos and profile content that you have rights to use.</p>
          <p>• Do not buy views, automate clicks, or ask people to click ads.</p>
          <p>• Google account linking and creator payouts will only be enabled through an approved provider integration.</p>
          <p>• Applying or receiving approval does not guarantee acceptance by Google or guarantee earnings.</p>
        </CardContent>
      </Card>
    </main>
  );
}
