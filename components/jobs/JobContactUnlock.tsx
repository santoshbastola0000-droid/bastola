"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  Loader2,
  Share2,
  Facebook,
  Link as LinkIcon,
  MessageCircle,
  Phone,
  X,
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
  const [showFlowerRain, setShowFlowerRain] =
    useState(false);
  const [showShareMenu, setShowShareMenu] =
    useState(false);
  const wasUnlockedRef = useRef(false);

  const messageEmployer = async () => {
    if (!token || openingMessage) return;

    try {
      setOpeningMessage(true);
      const result =
        await messageService.startForJob(jobId);

      router.push(
        `/messages?conversation=${encodeURIComponent(
          result.conversation.id,
        )}`,
      );
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          "Employer लाई message सुरु गर्न सकिएन।",
      );
    } finally {
      setOpeningMessage(false);
    }
  };

  const loadStatus = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const next =
        await jobPostingService.getShareStatus(
          jobId,
        );

    } catch (error: any) {
      // Do not expose raw backend errors such as "Internal server error".
      toast.error("Share progress load गर्न सकिएन। पछि फेरि प्रयास गर्नुहोस्।");
    } finally {
      setLoading(false);
    }
  }, [jobId, token]);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  // Other people open the shared link on their own devices. Refresh while this
  // card is visible, and as soon as the sharer returns from WhatsApp/Facebook.
  useEffect(() => {
    if (!token || status?.isFullyUnlocked) return;

    const refresh = () => {
      if (document.visibilityState === "visible") {
        loadStatus();
      }
    };

    const interval = window.setInterval(refresh, 10_000);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [loadStatus, status?.isFullyUnlocked, token]);

  useEffect(() => {
    if (!status) return;

    if (status.isFullyUnlocked && !wasUnlockedRef.current) {
      setShowFlowerRain(true);
      const timer = window.setTimeout(
        () => setShowFlowerRain(false),
        5000,
      );
      wasUnlockedRef.current = true;
      return () => window.clearTimeout(timer);
    }

    wasUnlockedRef.current = status.isFullyUnlocked;
  }, [status]);

  const getBrowserId = () => {
    const key = "roomkhoj_browser_id";
    let value = localStorage.getItem(key);

    if (!value) {
      value = crypto.randomUUID();
      localStorage.setItem(key, value);
    }

    return value;
  };

  useEffect(() => {
    const shareCode =
      new URLSearchParams(window.location.search)
        .get("share");

    if (!shareCode) return;

    try {
      const owned = JSON.parse(
        localStorage.getItem(
          "roomkhoj_owned_share_codes",
        ) || "[]",
      ) as string[];

      if (owned.includes(shareCode)) return;

      jobPostingService
        .recordOpen(
          jobId,
          shareCode,
          getBrowserId(),
        )
        .catch(() => undefined);
    } catch {
      // Invalid local data must not block the job page.
    }
  }, [jobId]);

  const shareTo = async (
    channel: "native" | "whatsapp" | "facebook" | "copy",
  ) => {
    if (!token || sharing) return;

    try {
      setSharing(true);

      // The status endpoint creates one stable share code for this user and job.
      // Reusing it avoids an unnecessary POST before opening the share menu.
      let shareCode = status?.shareCode;

      if (!shareCode) {
        const next =
          await jobPostingService.getShareStatus(jobId);
        shareCode = shareCode;
        setStatus(next);
      }

      if (!shareCode) {
        throw new Error("Share link unavailable");
      }

      const ownedKey =
        "roomkhoj_owned_share_codes";
      const owned = JSON.parse(
        localStorage.getItem(ownedKey) || "[]",
      ) as string[];

      localStorage.setItem(
        ownedKey,
        JSON.stringify(
          Array.from(
            new Set([...owned, shareCode]),
          ).slice(-50),
        ),
      );

      const url =
        `${window.location.origin}${window.location.pathname}?share=${encodeURIComponent(shareCode)}`;
      const text =
        `RoomKhoj मा ${jobTitle} vacancy हेर्नुहोस्: ${url}`;

      if (channel === "whatsapp") {
        window.open(
          `https://wa.me/?text=${encodeURIComponent(text)}`,
          "_blank",
          "noopener,noreferrer",
        );
      } else if (channel === "facebook") {
        window.open(
          `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
          "_blank",
          "noopener,noreferrer",
        );
      } else if (channel === "copy") {
        await navigator.clipboard.writeText(text);
        toast.success(
          "Unique link copied. अरूले खोलेपछि progress बढ्छ।",
        );
      } else if (navigator.share) {
        await navigator.share({
          title: `${jobTitle} vacancy`,
          text,
          url,
        });
      } else {
        await navigator.clipboard.writeText(text);
        toast.success("Unique job link copied.");
      }

      setStatus(next);
    } catch (error: any) {
      if (error?.name !== "AbortError") {
        // Keep the share UI friendly; technical backend errors are never shown.
        toast.error("Share link बनाउन सकिएन। पछि फेरि प्रयास गर्नुहोस्।");
      }
    } finally {
      setSharing(false);
    }
  };

  const share = () => setShowShareMenu((open) => !open);

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
    <>
      {showFlowerRain && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-[100] overflow-hidden"
        >
          <style>{`
            @keyframes job-flower-rain {
              from { transform: translate3d(0, -12vh, 0) rotate(0deg); opacity: 0; }
              8% { opacity: 1; }
              to { transform: translate3d(12vw, 112vh, 0) rotate(540deg); opacity: 0; }
            }
          `}</style>
          {Array.from({ length: 64 }, (_, index) => (
            <span
              key={index}
              className="absolute text-3xl drop-shadow-sm"
              style={{
                left: `${(index * 37) % 100}%`,
                animation: `job-flower-rain ${2.4 + (index % 5) * 0.35}s linear ${(index % 12) * 0.12}s forwards`,
              }}
            >
              {index % 3 === 0 ? "🌸" : index % 3 === 1 ? "🌺" : "🌼"}
            </span>
          ))}
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Contact Employee
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            5 जना साथीलाई यो vacancy share गर्नुहोस् र उहाँहरूलाई link खोलेर click गर्न भन्नुहोस्।
            5 जनाले खोलेपछि vacancy unlock भएर तपाईंको Profile मा देखिनेछ।
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
              shareCount * 20,
              100,
            )}%`,
          }}
        />
      </div>

      <div className="mt-2 flex justify-between text-sm font-medium text-slate-600">
        <span>{Math.min(shareCount, 5)}/5 unique opens</span>
        <span>{Math.min(shareCount * 20, 100)}%</span>
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

      {!status?.isFullyUnlocked && showShareMenu && (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3 shadow-inner">
          <div className="mb-3 flex items-center justify-between px-1">
            <p className="text-sm font-semibold text-slate-700">Share vacancy</p>
            <button
              type="button"
              onClick={() => setShowShareMenu(false)}
              aria-label="Close share menu"
              className="rounded-full p-1 text-slate-500 hover:bg-slate-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-4 gap-2">
            <button type="button" onClick={() => shareTo("whatsapp")} disabled={sharing} aria-label="Share on WhatsApp" className="flex flex-col items-center gap-1 text-xs font-medium text-slate-700 disabled:opacity-50">
              <span className="relative flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366] text-white shadow-sm"><MessageCircle className="h-8 w-8" strokeWidth={2.6} /><Phone className="absolute h-3.5 w-3.5 fill-[#25D366] text-white" strokeWidth={3} /></span>
              WhatsApp
            </button>
            <button type="button" onClick={() => shareTo("facebook")} disabled={sharing} aria-label="Share on Facebook" className="flex flex-col items-center gap-1 text-xs font-medium text-slate-700 disabled:opacity-50">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1877F2] text-white shadow-sm"><Facebook className="h-7 w-7 fill-white" strokeWidth={2.5} /></span>
              Facebook
            </button>
            <button type="button" onClick={() => shareTo("copy")} disabled={sharing} aria-label="Copy share link" className="flex flex-col items-center gap-1 text-xs font-medium text-slate-700 disabled:opacity-50">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-700 text-white shadow-sm"><LinkIcon className="h-6 w-6" /></span>
              Copy link
            </button>
            <button type="button" onClick={() => shareTo("native")} disabled={sharing} aria-label="More share options" className="flex flex-col items-center gap-1 text-xs font-medium text-slate-700 disabled:opacity-50">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-red-600 text-white shadow-sm"><Share2 className="h-6 w-6" /></span>
              More
            </button>
          </div>
        </div>
      )}

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
    </>
  );
}
