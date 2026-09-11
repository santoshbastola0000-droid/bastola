"use client";

import { useEffect, useRef, useState } from "react";
import { Music2 } from "lucide-react";

import { socialService, type SocialMusic } from "@/http/services/social.service";

const backendUrl = String(
  process.env.NEXT_PUBLIC_BACKEND_URL || "https://api.roomkhoj.com",
).replace(/\/$/, "");

function media(value?: string | null) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  return `${backendUrl}${raw.startsWith("/") ? raw : `/${raw}`}`;
}

export function PostMusicPlayer({ postId }: { postId: string }) {
  const anchorRef = useRef<HTMLDivElement>(null);
  const [music, setMusic] = useState<SocialMusic | null>(null);

  useEffect(() => {
    const node = anchorRef.current;
    if (!node) return;

    let active = true;
    const load = async () => {
      const result = await socialService.postMusic(postId).catch(() => null);
      if (active) setMusic(result?.musicUrl ? result : null);
    };

    if (!("IntersectionObserver" in window)) {
      void load();
      return () => {
        active = false;
      };
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        observer.disconnect();
        void load();
      },
      { rootMargin: "300px" },
    );
    observer.observe(node);

    return () => {
      active = false;
      observer.disconnect();
    };
  }, [postId]);

  return (
    <div ref={anchorRef}>
      {music?.musicUrl && (
        <div className="mx-3 mb-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
          <div className="mb-2 flex items-center gap-2 text-xs text-slate-700">
            <Music2 className="h-4 w-4 shrink-0 text-red-600" />
            <span className="min-w-0 flex-1 truncate font-bold">
              {music.musicTitle || "Post music"}
              {music.musicArtist ? ` · ${music.musicArtist}` : ""}
            </span>
          </div>
          <audio
            src={media(music.musicUrl)}
            controls
            preload="none"
            className="h-9 w-full"
          />
        </div>
      )}
    </div>
  );
}
