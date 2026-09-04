"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Clock3, History, Search, UserRound } from "lucide-react";
import { userService } from "@/http/services/user.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function AllUserVisitHistoryPage() {
  const [search, setSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");

  const { data: usersResponse, isLoading: usersLoading } = useQuery({
    queryKey: ["admin-visit-user-search", search],
    queryFn: () => userService.getUsers({ page: 0, take: 20, search: search || undefined }),
    staleTime: 20_000,
  });

  const users = useMemo(() => usersResponse?.data || [], [usersResponse]);
  const selectedUser = users.find((user) => user.id === selectedUserId);

  const { data: visits = [], isLoading: visitsLoading } = useQuery({
    queryKey: ["admin-user-visits", selectedUserId],
    queryFn: () => userService.getVisitHistory(selectedUserId, 500),
    enabled: Boolean(selectedUserId),
    staleTime: 15_000,
  });

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <div className="flex items-center gap-2">
          <History className="h-6 w-6" />
          <h1 className="text-2xl font-bold">User Visit History</h1>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          User खोजेर उसले RoomKhoj मा कुन-कुन page खोलेको थियो हेर्नुहोस्।
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Select User</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name, email or phone"
              className="pl-9"
            />
          </div>

          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {usersLoading ? (
              <p className="text-sm text-muted-foreground">Loading users...</p>
            ) : users.length === 0 ? (
              <p className="text-sm text-muted-foreground">No users found.</p>
            ) : (
              users.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => setSelectedUserId(user.id)}
                  className={`rounded-xl border p-3 text-left transition ${selectedUserId === user.id ? "border-violet-400 bg-violet-50" : "bg-white hover:bg-slate-50"}`}
                >
                  <div className="flex items-start gap-2">
                    <UserRound className="mt-0.5 h-4 w-4 flex-none" />
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{user.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                      {user.phone ? <p className="text-xs text-muted-foreground">{user.phone}</p> : null}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {selectedUserId ? (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base">{selectedUser?.name || "Selected user"}</CardTitle>
              <p className="text-xs text-muted-foreground">Recorded visits: {visits.length}</p>
            </div>
            <Button asChild size="sm" variant="outline">
              <Link href={`/admin/dashboard/users/${selectedUserId}/visits`}>Open full history</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {visitsLoading ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Loading visit history...</p>
            ) : visits.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No page visits recorded yet.</p>
            ) : (
              <div className="space-y-3">
                {visits.map((visit) => (
                  <div key={visit.id} className="rounded-xl border p-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <p className="min-w-0 break-all font-medium">{visit.path || "/"}</p>
                      <Badge variant="outline">{visit.source || "DIRECT"}</Badge>
                    </div>
                    <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock3 className="h-3.5 w-3.5" />
                      {new Date(visit.createdAt).toLocaleString()}
                    </div>
                    {visit.referrer ? (
                      <p className="mt-1 break-all text-xs text-muted-foreground">Referrer: {visit.referrer}</p>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
