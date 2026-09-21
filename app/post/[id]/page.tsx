import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Heart, MessageCircle } from "lucide-react";

import { HashtagText } from "@/components/social/HashtagText";
import { PostShareButton } from "@/components/social/PostShareButton";

const baseUrl = "https://www.roomkhoj.com";
const backendUrl = String(
  process.env.NEXT_PUBLIC_BACKEND_URL || "https://api.roomkhoj.com",
).replace(/\/$/, "");

type PublicPost = {
  id: string;
  userId: string;
  content?: string | null;
  mediaUrls: string[];
  mediaTypes: Array<"IMAGE" | "VIDEO">;
  visibility: "PUBLIC";
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    name: string;
    profilePhotoUrl?: string | null;
    isVerified?: boolean;
    isMonetized?: boolean;
  };
  likeCount: number;
  commentCount: number;
  shareCount: number;
  hashtags?: string[];
};

function media(value?: string | null) {
  const raw = String(value || "");
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  return `${backendUrl}${raw.startsWith("/") ? raw : `/${raw}`}`;
}

function streamVideoPoster(value?: string | null) {
  const resolved = media(value);
  if (!/\.m3u8(?:$|\?)/i.test(resolved)) return "";
  return resolved.replace(
    /\/manifest\/video\.m3u8(?:\?.*)?$/i,
    "/thumbnails/thumbnail.jpg?time=1s&height=720",
  );
}

function plainText(value?: string | null) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim();
}

async function getPost(id: string): Promise<PublicPost | null> {
  try {
    const response = await fetch(
      `${backendUrl}/public/social/posts/${encodeURIComponent(id)}`,
      { next: { revalidate: 300 } },
    );
    if (!response.ok) return null;
    return (await response.json()) as PublicPost;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const post = await getPost(id);
  if (!post) {
    return {
      title: "Post not found | RoomKhoj",
      robots: { index: false, follow: false },
    };
  }

  const text = plainText(post.content);
  const titleBase = text || `Post by ${post.author?.name || "RoomKhoj User"}`;
  const title =
    titleBase.length > 68 ? `${titleBase.slice(0, 65)}...` : titleBase;
  const description = text
    ? text.slice(0, 155)
    : "View this public RoomKhoj post.";
  const canonical = `${baseUrl}/post/${post.id}`;
  const firstImageIndex = post.mediaTypes.findIndex((type) => type === "IMAGE");
  const firstImage =
    firstImageIndex >= 0 ? media(post.mediaUrls?.[firstImageIndex]) : "";
  const meaningfulText = text
    .replace(/#[A-Za-z0-9_\u0900-\u097F]{2,50}/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const hashtagCount = post.hashtags?.length || 0;
  const shouldIndex = meaningfulText.length >= 20 && hashtagCount <= 12;

  return {
    title: `${title} | RoomKhoj`,
    description,
    alternates: { canonical },
    robots: {
      index: shouldIndex,
      follow: true,
    },
    openGraph: {
      type: "article",
      url: canonical,
      siteName: "RoomKhoj",
      title,
      description,
      ...(firstImage ? { images: [{ url: firstImage }] } : {}),
    },
    twitter: {
      card: firstImage ? "summary_large_image" : "summary",
      title,
      description,
      ...(firstImage ? { images: [firstImage] } : {}),
    },
  };
}

export default async function SocialPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const post = await getPost(id);
  if (!post) notFound();

  const canonical = `${baseUrl}/post/${post.id}`;
  const schema = {
    "@context": "https://schema.org",
    "@type": "SocialMediaPosting",
    headline: plainText(post.content).slice(0, 110) || "RoomKhoj public post",
    datePublished: post.createdAt,
    dateModified: post.updatedAt,
    url: canonical,
    author: {
      "@type": "Person",
      name: post.author?.name || "RoomKhoj User",
      ...(post.author?.id
        ? { url: `${baseUrl}/profile/${post.author.id}` }
        : {}),
    },
    ...(post.mediaUrls?.length
      ? {
          associatedMedia: post.mediaUrls.slice(0, 4).map((url, index) => ({
            "@type": post.mediaTypes?.[index] === "VIDEO" ? "VideoObject" : "ImageObject",
            contentUrl: media(url),
          })),
        }
      : {}),
  };

  return (
    <main className="min-h-screen bg-[#f0f2f5] px-0 py-3 sm:px-3">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />

      <article className="mx-auto max-w-[680px] overflow-hidden bg-white shadow-sm sm:rounded-2xl sm:border">
        <header className="flex items-center gap-3 border-b px-4 py-3">
          <Link
            href="/feed"
            className="rounded-full p-2 hover:bg-slate-100"
            aria-label="Back to feed"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>

          {media(post.author?.profilePhotoUrl) ? (
            <img
              src={media(post.author?.profilePhotoUrl)}
              alt={post.author?.name || "Profile"}
              className="h-10 w-10 shrink-0 rounded-full border border-slate-200 bg-slate-100 object-cover"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 font-bold text-slate-600">
              {post.author?.name?.slice(0, 1).toUpperCase() || "R"}
            </div>
          )}

          <div>
            <div className="text-[15px] font-semibold leading-tight">
              {post.author?.name || "RoomKhoj User"}
            </div>
            <time
              dateTime={post.createdAt}
              className="mt-0.5 block text-[12px] font-medium text-slate-500"
            >
              {new Date(post.createdAt).toLocaleString("en-NP")}
            </time>
          </div>
        </header>

        {post.content && (
          <p className="whitespace-pre-wrap px-4 py-3 text-[16px] leading-[1.45] text-slate-950">
            <HashtagText text={post.content} />
          </p>
        )}

        {post.mediaUrls?.length > 0 && (
          <div className={post.mediaUrls.length > 1 ? "grid grid-cols-2 gap-0.5" : ""}>
            {post.mediaUrls.slice(0, 4).map((url, index) =>
              post.mediaTypes?.[index] === "VIDEO" ? (
                <video
                  key={url}
                  src={media(url)}
                  poster={streamVideoPoster(url) || undefined}
                  controls
                  playsInline
                  preload="metadata"
                  className="max-h-[680px] w-full bg-black object-contain"
                />
              ) : (
                <img
                  key={url}
                  src={media(url)}
                  alt={plainText(post.content).slice(0, 80) || "RoomKhoj post"}
                  loading="lazy"
                  className="max-h-[680px] w-full object-cover"
                />
              ),
            )}
          </div>
        )}

        <div className="flex items-center justify-between px-4 py-2 text-xs text-slate-500">
          <span>{post.likeCount ? `${post.likeCount} reactions` : ""}</span>
          <span>
            {post.commentCount || 0} comments · {post.shareCount || 0} shares
          </span>
        </div>

        <div className="grid grid-cols-3 border-t px-2 py-1 text-sm font-semibold text-slate-600">
          <Link
            href={`/feed?post=${post.id}`}
            className="flex items-center justify-center gap-2 rounded py-2 hover:bg-slate-100"
          >
            <Heart className="h-5 w-5" /> Like
          </Link>
          <Link
            href={`/feed?post=${post.id}`}
            className="flex items-center justify-center gap-2 rounded py-2 hover:bg-slate-100"
          >
            <MessageCircle className="h-5 w-5" /> Comment
          </Link>
          <PostShareButton title={plainText(post.content).slice(0, 80) || "RoomKhoj post"} />
        </div>
      </article>
    </main>
  );
}
