"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    adsbygoogle?: Array<Record<string, unknown>>;
  }
}

const PROFILE_AD_CLIENT = "ca-pub-4155800281448057";
const PROFILE_AD_SLOT = process.env.NEXT_PUBLIC_ADSENSE_PROFILE_SLOT;

export function ProfileAdSlot() {
  const adRef = useRef<HTMLElement | null>(null);
  const requested = useRef(false);

  useEffect(() => {
    if (!PROFILE_AD_SLOT || requested.current || !adRef.current) return;
    requested.current = true;
    try {
      window.adsbygoogle = window.adsbygoogle || [];
      window.adsbygoogle.push({});
    } catch {
      requested.current = false;
    }
  }, []);

  if (!PROFILE_AD_SLOT) return null;

  return (
    <aside className="mx-auto w-full max-w-3xl overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-3" aria-label="Advertisement">
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Advertisement</p>
      <ins
        ref={(node) => { adRef.current = node; }}
        className="adsbygoogle block min-h-[90px] w-full"
        style={{ display: "block" }}
        data-ad-client={PROFILE_AD_CLIENT}
        data-ad-slot={PROFILE_AD_SLOT}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </aside>
  );
}
