"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Heart, MessageCircle, Share2 } from "lucide-react";
import { privateApi } from "@/http/api/privateApi";
import type { SocialPost } from "@/http/services/social.service";

const backendUrl = String(
  process.env.NEXT_PUBLIC_BACKEND_URL || "https://api.roomkhoj.com",
).replace(/\/$/, "");

function media(value?: string | null) {
  const raw = String(value || "");
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  return `${backendUrl}${raw.startsWith("/") ? raw : `/${raw}`}`;
}

export default function SocialPostPage() {
  const params = useParams<{ id: string }>();
  const [post, setPost] = useState<SocialPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const run = async () => {
      try {
        const response = await privateApi.get(`/social/posts/${params.id}`);
        if (active) setPost(response.data as SocialPost);
      } finally {
        if (active) setLoading(false);
      }
    };
    void run();
    return () => {
      active = false;
    };
  }, [params.id]);

  if (loading) {
    return <div className="min-h-screen bg-[#f0f2f5] p-8 text-center text-sm text-slate-500">Loading post...</div>;
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-[#f0f2f5] p-8 text-center">
        <p className="text-sm text-slate-600">Post unavailable.</p>
        <Link href="/feed" className="mt-3 inline-block font-semibold text-blue-600">Back to feed</Link>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#f0f2f5] px-0 py-3 sm:px-3">
      <article className="mx-auto max-w-[680px] overflow-hidden bg-white shadow-sm sm:rounded-2xl sm:border">
        <header className="flex items-center gap-3 border-b px-4 py-3">
          <Link href="/feed" className="rounded-full p-2 hover:bg-slate-100" aria-label="Back to feed">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 font-bold text-slate-600">
            {post.author?.name?.slice(0, 1).toUpperCase() || "R"}
          </div>
          <div>
            <div className="text-[15px] font-semibold leading-tight">{post.author?.name || "RoomKhoj User"}</div>
            <div className="mt-0.5 text-[12px] font-medium text-slate-500">{new Date(post.createdAt).toLocaleString()}</div>
          </div>
        </header>

        {post.content && (
          <p className="whitespace-pre-wrap px-4 py-3 text-[16px] leading-[1.35] text-slate-950">{post.content}</p>
        )}

        {post.mediaUrls?.length > 0 && (
          <div className={post.mediaUrls.length > 1 ? "grid grid-cols-2 gap-0.5" : ""}>
            {post.mediaUrls.slice(0, 4).map((url, index) =>
              post.mediaTypes?.[index] === "VIDEO" ? (
                <video key={url} src={media(url)} controls className="max-h-[680px] w-full bg-black object-contain" />
              ) : (
                <img key={url} src={media(url)} alt="Post" className="max-h-[680px] w-full object-cover" />
              ),
            )}
          </div>
        )}

        <div className="flex items-center justify-between px-4 py-2 text-xs text-slate-500">
          <span>{post.likeCount ? `${post.likeCount} reactions` : ""}</span>
          <span>{post.commentCount || 0} comments · {post.shareCount || 0} shares</span>
        </div>

        <div className="grid grid-cols-3 border-t px-2 py-1 text-sm font-semibold text-slate-600">
          <Link href={`/feed?post=${post.id}`} className="flex items-center justify-center gap-2 rounded py-2 hover:bg-slate-100">
            <Heart className="h-5 w-5" /> Like
          </Link>
          <Link href={`/feed?post=${post.id}`} className="flex items-center justify-center gap-2 rounded py-2 hover:bg-slate-100">
            <MessageCircle className="h-5 w-5" /> Comment
          </Link>
          <button
            type="button"
            onClick={async () => {
              const url = window.location.href;
              if (navigator.share) await navigator.share({ title: "RoomKhoj post", url });
              else await navigator.clipboard.writeText(url);
            }}
            className="flex items-center justify-center gap-2 rounded py-2 hover:bg-slate-100"
          >
            <Share2 className="h-5 w-5" /> Share
          </button>
        </div>
      </article>
    </main>
  );
}
