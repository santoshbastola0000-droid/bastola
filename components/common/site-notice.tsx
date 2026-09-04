"use client";

import { useEffect, useState } from "react";
import { BellRing, ExternalLink, X } from "lucide-react";
import {
  DEFAULT_SITE_NOTICE,
  readSiteNotice,
  SITE_NOTICE_EVENT,
  type SiteNotice,
} from "@/lib/site-notice";

export function SiteNoticeBanner() {
  const [notice, setNotice] = useState<SiteNotice>(DEFAULT_SITE_NOTICE);
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

  if (!notice.enabled || !notice.message.trim() || dismissed) return null;

  const href = notice.link?.trim() || "";
  const isExternal = /^https?:\/\//i.test(href);

  return (
    <div className="mx-auto mt-3 max-w-4xl px-0 sm:px-0">
      <div className="relative overflow-hidden rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 via-white to-red-50 px-4 py-3 shadow-sm">
        <div className="flex items-start gap-3 pr-8">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
            <BellRing className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-slate-900">{notice.title || "Notice"}</p>
            <p className="mt-0.5 text-sm leading-5 text-slate-600">{notice.message}</p>
            {href && (
              <a
                href={href}
                target={isExternal ? "_blank" : undefined}
                rel={isExternal ? "noreferrer" : undefined}
                className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-red-600 hover:text-red-700"
              >
                {notice.linkLabel || "View details"}
                {isExternal && <ExternalLink className="h-3.5 w-3.5" />}
              </a>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="absolute right-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-full text-slate-400 transition hover:bg-white hover:text-slate-700"
          aria-label="Dismiss notice"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
