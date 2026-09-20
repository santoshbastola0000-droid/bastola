"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bot, Pause, Play, Plus, RefreshCw, Search, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";

import { privateApi } from "@/http/api/privateApi";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type BotIdentity = {
  id: string;
  displayName: string;
  bio?: string | null;
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


function botAvatarDataUrl(bot: Pick<BotIdentity, "id" | "displayName">) {
  const name = String(bot.displayName || "Bot").trim();
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.slice(0, 1).toUpperCase())
    .join("") || "B";

  let hash = 0;
  const seed = `${bot.id}:${name}`;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }

  const hue = hash % 360;
  const hue2 = (hue + 48 + (hash % 72)) % 360;
  const skin = ["#f1c27d", "#e0ac69", "#c68642", "#8d5524"][hash % 4];
  const hair = ["#231f20", "#4b2e1f", "#6b4423", "#1f2937"][Math.floor(hash / 5) % 4];

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="hsl(${hue} 72% 66%)"/>
          <stop offset="100%" stop-color="hsl(${hue2} 70% 52%)"/>
        </linearGradient>
      </defs>
      <rect width="160" height="160" rx="80" fill="url(#bg)"/>
      <circle cx="80" cy="66" r="34" fill="${skin}"/>
      <path d="M47 62c2-25 17-39 34-39 21 0 34 15 34 41-11-9-22-14-36-14-11 0-21 4-32 12z" fill="${hair}"/>
      <circle cx="67" cy="67" r="3" fill="#222"/>
      <circle cx="93" cy="67" r="3" fill="#222"/>
      <path d="M69 84c7 6 15 6 22 0" stroke="#7c3f2d" stroke-width="3" fill="none" stroke-linecap="round"/>
      <path d="M34 146c7-32 24-48 46-48s39 16 46 48" fill="rgba(255,255,255,.88)"/>
      <circle cx="124" cy="124" r="20" fill="rgba(17,24,39,.82)"/>
      <text x="124" y="131" text-anchor="middle" font-family="Arial,sans-serif" font-size="17" font-weight="700" fill="#fff">${initials}</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

