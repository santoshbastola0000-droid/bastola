"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  BriefcaseBusiness,
  Building2,
  Loader2,
  MapPin,
  Search,
  WalletCards,
} from "lucide-react";

import {
  jobPostingService,
  type JobPosting,
} from "@/http/services/job-posting.service";

function formatSalary(job: JobPosting) {
  if (job.salaryNegotiable) {
    return "Negotiable";
  }

  if (job.salaryMin && job.salaryMax) {
    return `रु ${job.salaryMin.toLocaleString()} - ${job.salaryMax.toLocaleString()}`;
  }

  if (job.salary) {
    return `रु ${job.salary.toLocaleString()}`;
  }

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
  const [search, setSearch] =
    useState(defaultSearch);
  const [location, setLocation] =
    useState(defaultLocation);
  const searchParams = useSearchParams();

  useEffect(() => {
    const shareCode = searchParams.get("share");
    const jobId = searchParams.get("job");

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

      jobPostingService
        .recordOpen(jobId, shareCode, browserId)
        .catch(() => undefined);
    } catch {
      // A shared-list page must still work when browser storage is unavailable.
    }
  }, [searchParams]);

  const {
    data: jobs = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["public-approved-vacancies"],
    queryFn: () => jobPostingService.getApproved(),
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const l = location.trim().toLowerCase();

    return jobs.filter((job) => {
      const matchesSearch =
        !q ||
        [
          job.jobTitle,
          job.companyName,
          job.category,
          job.description,
          job.experience,
        ]
          .filter(Boolean)
          .some((value) =>
            String(value).toLowerCase().includes(q),
          );

      const matchesLocation =
        !l ||
        String(job.location || "")
          .toLowerCase()
          .includes(l);

      return matchesSearch && matchesLocation;
    });
  }, [jobs, search, location]);

  return (
    <section
      id="latest-vacancies"
      className="mx-auto max-w-6xl px-4 py-16"
    >
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-semibold text-red-600">
            Latest vacancies
          </p>

          <h2 className="mt-2 text-3xl font-bold text-slate-900">
            Available Jobs in Nepal
          </h2>

          <p className="mt-2 text-slate-600">
            Admin-approved vacancies only.
          </p>
        </div>

        <a
          href="/jobs/post"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 font-semibold text-white transition hover:bg-red-700"
        >
          <BriefcaseBusiness className="h-5 w-5" />
          Post a Vacancy
        </a>
      </div>

      <div className="mt-8 grid gap-3 md:grid-cols-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search job title or company"
            className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-100"
          />
        </div>

        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Location e.g. Pokhara"
            className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-100"
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
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-600">
          Matching vacancy भेटिएन।
        </div>
      )}

      {!isLoading && !error && filtered.length > 0 && (
        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((job) => (
            <article
              key={job.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50">
                  <BriefcaseBusiness className="h-6 w-6 text-red-600" />
                </div>

                {job.jobCode && (
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                    #{job.jobCode}
                  </span>
                )}
              </div>

              <h3 className="mt-5 text-xl font-bold text-slate-900">
                {job.jobTitle}
              </h3>

              <div className="mt-2 flex items-center gap-2 text-sm text-slate-600">
                <Building2 className="h-4 w-4" />
                {job.companyName || "Company not specified"}
              </div>

              <div className="mt-2 flex items-center gap-2 text-sm text-slate-600">
                <MapPin className="h-4 w-4" />
                {job.location}
              </div>

              <div className="mt-2 flex items-center gap-2 text-sm font-semibold text-slate-800">
                <WalletCards className="h-4 w-4 text-red-600" />
                {formatSalary(job)}
              </div>

              {job.experience && (
                <p className="mt-3 text-sm text-slate-600">
                  Experience: {job.experience}
                </p>
              )}

              {job.description && (
                <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">
                  {job.description}
                </p>
              )}

              <div className="mt-5 border-t border-slate-100 pt-4">
                <a
                  href={`/job/${jobSlug(job)}`}
                  className="inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 font-semibold text-white transition hover:bg-black"
                >
                  Contact Employee
                </a>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
