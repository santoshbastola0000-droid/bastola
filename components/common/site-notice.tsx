"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { BellRing, ExternalLink, Trophy, X } from "lucide-react";
import { api } from "@/http/api/api";
import {
  DEFAULT_SITE_NOTICE,
  isSiteNoticeActive,
  readSiteNotice,
  SITE_NOTICE_EVENT,
  type SiteNotice,
} from "@/lib/site-notice";

type LeaderboardUser = {
  userId: string;
  name: string;
  qualifiedReferrals: string | number;
};

export function SiteNoticeBanner() {
  const pathname = usePathname();
  const [notice, setNotice] = useState<SiteNotice>(DEFAULT_SITE_NOTICE);
  const [topReferralName, setTopReferralName] = useState("");
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const sync = () => {
      setNotice(readSiteNotice());
      setDismissed(false);
    };

    sync();
    window.addEventListener("storage", sync);
    window.addEventListener(SITE_NOTICE_EVENT, sync as EventListener);

    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(SITE_NOTICE_EVENT, sync as EventListener);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadTopReferral = async () => {
      try {
        const response = await api.get("/referral/leaderboard");
        const users = (response.data?.data || []) as LeaderboardUser[];
        if (!cancelled) setTopReferralName(String(users[0]?.name || "").trim());
      } catch {
        if (!cancelled) setTopReferralName("");
      }
    };

    void loadTopReferral();
    return () => {
      cancelled = true;
    };
  }, []);

  const isHomePage = pathname === "/" || pathname === "/rooms";
  const hasActiveNotice = isSiteNoticeActive(notice);

  if (!isHomePage || dismissed || (!hasActiveNotice && !topReferralName)) {
    return null;
  }

  const href = hasActiveNotice ? notice.link?.trim() || "" : "";
  const isExternal = /^https?:\/\//i.test(href);

  return (
    <div className="pointer-events-none fixed left-3 right-3 top-[78px] z-[80] sm:left-1/2 sm:right-auto sm:w-[calc(100%-32px)] sm:max-w-2xl sm:-translate-x-1/2">
      <div className="pointer-events-auto relative overflow-hidden rounded-2xl border border-red-200 bg-white/95 px-4 py-3 shadow-[0_16px_50px_rgba(15,23,42,0.18)] backdrop-blur-xl">
        <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-red-500 to-rose-600" />

        <div className="flex items-start gap-3 pr-8">
          <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600 ring-1 ring-red-100">
            {hasActiveNotice ? <BellRing className="h-5 w-5" /> : <Trophy className="h-5 w-5" />}
          </div>

          <div className="min-w-0 flex-1">
            {hasActiveNotice ? (
              <>
                <p className="text-sm font-extrabold text-slate-950">
                  {notice.title || "RoomKhoj Notice"}
                </p>
                <p className="mt-0.5 text-sm leading-5 text-slate-600">
                  {notice.message}
                </p>

                {href && (
                  <a
                    href={href}
                    target={isExternal ? "_blank" : undefined}
                    rel={isExternal ? "noreferrer" : undefined}
                    className="mt-2 inline-flex items-center gap-1 text-sm font-bold text-red-600 hover:text-red-700"
                  >
                    {notice.linkLabel || "View details"}
                    {isExternal && <ExternalLink className="h-3.5 w-3.5" />}
                  </a>
                )}
              </>
            ) : (
              <>
                <p className="text-xs font-bold uppercase tracking-wide text-red-600">Top Referral</p>
                <p className="mt-0.5 truncate text-sm font-extrabold text-slate-950">{topReferralName}</p>
              </>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          aria-label="Dismiss notice"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
