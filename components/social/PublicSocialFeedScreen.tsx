"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Heart, Loader2, MessageCircle, Share2 } from "lucide-react";

const backendUrl = String(
  process.env.NEXT_PUBLIC_BACKEND_URL || "https://api.roomkhoj.com",
).replace(/\/$/, "");

type PublicPost = {
  id: string;
  userId: string;
  content?: string | null;
  mediaUrls?: string[];
  mediaTypes?: Array<"IMAGE" | "VIDEO">;
  visibility?: string;
  createdAt: string;
  updatedAt?: string;
  author?: {
    id: string;
    name: string;
    profilePhotoUrl?: string | null;
  };
  likeCount?: number;
  commentCount?: number;
  shareCount?: number;
};

type PublicFeedItem = {
  type: "POST" | "ROOM" | "JOB" | string;
  id: string;
  createdAt: string;
  post?: PublicPost;
};

type PublicFeedResponse = {
  items?: PublicFeedItem[];
  nextCursor?: string | null;
};

function media(value?: string | null) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (/^(https?:)?\/\//i.test(raw)) return raw.startsWith("//") ? `https:${raw}` : raw;
  return `${backendUrl}${raw.startsWith("/") ? raw : `/${raw}`}`;
}

function ago(value?: string) {
  if (!value) return "";
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60000));
  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return days < 7 ? `${days}d` : new Date(value).toLocaleDateString();
}

function requireLogin() {
  window.dispatchEvent(new Event("roomkhoj:open-login"));
}

export function PublicSocialFeedScreen() {
  const [items, setItems] = useState<PublicFeedItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const sentinel = useRef<HTMLDivElement | null>(null);

  const load = useCallback(async (before?: string | null) => {
    const isMore = Boolean(before);
    if (isMore) setLoadingMore(true);
    else setLoading(true);

    try {
      const params = new URLSearchParams({ limit: "20" });
      if (before) params.set("before", before);
      const response = await fetch(`${backendUrl}/public/social/feed?${params.toString()}`, {
        method: "GET",
        credentials: "omit",
        cache: "no-store",
      });
      if (!response.ok) throw new Error(`Feed request failed: ${response.status}`);
      const data = (await response.json()) as PublicFeedResponse;
      const publicPosts = (data.items || []).filter(
        (item) => item.type === "POST" && item.post,
      );
      setItems((current) => (isMore ? [...current, ...publicPosts] : publicPosts));
      setNextCursor(data.nextCursor || null);
    } catch {
      if (!isMore) setItems([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const node = sentinel.current;
    if (!node || !nextCursor) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !loadingMore) void load(nextCursor);
      },
      { rootMargin: "700px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [load, loadingMore, nextCursor]);

  if (loading) {
    return (
      <div className="flex min-h-[65vh] items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[760px] space-y-2 pb-24">
      {items.length === 0 ? (
        <div className="rounded-2xl bg-white px-6 py-12 text-center text-sm text-slate-500">
          अहिले public post उपलब्ध छैन।
        </div>
      ) : (
        items.map((item) => {
          const post = item.post!;
          const authorName = post.author?.name || "RoomKhoj User";
          const photo = media(post.author?.profilePhotoUrl);
          const mediaUrls = Array.isArray(post.mediaUrls) ? post.mediaUrls : [];

          return (
            <article key={post.id} className="overflow-hidden border-y border-slate-200 bg-white sm:rounded-2xl sm:border">
              <div className="flex items-center gap-3 px-4 py-3">
                {photo ? (
                  <img src={photo} alt={authorName} className="h-10 w-10 rounded-full object-cover" />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-sm font-bold text-slate-600">
                    {authorName.slice(0, 1).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-bold">{authorName}</div>
                  <div className="text-xs text-slate-500">{ago(post.createdAt)}</div>
                </div>
              </div>

              {post.content && (
                <div className="whitespace-pre-wrap px-4 pb-3 text-[15px] leading-6 text-slate-900">
                  {post.content}
                </div>
              )}

              {mediaUrls.length > 0 && (
                <div className="space-y-1 bg-black">
                  {mediaUrls.slice(0, 6).map((url, index) => {
                    const src = media(url);
                    const type = post.mediaTypes?.[index] || "IMAGE";
                    return type === "VIDEO" ? (
                      <video key={`${url}-${index}`} src={src} controls playsInline preload="metadata" className="max-h-[620px] w-full object-contain" />
                    ) : (
                      <img key={`${url}-${index}`} src={src} alt="Post media" loading="lazy" className="max-h-[620px] w-full object-contain" />
                    );
                  })}
                </div>
              )}

              <div className="flex items-center justify-between border-t border-slate-100 px-3 py-2 text-slate-600">
                <button type="button" onClick={requireLogin} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm active:bg-slate-100">
                  <Heart className="h-5 w-5" /> {post.likeCount || 0}
                </button>
                <button type="button" onClick={requireLogin} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm active:bg-slate-100">
                  <MessageCircle className="h-5 w-5" /> {post.commentCount || 0}
                </button>
                <button type="button" onClick={requireLogin} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm active:bg-slate-100">
                  <Share2 className="h-5 w-5" /> {post.shareCount || 0}
                </button>
              </div>
            </article>
          );
        })
      )}

      <div ref={sentinel} className="flex min-h-12 items-center justify-center">
        {loadingMore && <Loader2 className="h-5 w-5 animate-spin" />}
      </div>
    </div>
  );
}
