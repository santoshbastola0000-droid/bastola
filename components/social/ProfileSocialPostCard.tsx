"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { MoreHorizontal } from "lucide-react";
import { toast } from "sonner";

import {
  type SocialPost,
  socialService,
} from "@/http/services/social.service";
import { PostReactions } from "@/components/social/PostReactions";
import { CommentThread } from "@/components/social/CommentThread";

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

function ago(value: string) {
  const minutes = Math.max(
    0,
    Math.floor((Date.now() - new Date(value).getTime()) / 60000),
  );
  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return days < 7 ? `${days}d` : new Date(value).toLocaleDateString();
}

function PostAvatar({ post }: { post: SocialPost }) {
  const photo = media(post.author?.profilePhotoUrl);
  const initial = String(post.author?.name || "R").slice(0, 1).toUpperCase();
  const [failed, setFailed] = useState(false);

  if (photo && !failed) {
    return (
      <img
        src={photo}
        alt={post.author?.name || "Profile"}
        className="h-10 w-10 shrink-0 rounded-full border border-slate-200 bg-slate-100 object-cover"
        loading="lazy"
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-200 text-[13px] font-bold text-slate-600">
      {initial}
    </div>
  );
}

function ProfilePostMedia({ post }: { post: SocialPost }) {
  const [active, setActive] = useState(0);
  const scroller = useRef<HTMLDivElement>(null);
  const allImages =
    post.mediaUrls.length > 1 &&
    post.mediaTypes.every((type) => type === "IMAGE");

  if (!post.mediaUrls.length) return null;

  if (!allImages) {
    return (
      <div
        className={
          post.mediaUrls.length > 1
            ? "grid grid-cols-2 gap-0.5 bg-black"
            : "bg-black"
        }
      >
        {post.mediaUrls.slice(0, 4).map((url, index) =>
          post.mediaTypes[index] === "VIDEO" ? (
            <video
              key={`${url}-${index}`}
              src={media(url)}
              controls
              preload="metadata"
              className="max-h-[640px] w-full object-contain"
            />
          ) : (
            <img
              key={`${url}-${index}`}
              src={media(url)}
              alt="Post"
              loading="lazy"
              decoding="async"
              className="max-h-[760px] w-full object-contain"
            />
          ),
        )}
      </div>
    );
  }

  return (
    <div className="relative bg-black">
      <div
        ref={scroller}
        onScroll={(event) => {
          const el = event.currentTarget;
          const width = el.clientWidth || 1;
          setActive(
            Math.max(
              0,
              Math.min(
                post.mediaUrls.length - 1,
                Math.round(el.scrollLeft / width),
              ),
            ),
          );
        }}
        className="flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {post.mediaUrls.map((url, index) => (
          <div
            key={`${url}-${index}`}
            className="w-full shrink-0 snap-center"
          >
            <img
              src={media(url)}
              alt={`Post photo ${index + 1}`}
              loading="lazy"
              decoding="async"
              className="max-h-[760px] w-full object-contain"
            />
          </div>
        ))}
      </div>

      <div className="absolute right-3 top-3 rounded-full bg-black/60 px-2.5 py-1 text-xs font-bold text-white">
        {active + 1}/{post.mediaUrls.length}
      </div>

      <div className="pointer-events-none absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
        {post.mediaUrls.map((_, index) => (
          <span
            key={index}
            className={`h-1.5 w-1.5 rounded-full ${
              index === active ? "bg-white" : "bg-white/45"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

export function ProfileSocialPostCard({
  post,
  currentUserId,
  currentUserPhotoUrl,
  onChanged,
}: {
  post: SocialPost;
  currentUserId: string;
  currentUserPhotoUrl?: string | null;
  onChanged: () => void | Promise<void>;
}) {
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [postMenu, setPostMenu] = useState(false);
  const own = String(post.author?.id || post.userId) === String(currentUserId);

  const share = async () => {
    const url = `${window.location.origin}/post/${post.id}`;
    const native = typeof navigator.share === "function";

    if (native) {
      await navigator.share({
        title: "RoomKhoj post",
        url,
      });
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Post link copied");
    }

    await socialService.registerShare(
      post.id,
      native ? "native" : "copy-link",
    );
  };

  return (
    <article className="overflow-hidden border-y bg-white font-sans text-slate-950 shadow-sm sm:rounded-xl sm:border">
      <header className="relative flex items-center gap-2.5 px-3 pb-2 pt-3">
        <Link href={`/profile/${post.author?.id || post.userId}`}>
          <PostAvatar post={post} />
        </Link>

        <div className="min-w-0 flex-1">
          <Link
            href={`/profile/${post.author?.id || post.userId}`}
            className="block truncate text-[15px] font-semibold leading-tight"
          >
            {post.author?.name || "RoomKhoj user"}
          </Link>
          <div className="mt-0.5 text-[12px] font-medium leading-tight text-slate-500">
            {ago(post.createdAt)} ·{" "}
            {post.visibility === "FRIENDS"
              ? "Friends"
              : post.visibility === "GROUP"
                ? "Group"
                : "Public"}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setPostMenu((value) => !value)}
          className="rounded-full p-2 hover:bg-slate-100"
          aria-label="Post actions"
        >
          <MoreHorizontal className="h-5 w-5" />
        </button>

        {postMenu && (
          <div className="absolute right-3 top-12 z-30 w-48 rounded-xl border bg-white p-1 shadow-xl">
            {own ? (
              <>
                <button
                  type="button"
                  className="block w-full rounded-lg px-3 py-2 text-left text-[13px] font-semibold text-slate-700 hover:bg-slate-100"
                  onClick={async () => {
                    const value = window.prompt(
                      "Edit post",
                      post.content || "",
                    );
                    if (value === null) return;
                    await socialService.updatePost(post.id, {
                      content: value,
                    });
                    setPostMenu(false);
                    await onChanged();
                  }}
                >
                  Edit post
                </button>
                <button
                  type="button"
                  className="block w-full rounded-lg px-3 py-2 text-left text-[13px] font-semibold text-red-600 hover:bg-slate-100"
                  onClick={async () => {
                    if (!window.confirm("Delete this post?")) return;
                    await socialService.deletePost(post.id);
                    setPostMenu(false);
                    await onChanged();
                  }}
                >
                  Delete post
                </button>
              </>
            ) : (
              <button
                type="button"
                className="block w-full rounded-lg px-3 py-2 text-left text-[13px] font-semibold text-red-600 hover:bg-slate-100"
                onClick={async () => {
                  const reason = window.prompt(
                    "Why are you reporting this post?",
                  );
                  if (!reason?.trim()) return;
                  await socialService.report({
                    targetType: "POST",
                    targetId: post.id,
                    reason: reason.trim(),
                  });
                  setPostMenu(false);
                  toast.success("Report submitted");
                }}
              >
                Report post
              </button>
            )}
          </div>
        )}
      </header>

      {post.content && (
        <p className="whitespace-pre-wrap px-3 pb-3 text-[16px] font-normal leading-[1.35] text-slate-950">
          {post.content}
        </p>
      )}

      <ProfilePostMedia post={post} />

      <PostReactions
        postId={post.id}
        currentUserId={currentUserId}
        initialLikeCount={Number(post.likeCount || 0)}
        initialLiked={Boolean(post.likedByMe)}
        commentCount={Number(post.commentCount || 0)}
        shareCount={Number(post.shareCount || 0)}
        onToggleComments={() => setCommentsOpen((value) => !value)}
        onShare={share}
      />

      {commentsOpen && (
        <CommentThread
          postId={post.id}
          currentUserId={currentUserId}
          currentUserPhotoUrl={currentUserPhotoUrl}
        />
      )}
    </article>
  );
}
