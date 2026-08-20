"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  BriefcaseBusiness,
  Loader2,
  MapPin,
  Search,
  UserRound,
} from "lucide-react";

import { candidateProfileService } from "@/http/services/candidate-profile.service";
import { candidateCategories } from "@/components/jobs/candidates/candidate-config";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function AdminCandidatesPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("ALL");
  const [availability, setAvailability] = useState("ALL");

  const {
    data: candidates = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["admin-candidates"],
    queryFn: () =>
      candidateProfileService.getAdminCandidates(),
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return candidates.filter((candidate: any) => {
      if (
        status !== "ALL" &&
        candidate.status !== status
      ) {
        return false;
      }

      if (
        availability === "AVAILABLE" &&
        !candidate.isAvailable
      ) {
        return false;
      }

      if (
        availability === "NOT_AVAILABLE" &&
        candidate.isAvailable
      ) {
        return false;
      }

      const jobs =
        Array.isArray(candidate.jobProfiles)
          ? candidate.jobProfiles
          : [];

      if (
        category &&
        !jobs.some(
          (job: any) =>
            job.category === category,
        )
      ) {
        return false;
      }

      if (!q) return true;

      return [
        candidate.fullName,
        candidate.phone,
        candidate.currentLocation,
        candidate.preferredJobLocation,
        candidate.education,
        ...jobs.flatMap((job: any) => [
          job.jobTitle,
          job.category,
          ...(job.skills || []),
        ]),
      ]
        .filter(Boolean)
        .some((value) =>
          String(value).toLowerCase().includes(q),
        );
    });
  }, [
    candidates,
    search,
    category,
    status,
    availability,
  ]);

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-red-600">
          Candidates load गर्न सकिएन।
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          Candidates
        </h1>

        <p className="mt-1 text-sm text-muted-foreground">
          Candidate profiles, professions and availability manage गर्नुहोस्।
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <div className="relative md:col-span-2">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />

          <Input
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            placeholder="Search candidate, job, skill or location"
            className="pl-9"
          />
        </div>

        <select
          value={category}
          onChange={(e) =>
            setCategory(e.target.value)
          }
          className="rounded-md border bg-background px-3 py-2 text-sm"
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

        <select
          value={status}
          onChange={(e) =>
            setStatus(e.target.value)
          }
          className="rounded-md border bg-background px-3 py-2 text-sm"
        >
          <option value="ALL">
            All status
          </option>
          <option value="DRAFT">
            Draft
          </option>
          <option value="ACTIVE">
            Active
          </option>
          <option value="PAUSED">
            Paused
          </option>
          <option value="HIRED">
            Hired
          </option>
        </select>
      </div>

      <div className="flex gap-2">
        {[
          ["ALL", "All"],
          ["AVAILABLE", "Available"],
          ["NOT_AVAILABLE", "Not Available"],
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() =>
              setAvailability(value)
            }
            className={`rounded-full px-4 py-2 text-sm font-medium ${
              availability === value
                ? "bg-slate-900 text-white"
                : "border bg-white text-slate-600"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="text-sm text-muted-foreground">
        {filtered.length} candidate(s)
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center text-muted-foreground">
            No candidates found.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {filtered.map((candidate: any) => {
            const jobs =
              candidate.jobProfiles || [];

            const primaryJob =
              jobs[0] || null;

            return (
              <Card key={candidate.id}>
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-muted">
                      <UserRound className="h-5 w-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <h2 className="font-bold">
                            {candidate.fullName ||
                              "Unnamed Candidate"}
                          </h2>

                          <p className="mt-1 text-sm font-medium text-red-600">
                            {primaryJob?.jobTitle ||
                              "No job profile"}
                          </p>
                        </div>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            candidate.status ===
                            "ACTIVE"
                              ? "bg-emerald-100 text-emerald-700"
                              : candidate.status ===
                                  "HIRED"
                                ? "bg-blue-100 text-blue-700"
                                : candidate.status ===
                                    "PAUSED"
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {candidate.status}
                        </span>
                      </div>

                      <div className="mt-4 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                        <p className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          {candidate.preferredJobLocation ||
                            candidate.currentLocation ||
                            "Location not specified"}
                        </p>

                        <p className="flex items-center gap-2">
                          <BriefcaseBusiness className="h-4 w-4" />

                          {primaryJob?.isFresher
                            ? "Fresher"
                            : primaryJob?.experienceMonths
                              ? `${primaryJob.experienceMonths} months`
                              : "Experience not specified"}
                        </p>
                      </div>

                      {primaryJob?.expectedSalary && (
                        <p className="mt-3 text-sm">
                          Expected Salary:{" "}
                          <span className="font-semibold">
                            Rs.{" "}
                            {Number(
                              primaryJob.expectedSalary,
                            ).toLocaleString()}
                          </span>
                        </p>
                      )}

                      {primaryJob?.skills?.length >
                        0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {primaryJob.skills
                            .slice(0, 5)
                            .map(
                              (skill: string) => (
                                <span
                                  key={skill}
                                  className="rounded-md bg-muted px-2 py-1 text-xs"
                                >
                                  {skill}
                                </span>
                              ),
                            )}
                        </div>
                      )}

                      <div className="mt-4 flex flex-wrap gap-2">
                        <Link
                          href={`/jobs/candidates/${candidate.id}`}
                          className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white"
                        >
                          View Profile
                        </Link>

                        <Link
                          href={`/admin/dashboard/candidate-contacts?candidate=${candidate.id}`}
                          className="rounded-lg border px-4 py-2 text-xs font-semibold"
                        >
                          Contact History
                        </Link>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
