import type { Metadata } from "next";
import Link from "next/link";

const baseUrl = "https://www.roomkhoj.com";
const backendUrl = String(
  process.env.NEXT_PUBLIC_BACKEND_URL || "https://api.roomkhoj.com",
).replace(/\/$/, "");

type SeoIndex = {
  hashtags: Array<{ tag: string; count: number }>;
};

export const metadata: Metadata = {
  title: "Popular Hashtags | RoomKhoj Nepal",
  description:
    "Browse popular RoomKhoj hashtags across public rooms, jobs and community posts in Nepal.",
  alternates: { canonical: `${baseUrl}/hashtags` },
};

async function getHashtags() {
  try {
    const response = await fetch(`${backendUrl}/public/social/seo-index`, {
      next: { revalidate: 1800 },
    });
    if (!response.ok) return [];
    const data = (await response.json()) as SeoIndex;
    return Array.isArray(data.hashtags) ? data.hashtags : [];
  } catch {
    return [];
  }
}

export default async function HashtagsPage() {
  const hashtags = await getHashtags();

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <section className="mx-auto max-w-4xl rounded-3xl border bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-3xl font-black tracking-tight text-slate-950">
          Popular RoomKhoj Hashtags
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          Explore frequently used public hashtags across rooms, jobs and community posts.
          Only established tags are listed here to reduce duplicate and spam pages.
        </p>

        {hashtags.length ? (
          <div className="mt-6 flex flex-wrap gap-2">
            {hashtags.map(({ tag, count }) => (
              <Link
                key={tag}
                href={`/hashtag/${encodeURIComponent(tag)}`}
                className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-800 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700"
              >
                #{tag} <span className="font-medium text-slate-400">· {count}</span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="mt-6 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
            Popular hashtags will appear here after enough public content uses them.
          </p>
        )}
      </section>
    </main>
  );
}
