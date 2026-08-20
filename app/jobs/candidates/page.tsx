"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  BriefcaseBusiness,
  Loader2,
  MapPin,
  Search,
  UserRound,
} from "lucide-react";

import { NavBar } from "@/components/common/navbar";
import Footer from "@/components/common/footer";
import { candidateProfileService } from "@/http/services/candidate-profile.service";
import { candidateCategories } from "@/components/jobs/candidates/candidate-config";

export default function CandidatesPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");

  const {
    data: candidates = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: [
      "public-candidates",
      category,
      location,
      search,
    ],
    queryFn: () =>
      candidateProfileService.getPublic({
        category: category || undefined,
        location: location || undefined,
        jobTitle: search || undefined,
      }),
  });

  return (
    <>
      <NavBar />

      <main className="min-h-screen bg-slate-50 px-4 pb-16 pt-24">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-red-600">
                RoomKhoj Jobs
              </p>

              <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
                Find Candidates
              </h1>

              <p className="mt-2 max-w-xl text-sm text-slate-600">
                Search candidates by profession, category and location.
              </p>
            </div>

            <Link
              href="/jobs/candidates/create"
              className="inline-flex w-fit items-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white"
            >
              <UserRound className="h-4 w-4" />
              Create Job Profile
            </Link>
          </div>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="grid gap-3 md:grid-cols-3">
              <div className="relative">
                <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />

                <input
                  value={search}
                  onChange={(e) =>
                    setSearch(e.target.value)
                  }
                  placeholder="Job title, e.g. Waiter"
                  className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-3 text-sm outline-none focus:border-red-400"
                />
              </div>

              <select
                value={category}
                onChange={(e) =>
                  setCategory(e.target.value)
                }
                className="rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-red-400"
              >
                <option value="">
                  All categories
                </option>

                {candidateCategories.map((item) => (
                  <option
                    key={item.key}
                    value={item.key}
                  >
                    {item.label}
                  </option>
                ))}
              </select>

              <div className="relative">
                <MapPin className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />

                <input
                  value={location}
                  onChange={(e) =>
                    setLocation(e.target.value)
                  }
                  placeholder="Location"
                  className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-3 text-sm outline-none focus:border-red-400"
                />
              </div>
            </div>
          </div>

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

          {!isLoading &&
            !error &&
            candidates.length === 0 && (
              <div className="mt-6 rounded-2xl border border-slate-200 bg-white px-5 py-12 text-center">
                <UserRound className="mx-auto h-10 w-10 text-slate-300" />

                <h2 className="mt-4 font-bold text-slate-900">
                  No candidates found
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Try another category, profession or location.
                </p>
              </div>
            )}

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {candidates.map((candidate: any) => (
              <article
                key={`${candidate.id}-${candidate.jobProfileId}`}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100">
                    <UserRound className="h-5 w-5 text-slate-600" />
                  </div>

                  <div className="min-w-0">
                    <h2 className="truncate font-bold text-slate-900">
                      {candidate.fullName ||
                        "Candidate"}
                    </h2>

                    <p className="mt-0.5 text-sm font-medium text-red-600">
                      {candidate.jobTitle}
                    </p>
                  </div>
                </div>

                <div className="mt-4 space-y-2 text-sm text-slate-600">
                  <p className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 shrink-0" />
                    {candidate.preferredJobLocation ||
                      candidate.currentLocation ||
                      "Location not specified"}
                  </p>

                  <p className="flex items-center gap-2">
                    <BriefcaseBusiness className="h-4 w-4 shrink-0" />

                    {candidate.isFresher
                      ? "Fresher"
                      : candidate.experienceMonths
                        ? `${candidate.experienceMonths} months experience`
                        : "Experience not specified"}
                  </p>
                </div>

                {candidate.skills?.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {candidate.skills
                      .slice(0, 4)
                      .map((skill: string) => (
                        <span
                          key={skill}
                          className="rounded-lg bg-slate-100 px-2 py-1 text-xs text-slate-600"
                        >
                          {skill}
                        </span>
                      ))}
                  </div>
                )}

                {candidate.expectedSalary && (
                  <p className="mt-4 text-sm">
                    <span className="text-slate-500">
                      Expected:
                    </span>{" "}
                    <span className="font-semibold text-slate-900">
                      Rs.{" "}
                      {Number(
                        candidate.expectedSalary,
                      ).toLocaleString()}
                    </span>
                  </p>
                )}

                <Link
                  href={`/jobs/candidates/${candidate.id}`}
                  className="mt-5 flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white"
                >
                  View Profile
                </Link>
              </article>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
