"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useMutation } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

import { NavBar } from "@/components/common/navbar";
import Footer from "@/components/common/footer";
import {
  jobPostingService,
  type JobPostingInput,
} from "@/http/services/job-posting.service";

type FormState = {
  companyName: string;
  jobTitle: string;
  category: string;
  location: string;
  salary: string;
  experience: string;
  requiredEducation: string;
  requiredSkills: string;
  description: string;
  applicationDeadline: string;
  contactPhone: string;
};

const initialForm: FormState = {
  companyName: "",
  jobTitle: "",
  category: "",
  location: "",
  salary: "",
  experience: "",
  requiredEducation: "",
  requiredSkills: "",
  description: "",
  applicationDeadline: "",
  contactPhone: "",
};

const steps = [
  {
    key: "jobTitle",
    title: "What position are you hiring for?",
    subtitle: "Example: Waiter, Accountant, Driver, Receptionist",
  },
  {
    key: "companyName",
    title: "What is your company or business name?",
    subtitle: "Enter the employer/company name",
  },
  {
    key: "category",
    title: "Which category does this job belong to?",
    subtitle: "Example: Hotel & Hospitality, Sales, Office, Driver",
  },
  {
    key: "location",
    title: "Where is the job located?",
    subtitle: "Example: Lakeside, Pokhara",
  },
  {
    key: "salary",
    title: "What salary are you offering?",
    subtitle: "Enter monthly salary in NPR",
  },
  {
    key: "experience",
    title: "How much experience is required?",
    subtitle: "Example: Fresher accepted, 1 year, 2 years preferred",
  },
  {
    key: "requiredEducation",
    title: "What education or qualification is required?",
    subtitle: "Example: SEE, +2, Bachelor, Not required",
  },
  {
    key: "requiredSkills",
    title: "What skills should the candidate have?",
    subtitle: "Separate skills with commas",
  },
  {
    key: "description",
    title: "Tell candidates about the job",
    subtitle: "Add duties, shift, benefits or other important details",
  },
  {
    key: "applicationDeadline",
    title: "What is the application deadline?",
    subtitle: "Optional",
  },
  {
    key: "contactPhone",
    title: "What phone number should candidates contact?",
    subtitle: "This will be shown on the approved vacancy",
  },
] as const;

