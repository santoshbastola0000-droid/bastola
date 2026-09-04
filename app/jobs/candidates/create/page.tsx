"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useMutation } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  FileText,
  Loader2,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";

import { NavBar } from "@/components/common/navbar";
import Footer from "@/components/common/footer";

import {
  candidateCategories,
  getRolesForCategory,
} from "@/components/jobs/candidates/candidate-config";

import { candidateProfileService } from "@/http/services/candidate-profile.service";

type FormState = {
  category: string;
  categoryOther: string;

  jobTitle: string;
  jobTitleOther: string;

  isFresher: boolean | null;
  experienceMonths: string;

  skills: string;
  skillsOther: string;

  education: string;
  expectedSalary: string;

  currentLocation: string;
  preferredJobLocation: string;

  joiningAvailability: string;

  fullName: string;
  phone: string;

  consentToEmployerSearch: boolean;
  extraInfo: string;
};

const initialForm: FormState = {
  category: "",
  categoryOther: "",

  jobTitle: "",
  jobTitleOther: "",

  isFresher: null,
  experienceMonths: "",

  skills: "",
  skillsOther: "",

  education: "",
  expectedSalary: "",

  currentLocation: "",
  preferredJobLocation: "",

  joiningAvailability: "",

  fullName: "",
  phone: "",

  consentToEmployerSearch: false,
  extraInfo: "",
};

const totalSteps = 10;

