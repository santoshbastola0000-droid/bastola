"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Ban, CheckCircle2, Search, ShieldCheck, UserRound } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { userService } from "@/http/services/user.service";
import { privateApi } from "@/http/api/privateApi";
import { UserRole } from "@/types/user.types";

export default function UserBandPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [reasonByUser, setReasonByUser] = useState<Record<string, string>>({});

  const filters = useMemo(
    () => ({
      page: 0,
      take: 50,
      search: search.trim() || undefined,
    }),
    [search],
  );

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["admin-user-band-list", filters],
    queryFn: () => userService.getUsers(filters),
    staleTime: 10_000,
  });

  const bandMutation = useMutation({
    mutationFn: ({
      userId,
      isBanned,
      reason,
    }: {
      userId: string;
      isBanned: boolean;
      reason?: string;
    }) => userService.setUserBanned(userId, isBanned, reason),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["admin-user-band-list"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success(result.isBanned ? "User ban गरिएको छ" : "User unban गरिएको छ");
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "User ban status update गर्न सकिएन",
      );
    },
  });

  const users = data?.data || [];

  const { data: appealRows = [], refetch: refetchAppeals } = useQuery({
    queryKey: ["admin-user-ban-appeals"],
    queryFn: async () => {
      const response = await privateApi.get("/user/ban-appeals");
      return response.data?.data ?? response.data ?? [];
    },
  });

  const openAppealDocument = async (userId: string) => {
    try {
      const response = await privateApi.get(`/user/${userId}/ban-appeal/document`, {
        responseType: "blob",
      });
      const url = URL.createObjectURL(response.data);
      window.open(url, "_blank", "noopener,noreferrer");
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch {
      toast.error("Appeal document खोल्न सकिएन");
    }
  };

  const reopenFromAppeal = async (user: any) => {
    if (!window.confirm(`${user.name || user.email} को account reopen गर्ने हो?`)) return;
    try {
      await userService.setUserBanned(user.id, false);
      toast.success("Account reopen भयो। User लाई email पठाइन्छ।");
      await Promise.all([refetch(), refetchAppeals()]);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Account reopen गर्न सकिएन");
    }
  };

  const changeBandStatus = (user: any) => {
    if (user.role === UserRole.ADMIN) return;

    const nextBanned = !Boolean(user.isBanned);
    const action = nextBanned ? "Band" : "Unband";
    const confirmed = window.confirm(
      `${user.name || user.email} लाई ${action} गर्ने हो?${
        nextBanned
          ? " Band भएपछि account access र notifications बन्द हुनेछन्।"
          : " Unband भएपछि account फेरि normal हुनेछ।"
      }`,
    );

    if (!confirmed) return;

    bandMutation.mutate({
      userId: user.id,
      isBanned: nextBanned,
      reason: nextBanned ? reasonByUser[user.id]?.trim() || undefined : undefined,
    });
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold md:text-3xl">
          <ShieldCheck className="h-7 w-7 text-primary" />
          User Ban / Unban
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          User को data delete नगरी account बन्द गर्नुहोस्। Unband गर्दा पुरानै account र history फर्किन्छ।
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User खोज्नुहोस्</CardTitle>
          <CardDescription>Name, email वा phone number बाट search गर्न सकिन्छ।</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Name, email वा phone..."
                className="pl-9"
              />
            </div>
            <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
              {isFetching ? "Refreshing..." : "Refresh"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>User Appeals</CardTitle>
          <CardDescription>Banned users ले पठाएको identity document manually review गरेर account reopen गर्न सकिन्छ।</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {appealRows.length === 0 ? (
            <p className="text-sm text-muted-foreground">Pending/submitted appeal छैन।</p>
          ) : appealRows.map((appeal: any) => (
            <div key={appeal.id} className="rounded-2xl border p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold">{appeal.name}</p>
                    <Badge variant={appeal.banAppealStatus === "PENDING" ? "secondary" : "outline"}>{appeal.banAppealStatus}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{appeal.email}</p>
                  <p className="mt-1 text-xs">Document: {appeal.banAppealDocumentType || "—"}</p>
                  {appeal.banAppealMessage && <p className="mt-2 text-sm">{appeal.banAppealMessage}</p>}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => openAppealDocument(appeal.id)}>View Document</Button>
                  <Button onClick={() => reopenFromAppeal(appeal)}>Open Account</Button>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="space-y-3">
        {isLoading ? (
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">Loading users...</CardContent>
          </Card>
        ) : users.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">User भेटिएन।</CardContent>
          </Card>
        ) : (
          users.map((user) => {
            const isAdmin = user.role === UserRole.ADMIN;
            const isBanned = Boolean(user.isBanned);

            return (
              <Card key={user.id} className={isBanned ? "border-red-300" : undefined}>
                <CardContent className="p-4 md:p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <UserRound className="h-5 w-5 text-muted-foreground" />
                        <p className="font-semibold">{user.name}</p>
                        {isBanned ? (
                          <Badge variant="destructive">Banned</Badge>
                        ) : (
                          <Badge variant="outline" className="border-emerald-300 text-emerald-700">
                            Active
                          </Badge>
                        )}
                        {isAdmin && <Badge variant="secondary">Admin</Badge>}
                      </div>
                      <p className="mt-1 break-all text-sm text-muted-foreground">{user.email}</p>
                      <p className="text-sm text-muted-foreground">{user.phone || "No phone"}</p>
                      {isBanned && user.bannedAt && (
                        <p className="mt-2 text-xs text-red-600">
                          Banned at: {new Date(user.bannedAt).toLocaleString()}
                        </p>
                      )}
                      {isBanned && user.banReason && (
                        <p className="mt-1 text-xs text-red-600">Reason: {user.banReason}</p>
                      )}
                    </div>

                    {!isAdmin && (
                      <div className="w-full space-y-2 lg:w-[360px]">
                        {!isBanned && (
                          <Input
                            value={reasonByUser[user.id] || ""}
                            onChange={(event) =>
                              setReasonByUser((current) => ({
                                ...current,
                                [user.id]: event.target.value,
                              }))
                            }
                            maxLength={300}
                            placeholder="Ban reason (optional)"
                          />
                        )}
                        <Button
                          className="w-full"
                          variant={isBanned ? "outline" : "destructive"}
                          disabled={bandMutation.isPending}
                          onClick={() => changeBandStatus(user)}
                        >
                          {isBanned ? (
                            <>
                              <CheckCircle2 className="mr-2 h-4 w-4" /> Unban User
                            </>
                          ) : (
                            <>
                              <Ban className="mr-2 h-4 w-4" /> Ban User
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
