import type { SocialMusic } from "@/http/services/social.service";

export type SocialMusicTarget = "post" | "story";

const keyFor = (target: SocialMusicTarget) => `roomkhoj_social_music_${target}`;

export function getPendingSocialMusic(target: SocialMusicTarget): SocialMusic | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(keyFor(target));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SocialMusic;
    return parsed?.musicUrl ? parsed : null;
  } catch {
    return null;
  }
}

export function setPendingSocialMusic(target: SocialMusicTarget, music: SocialMusic | null) {
  if (typeof window === "undefined") return;
  if (!music?.musicUrl) {
    sessionStorage.removeItem(keyFor(target));
    window.dispatchEvent(new CustomEvent("roomkhoj:social-music-changed"));
    return;
  }
  sessionStorage.setItem(keyFor(target), JSON.stringify(music));
  window.dispatchEvent(new CustomEvent("roomkhoj:social-music-changed"));
}

export function clearPendingSocialMusic(target: SocialMusicTarget) {
  setPendingSocialMusic(target, null);
}
