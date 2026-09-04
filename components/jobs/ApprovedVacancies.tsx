"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BriefcaseBusiness,
  Building2,
  Loader2,
  MapPin,
  Search,
  UserRound,
  UsersRound,
  WalletCards,
  ArrowUpRight,
  BadgeCheck,
} from "lucide-react";

import {
  jobPostingService,
  type JobPosting,
} from "@/http/services/job-posting.service";

function formatSalary(job: JobPosting) {
  if (job.salaryNegotiable) return "Negotiable";
  if (job.salaryMin && job.salaryMax) {
    return `रु ${job.salaryMin.toLocaleString()} - रु ${job.salaryMax.toLocaleString()}`;
  }
  if (job.salary) return `रु ${job.salary.toLocaleString()}`;
  return "Salary not specified";
}

function jobSlug(job: JobPosting) {
  const title = job.jobTitle
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${job.id}-${title || "vacancy"}`;
}

export default function ApprovedVacancies({
  defaultSearch = "",
  defaultLocation = "",
}: {
  defaultSearch?: string;
  defaultLocation?: string;
}) {
  const [search, setSearch] = useState(defaultSearch);
  const [location, setLocation] = useState(defaultLocation);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shareCode = params.get("share");
    const jobId = params.get("job");
    if (!shareCode || !jobId) return;

    try {
      const owned = JSON.parse(
        localStorage.getItem("roomkhoj_owned_share_codes") || "[]",
      ) as string[];
      if (owned.includes(shareCode)) return;

      const key = "roomkhoj_browser_id";
      let browserId = localStorage.getItem(key);
      if (!browserId) {
        browserId = crypto.randomUUID();
        localStorage.setItem(key, browserId);
      }

      jobPostingService.recordOpen(jobId, shareCode, browserId).catch(() => undefined);
    } catch {
      // Shared job pages should remain usable if storage is unavailable.
    }
  }, []);

  const { data: jobs = [], isLoading, error } = useQuery({
    queryKey: ["public-approved-vacancies"],
    queryFn: () => jobPostingService.getApproved(),
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const l = location.trim().toLowerCase();

    return jobs.filter((job) => {
      const matchesSearch =
        !q ||
        [job.jobTitle, job.companyName, job.category, job.description, job.experience]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(q));
      const matchesLocation =
        !l || String(job.location || "").toLowerCase().includes(l);
      return matchesSearch && matchesLocation;
    });
  }, [jobs, search, location]);

  return (
    <section id="latest-vacancies" className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
      <div className="rounded-[28px] border border-slate-200 bg-gradient-to-br from-white via-white to-red-50/50 p-5 shadow-sm sm:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1.5 text-sm font-bold text-red-600">
              <BadgeCheck className="h-4 w-4" />
              RoomKhoj Jobs
            </div>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
              Jobs & Employees in one place
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
              Job seekers can find verified vacancies. Employers can browse CV profiles, filter candidates and contact suitable employees.
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-3 lg:min-w-[560px]">
            <a
              href="/jobs/candidates"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800"
            >
              <UsersRound className="h-5 w-5" />
              Find Employees
            </a>
            <a
              href="/jobs/candidates/create"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-red-200 bg-white px-4 py-3 text-sm font-bold text-red-700 transition hover:bg-red-50"
            >
              <UserRound className="h-5 w-5" />
              Upload CV
            </a>
            <a
              href="/jobs/post"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-red-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-red-700"
            >
              <BriefcaseBusiness className="h-5 w-5" />
              Post Vacancy
            </a>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <p className="font-semibold text-red-600">Latest vacancies</p>
        <h3 className="mt-1 text-2xl font-extrabold text-slate-950 sm:text-3xl">Available Jobs in Nepal</h3>
        <p className="mt-1 text-sm text-slate-500">Admin-approved job opportunities only.</p>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-2">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search job title or company"
            className="h-14 w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-4 text-[15px] outline-none transition focus:border-red-400 focus:ring-4 focus:ring-red-50"
          />
        </div>
        <div className="relative">
          <MapPin className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Location e.g. Pokhara"
            className="h-14 w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-4 text-[15px] outline-none transition focus:border-red-400 focus:ring-4 focus:ring-red-50"
          />
        </div>
      </div>

      {isLoading && (
        <div className="flex min-h-[240px] items-center justify-center">
          <Loader2 className="h-7 w-7 animate-spin text-red-600" />
        </div>
      )}

      {error && (
        <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
          Vacancies load गर्न सकिएन।
        </div>
      )}

      {!isLoading && !error && filtered.length === 0 && (
        <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-10 text-center text-slate-600">
          Matching vacancy भेटिएन।
        </div>
      )}

      {!isLoading && !error && filtered.length > 0 && (
        <div className="mt-7 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((job) => (
            <article
              key={job.id}
              className="group flex min-h-[360px] flex-col overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.06)] transition duration-200 hover:-translate-y-1 hover:border-red-200 hover:shadow-[0_16px_38px_rgba(15,23,42,0.10)]"
            >
              <div className="h-1.5 bg-gradient-to-r from-red-600 via-rose-500 to-orange-400" />
              <div className="flex flex-1 flex-col p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 ring-1 ring-red-100">
                    <BriefcaseBusiness className="h-6 w-6 text-red-600" />
                  </div>
                  {job.jobCode && (
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">#{job.jobCode}</span>
                  )}
                </div>

                <h3 className="mt-5 text-xl font-extrabold capitalize text-slate-950">{job.jobTitle}</h3>
                <div className="mt-3 space-y-2.5 text-sm text-slate-600">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 shrink-0 text-slate-400" />
                    <span className="truncate">{job.companyName || "Company not specified"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 shrink-0 text-slate-400" />
                    <span>{job.location || "Location not specified"}</span>
                  </div>
                  <div className="flex items-center gap-2 font-bold text-slate-900">
                    <WalletCards className="h-4 w-4 shrink-0 text-red-600" />
                    {formatSalary(job)}
                  </div>
                </div>

                {job.experience && (
                  <div className="mt-4 inline-flex w-fit rounded-lg bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600">
                    Experience: {job.experience}
                  </div>
                )}

                {job.description && (
                  <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-600">{job.description}</p>
                )}

                <div className="mt-auto pt-5">
                  <a
                    href={`/job/${jobSlug(job)}`}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-bold text-white transition group-hover:bg-red-600"
                  >
                    View Job
                    <ArrowUpRight className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
