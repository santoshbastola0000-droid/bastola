"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  BadgeCheck,
  BriefcaseBusiness,
  CheckCircle2,
  Download,
  FileText,
  GraduationCap,
  Loader2,
  MapPin,
  MessageCircle,
  Phone,
  UserRound,
  WalletCards,
} from "lucide-react";
import { toast } from "sonner";

import { NavBar } from "@/components/common/navbar";
import Footer from "@/components/common/footer";
import { candidateProfileService } from "@/http/services/candidate-profile.service";
import { messageService } from "@/http/services/message.service";

export default function CandidateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params.id);
  const [contact, setContact] = useState<{ phone?: string | null } | null>(null);
  const [openingMessage, setOpeningMessage] = useState(false);
  const [openingCv, setOpeningCv] = useState(false);

  const { data: candidate, isLoading, error } = useQuery({
    queryKey: ["candidate-profile", id],
    queryFn: () => candidateProfileService.getPublicOne(id),
    enabled: Boolean(id),
  });

  const contactMutation = useMutation({
    mutationFn: (action: "VIEW_CONTACT" | "CALL" | "WHATSAPP") =>
      candidateProfileService.revealContact(id, { action }),
    onSuccess: (data, action) => {
      setContact(data);
      if (action === "CALL" && data?.phone) window.location.href = `tel:${data.phone}`;
      if (action === "WHATSAPP" && data?.phone) {
        const digits = String(data.phone).replace(/\D/g, "").replace(/^0/, "");
        const number = digits.startsWith("977") ? digits : `977${digits}`;
        window.open(`https://wa.me/${number}`, "_blank", "noopener,noreferrer");
      }
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Contact उपलब्ध भएन");
    },
  });

  const openRoomKhojMessage = async () => {
    try {
      setOpeningMessage(true);
      const data = contact?.phone
        ? contact
        : await candidateProfileService.revealContact(id, { action: "VIEW_CONTACT" });

      if (!data?.phone) {
        toast.error("यो candidate को RoomKhoj contact उपलब्ध छैन।");
        return;
      }

      setContact(data);
      const started = await messageService.startByContact(String(data.phone));
      const conversationId = started?.conversation?.id;

      if (!conversationId) {
        toast.error("यो candidate को RoomKhoj account भेटिएन।");
        return;
      }

      router.push(
        `/messages?conversation=${encodeURIComponent(conversationId)}&returnTo=${encodeURIComponent(`/jobs/candidates/${id}`)}`,
      );
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ||
          "यो candidate को RoomKhoj account भेटिएन वा message खोल्न सकिएन।",
      );
    } finally {
      setOpeningMessage(false);
    }
  };

  const openCandidateCv = async () => {
    try {
      setOpeningCv(true);
      const blob = await candidateProfileService.downloadCv(id);
      const url = URL.createObjectURL(blob);
      const popup = window.open(url, "_blank", "noopener,noreferrer");
      if (!popup) {
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = "candidate-cv";
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
      }
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Candidate CV खोल्न सकिएन।");
    } finally {
      setOpeningCv(false);
    }
  };

  if (isLoading) {
    return (
      <><NavBar /><main className="flex min-h-screen items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-red-600" /></main></>
    );
  }

  if (error || !candidate) {
    return (
      <><NavBar /><main className="min-h-screen bg-slate-50 px-4 pt-28"><div className="mx-auto max-w-xl rounded-2xl border bg-white p-6 text-center">Candidate profile उपलब्ध छैन।</div></main></>
    );
  }

  const primaryJob = candidate.jobs?.[0];
  const cv = primaryJob?.jobSpecificAnswers?.cv as { url?: string; originalName?: string } | undefined;

  return (
    <>
      <NavBar />
      <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 px-4 pb-20 pt-24">
        <div className="mx-auto max-w-4xl">
          <Link href="/jobs/candidates" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-red-600">
            <ArrowLeft className="h-4 w-4" /> Back to candidates
          </Link>

          <section className="mt-4 overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_18px_55px_rgba(15,23,42,0.08)]">
            <div className="h-2 bg-gradient-to-r from-red-600 via-rose-500 to-orange-400" />
            <div className="border-b border-slate-100 bg-gradient-to-br from-white to-slate-50 p-5 sm:p-7">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-sm">
                    <UserRound className="h-7 w-7" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h1 className="text-2xl font-extrabold text-slate-950">{candidate.fullName || "Candidate"}</h1>
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700"><BadgeCheck className="h-3.5 w-3.5" /> Available</span>
                    </div>
                    <p className="mt-1 text-base font-bold capitalize text-red-600">{primaryJob?.jobTitle || "Job Candidate"}</p>
                    <p className="mt-2 flex items-center gap-1.5 text-sm text-slate-500"><MapPin className="h-4 w-4" />{candidate.preferredJobLocation || candidate.currentLocation || "Location not specified"}</p>
                  </div>
                </div>

                <button
                  id="contact-candidate"
                  type="button"
                  onClick={openRoomKhojMessage}
                  disabled={openingMessage}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-red-700 disabled:opacity-60"
                >
                  {openingMessage ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageCircle className="h-5 w-5" />}
                  Message Candidate
                </button>
              </div>
            </div>

            <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[1fr_320px]">
              <div className="space-y-6">
                {primaryJob && (
                  <div>
                    <h2 className="text-lg font-extrabold text-slate-950">Professional Profile</h2>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <Info icon={<BriefcaseBusiness className="h-4 w-4" />} label="Category" value={primaryJob.category || "Not specified"} />
                      <Info icon={<BriefcaseBusiness className="h-4 w-4" />} label="Experience" value={primaryJob.isFresher ? "Fresher" : primaryJob.experienceMonths ? `${primaryJob.experienceMonths} months` : "Not specified"} />
                      <Info icon={<WalletCards className="h-4 w-4" />} label="Expected Salary" value={primaryJob.expectedSalary ? `Rs. ${Number(primaryJob.expectedSalary).toLocaleString()}` : "Not specified"} />
                      <Info icon={<GraduationCap className="h-4 w-4" />} label="Education" value={candidate.education || "Not specified"} />
                    </div>
                  </div>
                )}

                {primaryJob?.skills?.length > 0 && (
                  <div>
                    <h2 className="text-lg font-extrabold text-slate-950">Skills</h2>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {primaryJob.skills.map((skill: string) => <span key={skill} className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700">{skill}</span>)}
                    </div>
                  </div>
                )}

                {candidate.joiningAvailability && (
                  <div>
                    <h2 className="text-lg font-extrabold text-slate-950">Joining Availability</h2>
                    <p className="mt-2 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">{candidate.joiningAvailability}</p>
                  </div>
                )}

                {cv?.url && (
                  <div>
                    <h2 className="text-lg font-extrabold text-slate-950">Candidate CV</h2>
                    <button
                      type="button"
                      onClick={openCandidateCv}
                      disabled={openingCv}
                      className="mt-3 flex w-full items-center justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-left text-red-700 transition hover:bg-red-100 disabled:opacity-60"
                    >
                      <span className="flex min-w-0 items-center gap-3"><FileText className="h-5 w-5 shrink-0" /><span className="truncate text-sm font-bold">{cv.originalName || "View candidate CV"}</span></span>
                      {openingCv ? <Loader2 className="h-5 w-5 shrink-0 animate-spin" /> : <Download className="h-5 w-5 shrink-0" />}
                    </button>
                  </div>
                )}
              </div>

              <aside className="h-fit rounded-[22px] border border-slate-200 bg-slate-50 p-5">
                <h2 className="font-extrabold text-slate-950">Contact Candidate</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">Use RoomKhoj messaging first. Phone remains hidden until you choose to reveal it.</p>

                <button type="button" onClick={openRoomKhojMessage} disabled={openingMessage} className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-bold text-white transition hover:bg-red-600 disabled:opacity-60">
                  <MessageCircle className="h-4 w-4" /> Message in RoomKhoj
                </button>

                {!contact?.phone ? (
                  <button type="button" disabled={contactMutation.isPending} onClick={() => contactMutation.mutate("VIEW_CONTACT")} className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 disabled:opacity-50">
                    {contactMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Phone className="h-4 w-4" />} Reveal Phone
                  </button>
                ) : (
                  <>
                    <div className="mt-3 flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700"><CheckCircle2 className="h-5 w-5" /><span className="font-bold">{contact.phone}</span></div>
                    <button type="button" onClick={() => contactMutation.mutate("CALL")} className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800"><Phone className="h-4 w-4" /> Call Candidate</button>
                  </>
                )}
              </aside>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}

function Info({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">{icon}{label}</div>
      <p className="mt-1.5 text-sm font-bold text-slate-900">{value}</p>
    </div>
  );
}
