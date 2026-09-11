"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Music2 } from "lucide-react";

import { socialService, type SocialStory } from "@/http/services/social.service";

const backendUrl = String(
  process.env.NEXT_PUBLIC_BACKEND_URL || "https://api.roomkhoj.com",
).replace(/\/$/, "");

function absoluteMedia(value?: string | null) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  return `${backendUrl}${raw.startsWith("/") ? raw : `/${raw}`}`;
}

export function StoryMusicBridge() {
  const storiesRef = useRef<SocialStory[]>([]);
  const mutedVideoRef = useRef<{ element: HTMLVideoElement; muted: boolean } | null>(null);
  const scheduledRef = useRef(false);
  const [activeStory, setActiveStory] = useState<SocialStory | null>(null);

  const refreshStories = useCallback(async () => {
    const rows = await socialService.stories().catch(() => []);
    storiesRef.current = rows;
  }, []);

  const restoreVideo = () => {
    const previous = mutedVideoRef.current;
    if (previous?.element?.isConnected) previous.element.muted = previous.muted;
    mutedVideoRef.current = null;
  };

  const inspect = useCallback(() => {
    scheduledRef.current = false;
    const overlays = Array.from(document.querySelectorAll<HTMLElement>("div.fixed.inset-0"));
    const overlay = overlays.find((node) => node.querySelector('img[alt="Story"], video'));
    const storyMedia = overlay?.querySelector<HTMLImageElement | HTMLVideoElement>('img[alt="Story"], video');

    if (!storyMedia) {
      restoreVideo();
      setActiveStory(null);
      return;
    }

    const src =
      storyMedia instanceof HTMLVideoElement
        ? storyMedia.currentSrc || storyMedia.src
        : storyMedia.currentSrc || storyMedia.src;

    const story = storiesRef.current.find((row) => {
      const expected = absoluteMedia(row.mediaUrl);
      return Boolean(expected && (src === expected || src.endsWith(row.mediaUrl)));
    });

    if (!story?.musicUrl) {
      restoreVideo();
      setActiveStory(null);
      return;
    }

    if (storyMedia instanceof HTMLVideoElement) {
      if (mutedVideoRef.current?.element !== storyMedia) {
        restoreVideo();
        mutedVideoRef.current = { element: storyMedia, muted: storyMedia.muted };
      }
      storyMedia.muted = true;
    } else {
      restoreVideo();
    }

    setActiveStory((current) => (current?.id === story.id ? current : story));
  }, []);

  useEffect(() => {
    void refreshStories().then(inspect);

    const scheduleInspect = () => {
      if (scheduledRef.current) return;
      scheduledRef.current = true;
      window.requestAnimationFrame(inspect);
    };

    const observer = new MutationObserver(scheduleInspect);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["src"] });

    const refresh = () => void refreshStories().then(scheduleInspect);
    window.addEventListener("roomkhoj:social-music-attached", refresh);
    window.addEventListener("focus", refresh);

    return () => {
      observer.disconnect();
      window.removeEventListener("roomkhoj:social-music-attached", refresh);
      window.removeEventListener("focus", refresh);
      restoreVideo();
    };
  }, [inspect, refreshStories]);

  if (!activeStory?.musicUrl) return null;

  return (
    <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+18px)] left-1/2 z-[270] w-[min(92vw,420px)] -translate-x-1/2 rounded-2xl bg-black/80 p-3 text-white shadow-2xl backdrop-blur">
      <div className="mb-2 flex items-center gap-2 text-xs">
        <Music2 className="h-4 w-4 shrink-0" />
        <span className="min-w-0 flex-1 truncate font-bold">
          {activeStory.musicTitle || "Story music"}
          {activeStory.musicArtist ? ` · ${activeStory.musicArtist}` : ""}
        </span>
      </div>
      <audio
        key={`${activeStory.id}-${activeStory.musicUrl}`}
        src={absoluteMedia(activeStory.musicUrl)}
        autoPlay
        loop
        controls
        playsInline
        className="h-9 w-full"
      />
    </div>
  );
}