export default function BotUsersPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [generateCount, setGenerateCount] = useState("100");
  const [simulationEnabled, setSimulationEnabled] = useState(false);
  const [reactionsEnabled, setReactionsEnabled] = useState(true);
  const [commentsEnabled, setCommentsEnabled] = useState(true);
  const [reactionChance, setReactionChance] = useState("70");
  const [commentChance, setCommentChance] = useState("30");
  const [actionsPerRun, setActionsPerRun] = useState("2");
  const [maxBotsPerPost, setMaxBotsPerPost] = useState("4");
  const [postAgeHours, setPostAgeHours] = useState("72");
  const [simulationMinDelay, setSimulationMinDelay] = useState("1");
  const [simulationMaxDelay, setSimulationMaxDelay] = useState("400");

  const [friendEnabled, setFriendEnabled] = useState(false);
  const [friendStrategy, setFriendStrategy] = useState<"MUTUAL_FIRST" | "RANDOM">("MUTUAL_FIRST");
  const [friendRequestsPerRun, setFriendRequestsPerRun] = useState("1");
  const [friendMinDelay, setFriendMinDelay] = useState("60");
  const [friendMaxDelay, setFriendMaxDelay] = useState("360");

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

  useEffect(() => {
    const data = simulationQuery.data;
    if (!data) return;
    setSimulationEnabled(Boolean(data.enabled));
    setReactionsEnabled(Boolean(data.reactionsEnabled));
    setCommentsEnabled(Boolean(data.commentsEnabled));
    setReactionChance(String(data.reactionChancePercent ?? 70));
    setCommentChance(String(data.commentChancePercent ?? 30));
    setActionsPerRun(String(data.actionsPerRun ?? 2));
    setMaxBotsPerPost(String(data.maxBotsPerPost ?? 4));
    setPostAgeHours(String(data.postAgeHours ?? 72));
    setSimulationMinDelay(String(data.minDelayMinutes ?? 1));
    setSimulationMaxDelay(String(data.maxDelayMinutes ?? 400));
  }, [simulationQuery.data]);

  const simulationMutation = useMutation({
    mutationFn: async () => {
      const res = await privateApi.patch("/social/admin/bot-simulation", {
        enabled: simulationEnabled,
        minDelayMinutes: Math.max(1, Math.min(1440, Number(simulationMinDelay) || 1)),
        maxDelayMinutes: Math.max(1, Math.min(1440, Number(simulationMaxDelay) || 400)),
        reactionsEnabled,
        commentsEnabled,
        reactionChancePercent: Math.max(0, Math.min(100, Number(reactionChance) || 0)),
        commentChancePercent: Math.max(0, Math.min(100, Number(commentChance) || 0)),
        actionsPerRun: Math.max(1, Math.min(20, Number(actionsPerRun) || 2)),
        maxBotsPerPost: Math.max(1, Math.min(50, Number(maxBotsPerPost) || 4)),
        postAgeHours: Math.max(1, Math.min(720, Number(postAgeHours) || 72)),
      });
      return res.data?.data ?? res.data;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin-bot-simulation"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-bot-simulation-stats"] }),
      ]);
      toast.success("Auto like/comment settings saved");
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || "Could not update simulation"),
  });

  const simulationRunMutation = useMutation({
    mutationFn: async () => {
      const res = await privateApi.post("/social/admin/bot-simulation/run");
      return res.data?.data ?? res.data;
    },
    onSuccess: async (result: any) => {
      await queryClient.invalidateQueries({ queryKey: ["admin-bot-simulation-stats"] });
      toast.success(
        String(Number(result?.reactions ?? 0)) +
          " like/reaction(s), " +
          String(Number(result?.comments ?? 0)) +
          " comment(s) created",
      );
    },
    onError: (error: any) =>
      toast.error(error?.response?.data?.message || "Could not run auto engagement"),
  });

  const friendAutomationQuery = useQuery({
    queryKey: ["admin-bot-friend-automation"],
    queryFn: async () => {
      const res = await privateApi.get("/social/admin/bot-friend-automation");
      return res.data?.data ?? res.data;
    },
  });

  useEffect(() => {
    const data = friendAutomationQuery.data;
    if (!data) return;
    setFriendEnabled(Boolean(data.enabled));
    setFriendStrategy(data.strategy === "RANDOM" ? "RANDOM" : "MUTUAL_FIRST");
    setFriendRequestsPerRun(String(data.requestsPerRun ?? 1));
    setFriendMinDelay(String(data.minDelayMinutes ?? 60));
    setFriendMaxDelay(String(data.maxDelayMinutes ?? 360));
  }, [friendAutomationQuery.data]);

  const friendAutomationMutation = useMutation({
    mutationFn: async () => {
      const res = await privateApi.patch("/social/admin/bot-friend-automation", {
        enabled: friendEnabled,
        strategy: friendStrategy,
        requestsPerRun: Math.max(1, Math.min(20, Number(friendRequestsPerRun) || 1)),
        minDelayMinutes: Math.max(1, Number(friendMinDelay) || 60),
        maxDelayMinutes: Math.max(1, Number(friendMaxDelay) || 360),
      });
      return res.data?.data ?? res.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-bot-friend-automation"] });
      toast.success("Bot friend-request automation saved");
    },
    onError: (error: any) =>
      toast.error(error?.response?.data?.message || "Could not save friend automation"),
  });

  const friendAutomationRunMutation = useMutation({
    mutationFn: async () => {
      const res = await privateApi.post("/social/admin/bot-friend-automation/run");
      return res.data?.data ?? res.data;
    },
    onSuccess: async (result: any) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin-bot-friend-automation"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-bot-simulation-stats"] }),
      ]);
      toast.success(String(Number(result?.sent ?? 0)) + " bot friend request(s) sent");
    },
    onError: (error: any) =>
      toast.error(error?.response?.data?.message || "Could not run friend automation"),
  });
  const botsQuery = useQuery({
    queryKey: ["admin-synthetic-bots", params],
    queryFn: async () => {
      const res = await privateApi.get("/social/admin/synthetic-bots", { params });
      const payload = res.data;

      // The API may be returned directly or inside the app's standard
      // response envelope. A list response itself also has a "data" field,
      // so blindly doing payload.data would turn the response into only the
      // array and lose pagination/total information.
      if (Array.isArray(payload?.data) && payload?.pagination) {
        return payload as BotListResponse;
      }

      if (Array.isArray(payload?.data?.data) && payload?.data?.pagination) {
        return payload.data as BotListResponse;
      }

      if (Array.isArray(payload)) {
        return {
          data: payload,
          pagination: {
            page,
            take: 50,
            total: payload.length,
            count: payload.length,
            previousPage: page > 0 ? page - 1 : null,
            nextPage: null,
          },
          synthetic: true,
        } as BotListResponse;
      }

      throw new Error("Invalid bot list response from server");
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
      const created = Number(result?.created ?? 0);
      setSearch("");
      setPage(0);

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin-synthetic-bots"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-synthetic-bots-stats"] }),
        queryClient.refetchQueries({ queryKey: ["admin-synthetic-bots"], type: "active" }),
        queryClient.refetchQueries({ queryKey: ["admin-synthetic-bots-stats"], type: "active" }),
      ]);

      if (created > 0) {
        toast.success(`${created} bot users created and loaded`);
      } else {
        toast.error("Server returned 0 created users");
      }
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
        <CardHeader>
          <CardTitle>Auto Like & Comment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium">{simulationEnabled ? "Running" : "Paused"}</p>
              <p className="text-sm text-muted-foreground">
                Bot reactions and contextual comments run only on recent public posts.
              </p>
            </div>
            <Button
              type="button"
              variant={simulationEnabled ? "default" : "outline"}
              onClick={() => setSimulationEnabled((value) => !value)}
            >
              {simulationEnabled ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
              {simulationEnabled ? "Automation ON" : "Automation OFF"}
            </Button>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <button
              type="button"
              onClick={() => setReactionsEnabled((value) => !value)}
              className="flex items-center justify-between rounded-xl border p-3 text-left"
            >
              <div>
                <p className="font-medium">Auto reactions</p>
                <p className="text-xs text-muted-foreground">LIKE / LOVE / WOW / HAHA</p>
              </div>
              <Badge variant={reactionsEnabled ? "default" : "secondary"}>
                {reactionsEnabled ? "ON" : "OFF"}
              </Badge>
            </button>

            <button
              type="button"
              onClick={() => setCommentsEnabled((value) => !value)}
              className="flex items-center justify-between rounded-xl border p-3 text-left"
            >
              <div>
                <p className="font-medium">Auto comments</p>
                <p className="text-xs text-muted-foreground">Room/job/general context templates</p>
              </div>
              <Badge variant={commentsEnabled ? "default" : "secondary"}>
                {commentsEnabled ? "ON" : "OFF"}
              </Badge>
            </button>
          </div>

          <div className="grid gap-3 md:grid-cols-5">
            <label className="space-y-1 text-sm">
              <span className="font-medium">Reaction chance %</span>
              <Input type="number" min={0} max={100} value={reactionChance} onChange={(e) => setReactionChance(e.target.value)} />
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium">Comment chance %</span>
              <Input type="number" min={0} max={100} value={commentChance} onChange={(e) => setCommentChance(e.target.value)} />
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium">Actions / run</span>
              <Input type="number" min={1} max={20} value={actionsPerRun} onChange={(e) => setActionsPerRun(e.target.value)} />
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium">Max bots / post</span>
              <Input type="number" min={1} max={50} value={maxBotsPerPost} onChange={(e) => setMaxBotsPerPost(e.target.value)} />
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium">Post age (hours)</span>
              <Input type="number" min={1} max={720} value={postAgeHours} onChange={(e) => setPostAgeHours(e.target.value)} />
            </label>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="space-y-1 text-sm">
              <span className="font-medium">Min delay (minutes)</span>
              <Input type="number" min={1} max={1440} value={simulationMinDelay} onChange={(e) => setSimulationMinDelay(e.target.value)} />
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium">Max delay (minutes)</span>
              <Input type="number" min={1} max={1440} value={simulationMaxDelay} onChange={(e) => setSimulationMaxDelay(e.target.value)} />
            </label>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              onClick={() => simulationMutation.mutate()}
              disabled={simulationMutation.isPending || simulationQuery.isLoading}
            >
              Save Auto Engagement
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => simulationRunMutation.mutate()}
              disabled={simulationRunMutation.isPending || total === 0}
            >
              Run Once Now
            </Button>
          </div>

          <div className="flex flex-wrap gap-2 text-sm">
            <Badge variant="secondary">All actions: {Number(simulationStatsQuery.data?.totalActions ?? 0).toLocaleString()}</Badge>
            <Badge variant="secondary">Last 24h: {Number(simulationStatsQuery.data?.actions24h ?? 0).toLocaleString()}</Badge>
            <Badge variant="outline">Reactions: {Number(simulationStatsQuery.data?.reactions ?? 0).toLocaleString()}</Badge>
            <Badge variant="outline">Comments: {Number(simulationStatsQuery.data?.comments ?? 0).toLocaleString()}</Badge>
            {simulationQuery.data?.nextRunAt && (
              <Badge variant="outline">Next run: {new Date(simulationQuery.data.nextRunAt).toLocaleString()}</Badge>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Friend Request Automation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium">{friendEnabled ? "Enabled" : "Disabled"}</p>
              <p className="text-sm text-muted-foreground">
                Bots can send friend requests to real users. Mutual-first prefers users connected to people who already accepted that bot.
              </p>
            </div>
            <Button
              type="button"
              variant={friendEnabled ? "default" : "outline"}
              onClick={() => setFriendEnabled((value) => !value)}
            >
              {friendEnabled ? "Automation ON" : "Automation OFF"}
            </Button>
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            <label className="space-y-1 text-sm">
              <span className="font-medium">Target strategy</span>
              <select
                value={friendStrategy}
                onChange={(event) =>
                  setFriendStrategy(event.target.value === "RANDOM" ? "RANDOM" : "MUTUAL_FIRST")
                }
                className="h-10 w-full rounded-md border bg-background px-3"
              >
                <option value="MUTUAL_FIRST">Mutual first</option>
                <option value="RANDOM">Random real users</option>
              </select>
            </label>

            <label className="space-y-1 text-sm">
              <span className="font-medium">Requests / run</span>
              <Input type="number" min={1} max={20} value={friendRequestsPerRun} onChange={(event) => setFriendRequestsPerRun(event.target.value)} />
            </label>

            <label className="space-y-1 text-sm">
              <span className="font-medium">Min delay (min)</span>
              <Input type="number" min={1} max={1440} value={friendMinDelay} onChange={(event) => setFriendMinDelay(event.target.value)} />
            </label>

            <label className="space-y-1 text-sm">
              <span className="font-medium">Max delay (min)</span>
              <Input type="number" min={1} max={1440} value={friendMaxDelay} onChange={(event) => setFriendMaxDelay(event.target.value)} />
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              onClick={() => friendAutomationMutation.mutate()}
              disabled={friendAutomationMutation.isPending || friendAutomationQuery.isLoading}
            >
              Save Friend Automation
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => friendAutomationRunMutation.mutate()}
              disabled={friendAutomationRunMutation.isPending || total === 0}
            >
              Run Once Now
            </Button>
            {friendAutomationQuery.data?.nextRunAt && (
              <Badge variant="outline">
                Next run: {new Date(friendAutomationQuery.data.nextRunAt).toLocaleString()}
              </Badge>
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            Bot accounts stay hidden from normal friend suggestions and real users cannot send requests to bots. Incoming bot requests show the bot bio and a Bot label.
          </p>
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
              <TableHeader><TableRow><TableHead>Profile</TableHead><TableHead>Name</TableHead><TableHead>Bio</TableHead><TableHead>Email</TableHead><TableHead>Status</TableHead><TableHead>Created</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader>
              <TableBody>
                {botsQuery.isLoading ? (
                  <TableRow><TableCell colSpan={7} className="py-10 text-center">Loading bot users...</TableCell></TableRow>
                ) : botsQuery.isError ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-10 text-center text-destructive">
                      Could not load bot users. Tap Refresh and try again.
                    </TableCell>
                  </TableRow>
                ) : bots.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="py-10 text-center text-muted-foreground">No bot users found.</TableCell></TableRow>
                ) : bots.map((bot) => (
                  <TableRow key={bot.id}>
                    <TableCell>
                      <Avatar className="h-11 w-11 border shadow-sm">
                        <AvatarImage
                          src={botAvatarDataUrl(bot)}
                          alt={`${bot.displayName} profile`}
                        />
                        <AvatarFallback>
                          {bot.displayName
                            .split(/\s+/)
                            .slice(0, 2)
                            .map((part) => part.slice(0, 1))
                            .join("")
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </TableCell>
                    <TableCell className="font-medium">{bot.displayName}</TableCell>
                    <TableCell className="max-w-[260px] truncate text-sm text-muted-foreground">
                      {bot.bio || "RoomKhoj community ma active."}
                    </TableCell>
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
            <p className="text-sm text-muted-foreground">
              {Number(pagination?.total ?? 0) > 0
                ? `Showing ${page * Number(pagination?.take ?? 50) + 1}–${Math.min(
                    page * Number(pagination?.take ?? 50) + bots.length,
                    Number(pagination?.total ?? 0),
                  )} of ${Number(pagination?.total ?? 0).toLocaleString()}`
                : "Total 0"}
            </p>
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
