"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  BriefcaseBusiness,
  CheckCircle2,
  Loader2,
  MapPin,
  MessageCircle,
  Phone,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";

import { NavBar } from "@/components/common/navbar";
import Footer from "@/components/common/footer";
import { candidateProfileService } from "@/http/services/candidate-profile.service";

export default function CandidateDetailPage() {
  const params = useParams();
  const id = String(params.id);

  const [contact, setContact] = useState<{
    phone?: string | null;
  } | null>(null);

  const {
    data: candidate,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["candidate-profile", id],
    queryFn: () =>
      candidateProfileService.getPublicOne(id),
    enabled: Boolean(id),
  });

  const contactMutation = useMutation({
    mutationFn: (
      action:
        | "VIEW_CONTACT"
        | "CALL"
        | "WHATSAPP",
    ) =>
      candidateProfileService.revealContact(
        id,
        { action },
      ),

    onSuccess: (data, action) => {
      setContact(data);

      if (
        action === "CALL" &&
        data?.phone
      ) {
        window.location.href =
          `tel:${data.phone}`;
      }

      if (
        action === "WHATSAPP" &&
        data?.phone
      ) {
        const digits = String(data.phone)
          .replace(/\D/g, "")
          .replace(/^0/, "");

        const number =
          digits.startsWith("977")
            ? digits
            : `977${digits}`;

        window.open(
          `https://wa.me/${number}`,
          "_blank",
          "noopener,noreferrer",
        );
      }
    },

    onError: (err: any) => {
      toast.error(
        err?.response?.data?.message ||
          "Contact उपलब्ध भएन",
      );
    },
  });

  if (isLoading) {
    return (
      <>
        <NavBar />
        <main className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-7 w-7 animate-spin" />
        </main>
      </>
    );
  }

  if (error || !candidate) {
    return (
      <>
        <NavBar />

        <main className="min-h-screen bg-slate-50 px-4 pt-28">
          <div className="mx-auto max-w-xl rounded-2xl border bg-white p-6 text-center">
            Candidate profile उपलब्ध छैन।
          </div>
        </main>
      </>
    );
  }

  const primaryJob = candidate.jobs?.[0];

  return (
    <>
      <NavBar />

      <main className="min-h-screen bg-slate-50 px-4 pb-16 pt-24">
        <div className="mx-auto max-w-2xl">
          <Link
            href="/jobs/candidates"
            className="inline-flex items-center gap-2 text-sm text-slate-600"
          >
            <ArrowLeft className="h-4 w-4" />
            Candidates
          </Link>

          <section className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-5">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-slate-100">
                  <UserRound className="h-6 w-6 text-slate-600" />
                </div>

                <div>
                  <h1 className="text-xl font-bold text-slate-900">
                    {candidate.fullName ||
                      "Candidate"}
                  </h1>

                  <p className="mt-1 font-semibold text-red-600">
                    {primaryJob?.jobTitle ||
                      "Job Candidate"}
                  </p>

                  <p className="mt-2 flex items-center gap-1.5 text-sm text-slate-500">
                    <MapPin className="h-4 w-4" />
                    {candidate.preferredJobLocation ||
                      candidate.currentLocation ||
                      "Location not specified"}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-6 p-5">
              {primaryJob && (
                <div>
                  <h2 className="font-bold text-slate-900">
                    Work Profile
                  </h2>

                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <Info
                      label="Category"
                      value={
                        primaryJob.category ||
                        "Not specified"
                      }
                    />

                    <Info
                      label="Experience"
                      value={
                        primaryJob.isFresher
                          ? "Fresher"
                          : primaryJob.experienceMonths
                            ? `${primaryJob.experienceMonths} months`
                            : "Not specified"
                      }
                    />

                    <Info
                      label="Expected Salary"
                      value={
                        primaryJob.expectedSalary
                          ? `Rs. ${Number(
                              primaryJob.expectedSalary,
                            ).toLocaleString()}`
                          : "Not specified"
                      }
                    />

                    <Info
                      label="Education"
                      value={
                        candidate.education ||
                        "Not specified"
                      }
                    />
                  </div>
                </div>
              )}

              {primaryJob?.skills?.length > 0 && (
                <div>
                  <h2 className="font-bold text-slate-900">
                    Skills
                  </h2>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {primaryJob.skills.map(
                      (skill: string) => (
                        <span
                          key={skill}
                          className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm text-slate-700"
                        >
                          {skill}
                        </span>
                      ),
                    )}
                  </div>
                </div>
              )}

              {candidate.joiningAvailability && (
                <div>
                  <h2 className="font-bold text-slate-900">
                    Availability
                  </h2>

                  <p className="mt-2 text-sm text-slate-600">
                    {candidate.joiningAvailability}
                  </p>
                </div>
              )}

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-2">
                  <BriefcaseBusiness className="h-5 w-5 text-slate-700" />

                  <h2 className="font-bold text-slate-900">
                    Contact Candidate
                  </h2>
                </div>

                {!contact?.phone ? (
                  <>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Contact information is hidden for privacy.
                      Reveal it only if you are interested in this candidate.
                    </p>

                    <button
                      type="button"
                      disabled={contactMutation.isPending}
                      onClick={() =>
                        contactMutation.mutate(
                          "VIEW_CONTACT",
                        )
                      }
                      className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
                    >
                      {contactMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Phone className="h-4 w-4" />
                      )}

                      Reveal Contact
                    </button>
                  </>
                ) : (
                  <>
                    <div className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-emerald-700">
                      <CheckCircle2 className="h-5 w-5" />

                      <span className="font-semibold">
                        {contact.phone}
                      </span>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          contactMutation.mutate(
                            "CALL",
                          )
                        }
                        className="flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-3 py-3 text-sm font-semibold text-white"
                      >
                        <Phone className="h-4 w-4" />
                        Call
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          contactMutation.mutate(
                            "WHATSAPP",
                          )
                        }
                        className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-semibold text-slate-800"
                      >
                        <MessageCircle className="h-4 w-4" />
                        WhatsApp
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </>
  );
}

function Info({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <p className="text-xs text-slate-500">
        {label}
      </p>

      <p className="mt-1 text-sm font-semibold text-slate-800">
        {value}
      </p>
    </div>
  );
}
