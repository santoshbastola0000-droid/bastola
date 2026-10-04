"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pause, Play, RefreshCw, Target, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { privateApi } from "@/http/api/privateApi";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type Post = {
  id: string;
  content?: string | null;
  createdAt: string;
  syntheticLikes: number;
  syntheticComments: number;
  campaignId?: string | null;
  targetLikes?: number | null;
  targetComments?: number | null;
  durationDays?: number | null;
  campaignEnabled?: boolean | null;
  endsAt?: string | null;
};

type Campaign = {
  id: string;
  postId: string;
  postContent?: string | null;
  targetLikes: number;
  targetComments: number;
  durationDays: number;
  enabled: boolean;
  createdLikes: number;
  createdComments: number;
  endsAt: string;
};

export default function BotEngagementPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedPostId, setSelectedPostId] = useState("");
  const [targetLikes, setTargetLikes] = useState("20");
  const [targetComments, setTargetComments] = useState("5");
  const [durationDays, setDurationDays] = useState("7");

  const postsQuery = useQuery({
    queryKey: ["admin-bot-engagement-posts", search],
    queryFn: async () => {
      const res = await privateApi.get("/social/admin/bot-engagement/posts", {
        params: { search: search.trim() || undefined, limit: 50 },
      });
      return (res.data?.data ?? res.data) as Post[];
    },
  });

  const campaignsQuery = useQuery({
    queryKey: ["admin-bot-engagement-campaigns"],
    queryFn: async () => {
      const res = await privateApi.get("/social/admin/bot-engagement/campaigns");
      return (res.data?.data ?? res.data) as Campaign[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!selectedPostId) throw new Error("Select a post first");
      const res = await privateApi.post("/social/admin/bot-engagement/campaigns", {
        postId: selectedPostId,
        targetLikes: Math.max(0, Math.min(50000, Number(targetLikes) || 0)),
        targetComments: Math.max(0, Math.min(50000, Number(targetComments) || 0)),
        durationDays: Math.max(1, Math.min(365, Number(durationDays) || 1)),
        enabled: true,
      });
      return res.data?.data ?? res.data;
    },
    onSuccess: async () => {
      toast.success("Bot engagement campaign saved");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin-bot-engagement-posts"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-bot-engagement-campaigns"] }),
      ]);
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || error?.message || "Could not create campaign"),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const res = await privateApi.patch("/social/admin/bot-engagement/campaigns/" + id, { enabled });
      return res.data?.data ?? res.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-bot-engagement-campaigns"] });
      await queryClient.invalidateQueries({ queryKey: ["admin-bot-engagement-posts"] });
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || "Could not update campaign"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => privateApi.delete("/social/admin/bot-engagement/campaigns/" + id),
    onSuccess: async () => {
      toast.success("Campaign deleted");
      await queryClient.invalidateQueries({ queryKey: ["admin-bot-engagement-campaigns"] });
      await queryClient.invalidateQueries({ queryKey: ["admin-bot-engagement-posts"] });
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || "Could not delete campaign"),
  });

  const runMutation = useMutation({
    mutationFn: async () => {
      const res = await privateApi.post("/social/admin/bot-engagement/run");
      return res.data?.data ?? res.data;
    },
    onSuccess: async (result: any) => {
      toast.success(`${Number(result?.likes ?? 0)} likes, ${Number(result?.comments ?? 0)} comments created`);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin-bot-engagement-campaigns"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-bot-engagement-posts"] }),
      ]);
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || "Could not run campaigns"),
  });

  const posts = useMemo(() => postsQuery.data ?? [], [postsQuery.data]);
  const campaigns = campaignsQuery.data ?? [];

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold"><Target className="h-6 w-6" /> Targeted Bot Engagement</h1>
          <p className="text-sm text-muted-foreground">
            Experiment-only synthetic bots. Real user accounts are never used.
          </p>
        </div>
        <Button variant="outline" onClick={() => postsQuery.refetch()}>
          <RefreshCw className="mr-2 h-4 w-4" /> Refresh posts
        </Button>
      </div>

      <Card>
        <CardHeader><CardTitle>1. Select a public post</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Input placeholder="Search post text..." value={search} onChange={(e) => setSearch(e.target.value)} />
          <div className="max-h-[420px] space-y-2 overflow-y-auto">
            {posts.map((post) => (
              <button
                key={post.id}
                type="button"
                onClick={() => setSelectedPostId(post.id)}
                className={`w-full rounded-xl border p-3 text-left transition ${selectedPostId === post.id ? "border-primary bg-muted" : ""}`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={selectedPostId === post.id ? "default" : "outline"}>
                    {selectedPostId === post.id ? "Selected" : "Select"}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{new Date(post.createdAt).toLocaleString()}</span>
                </div>
                <p className="mt-2 line-clamp-3 text-sm">{post.content || "(no caption)"}</p>
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  <Badge variant="secondary">Bot likes: {post.syntheticLikes}</Badge>
                  <Badge variant="secondary">Bot comments: {post.syntheticComments}</Badge>
                  {post.campaignId && <Badge variant={post.campaignEnabled ? "default" : "secondary"}>{post.campaignEnabled ? "Campaign ON" : "Campaign finished/paused"}</Badge>}
                </div>
              </button>
            ))}
            {!posts.length && <p className="text-sm text-muted-foreground">No public active posts found.</p>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>2. Set the experiment</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            The target is the total synthetic engagement. The system spreads it approximately across the selected number of days.
          </p>
          <div className="grid gap-3 md:grid-cols-3">
            <label className="space-y-1 text-sm"><span className="font-medium">Target likes</span><Input type="number" min={0} max={50000} value={targetLikes} onChange={(e) => setTargetLikes(e.target.value)} /></label>
            <label className="space-y-1 text-sm"><span className="font-medium">Target comments</span><Input type="number" min={0} max={50000} value={targetComments} onChange={(e) => setTargetComments(e.target.value)} /></label>
            <label className="space-y-1 text-sm"><span className="font-medium">Days</span><Input type="number" min={1} max={365} value={durationDays} onChange={(e) => setDurationDays(e.target.value)} /></label>
          </div>
          <Button onClick={() => createMutation.mutate()} disabled={!selectedPostId || createMutation.isPending}>
            <Target className="mr-2 h-4 w-4" /> {createMutation.isPending ? "Saving..." : "Save campaign"}
          </Button>
          {selectedPostId && <p className="text-xs text-muted-foreground">Selected post: {selectedPostId}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>3. Saved campaigns</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {campaigns.map((campaign) => (
            <div key={campaign.id} className="rounded-xl border p-4">
              <p className="line-clamp-2 text-sm font-medium">{campaign.postContent || campaign.postId}</p>
              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                <Badge variant="outline">Likes {campaign.createdLikes}/{campaign.targetLikes}</Badge>
                <Badge variant="outline">Comments {campaign.createdComments}/{campaign.targetComments}</Badge>
                <Badge variant="secondary">{campaign.durationDays} day(s)</Badge>
                <Badge variant={campaign.enabled ? "default" : "secondary"}>{campaign.enabled ? "ON" : "OFF"}</Badge>
                <Badge variant="outline">Ends {new Date(campaign.endsAt).toLocaleString()}</Badge>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => toggleMutation.mutate({ id: campaign.id, enabled: !campaign.enabled })} disabled={toggleMutation.isPending}>
                  {campaign.enabled ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
                  {campaign.enabled ? "Pause" : "Resume"}
                </Button>
                <Button size="sm" variant="destructive" onClick={() => deleteMutation.mutate(campaign.id)} disabled={deleteMutation.isPending}>
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                </Button>
              </div>
            </div>
          ))}
          {!campaigns.length && <p className="text-sm text-muted-foreground">No campaigns saved.</p>}
          <Button variant="outline" onClick={() => runMutation.mutate()} disabled={runMutation.isPending}>
            <Play className="mr-2 h-4 w-4" /> Run due campaigns now
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
