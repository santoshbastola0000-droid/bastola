"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  BadgeCheck,
  BriefcaseBusiness,
  FileText,
  GraduationCap,
  Loader2,
  MapPin,
  MessageCircle,
  Search,
  SlidersHorizontal,
  UserRound,
  WalletCards,
} from "lucide-react";

import { NavBar } from "@/components/common/navbar";
import Footer from "@/components/common/footer";
import { candidateProfileService } from "@/http/services/candidate-profile.service";
import { candidateCategories } from "@/components/jobs/candidates/candidate-config";

export default function CandidatesPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");

  const { data: candidates = [], isLoading, error } = useQuery({
    queryKey: ["public-candidates", category, location, search],
    queryFn: () =>
      candidateProfileService.getPublic({
        category: category || undefined,
        location: location || undefined,
        jobTitle: search || undefined,
      }),
  });

  const resultLabel = useMemo(() => {
    if (isLoading) return "Searching candidates...";
    return `${candidates.length} candidate${candidates.length === 1 ? "" : "s"} found`;
  }, [candidates.length, isLoading]);

  return (
    <>
      <NavBar />

      <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 px-4 pb-20 pt-24">
        <div className="mx-auto max-w-6xl">
          <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.07)]">
            <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-red-950 px-5 py-8 text-white sm:px-8 sm:py-10">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-sm font-bold text-red-100">
                    <BadgeCheck className="h-4 w-4" />
                    Employer Candidate Search
                  </div>
                  <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
                    Find the right employee
                  </h1>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                    Filter uploaded CV profiles by profession, category and preferred location. Open a profile to review skills, experience, salary expectation and contact options.
                  </p>
                </div>

                <Link
                  href="/jobs/candidates/create"
                  className="inline-flex min-h-12 w-fit items-center gap-2 rounded-2xl bg-red-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-red-950/20 transition hover:bg-red-500"
                >
                  <FileText className="h-5 w-5" />
                  Add Candidate / Upload CV
                </Link>
              </div>
            </div>

            <div className="p-4 sm:p-6">
              <div className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-700">
                <SlidersHorizontal className="h-4 w-4 text-red-600" />
                Filter candidates
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Profession, e.g. Waiter"
                    className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-sm outline-none transition focus:border-red-400 focus:bg-white focus:ring-4 focus:ring-red-50"
                  />
                </div>

                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="h-14 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-red-400 focus:bg-white focus:ring-4 focus:ring-red-50"
                >
                  <option value="">All categories</option>
                  {candidateCategories.map((item) => (
                    <option key={item.key} value={item.key}>{item.label}</option>
                  ))}
                </select>

                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Preferred location"
                    className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-sm outline-none transition focus:border-red-400 focus:bg-white focus:ring-4 focus:ring-red-50"
                  />
                </div>
              </div>

              <p className="mt-4 text-sm font-semibold text-slate-500">{resultLabel}</p>
            </div>
          </section>

          {isLoading && (
            <div className="flex min-h-[300px] items-center justify-center">
              <Loader2 className="h-7 w-7 animate-spin text-red-600" />
            </div>
          )}

          {error && (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
              Candidates load गर्न सकिएन।
            </div>
          )}

          {!isLoading && !error && candidates.length === 0 && (
            <div className="mt-6 rounded-[24px] border border-slate-200 bg-white px-5 py-14 text-center shadow-sm">
              <UserRound className="mx-auto h-11 w-11 text-slate-300" />
              <h2 className="mt-4 text-lg font-bold text-slate-900">No candidates found</h2>
              <p className="mt-1 text-sm text-slate-500">Try another category, profession or location.</p>
            </div>
          )}

          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {candidates.map((candidate: any) => {
              const hasCv = Boolean(candidate.hasCv || candidate.cv || candidate.cvUrl);
              return (
                <article
                  key={`${candidate.id}-${candidate.jobProfileId}`}
                  className="group flex min-h-[390px] flex-col overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_10px_34px_rgba(15,23,42,0.07)] transition duration-200 hover:-translate-y-1 hover:border-red-200 hover:shadow-[0_18px_44px_rgba(15,23,42,0.11)]"
                >
                  <div className="h-1.5 bg-gradient-to-r from-red-600 via-rose-500 to-orange-400" />
                  <div className="flex flex-1 flex-col p-5">
                    <div className="flex items-start gap-3">
                      <div className="flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl bg-slate-100 ring-1 ring-slate-200">
                        <UserRound className="h-6 w-6 text-slate-700" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h2 className="truncate text-lg font-extrabold text-slate-950">
                          {candidate.fullName || "Candidate"}
                        </h2>
                        <p className="mt-0.5 truncate text-sm font-bold capitalize text-red-600">
                          {candidate.jobTitle || "Job Candidate"}
                        </p>
                      </div>
                      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">Available</span>
                    </div>

                    <div className="mt-5 space-y-3 text-sm text-slate-600">
                      <p className="flex items-start gap-2">
                        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                        <span>{candidate.preferredJobLocation || candidate.currentLocation || "Location not specified"}</span>
                      </p>
                      <p className="flex items-start gap-2">
                        <BriefcaseBusiness className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                        <span>{candidate.isFresher ? "Fresher" : candidate.experienceMonths ? `${candidate.experienceMonths} months experience` : "Experience not specified"}</span>
                      </p>
                      {candidate.education && (
                        <p className="flex items-start gap-2">
                          <GraduationCap className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                          <span>{candidate.education}</span>
                        </p>
                      )}
                      {candidate.expectedSalary && (
                        <p className="flex items-start gap-2 font-bold text-slate-900">
                          <WalletCards className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                          <span>Rs. {Number(candidate.expectedSalary).toLocaleString()} expected</span>
                        </p>
                      )}
                    </div>

                    {candidate.skills?.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {candidate.skills.slice(0, 4).map((skill: string) => (
                          <span key={skill} className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-600">
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="mt-auto pt-5">
                      {hasCv && (
                        <div className="mb-3 inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                          <FileText className="h-3.5 w-3.5" /> CV uploaded
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-2">
                        <Link
                          href={`/jobs/candidates/${candidate.id}`}
                          className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm font-bold text-slate-800 transition hover:bg-slate-50"
                        >
                          View Profile
                        </Link>
                        <Link
                          href={`/jobs/candidates/${candidate.id}#contact-candidate`}
                          className="flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-3 py-3 text-sm font-bold text-white transition group-hover:bg-red-600"
                        >
                          <MessageCircle className="h-4 w-4" />
                          Message
                        </Link>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
