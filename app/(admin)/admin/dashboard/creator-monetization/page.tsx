"use client";

import { useCallback, useEffect, useState } from "react";
import { privateApi } from "@/http/api/privateApi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw, ShieldCheck } from "lucide-react";

type Application = {
  id: string;
  userId: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED";
  providerPreference?: string;
  profileAdsRequested?: boolean;
  videoAdsRequested?: boolean;
  adminNote?: string | null;
  createdAt?: string;
};

const filters = ["ALL", "PENDING", "APPROVED", "REJECTED", "SUSPENDED"] as const;

export default function AdminCreatorMonetizationPage() {
  const [filter, setFilter] = useState<(typeof filters)[number]>("PENDING");
  const [items, setItems] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await privateApi.get("/creator-monetization/admin/applications", {
        params: filter === "ALL" ? {} : { status: filter },
      });
      const data = response.data;
      setItems(Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : []);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Creator applications could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { void load(); }, [load]);

  const review = async (id: string, status: "APPROVED" | "REJECTED" | "SUSPENDED") => {
    setBusyId(id);
    setError("");
    try {
      await privateApi.patch(`/creator-monetization/admin/applications/${id}/review`, { status });
      await load();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Application review failed.");
    } finally {
      setBusyId("");
    }
  };

  return (
    <main className="mx-auto w-full max-w-6xl space-y-5 p-4 md:p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-red-600">RoomKhoj Admin</p>
          <h1 className="text-2xl font-bold">Creator Monetization</h1>
          <p className="text-sm text-muted-foreground">Review creator applications for profile and video monetization.</p>
        </div>
        <Button variant="outline" onClick={() => void load()} disabled={loading}><RefreshCw className="mr-2 h-4 w-4" />Refresh</Button>
      </header>

      <div className="flex flex-wrap gap-2">
        {filters.map((value) => (
          <Button key={value} size="sm" variant={filter === value ? "default" : "outline"} onClick={() => setFilter(value)}>{value}</Button>
        ))}
      </div>

      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      {loading ? (
        <div className="flex items-center gap-2 p-8 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Loading applications…</div>
      ) : items.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">No creator applications found.</CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {items.map((item) => (
            <Card key={item.id}>
              <CardHeader className="pb-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle className="text-base">Creator User ID: {item.userId}</CardTitle>
                  <Badge variant={item.status === "APPROVED" ? "default" : "secondary"}>{item.status}</Badge>
                </div>
                <CardDescription>Applied {item.createdAt ? new Date(item.createdAt).toLocaleString() : "date unavailable"} · Provider: {item.providerPreference || "BOTH"}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-2 text-sm">
                  <Badge variant="outline">Profile ads: {item.profileAdsRequested ? "Requested" : "No"}</Badge>
                  <Badge variant="outline">Video ads: {item.videoAdsRequested ? "Requested" : "No"}</Badge>
                </div>
                {item.adminNote && <p className="text-sm text-muted-foreground">Admin note: {item.adminNote}</p>}
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" disabled={Boolean(busyId)} onClick={() => void review(item.id, "APPROVED")}>
                    {busyId === item.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}Approve
                  </Button>
                  <Button size="sm" variant="outline" disabled={Boolean(busyId)} onClick={() => void review(item.id, "REJECTED")}>Reject</Button>
                  <Button size="sm" variant="destructive" disabled={Boolean(busyId)} onClick={() => void review(item.id, "SUSPENDED")}>Suspend</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground">Admin approval records application status only. It does not activate Google ads, creator AFP, video ads, revenue sharing, or withdrawals.</p>
    </main>
  );
}
