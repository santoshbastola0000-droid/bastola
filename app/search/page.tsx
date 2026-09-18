"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { BriefcaseBusiness, Building2, Loader2, Search, UserRound, Wrench } from "lucide-react";
import { NavBar } from "@/components/common/navbar";
import { socialService, type GlobalSearchResult } from "@/http/services/social.service";

const backendUrl = String(
  process.env.NEXT_PUBLIC_BACKEND_URL || "https://api.roomkhoj.com",
).replace(/\/$/, "");

function media(value?: string | null) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  return `${backendUrl}${raw.startsWith("/") ? raw : `/${raw}`}`;
}

export default function SearchPage() {
  const params = useSearchParams();
  const router = useRouter();
  const initial = String(params.get("q") || "");
  const [query, setQuery] = useState(initial);
  const [loading, setLoading] = useState(Boolean(initial.trim()));
  const [result, setResult] = useState<GlobalSearchResult | null>(null);

  useEffect(() => {
    setQuery(initial);
    const q = initial.trim();
    if (q.length < 2) {
      setResult(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    socialService
      .search(q, 20)
      .then((data) => {
        if (!cancelled) setResult(data);
      })
      .catch(() => {
        if (!cancelled) setResult(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [initial]);

  const total = useMemo(() => {
    if (!result) return 0;
    return (
      result.users.length +
      result.posts.length +
      result.rooms.length +
      result.jobs.length +
      result.services.length
    );
  }, [result]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const q = query.trim();
    if (q.length < 2) return;
    router.push(`/search?q=${encodeURIComponent(q)}`);
  };

  return (
    <>
      <NavBar />
      <main className="min-h-screen bg-slate-50 pt-20">
        <div className="mx-auto max-w-5xl px-4 pb-16 sm:px-6">
          <form onSubmit={submit} className="sticky top-16 z-30 mb-6 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
            <div className="flex items-center gap-2 rounded-xl bg-slate-100 px-3">
              <Search className="h-5 w-5 text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search users, posts, rooms, jobs and services"
                className="min-w-0 flex-1 bg-transparent py-3 text-[15px] outline-none"
              />
              <button
                type="submit"
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white"
              >
                Search
              </button>
            </div>
          </form>

          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="h-7 w-7 animate-spin text-red-600" /></div>
          ) : initial.trim().length < 2 ? (
            <div className="rounded-2xl border bg-white p-8 text-center text-slate-500">
              Search by user name, post text, room location/title, job or service.
            </div>
          ) : !result || total === 0 ? (
            <div className="rounded-2xl border bg-white p-8 text-center text-slate-500">
              No results found for <b>{initial}</b>.
            </div>
          ) : (
            <div className="space-y-6">
              {result.users.length > 0 && (
                <Section title="People" icon={<UserRound className="h-5 w-5" />}>
                  {result.users.map((user) => {
                    const photo = media(user.profilePhotoUrl);
                    return (
                      <Link key={user.id} href={user.href} className="flex items-center gap-3 rounded-xl px-3 py-3 hover:bg-slate-50">
                        {photo ? (
                          <img src={photo} alt={user.name} className="h-11 w-11 rounded-full object-cover" />
                        ) : (
                          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-200 text-sm font-bold text-slate-600">
                            {user.name.slice(0, 1).toUpperCase()}
                          </div>
                        )}
                        <div className="font-semibold text-slate-950">{user.name}</div>
                      </Link>
                    );
                  })}
                </Section>
              )}

              {result.posts.length > 0 && (
                <Section title="Posts" icon={<Search className="h-5 w-5" />}>
                  {result.posts.map((post) => (
                    <Link key={post.id} href={post.href} className="block rounded-xl px-3 py-3 hover:bg-slate-50">
                      <div className="text-sm font-semibold text-slate-900">{post.author?.name || "RoomKhoj user"}</div>
                      <div className="mt-1 line-clamp-2 text-sm text-slate-600">{post.content || "Media post"}</div>
                    </Link>
                  ))}
                </Section>
              )}

              {result.rooms.length > 0 && (
                <Section title="Rooms" icon={<Building2 className="h-5 w-5" />}>
                  {result.rooms.map((room) => (
                    <Link key={room.id} href={room.href} className="flex gap-3 rounded-xl px-3 py-3 hover:bg-slate-50">
                      {room.images?.[0] ? (
                        <img src={media(room.images[0])} alt={room.title} className="h-16 w-20 rounded-lg object-cover" />
                      ) : (
                        <div className="h-16 w-20 rounded-lg bg-slate-100" />
                      )}
                      <div className="min-w-0">
                        <div className="truncate font-semibold text-slate-950">{room.title}</div>
                        <div className="truncate text-sm text-slate-500">{room.address}</div>
                        <div className="mt-1 text-sm font-bold text-red-600">रु {Number(room.price || 0).toLocaleString("en-NP")}</div>
                      </div>
                    </Link>
                  ))}
                </Section>
              )}

              {result.jobs.length > 0 && (
                <Section title="Jobs" icon={<BriefcaseBusiness className="h-5 w-5" />}>
                  {result.jobs.map((job) => (
                    <Link key={job.id} href={job.href} className="block rounded-xl px-3 py-3 hover:bg-slate-50">
                      <div className="font-semibold text-slate-950">{job.title}</div>
                      <div className="mt-1 text-sm text-slate-500">{job.companyName || "Employer"} · {job.location}</div>
                    </Link>
                  ))}
                </Section>
              )}

              {result.services.length > 0 && (
                <Section title="Services" icon={<Wrench className="h-5 w-5" />}>
                  {result.services.map((service) => (
                    <Link key={service.key} href={service.href} className="block rounded-xl px-3 py-3 hover:bg-slate-50">
                      <div className="font-semibold text-slate-950">{service.title}</div>
                      <div className="mt-1 text-sm text-slate-500">{service.body}</div>
                    </Link>
                  ))}
                </Section>
              )}
            </div>
          )}
        </div>
      </main>
    </>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b px-4 py-3 text-sm font-black text-slate-950">
        {icon}
        <span>{title}</span>
      </div>
      <div className="divide-y divide-slate-100">{children}</div>
    </section>
  );
}