export default function CreateCandidateProfilePage() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(initialForm);
  const [submitted, setSubmitted] = useState(false);
  const [cvFile, setCvFile] = useState<File | null>(null);

  const roles = useMemo(
    () => getRolesForCategory(form.category),
    [form.category],
  );

  const selectedCategory =
    form.category === "OTHER"
      ? form.categoryOther.trim()
      : form.category;

  const selectedJobTitle =
    form.jobTitle === "Other / Not listed"
      ? form.jobTitleOther.trim()
      : form.jobTitle;

  const mutation = useMutation({
    mutationFn: () =>
      candidateProfileService.createPublic({
        profile: {
          fullName: form.fullName.trim(),
          phone: form.phone.trim(),
          currentLocation:
            form.currentLocation.trim() || null,
          preferredJobLocation:
            form.preferredJobLocation.trim() || null,
          education:
            form.education.trim() || null,
          joiningAvailability:
            form.joiningAvailability.trim() || null,
          consentToEmployerSearch: true,
        },

        job: {
          jobTitle: selectedJobTitle,
          category: selectedCategory || null,

          isFresher:
            form.isFresher === true,

          experienceMonths:
            form.isFresher === true
              ? 0
              : form.experienceMonths
              ? Number(form.experienceMonths)
              : null,

          expectedSalary:
            form.expectedSalary
              ? Number(form.expectedSalary)
              : null,

          skills: [
            ...form.skills
              .split(",")
              .map((v) => v.trim())
              .filter(Boolean),

            ...form.skillsOther
              .split(",")
              .map((v) => v.trim())
              .filter(Boolean),
          ],

          jobSpecificAnswers: {
            otherCategory:
              form.categoryOther || null,

            otherJobTitle:
              form.jobTitleOther || null,

            extraInfo:
              form.extraInfo || null,
          },

          interviewCompleted: true,
          isActive: true,
        },
      }, cvFile),

    onSuccess: () => {
      setSubmitted(true);
      toast.success("Candidate profile published");
    },

    onError: (err: any) => {
      toast.error(
        err?.response?.data?.message ||
          "Could not create profile",
      );
    },
  });

  const canContinue = useMemo(() => {
    switch (step) {
      case 0:
        return Boolean(
          form.category &&
            (form.category !== "OTHER" ||
              form.categoryOther.trim()),
        );

      case 1:
        return Boolean(
          form.jobTitle &&
            (form.jobTitle !== "Other / Not listed" ||
              form.jobTitleOther.trim()),
        );

      case 2:
        return form.isFresher !== null;

      case 3:
        return (
          form.isFresher === true ||
          Boolean(form.experienceMonths)
        );

      case 4:
        return true;

      case 5:
        return true;

      case 6:
        return Boolean(form.currentLocation.trim());

      case 7:
        return Boolean(form.fullName.trim());

      case 8:
        return Boolean(form.phone.trim());

      case 9:
        return form.consentToEmployerSearch;

      default:
        return true;
    }
  }, [form, step]);

  const next = () => {
    if (!canContinue) {
      toast.error("Please complete this step");
      return;
    }

    setStep((s) => Math.min(s + 1, totalSteps));
  };

  const back = () => {
    setStep((s) => Math.max(s - 1, 0));
  };

  if (submitted) {
    return (
      <>
        <NavBar />

        <main className="min-h-screen bg-slate-50 px-4 pb-16 pt-28">
          <div className="mx-auto max-w-md rounded-2xl border bg-white p-6 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle2 className="h-7 w-7 text-emerald-600" />
            </div>

            <h1 className="mt-5 text-2xl font-bold text-slate-900">
              Profile Published
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Employers can now find your profile according to your job category,
              skills and location.
            </p>

            <Link
              href="/jobs/candidates"
              className="mt-6 inline-flex rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white"
            >
              View Candidates
            </Link>
          </div>
        </main>

        <Footer />
      </>
    );
  }

  return (
    <>
      <NavBar />

      <main className="min-h-screen bg-slate-50 px-4 pb-16 pt-24">
        <div className="mx-auto max-w-md">
          <Link
            href="/jobs"
            className="mb-4 inline-flex items-center gap-2 text-sm text-slate-600"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="bg-slate-900 px-5 py-5 text-white">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-600">
                  <UserRound className="h-5 w-5" />
                </div>

                <div>
                  <h1 className="text-lg font-bold">
                    Create Job Profile
                  </h1>

                  <p className="text-xs text-slate-300">
                    Step {Math.min(step + 1, totalSteps)} of {totalSteps}
                  </p>
                </div>
              </div>

              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/15">
                <div
                  className="h-full bg-red-500 transition-all"
                  style={{
                    width: `${Math.min(
                      (step / totalSteps) * 100,
                      100,
                    )}%`,
                  }}
                />
              </div>
            </div>

            <div className="p-5">
              {step === 0 && (
                <>
                  <h2 className="text-xl font-bold text-slate-900">
                    What type of job are you looking for?
                  </h2>

                  <div className="mt-5 grid gap-2">
                    {candidateCategories.map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() =>
                          setForm((p) => ({
                            ...p,
                            category: item.key,
                            jobTitle: "",
                          }))
                        }
                        className={`rounded-xl border px-4 py-3 text-left text-sm font-medium ${
                          form.category === item.key
                            ? "border-red-500 bg-red-50 text-red-700"
                            : "border-slate-200 text-slate-700"
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>

                  {form.category === "OTHER" && (
                    <input
                      value={form.categoryOther}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          categoryOther: e.target.value,
                        }))
                      }
                      placeholder="Please specify your field"
                      className="mt-3 w-full rounded-xl border border-slate-200 p-3 outline-none focus:border-red-400"
                    />
                  )}
                </>
              )}

              {step === 1 && (
                <>
                  <h2 className="text-xl font-bold text-slate-900">
                    Which role do you prefer?
                  </h2>

                  <div className="mt-5 grid grid-cols-2 gap-2">
                    {roles.map((role) => (
                      <button
                        key={role}
                        type="button"
                        onClick={() =>
                          setForm((p) => ({
                            ...p,
                            jobTitle: role,
                          }))
                        }
                        className={`rounded-xl border px-3 py-3 text-sm font-medium ${
                          form.jobTitle === role
                            ? "border-red-500 bg-red-50 text-red-700"
                            : "border-slate-200 text-slate-700"
                        }`}
                      >
                        {role}
                      </button>
                    ))}
                  </div>

                  {form.jobTitle === "Other / Not listed" && (
                    <input
                      value={form.jobTitleOther}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          jobTitleOther: e.target.value,
                        }))
                      }
                      placeholder="Write your profession"
                      className="mt-3 w-full rounded-xl border border-slate-200 p-3 outline-none focus:border-red-400"
                    />
                  )}
                </>
              )}

              {step === 2 && (
                <>
                  <h2 className="text-xl font-bold text-slate-900">
                    Do you have work experience?
                  </h2>

                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        setForm((p) => ({
                          ...p,
                          isFresher: false,
                        }))
                      }
                      className={`rounded-xl border p-4 font-semibold ${
                        form.isFresher === false
                          ? "border-red-500 bg-red-50 text-red-700"
                          : "border-slate-200"
                      }`}
                    >
                      Yes
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setForm((p) => ({
                          ...p,
                          isFresher: true,
                          experienceMonths: "",
                        }))
                      }
                      className={`rounded-xl border p-4 font-semibold ${
                        form.isFresher === true
                          ? "border-red-500 bg-red-50 text-red-700"
                          : "border-slate-200"
                      }`}
                    >
                      Fresher
                    </button>
                  </div>
                </>
              )}

              {step === 3 && (
                <>
                  <h2 className="text-xl font-bold text-slate-900">
                    Experience
                  </h2>

                  {form.isFresher ? (
                    <div className="mt-5 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700">
                      No experience required. Your profile will be marked as Fresher.
                    </div>
                  ) : (
                    <input
                      type="number"
                      min="0"
                      value={form.experienceMonths}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          experienceMonths: e.target.value,
                        }))
                      }
                      placeholder="Experience in months, e.g. 12"
                      className="mt-5 w-full rounded-xl border border-slate-200 p-3 outline-none focus:border-red-400"
                    />
                  )}
                </>
              )}

              {step === 4 && (
                <>
                  <h2 className="text-xl font-bold text-slate-900">
                    Skills
                  </h2>

                  <input
                    value={form.skills}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        skills: e.target.value,
                      }))
                    }
                    placeholder="Example: Excel, Customer Service"
                    className="mt-5 w-full rounded-xl border border-slate-200 p-3 outline-none focus:border-red-400"
                  />

                  <input
                    value={form.skillsOther}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        skillsOther: e.target.value,
                      }))
                    }
                    placeholder="Anything we missed? Optional"
                    className="mt-3 w-full rounded-xl border border-slate-200 p-3 outline-none focus:border-red-400"
                  />
                </>
              )}

              {step === 5 && (
                <>
                  <h2 className="text-xl font-bold text-slate-900">
                    Education & expected salary
                  </h2>

                  <input
                    value={form.education}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        education: e.target.value,
                      }))
                    }
                    placeholder="Education / qualification"
                    className="mt-5 w-full rounded-xl border border-slate-200 p-3 outline-none focus:border-red-400"
                  />

                  <input
                    type="number"
                    min="0"
                    value={form.expectedSalary}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        expectedSalary: e.target.value,
                      }))
                    }
                    placeholder="Expected monthly salary"
                    className="mt-3 w-full rounded-xl border border-slate-200 p-3 outline-none focus:border-red-400"
                  />
                </>
              )}

              {step === 6 && (
                <>
                  <h2 className="text-xl font-bold text-slate-900">
                    Where do you want to work?
                  </h2>

                  <input
                    value={form.currentLocation}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        currentLocation: e.target.value,
                      }))
                    }
                    placeholder="Current location"
                    className="mt-5 w-full rounded-xl border border-slate-200 p-3 outline-none focus:border-red-400"
                  />

                  <input
                    value={form.preferredJobLocation}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        preferredJobLocation: e.target.value,
                      }))
                    }
                    placeholder="Preferred job location, optional"
                    className="mt-3 w-full rounded-xl border border-slate-200 p-3 outline-none focus:border-red-400"
                  />

                  <input
                    value={form.joiningAvailability}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        joiningAvailability: e.target.value,
                      }))
                    }
                    placeholder="When can you start? Optional"
                    className="mt-3 w-full rounded-xl border border-slate-200 p-3 outline-none focus:border-red-400"
                  />
                </>
              )}

              {step === 7 && (
                <>
                  <h2 className="text-xl font-bold text-slate-900">
                    Your name
                  </h2>

                  <input
                    autoFocus
                    value={form.fullName}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        fullName: e.target.value,
                      }))
                    }
                    placeholder="Full name"
                    className="mt-5 w-full rounded-xl border border-slate-200 p-3 outline-none focus:border-red-400"
                  />
                </>
              )}

              {step === 8 && (
                <>
                  <h2 className="text-xl font-bold text-slate-900">
                    Contact number
                  </h2>

                  <p className="mt-2 text-sm text-slate-500">
                    Your number is hidden until an employer chooses to reveal your contact.
                  </p>

                  <input
                    autoFocus
                    value={form.phone}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        phone: e.target.value,
                      }))
                    }
                    placeholder="98XXXXXXXX"
                    className="mt-5 w-full rounded-xl border border-slate-200 p-3 outline-none focus:border-red-400"
                  />
                </>
              )}

              {step === 9 && (
                <>
                  <h2 className="text-xl font-bold text-slate-900">
                    Final details
                  </h2>

                  <label className="mt-5 block cursor-pointer rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 transition hover:border-red-400 hover:bg-red-50/50">
                    <span className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-red-600 shadow-sm">
                        <FileText className="h-5 w-5" />
                      </span>
                      <span>
                        <span className="block text-sm font-semibold text-slate-800">
                          {cvFile ? cvFile.name : "Upload CV (optional)"}
                        </span>
                        <span className="block text-xs text-slate-500">
                          PDF, DOC or DOCX · maximum 5 MB
                        </span>
                      </span>
                    </span>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      className="sr-only"
                      onChange={(event) => {
                        const file = event.target.files?.[0] || null;

                        if (!file) {
                          setCvFile(null);
                          return;
                        }

                        const extension = file.name
                          .toLowerCase()
                          .split(".")
                          .pop();
                        const allowed = ["pdf", "doc", "docx"];

                        if (!extension || !allowed.includes(extension)) {
                          toast.error("CV PDF, DOC वा DOCX format मा upload गर्नुहोस्");
                          event.target.value = "";
                          return;
                        }

                        if (file.size > 5 * 1024 * 1024) {
                          toast.error("CV को size 5 MB भन्दा कम हुनुपर्छ");
                          event.target.value = "";
                          return;
                        }

                        setCvFile(file);
                      }}
                    />
                  </label>

                  {cvFile && (
                    <button
                      type="button"
                      onClick={() => setCvFile(null)}
                      className="mt-2 text-xs font-semibold text-red-600"
                    >
                      Remove CV
                    </button>
                  )}

                  <textarea
                    rows={4}
                    value={form.extraInfo}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        extraInfo: e.target.value,
                      }))
                    }
                    placeholder="Anything else you want employers to know? Optional"
                    className="mt-5 w-full rounded-xl border border-slate-200 p-3 outline-none focus:border-red-400"
                  />

                  <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-4">
                    <input
                      type="checkbox"
                      checked={form.consentToEmployerSearch}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          consentToEmployerSearch:
                            e.target.checked,
                        }))
                      }
                      className="mt-1"
                    />

                    <span className="text-sm leading-6 text-slate-700">
                      I allow employers to find my profile and request my contact information.
                    </span>
                  </label>
                </>
              )}

              {step === 10 && (
                <>
                  <h2 className="text-xl font-bold text-slate-900">
                    Review Profile
                  </h2>

                  <div className="mt-5 space-y-3 rounded-xl bg-slate-50 p-4 text-sm">
                    <p><b>Category:</b> {selectedCategory}</p>
                    <p><b>Role:</b> {selectedJobTitle}</p>
                    <p>
                      <b>Experience:</b>{" "}
                      {form.isFresher
                        ? "Fresher"
                        : `${form.experienceMonths || 0} months`}
                    </p>
                    <p><b>Skills:</b> {form.skills || "Not specified"}</p>
                    <p><b>Education:</b> {form.education || "Not specified"}</p>
                    <p>
                      <b>Expected Salary:</b>{" "}
                      {form.expectedSalary
                        ? `Rs. ${Number(form.expectedSalary).toLocaleString()}`
                        : "Not specified"}
                    </p>
                    <p><b>Location:</b> {form.currentLocation}</p>
                    <p><b>Name:</b> {form.fullName}</p>
                    <p><b>CV:</b> {cvFile?.name || "Not uploaded"}</p>
                  </div>
                </>
              )}

              <div className="mt-7 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={back}
                  disabled={step === 0}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold disabled:opacity-40"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </button>

                {step < totalSteps ? (
                  <button
                    type="button"
                    onClick={next}
                    disabled={!canContinue}
                    className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
                  >
                    Continue
                    <ArrowRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => mutation.mutate()}
                    disabled={mutation.isPending}
                    className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    {mutation.isPending && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}
                    Publish
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