export default function PostVacancyPage() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(initialForm);
  const [submitted, setSubmitted] = useState(false);

  const current = steps[step];
  const isPreview = step === steps.length;

  const mutation = useMutation({
    mutationFn: (payload: JobPostingInput) =>
      jobPostingService.createPublic(payload),

    onSuccess: () => {
      setSubmitted(true);
      toast.success("Vacancy submitted for approval");
    },

    onError: (err: any) => {
      toast.error(
        err?.response?.data?.message ||
          "Could not submit vacancy",
      );
    },
  });

  const canContinue = useMemo(() => {
    if (isPreview) return true;

    const key = current.key;

    if (key === "category") return true;
    if (key === "requiredEducation") return true;
    if (key === "requiredSkills") return true;
    if (key === "description") return true;
    if (key === "applicationDeadline") return true;

    return String(form[key] || "").trim().length > 0;
  }, [current, form, isPreview]);

  const updateField = (value: string) => {
    if (isPreview) return;

    setForm((prev) => ({
      ...prev,
      [current.key]: value,
    }));
  };

  const next = () => {
    if (!canContinue) {
      toast.error("Please answer this question");
      return;
    }

    setStep((s) => Math.min(s + 1, steps.length));
  };

  const back = () => {
    setStep((s) => Math.max(s - 1, 0));
  };

  const submit = () => {
    if (!form.jobTitle.trim()) {
      toast.error("Job title is required");
      return;
    }

    if (!form.location.trim()) {
      toast.error("Location is required");
      return;
    }

    if (!form.contactPhone.trim()) {
      toast.error("Contact phone is required");
      return;
    }

    const payload: JobPostingInput = {
      userId: "public-employer",
      companyName: form.companyName.trim() || undefined,
      jobTitle: form.jobTitle.trim(),
      category: form.category.trim() || undefined,
      location: form.location.trim(),

      salary: form.salary
        ? Number(form.salary)
        : null,

      experience:
        form.experience.trim() || undefined,

      requiredEducation:
        form.requiredEducation.trim() || undefined,

      requiredSkills: form.requiredSkills
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean),

      description:
        form.description.trim() || undefined,

      applicationDeadline:
        form.applicationDeadline || null,

      contactPhone: form.contactPhone.trim(),

      status: "PENDING",
    };

    mutation.mutate(payload);
  };

  if (submitted) {
    return (
      <>
        <NavBar />

        <main className="min-h-screen bg-slate-50 px-4 pb-20 pt-32">
          <div className="mx-auto max-w-2xl rounded-3xl border border-emerald-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            </div>

            <h1 className="mt-6 text-3xl font-bold text-slate-900">
              Vacancy Submitted
            </h1>

            <p className="mt-3 text-slate-600">
              Your vacancy has been submitted successfully and is waiting for admin approval.
            </p>

            <p className="mt-2 text-sm text-slate-500">
              It will appear publicly on RoomKhoj Jobs after approval.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/jobs"
                className="rounded-xl bg-slate-900 px-6 py-3 font-semibold text-white"
              >
                View Jobs
              </Link>

              <button
                onClick={() => {
                  setSubmitted(false);
                  setStep(0);
                  setForm(initialForm);
                }}
                className="rounded-xl border border-slate-200 px-6 py-3 font-semibold text-slate-700"
              >
                Post Another Vacancy
              </button>
            </div>
          </div>
        </main>

        <Footer />
      </>
    );
  }

  return (
    <>
      <NavBar />

      <main className="min-h-screen bg-slate-50 px-4 pb-20 pt-28">
        <div className="mx-auto max-w-3xl">
          <div className="mb-6">
            <Link
              href="/jobs"
              className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Jobs
            </Link>
          </div>

          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 bg-slate-900 px-6 py-6 text-white md:px-8">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-600">
                  <BriefcaseBusiness className="h-6 w-6" />
                </div>

                <div>
                  <h1 className="text-2xl font-bold">
                    Post a Vacancy
                  </h1>

                  <p className="text-sm text-slate-300">
                    Vacancy will be reviewed before going live.
                  </p>
                </div>
              </div>
            </div>

            <div className="px-6 py-7 md:px-8 md:py-9">
              <div className="mb-7">
                <div className="mb-2 flex justify-between text-xs font-semibold text-slate-500">
                  <span>
                    {isPreview
                      ? "Preview"
                      : `Step ${step + 1} of ${steps.length}`}
                  </span>

                  <span>
                    {Math.round(
                      (Math.min(step, steps.length) /
                        steps.length) *
                        100,
                    )}
                    %
                  </span>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full bg-red-600 transition-all"
                    style={{
                      width: `${
                        (Math.min(step, steps.length) /
                          steps.length) *
                        100
                      }%`,
                    }}
                  />
                </div>
              </div>

              {!isPreview ? (
                <>
                  <h2 className="text-2xl font-bold text-slate-900">
                    {current.title}
                  </h2>

                  <p className="mt-2 text-slate-500">
                    {current.subtitle}
                  </p>

                  <div className="mt-7">
                    {current.key === "description" ? (
                      <textarea
                        autoFocus
                        rows={6}
                        value={form.description}
                        onChange={(e) =>
                          updateField(e.target.value)
                        }
                        className="w-full rounded-2xl border border-slate-200 p-4 outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-100"
                        placeholder="Write job description..."
                      />
                    ) : current.key ===
                      "applicationDeadline" ? (
                      <input
                        autoFocus
                        type="date"
                        value={form.applicationDeadline}
                        onChange={(e) =>
                          updateField(e.target.value)
                        }
                        className="w-full rounded-2xl border border-slate-200 p-4 outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-100"
                      />
                    ) : current.key === "salary" ? (
                      <input
                        autoFocus
                        type="number"
                        min="0"
                        value={form.salary}
                        onChange={(e) =>
                          updateField(e.target.value)
                        }
                        placeholder="Example: 20000"
                        className="w-full rounded-2xl border border-slate-200 p-4 text-lg outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-100"
                      />
                    ) : (
                      <input
                        autoFocus
                        value={form[current.key]}
                        onChange={(e) =>
                          updateField(e.target.value)
                        }
                        onKeyDown={(e) => {
                          if (
                            e.key === "Enter" &&
                            canContinue
                          ) {
                            next();
                          }
                        }}
                        className="w-full rounded-2xl border border-slate-200 p-4 text-lg outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-100"
                        placeholder={current.subtitle}
                      />
                    )}
                  </div>
                </>
              ) : (
                <>
                  <h2 className="text-2xl font-bold text-slate-900">
                    Review your vacancy
                  </h2>

                  <p className="mt-2 text-slate-500">
                    Please check the information before submitting.
                  </p>

                  <div className="mt-7 space-y-4 rounded-2xl bg-slate-50 p-5">
                    {[
                      ["Job title", form.jobTitle],
                      ["Company", form.companyName],
                      ["Category", form.category],
                      ["Location", form.location],
                      [
                        "Salary",
                        form.salary
                          ? `रु ${Number(
                              form.salary,
                            ).toLocaleString()}`
                          : "",
                      ],
                      ["Experience", form.experience],
                      [
                        "Education",
                        form.requiredEducation,
                      ],
                      ["Skills", form.requiredSkills],
                      ["Description", form.description],
                      [
                        "Deadline",
                        form.applicationDeadline,
                      ],
                      ["Contact phone", form.contactPhone],
                    ].map(([label, value]) => (
                      <div
                        key={label}
                        className="border-b border-slate-200 pb-3 last:border-0 last:pb-0"
                      >
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                          {label}
                        </p>

                        <p className="mt-1 font-medium text-slate-800">
                          {value || "Not specified"}
                        </p>
                      </div>
                    ))}
                  </div>
                </>
              )}

              <div className="mt-8 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={back}
                  disabled={step === 0}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-5 py-3 font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </button>

                {!isPreview ? (
                  <button
                    type="button"
                    onClick={next}
                    disabled={!canContinue}
                    className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-6 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Continue
                    <ArrowRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={submit}
                    disabled={mutation.isPending}
                    className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-6 py-3 font-semibold text-white disabled:opacity-50"
                  >
                    {mutation.isPending && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}

                    Submit for Approval
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
