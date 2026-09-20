"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bot, Pause, Play, Plus, RefreshCw, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { privateApi } from "@/http/api/privateApi";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type BotIdentity = {
  id: string;
  displayName: string;
  email: string;
  enabled: boolean;
  identityType: "SYNTHETIC_TEST";
  createdAt: string;
};

type BotListResponse = {
  data: BotIdentity[];
  pagination: {
    page: number;
    take: number;
    total: number;
    count: number;
    previousPage: number | null;
    nextPage: number | null;
  };
  synthetic: true;
};

export default function BotUsersPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [generateCount, setGenerateCount] = useState("100");

  const params = useMemo(() => ({ page, take: 50, search: search.trim() || undefined }), [page, search]);

  const simulationQuery = useQuery({
    queryKey: ["admin-bot-simulation"],
    queryFn: async () => {
      const res = await privateApi.get("/social/admin/bot-simulation");
      return res.data?.data ?? res.data;
    },
  });

  const simulationStatsQuery = useQuery({
    queryKey: ["admin-bot-simulation-stats"],
    queryFn: async () => {
      const res = await privateApi.get("/social/admin/bot-simulation/stats");
      return res.data?.data ?? res.data;
    },
  });

  const simulationMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      const res = await privateApi.patch("/social/admin/bot-simulation", {
        enabled,
        minDelayMinutes: 1,
        maxDelayMinutes: 400,
        reactionsEnabled: true,
        commentsEnabled: true,
      });
      return res.data?.data ?? res.data;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin-bot-simulation"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-bot-simulation-stats"] }),
      ]);
      toast.success("Simulation setting updated");
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || "Could not update simulation"),
  });

  const botsQuery = useQuery({
    queryKey: ["admin-synthetic-bots", params],
    queryFn: async () => {
      const res = await privateApi.get("/social/admin/synthetic-bots", { params });
      return (res.data?.data ?? res.data) as BotListResponse;
    },
  });

  const statsQuery = useQuery({
    queryKey: ["admin-synthetic-bots-stats"],
    queryFn: async () => {
      const res = await privateApi.get("/social/admin/synthetic-bots/stats");
      return res.data?.data ?? res.data;
    },
  });

  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["admin-synthetic-bots"] }),
      queryClient.invalidateQueries({ queryKey: ["admin-synthetic-bots-stats"] }),
    ]);
  };

  const generateMutation = useMutation({
    mutationFn: async () => {
      const count = Math.max(1, Math.min(50000, Number(generateCount) || 1));
      const res = await privateApi.post("/social/admin/synthetic-bots/generate", { count });
      return res.data?.data ?? res.data;
    },
    onSuccess: async (result: any) => {
      toast.success(`${result?.created ?? 0} bot users generated`);
      await refresh();
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || "Could not generate bot users"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await privateApi.delete(`/social/admin/synthetic-bots/${id}`);
      return res.data?.data ?? res.data;
    },
    onSuccess: refresh,
    onError: (error: any) => toast.error(error?.response?.data?.message || "Could not delete bot user"),
  });

  const deleteAllMutation = useMutation({
    mutationFn: async () => {
      const res = await privateApi.delete("/social/admin/synthetic-bots", {
        params: { confirm: "DELETE_ALL_SYNTHETIC_BOTS" },
      });
      return res.data?.data ?? res.data;
    },
    onSuccess: async (result: any) => {
      toast.success(`${result?.deleted ?? 0} bot users permanently deleted`);
      setPage(0);
      await refresh();
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || "Could not delete bot users"),
  });

  const bots = botsQuery.data?.data ?? [];
  const pagination = botsQuery.data?.pagination;
  const total = statsQuery.data?.total ?? pagination?.total ?? 0;

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold"><Bot className="h-6 w-6" /> Bot Users</h1>
          <p className="text-sm text-muted-foreground">Synthetic RoomKhoj identities are stored separately from real users.</p>
        </div>
        <Button variant="outline" onClick={() => refresh()} disabled={botsQuery.isFetching || statsQuery.isFetching}>
          <RefreshCw className="mr-2 h-4 w-4" /> Refresh
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Total Bot Users</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold">{total.toLocaleString()}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Enabled</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold">{Number(statsQuery.data?.enabled ?? 0).toLocaleString()}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Storage</CardTitle></CardHeader><CardContent><Badge variant="secondary">Separate synthetic table</Badge></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Simulation Mode</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium">{simulationQuery.data?.enabled ? "Running" : "Paused"}</p>
              <p className="text-sm text-muted-foreground">
                Synthetic-only test activity · random 1–400 minute schedule · reactions and contextual test comments.
              </p>
            </div>
            <Button
              variant={simulationQuery.data?.enabled ? "outline" : "default"}
              onClick={() => simulationMutation.mutate(!simulationQuery.data?.enabled)}
              disabled={simulationMutation.isPending || simulationQuery.isLoading}
            >
              {simulationQuery.data?.enabled ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
              {simulationQuery.data?.enabled ? "Pause Simulation" : "Start Simulation"}
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 text-sm">
            <Badge variant="secondary">Total test actions: {Number(simulationStatsQuery.data?.totalActions ?? 0).toLocaleString()}</Badge>
            <Badge variant="secondary">Last 24h: {Number(simulationStatsQuery.data?.actions24h ?? 0).toLocaleString()}</Badge>
            {simulationQuery.data?.nextRunAt && <Badge variant="outline">Next run: {new Date(simulationQuery.data.nextRunAt).toLocaleString()}</Badge>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Generate Bot Users</CardTitle></CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row">
          <Input
            type="number"
            min={1}
            max={50000}
            value={generateCount}
            onChange={(e) => setGenerateCount(e.target.value)}
            className="sm:max-w-48"
            placeholder="How many?"
          />
          <Button onClick={() => generateMutation.mutate()} disabled={generateMutation.isPending}>
            <Plus className="mr-2 h-4 w-4" /> Generate Random Users
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              if (window.confirm("Permanently delete ALL synthetic bot users?")) deleteAllMutation.mutate();
            }}
            disabled={deleteAllMutation.isPending || total === 0}
          >
            <Trash2 className="mr-2 h-4 w-4" /> Delete All
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Bot Management</CardTitle>
            <div className="relative w-full sm:max-w-sm">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} placeholder="Search name or email" className="pl-9" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Status</TableHead><TableHead>Created</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader>
              <TableBody>
                {botsQuery.isLoading ? (
                  <TableRow><TableCell colSpan={5} className="py-10 text-center">Loading bot users...</TableCell></TableRow>
                ) : bots.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="py-10 text-center text-muted-foreground">No bot users found.</TableCell></TableRow>
                ) : bots.map((bot) => (
                  <TableRow key={bot.id}>
                    <TableCell className="font-medium">{bot.displayName}</TableCell>
                    <TableCell className="max-w-[280px] truncate">{bot.email}</TableCell>
                    <TableCell><Badge variant={bot.enabled ? "default" : "secondary"}>{bot.enabled ? "Enabled" : "Disabled"}</Badge></TableCell>
                    <TableCell>{new Date(bot.createdAt).toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        onClick={() => {
                          if (window.confirm(`Permanently delete ${bot.displayName}?`)) deleteMutation.mutate(bot.id);
                        }}
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Total {Number(pagination?.total ?? 0).toLocaleString()}</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={pagination?.previousPage == null} onClick={() => setPage(Math.max(0, page - 1))}>Previous</Button>
              <Button variant="outline" size="sm" disabled={pagination?.nextPage == null} onClick={() => setPage(page + 1)}>Next</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
