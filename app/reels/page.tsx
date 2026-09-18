"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Heart,
  Loader2,
  MessageCircle,
  Send,
} from "lucide-react";

import {
  socialService,
  type SocialPost,
} from "@/http/services/social.service";
import { useUserStore } from "@/stores/user-store";

const backendUrl = String(
  process.env.NEXT_PUBLIC_BACKEND_URL || "https://api.roomkhoj.com",
).replace(/\/$/, "");

function media(value?: string | null) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (/^(https?:)?\/\//i.test(raw)) {
    return raw.startsWith("//") ? `https:${raw}` : raw;
  }
  if (/^(data:|blob:)/i.test(raw)) return raw;
  return `${backendUrl}${raw.startsWith("/") ? raw : `/${raw}`}`;
}

type Reel = {
  id: string;
  post: SocialPost;
  url: string;
};

export default function ReelsPage() {
  const { user, isLoaded } = useUserStore();
  const [loading, setLoading] = useState(true);
  const [reels, setReels] = useState<Reel[]>([]);

  useEffect(() => {
    if (!isLoaded || !user) return;

    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        const collected: Reel[] = [];
        let cursor: string | undefined;

        for (let page = 0; page < 4 && collected.length < 20; page += 1) {
          const result = await socialService.feed(cursor);
          const posts = (result.items || []).filter(
            (item) => item.type === "POST",
          );

          for (const item of posts) {
            if (item.type !== "POST") continue;

            item.post.mediaUrls.forEach((url, index) => {
              if (item.post.mediaTypes[index] !== "VIDEO") return;
              collected.push({
                id: `${item.post.id}-${index}`,
                post: item.post,
                url,
              });
            });
          }

          if (!result.nextCursor) break;
          cursor = result.nextCursor;
        }

        if (!cancelled) setReels(collected.slice(0, 20));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [isLoaded, user]);

  const empty = useMemo(
    () => !loading && reels.length === 0,
    [loading, reels.length],
  );

  if (!isLoaded || !user || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        <Loader2 className="h-7 w-7 animate-spin" />
      </div>
    );
  }

  if (empty) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-black px-6 pb-28 text-center text-white">
        <h1 className="text-2xl font-black">Reels</h1>
        <p className="mt-2 max-w-sm text-sm text-white/65">
          Video posts आएपछि यहाँ Instagram-style Reels feed मा देखिन्छन्।
        </p>
        <Link
          href="/feed"
          className="mt-5 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-black"
        >
          Back to Feed
        </Link>
      </main>
    );
  }

  return (
    <main className="h-[100dvh] snap-y snap-mandatory overflow-y-auto bg-black pb-24 text-white [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {reels.map((reel) => (
        <section
          key={reel.id}
          className="relative flex h-[calc(100dvh-88px)] snap-start items-center justify-center overflow-hidden bg-black"
        >
          <video
            src={media(reel.url)}
            playsInline
            loop
            muted
            autoPlay
            preload="metadata"
            className="h-full w-full object-contain"
          />

          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/80 to-transparent" />

          <div className="absolute inset-x-0 bottom-5 flex items-end gap-3 px-4">
            <div className="min-w-0 flex-1">
              <Link
                href={`/profile/${reel.post.author.id}`}
                className="pointer-events-auto inline-flex max-w-full items-center gap-2"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/20 text-sm font-black">
                  {reel.post.author.profilePhotoUrl ? (
                    <img
                      src={media(reel.post.author.profilePhotoUrl)}
                      alt={reel.post.author.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    reel.post.author.name.slice(0, 1).toUpperCase()
                  )}
                </div>
                <span className="truncate text-sm font-bold">
                  {reel.post.author.name}
                </span>
              </Link>

              {reel.post.content && (
                <p className="mt-2 line-clamp-3 text-sm leading-5 text-white/90">
                  {reel.post.content}
                </p>
              )}
            </div>

            <div className="flex shrink-0 flex-col items-center gap-4 pb-1">
              <div className="text-center">
                <Heart className="mx-auto h-7 w-7" />
                <span className="mt-1 block text-[10px] font-bold">
                  {Number(reel.post.likeCount || 0)}
                </span>
              </div>

              <Link
                href={`/feed?post=${reel.post.id}`}
                className="pointer-events-auto text-center"
                aria-label="Open comments"
              >
                <MessageCircle className="mx-auto h-7 w-7" />
                <span className="mt-1 block text-[10px] font-bold">
                  {Number(reel.post.commentCount || 0)}
                </span>
              </Link>

              <button
                type="button"
                className="pointer-events-auto text-center"
                aria-label="Share reel"
                onClick={async () => {
                  const url = `${window.location.origin}/feed?post=${reel.post.id}`;
                  if (navigator.share) {
                    await navigator.share({
                      title: "RoomKhoj reel",
                      url,
                    });
                  } else {
                    await navigator.clipboard.writeText(url);
                  }
                  await socialService.registerShare(
                    reel.post.id,
                    navigator.share ? "native" : "copy-link",
                  );
                }}
              >
                <Send className="mx-auto h-7 w-7" />
                <span className="mt-1 block text-[10px] font-bold">
                  {Number(reel.post.shareCount || 0)}
                </span>
              </button>
            </div>
          </div>
        </section>
      ))}
    </main>
  );
}
