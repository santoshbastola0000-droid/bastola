"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Clock3, ExternalLink, History, Link2 } from "lucide-react";
import { userService } from "@/http/services/user.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function UserVisitHistoryPage() {
  const params = useParams<{ id: string }>();
  const userId = String(params?.id || "");

  const { data = [], isLoading, isError } = useQuery({
    queryKey: ["admin-user-visit-history", userId],
    queryFn: () => userService.getVisitHistory(userId, 500),
    enabled: Boolean(userId),
    staleTime: 15_000,
  });

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <History className="h-6 w-6" />
            <h1 className="text-2xl font-bold">User Visit History</h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            यो user ले RoomKhoj मा खोलेका पछिल्ला page हरू यहाँ देखिन्छन्।
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/admin/dashboard/users">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Users
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Recorded visits: {data.length}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-10 text-center text-sm text-muted-foreground">Loading visit history...</div>
          ) : isError ? (
            <div className="py-10 text-center text-sm text-red-600">Could not load visit history.</div>
          ) : data.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">No page visits recorded yet.</div>
          ) : (
            <div className="space-y-3">
              {data.map((visit) => (
                <div key={visit.id} className="rounded-xl border bg-white p-4 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Link2 className="h-4 w-4 flex-none text-primary" />
                        <p className="break-all font-medium text-slate-900">{visit.path || "/"}</p>
                      </div>
                      {visit.referrer ? (
                        <p className="mt-2 break-all text-xs text-muted-foreground">
                          Referrer: {visit.referrer}
                        </p>
                      ) : null}
                    </div>
                    <Badge variant="outline">{visit.source || "DIRECT"}</Badge>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Clock3 className="h-3.5 w-3.5" />
                      {new Date(visit.createdAt).toLocaleString()}
                    </span>
                    {visit.path?.startsWith("/") ? (
                      <a
                        href={visit.path}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-primary hover:underline"
                      >
                        Open page <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
