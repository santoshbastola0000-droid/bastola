"use client";

import { useState } from "react";

export function RoomShareButton({ code, title }: { code: string; title: string }) {
  const [notice, setNotice] = useState("");
  const [fallback, setFallback] = useState("");
  const [busy, setBusy] = useState(false);
  function publicUrl() {
    return new URL("/room/" + encodeURIComponent(code), window.location.origin).href;
  }
  async function copy() {
    const url = publicUrl();
    try {
      await navigator.clipboard.writeText(url);
      setFallback("");
      setNotice("Link copied · अब share गर्न सक्नुहुन्छ।");
    } catch {
      setFallback(url);
      setNotice("तलको link select गरेर copy गर्नुहोस्।");
    }
  }
  async function share() {
    if (busy) return;
    setBusy(true);
    setNotice("");
    try {
      if (navigator.share) {
        await navigator.share({ title: title + " · " + code + " · RoomKhoj", text: "यो room हेर्नुहोस् · " + code, url: publicUrl() });
      } else {
        await copy();
      }
    } catch (error) {
      if (!(error instanceof Error && error.name === "AbortError")) await copy();
    } finally {
      setBusy(false);
    }
  }
  return <div className="space-y-2">
    <div className="flex flex-wrap gap-2">
      <button type="button" disabled={busy} onClick={() => void share()} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50" aria-label={"Share room " + code}>{busy ? "Sharing…" : "Share room ↗"}</button>
      <button type="button" onClick={() => void copy()} className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold">Copy link</button>
    </div>
    {notice && <p role="status" className="text-xs text-slate-600">{notice}</p>}
    {fallback && <input readOnly aria-label="Public room link" value={fallback} onFocus={event => event.currentTarget.select()} className="w-full rounded-lg border p-2 text-sm" />}
  </div>;
}
