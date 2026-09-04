"use client";

import { useEffect, useState } from "react";
import { BellRing, Link2, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  DEFAULT_SITE_NOTICE,
  readSiteNotice,
  saveSiteNotice,
  type SiteNotice,
} from "@/lib/site-notice";

export default function AdminSiteNoticePage() {
  const [notice, setNotice] = useState<SiteNotice>(DEFAULT_SITE_NOTICE);

  useEffect(() => {
    setNotice(readSiteNotice());
  }, []);

  const update = (patch: Partial<SiteNotice>) =>
    setNotice((current) => ({ ...current, ...patch }));

  const save = () => {
    if (notice.enabled && !notice.message.trim()) {
      toast.error("Notice on गर्दा message राख्नुहोस्।");
      return;
    }

    saveSiteNotice({
      ...notice,
      title: notice.title.trim() || "Notice",
      message: notice.message.trim(),
      link: notice.link?.trim() || "",
      linkLabel: notice.linkLabel?.trim() || "View details",
    });
    toast.success("Website notice save भयो।");
  };

  const clear = () => {
    const next = { ...DEFAULT_SITE_NOTICE };
    setNotice(next);
    saveSiteNotice(next);
    toast.success("Website notice हटाइयो।");
  };

  return (
    <main className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <BellRing className="h-6 w-6 text-red-600" /> Website Notice
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Rooms page मा देखिने notice, message र optional link यहाँबाट मिलाउनुहोस्।
        </p>
      </div>

      <section className="space-y-5 rounded-2xl border bg-white p-5 shadow-sm">
        <label className="flex items-center justify-between gap-4 rounded-xl border p-4">
          <div>
            <p className="font-semibold">Show notice</p>
            <p className="text-xs text-muted-foreground">Off गर्दा public page मा notice देखिँदैन।</p>
          </div>
          <input
            type="checkbox"
            checked={notice.enabled}
            onChange={(event) => update({ enabled: event.target.checked })}
            className="h-5 w-5 accent-red-600"
          />
        </label>

        <div>
          <label className="mb-2 block text-sm font-medium">Title</label>
          <input
            value={notice.title}
            onChange={(event) => update({ title: event.target.value })}
            maxLength={100}
            className="h-11 w-full rounded-xl border px-3 text-sm"
            placeholder="Important notice"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">Message</label>
          <textarea
            value={notice.message}
            onChange={(event) => update({ message: event.target.value })}
            maxLength={500}
            rows={5}
            className="w-full rounded-xl border p-3 text-sm"
            placeholder="उदाहरण: आज बेलुका ८ बजे maintenance हुने भएकाले केही समय service slow हुन सक्छ।"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium">Link (optional)</label>
            <div className="relative">
              <Link2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={notice.link || ""}
                onChange={(event) => update({ link: event.target.value })}
                maxLength={500}
                className="h-11 w-full rounded-xl border pl-9 pr-3 text-sm"
                placeholder="/pricing or https://..."
              />
            </div>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">Link button text</label>
            <input
              value={notice.linkLabel || ""}
              onChange={(event) => update({ linkLabel: event.target.value })}
              maxLength={60}
              className="h-11 w-full rounded-xl border px-3 text-sm"
              placeholder="View details"
            />
          </div>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 via-white to-red-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Preview</p>
          <p className="mt-2 font-bold text-slate-900">{notice.title || "Notice"}</p>
          <p className="mt-1 text-sm text-slate-600">{notice.message || "Your notice message will appear here."}</p>
          {notice.link && (
            <p className="mt-2 text-sm font-semibold text-red-600">
              {notice.linkLabel || "View details"} →
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={save}
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-semibold text-white hover:bg-red-700"
          >
            <Save className="h-4 w-4" /> Save notice
          </button>
          <button
            type="button"
            onClick={clear}
            className="inline-flex h-11 items-center gap-2 rounded-xl border px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Trash2 className="h-4 w-4" /> Remove notice
          </button>
        </div>
      </section>
    </main>
  );
}
