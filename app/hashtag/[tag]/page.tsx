import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { HashtagText } from "@/components/social/HashtagText";

const baseUrl = "https://www.roomkhoj.com";
const backendUrl = String(
  process.env.NEXT_PUBLIC_BACKEND_URL || "https://api.roomkhoj.com",
).replace(/\/$/, "");

type HashtagPost = {
  id: string;
  content?: string | null;
  mediaUrls: string[];
  mediaTypes: Array<"IMAGE" | "VIDEO">;
  createdAt: string;
  author: {
    id: string;
    name: string;
    profilePhotoUrl?: string | null;
  };
  likeCount: number;
  commentCount: number;
  shareCount: number;
};

type HashtagResult = {
  tag: string;
  total: number;
  posts: HashtagPost[];
};

function normalizeTag(value: string) {
  const decoded = (() => {
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  })();

  return decoded
    .replace(/^#+/, "")
    .normalize("NFKC")
    .toLowerCase();
}

function media(value?: string | null) {
  const raw = String(value || "");
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  return `${backendUrl}${raw.startsWith("/") ? raw : `/${raw}`}`;
}

async function getHashtag(tag: string): Promise<HashtagResult | null> {
  const clean = normalizeTag(tag);
  if (!/^[a-z0-9_\u0900-\u097f]{2,50}$/i.test(clean)) return null;

  try {
    const response = await fetch(
      `${backendUrl}/public/social/hashtags/${encodeURIComponent(clean)}?limit=30`,
      { next: { revalidate: 300 } },
    );
    if (!response.ok) return null;
    return (await response.json()) as HashtagResult;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tag: string }>;
}): Promise<Metadata> {
  const { tag: rawTag } = await params;
  const tag = normalizeTag(rawTag);
  const data = await getHashtag(tag);
  const canonical = `${baseUrl}/hashtag/${encodeURIComponent(tag)}`;
  const title = `#${tag} posts | RoomKhoj Nepal`;
  const description = `Explore public RoomKhoj posts using #${tag}. Find related rooms, jobs and local updates from RoomKhoj users in Nepal.`;

  return {
    title,
    description,
    alternates: { canonical },
    robots: {
      // Avoid filling Google with thin one-off user tags.
      index: Boolean(data && data.total >= 3),
      follow: true,
    },
    openGraph: {
      type: "website",
      url: canonical,
      siteName: "RoomKhoj",
      title,
      description,
    },
  };
}

export default async function HashtagPage({
  params,
}: {
  params: Promise<{ tag: string }>;
}) {
  const { tag: rawTag } = await params;
  const tag = normalizeTag(rawTag);
  const data = await getHashtag(tag);
  if (!data) notFound();

  return (
    <main className="min-h-screen bg-slate-50 px-3 py-6">
      <div className="mx-auto max-w-3xl">
        <nav className="mb-4 text-sm text-slate-600" aria-label="Breadcrumb">
          <Link href="/" className="font-semibold hover:underline">
            RoomKhoj
          </Link>
          <span className="px-2">/</span>
          <span>#{data.tag}</span>
        </nav>

        <section className="mb-5 rounded-2xl border bg-white p-5 shadow-sm">
          <h1 className="text-2xl font-extrabold text-slate-950">#{data.tag}</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Public RoomKhoj posts using #{data.tag}. Hashtags make related public
            posts easier to browse and help search engines understand the topic.
          </p>
          <div className="mt-4 flex flex-wrap gap-2 text-sm font-semibold">
            <Link href="/rooms" className="rounded-full border px-3 py-1.5 hover:bg-slate-50">
              Browse rooms
            </Link>
            <Link href="/jobs" className="rounded-full border px-3 py-1.5 hover:bg-slate-50">
              Browse jobs
            </Link>
            <Link href="/feed" className="rounded-full border px-3 py-1.5 hover:bg-slate-50">
              Open feed
            </Link>
          </div>
        </section>

        {data.posts.length === 0 ? (
          <div className="rounded-2xl border bg-white p-6 text-sm text-slate-600">
            No public posts found for #{data.tag}.
          </div>
        ) : (
          <div className="space-y-4">
            {data.posts.map((post) => {
              const imageIndex = post.mediaTypes?.findIndex((type) => type === "IMAGE");
              const imageUrl =
                imageIndex >= 0 ? media(post.mediaUrls?.[imageIndex]) : "";

              return (
                <article key={post.id} className="overflow-hidden rounded-2xl border bg-white shadow-sm">
                  <div className="p-4">
                    <div className="flex items-center gap-3">
                      {media(post.author?.profilePhotoUrl) ? (
                        <img
                          src={media(post.author.profilePhotoUrl)}
                          alt={post.author?.name || "RoomKhoj user"}
                          className="h-10 w-10 rounded-full border object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 font-bold">
                          {post.author?.name?.slice(0, 1).toUpperCase() || "R"}
                        </div>
                      )}
                      <div>
                        <div className="font-semibold text-slate-900">
                          {post.author?.name || "RoomKhoj User"}
                        </div>
                        <time dateTime={post.createdAt} className="text-xs text-slate-500">
                          {new Date(post.createdAt).toLocaleDateString("en-NP")}
                        </time>
                      </div>
                    </div>

                    {post.content && (
                      <p className="mt-3 whitespace-pre-wrap text-[15px] leading-6 text-slate-800">
                        <HashtagText text={post.content} />
                      </p>
                    )}
                  </div>

                  {imageUrl && (
                    <Link href={`/post/${post.id}`} aria-label="Open post">
                      <img
                        src={imageUrl}
                        alt={String(post.content || `#${data.tag} RoomKhoj post`).slice(0, 90)}
                        className="max-h-[480px] w-full object-cover"
                        loading="lazy"
                      />
                    </Link>
                  )}

                  <div className="flex items-center justify-between border-t px-4 py-3 text-xs text-slate-500">
                    <span>
                      {post.likeCount || 0} reactions · {post.commentCount || 0} comments
                    </span>
                    <Link href={`/post/${post.id}`} className="font-bold text-slate-800 hover:underline">
                      View post
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
