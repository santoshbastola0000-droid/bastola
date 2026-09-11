"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BadgeCheck,
  Loader2,
  Search,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { privateApi } from "@/http/api/privateApi";
import { userService } from "@/http/services/user.service";

export default function ProfileVerificationAdminPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const usersQuery = useQuery({
    queryKey: ["admin-profile-verification-users", search.trim()],
    queryFn: () =>
      userService.getUsers({
        page: 0,
        take: 50,
        search: search.trim() || undefined,
      }),
    staleTime: 15_000,
  });

  const users = usersQuery.data?.data || [];
  const userIds = users.map((user) => user.id).join(",");

  const statusesQuery = useQuery({
    queryKey: ["admin-profile-verification-statuses", userIds],
    enabled: Boolean(userIds),
    queryFn: async () => {
      const response = await privateApi.get<Record<string, boolean>>(
        "/profile-verification/admin/statuses",
        { params: { userIds } },
      );
      return response.data || {};
    },
    staleTime: 10_000,
  });

  const statuses = statusesQuery.data || {};
  const verifiedCount = users.filter((user) => statuses[user.id]).length;

  const verificationMutation = useMutation({
    mutationFn: async ({
      userId,
      isProfileVerified,
    }: {
      userId: string;
      isProfileVerified: boolean;
    }) => {
      const response = await privateApi.patch(
        `/profile-verification/admin/${userId}`,
        { isProfileVerified },
      );
      return response.data;
    },
    onSuccess: (result) => {
      queryClient.setQueryData<Record<string, boolean>>(
        ["admin-profile-verification-statuses", userIds],
        (current) => ({
          ...(current || {}),
          [result.userId]: Boolean(result.isProfileVerified),
        }),
      );
      toast.success(
        result.isProfileVerified
          ? "Profile verification badge enabled"
          : "Profile verification badge removed",
      );
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ||
          "Profile verification update failed",
      );
    },
  });

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-7 w-7 text-primary" />
            <h1 className="text-2xl font-bold md:text-3xl">
              Profile Verification
            </h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Control the verified badge shown beside a user's profile name.
            This does not change email/account verification or login access.
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline">{users.length} loaded</Badge>
          <Badge className="gap-1 bg-blue-50 text-blue-700 hover:bg-blue-50">
            <BadgeCheck className="h-3.5 w-3.5" />
            {verifiedCount} profile verified
          </Badge>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Find a user</CardTitle>
          <CardDescription>
            Search by name, email or phone and choose whether the profile gets
            the public verified badge.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative max-w-xl">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search user..."
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Users</CardTitle>
          <CardDescription>
            Account verification is shown only for reference. The Profile
            Verified switch below is controlled only by admin.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {usersQuery.isLoading ? (
            <div className="flex min-h-40 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : users.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No users found.
            </div>
          ) : (
            <div className="divide-y rounded-xl border">
              {users.map((user) => {
                const isProfileVerified = Boolean(statuses[user.id]);
                const isUpdating =
                  verificationMutation.isPending &&
                  verificationMutation.variables?.userId === user.id;

                return (
                  <div
                    key={user.id}
                    className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10">
                        <UserRound className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate font-semibold">{user.name}</p>
                          {isProfileVerified && (
                            <BadgeCheck
                              className="h-4 w-4 shrink-0 text-blue-500"
                              aria-label="Profile verified"
                            />
                          )}
                        </div>
                        <p className="truncate text-sm text-muted-foreground">
                          {user.email}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {user.phone || "No phone number"}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 md:justify-end">
                      <Badge
                        variant="outline"
                        className={
                          user.isVerified
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-slate-200 bg-slate-50 text-slate-500"
                        }
                      >
                        Account: {user.isVerified ? "Verified" : "Unverified"}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={
                          isProfileVerified
                            ? "border-blue-200 bg-blue-50 text-blue-700"
                            : "border-slate-200 bg-slate-50 text-slate-500"
                        }
                      >
                        Profile: {isProfileVerified ? "Verified" : "Not verified"}
                      </Badge>
                      <Button
                        type="button"
                        variant={isProfileVerified ? "outline" : "default"}
                        disabled={isUpdating || statusesQuery.isLoading}
                        onClick={() =>
                          verificationMutation.mutate({
                            userId: user.id,
                            isProfileVerified: !isProfileVerified,
                          })
                        }
                      >
                        {isUpdating ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <BadgeCheck className="mr-2 h-4 w-4" />
                        )}
                        {isProfileVerified
                          ? "Remove Verification"
                          : "Verify Profile"}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
