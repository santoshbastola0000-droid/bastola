"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Eye,
  Loader2,
  MessageCircle,
  Phone,
  Search,
  UserRound,
} from "lucide-react";

import { candidateProfileService } from "@/http/services/candidate-profile.service";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function CandidateContactHistoryPage() {
  const [search, setSearch] = useState("");
  const [action, setAction] = useState("ALL");

  const {
    data: logs = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["candidate-contact-history"],
    queryFn: () =>
      candidateProfileService.getAdminContactAccess(),
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return logs.filter((item: any) => {
      if (action !== "ALL" && item.action !== action) {
        return false;
      }

      if (!q) return true;

      return [
        item.candidateProfile?.fullName,
        item.employerUserId,
        item.employerName,
        item.employerCompany,
        item.action,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value).toLowerCase().includes(q),
        );
    });
  }, [logs, search, action]);

  const actionIcon = (value: string) => {
    if (value === "CALL") {
      return <Phone className="h-4 w-4" />;
    }

    if (value === "WHATSAPP") {
      return <MessageCircle className="h-4 w-4" />;
    }

    return <Eye className="h-4 w-4" />;
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-red-600">
          Contact history load गर्न सकिएन।
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          Candidate Contact History
        </h1>

        <p className="mt-1 text-sm text-muted-foreground">
          Employers ले candidate contact कसरी र कहिले access गरे हेर्नुहोस्।
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-[1fr_220px]">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />

          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search candidate, employer or company"
            className="pl-9"
          />
        </div>

        <select
          value={action}
          onChange={(e) => setAction(e.target.value)}
          className="rounded-md border bg-background px-3 py-2 text-sm"
        >
          <option value="ALL">All actions</option>
          <option value="VIEW_CONTACT">View Contact</option>
          <option value="CALL">Call</option>
          <option value="WHATSAPP">WhatsApp</option>
          <option value="INVITE">Invite</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center text-muted-foreground">
            No contact activity found.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((item: any) => (
            <Card key={item.id}>
              <CardContent className="p-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
                      <UserRound className="h-5 w-5" />
                    </div>

                    <div>
                      <p className="font-semibold">
                        {item.candidateProfile?.fullName || "Candidate"}
                      </p>

                      <p className="mt-1 text-sm text-muted-foreground">
                        Employer:{" "}
                        {item.employerCompany ||
                          item.employerName ||
                          item.employerUserId ||
                          "Unknown"}
                      </p>

                      {item.jobPostingId && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Vacancy ID: {item.jobPostingId}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-5">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      {actionIcon(item.action)}
                      {item.action}
                    </div>

                    <div className="text-right text-xs text-muted-foreground">
                      {item.createdAt
                        ? new Date(item.createdAt).toLocaleString()
                        : "-"}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
