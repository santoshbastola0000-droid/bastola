"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarClock, Pause, Play, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { privateApi } from "@/http/api/privateApi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

type ScheduledPost = {
  id: string;
  content: string;
  mediaUrls: string[];
  scheduledAt: string;
  repeatIntervalMinutes?: number | null;
  enabled: boolean;
  status: string;
  lastError?: string | null;
  postedAt?: string | null;
};

export default function ScheduledPostsPage() {
  const qc = useQueryClient();
  const [content, setContent] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [repeat, setRepeat] = useState("");
  const [mediaUrls, setMediaUrls] = useState("");

  const posts = useQuery({
    queryKey: ["admin-scheduled-posts"],
    queryFn: async () => {
      const res = await privateApi.get("/social/admin/scheduled-posts");
      return (res.data?.data ?? res.data) as ScheduledPost[];
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      const res = await privateApi.post("/social/admin/scheduled-posts", {
        content,
        scheduledAt: new Date(scheduledAt).toISOString(),
        repeatIntervalMinutes: repeat ? Number(repeat) : null,
        mediaUrls: mediaUrls.split("\n").map((v) => v.trim()).filter(Boolean),
      });
      return res.data;
    },
    onSuccess: async () => {
      setContent(""); setScheduledAt(""); setRepeat(""); setMediaUrls("");
      await qc.invalidateQueries({ queryKey: ["admin-scheduled-posts"] });
      toast.success("Post schedule created");
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || "Could not schedule post"),
  });

  const toggle = useMutation({
    mutationFn: async ({ post, enabled }: { post: ScheduledPost; enabled: boolean }) => {
      await privateApi.patch(`/social/admin/scheduled-posts/${post.id}`, { enabled });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-scheduled-posts"] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => privateApi.delete(`/social/admin/scheduled-posts/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-scheduled-posts"] }),
  });

  const runDue = useMutation({
    mutationFn: async () => privateApi.post("/social/admin/scheduled-posts/run-due"),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["admin-scheduled-posts"] });
      toast.success("Due scheduled posts checked");
    },
  });

  return (
    <main className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold">Bot Scheduled Posts</h1>
        <p className="mt-1 text-sm text-muted-foreground">Admin ले post तयार गरेर समय सेट गर्छ; bot ले समय पुगेपछि Feed मा public post गर्छ।</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Plus className="h-5 w-5" /> New scheduled post</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Post लेख्नुहोस्..." rows={5} />
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm font-medium">Post time<input className="flex h-10 w-full rounded-md border bg-background px-3 text-sm" type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} /></label>
            <label className="space-y-2 text-sm font-medium">Repeat every (minutes)<Input type="number" min="1" placeholder="Empty = once" value={repeat} onChange={(e) => setRepeat(e.target.value)} /></label>
          </div>
          <Textarea value={mediaUrls} onChange={(e) => setMediaUrls(e.target.value)} placeholder="Image/video URL — one per line (optional)" rows={3} />
          <Button onClick={() => create.mutate()} disabled={create.isPending || !content.trim() || !scheduledAt}><CalendarClock className="mr-2 h-4 w-4" />{create.isPending ? "Saving..." : "Schedule Post"}</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between"><CardTitle>Scheduled / posted</CardTitle><Button variant="outline" onClick={() => runDue.mutate()} disabled={runDue.isPending}>Run due now</Button></CardHeader>
        <CardContent className="space-y-3">
          {posts.isLoading ? <p className="text-sm text-muted-foreground">Loading...</p> : null}
          {!posts.isLoading && !(posts.data?.length) ? <p className="text-sm text-muted-foreground">No scheduled posts yet.</p> : null}
          {posts.data?.map((post) => (
            <div key={post.id} className="rounded-lg border p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Badge>{post.status}</Badge>
                <span className="text-xs text-muted-foreground">{new Date(post.scheduledAt).toLocaleString()}</span>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm">{post.content}</p>
              {post.repeatIntervalMinutes ? <p className="mt-2 text-xs text-muted-foreground">Repeats every {post.repeatIntervalMinutes} minutes</p> : null}
              {post.lastError ? <p className="mt-2 text-xs text-destructive">{post.lastError}</p> : null}
              <div className="mt-3 flex gap-2">
                <Button size="sm" variant="outline" onClick={() => toggle.mutate({ post, enabled: !post.enabled })}>{post.enabled ? <><Pause className="mr-1 h-4 w-4" />Pause</> : <><Play className="mr-1 h-4 w-4" />Resume</>}</Button>
                <Button size="sm" variant="destructive" onClick={() => remove.mutate(post.id)}><Trash2 className="mr-1 h-4 w-4" />Delete</Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </main>
  );
}
