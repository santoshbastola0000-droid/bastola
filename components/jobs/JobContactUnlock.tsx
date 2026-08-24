"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  Loader2,
  Share2,
} from "lucide-react";
import { toast } from "sonner";

import {
  jobPostingService,
  type JobShareStatus,
} from "@/http/services/job-posting.service";
import useTokenStore from "@/store";
import { messageService } from "@/http/services/message.service";

export default function JobContactUnlock({
  jobId,
  jobTitle,
}: {
  jobId: string;
  jobTitle: string;
}) {
  const router = useRouter();
  const [openingMessage, setOpeningMessage] = useState(false);

  const token = useTokenStore(
    (state) => state.token,
  );

  const [status, setStatus] =
    useState<JobShareStatus | null>(null);
  const [loading, setLoading] =
    useState(Boolean(token));
  const [sharing, setSharing] =
    useState(false);

  const loadStatus = async () => {
    const messageEmployer = async () => {
    if (!token || openingMessage) return;

    try {
      setOpeningMessage(true);
      const result = await messageService.startForJob(jobId);
      router.push(`/messages?conversation=${encodeURIComponent(result.conversation.id)}`);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Employer लाई message सुरु गर्न सकिएन।");
    } finally {
      setOpeningMessage(false);
    }
  };

  if (!token) {
      setLoading(false);
      return;
    }

    try {
      const next =
        await jobPostingService.getShareStatus(
          jobId,
        );

      setStatus(next);
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          "Share progress load गर्न सकिएन।",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, [jobId, token]);

  const share = async () => {
    if (!token || sharing) {
      return;
    }

    const url = window.location.href;
    const text =
      `RoomKhoj मा ${jobTitle} vacancy हेर्नुहोस्: ${url}`;

    try {
      setSharing(true);

      if (navigator.share) {
        await navigator.share({
          title: `${jobTitle} vacancy`,
          text,
          url,
        });
      } else {
        await navigator.clipboard.writeText(
          text,
        );

        toast.success(
          "Job link copied. अब share गर्नुहोस्।",
        );
      }

      const next =
        await jobPostingService.recordShare(
          jobId,
          crypto.randomUUID(),
        );

      setStatus(next);

      if (next.isFullyUnlocked) {
        toast.success(
          "पूरा contact number unlock भयो।",
        );
      } else if (
        next.isPartiallyUnlocked &&
        next.shareCount === 5
      ) {
        toast.success(
          "Contact number को 50% unlock भयो।",
        );
      }
    } catch (error: any) {
      if (error?.name === "AbortError") {
        return;
      }

      toast.error(
        error?.response?.data?.message ||
          "Share record हुन सकेन।",
      );
    } finally {
      setSharing(false);
    }
  };

  if (!token) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
        <p className="font-semibold text-amber-900">
          Contact unlock गर्न login गर्नुहोस्।
        </p>

        <Link
          href={`/auth/login?redirect=${encodeURIComponent(
            `/job/${jobId}`,
          )}`}
          className="mt-4 inline-flex rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white"
        >
          Login
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  const shareCount =
    status?.shareCount || 0;
  const contact =
    status?.contactPhone || null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Contact Employee
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            5 shares मा आधा र 10 shares मा पूरा नम्बर खुल्छ।
          </p>
        </div>

        {status?.isFullyUnlocked && (
          <CheckCircle2 className="h-7 w-7 text-emerald-600" />
        )}
      </div>

      <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full bg-red-600 transition-all"
          style={{
            width: `${Math.min(
              shareCount * 10,
              100,
            )}%`,
          }}
        />
      </div>

      <div className="mt-2 flex justify-between text-sm font-medium text-slate-600">
        <span>{shareCount}/10 shares</span>
        <span>{shareCount * 10}%</span>
      </div>

      {contact && (
        <a
          href={
            status?.isFullyUnlocked
              ? `tel:${contact}`
              : undefined
          }
          className="mt-5 block rounded-xl bg-emerald-50 p-4 text-center text-2xl font-bold tracking-wider text-emerald-800"
        >
          {contact}
        </a>
      )}

      <button
        type="button"
        onClick={messageEmployer}
        disabled={openingMessage}
        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-800 disabled:opacity-50"
      >
        {openingMessage ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
        Message employer
      </button>

      {!status?.isFullyUnlocked && (
        <button
          type="button"
          onClick={share}
          disabled={sharing}
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 font-semibold text-white disabled:opacity-50"
        >
          {sharing ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Share2 className="h-5 w-5" />
          )}
          Share vacancy
        </button>
      )}
    </div>
  );
}
