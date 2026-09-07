export type SiteNotice = {
  enabled: boolean;
  title: string;
  message: string;
  link?: string;
  linkLabel?: string;
  publishedAt?: string;
  expiresAt?: string;
};

export const SITE_NOTICE_STORAGE_KEY = "roomkhoj-site-notice";
export const SITE_NOTICE_EVENT = "roomkhoj-site-notice-updated";
export const SITE_NOTICE_TTL_MS = 24 * 60 * 60 * 1000;

export const DEFAULT_SITE_NOTICE: SiteNotice = {
  enabled: false,
  title: "Notice",
  message: "",
  link: "",
  linkLabel: "View details",
  publishedAt: "",
  expiresAt: "",
};

export function isSiteNoticeActive(notice: SiteNotice) {
  if (!notice.enabled || !notice.message.trim()) return false;

  const expiresAt = notice.expiresAt ? Date.parse(notice.expiresAt) : NaN;
  return Number.isFinite(expiresAt) && expiresAt > Date.now();
}

export function readSiteNotice(): SiteNotice {
  if (typeof window === "undefined") return DEFAULT_SITE_NOTICE;

  try {
    const raw = window.localStorage.getItem(SITE_NOTICE_STORAGE_KEY);
    if (!raw) return DEFAULT_SITE_NOTICE;
    const parsed = JSON.parse(raw) as Partial<SiteNotice>;

    const notice: SiteNotice = {
      enabled: Boolean(parsed.enabled),
      title: String(parsed.title || "Notice"),
      message: String(parsed.message || ""),
      link: String(parsed.link || ""),
      linkLabel: String(parsed.linkLabel || "View details"),
      publishedAt: String(parsed.publishedAt || ""),
      expiresAt: String(parsed.expiresAt || ""),
    };

    // Older notices did not have an expiry. Treat them as expired instead of
    // allowing a stale banner to remain forever.
    if (!isSiteNoticeActive(notice)) {
      return { ...notice, enabled: false };
    }

    return notice;
  } catch {
    return DEFAULT_SITE_NOTICE;
  }
}

export function saveSiteNotice(notice: SiteNotice) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(SITE_NOTICE_STORAGE_KEY, JSON.stringify(notice));
  window.dispatchEvent(new CustomEvent(SITE_NOTICE_EVENT, { detail: notice }));
}
