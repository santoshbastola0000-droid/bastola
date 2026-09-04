export type SiteNotice = {
  enabled: boolean;
  title: string;
  message: string;
  link?: string;
  linkLabel?: string;
};

export const SITE_NOTICE_STORAGE_KEY = "roomkhoj-site-notice";
export const SITE_NOTICE_EVENT = "roomkhoj-site-notice-updated";

export const DEFAULT_SITE_NOTICE: SiteNotice = {
  enabled: false,
  title: "Notice",
  message: "",
  link: "",
  linkLabel: "View details",
};

export function readSiteNotice(): SiteNotice {
  if (typeof window === "undefined") return DEFAULT_SITE_NOTICE;

  try {
    const raw = window.localStorage.getItem(SITE_NOTICE_STORAGE_KEY);
    if (!raw) return DEFAULT_SITE_NOTICE;
    const parsed = JSON.parse(raw) as Partial<SiteNotice>;

    return {
      enabled: Boolean(parsed.enabled),
      title: String(parsed.title || "Notice"),
      message: String(parsed.message || ""),
      link: String(parsed.link || ""),
      linkLabel: String(parsed.linkLabel || "View details"),
    };
  } catch {
    return DEFAULT_SITE_NOTICE;
  }
}

export function saveSiteNotice(notice: SiteNotice) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(SITE_NOTICE_STORAGE_KEY, JSON.stringify(notice));
  window.dispatchEvent(new CustomEvent(SITE_NOTICE_EVENT, { detail: notice }));
}
