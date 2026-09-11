"use client";

import { useEffect, useState } from "react";
import {
  getNetworkProfile,
  onNetworkProfileChange,
  type NetworkProfile,
} from "@/lib/network-quality";

function optimizeMedia(root: ParentNode, profile: NetworkProfile) {
  root.querySelectorAll<HTMLImageElement>("img").forEach((image) => {
    if (!image.loading) image.loading = "lazy";
    image.decoding = "async";
    if (profile.liteMode) image.fetchPriority = "low";
  });

  root.querySelectorAll<HTMLVideoElement>("video").forEach((video) => {
    video.preload = profile.liteMode ? "none" : "metadata";
    video.playsInline = true;

    // Feed previews should never consume bandwidth just because they entered the DOM.
    // Explicit story/video viewers can still start playback after user interaction.
    if (profile.liteMode && !video.closest("[data-roomkhoj-active-media='true']")) {
      video.autoplay = false;
    }
  });
}

export function FeedNetworkOptimizer() {
  const [profile, setProfile] = useState<NetworkProfile>(() => getNetworkProfile());

  useEffect(() => onNetworkProfileChange(() => setProfile(getNetworkProfile())), []);

  useEffect(() => {
    const root = document.querySelector("[data-roomkhoj-feed-root='true']");
    if (!root) return;

    optimizeMedia(root, profile);

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of Array.from(mutation.addedNodes)) {
          if (node instanceof Element) optimizeMedia(node, profile);
        }
      }
    });

    observer.observe(root, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [profile]);

  return profile.liteMode ? (
    <div className="mx-auto max-w-[720px] px-3 pt-2 text-center text-[11px] font-medium text-slate-500">
      Lite mode active · media loads only when needed
    </div>
  ) : null;
}
