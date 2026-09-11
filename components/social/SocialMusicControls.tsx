"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Music2, X } from "lucide-react";
import { toast } from "sonner";

import { socialService, type SocialMusic } from "@/http/services/social.service";
import {
  clearPendingSocialMusic,
  getPendingSocialMusic,
  setPendingSocialMusic,
  type SocialMusicTarget,
} from "@/lib/social-music-selection";

const acceptAudio = "audio/*,.mp3,.m4a,.aac,.wav,.ogg,.oga,.webm";

function TrackChip({
  target,
  music,
  onClear,
}: {
  target: SocialMusicTarget;
  music: SocialMusic | null;
  onClear: () => void;
}) {
  if (!music?.musicUrl) return null;
  return (
    <div className="mt-2 flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-700">
      <Music2 className="h-4 w-4 shrink-0 text-red-600" />
      <div className="min-w-0 flex-1">
        <div className="truncate font-bold">{music.musicTitle || "Selected music"}</div>
        <div className="text-[11px] text-slate-500">
          Will be added to your next {target}
        </div>
      </div>
      <button
        type="button"
        onClick={onClear}
        aria-label={`Remove ${target} music`}
        className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-slate-200"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export function SocialMusicControls() {
  const postInput = useRef<HTMLInputElement>(null);
  const storyInput = useRef<HTMLInputElement>(null);
  const [postMusic, setPostMusic] = useState<SocialMusic | null>(null);
  const [storyMusic, setStoryMusic] = useState<SocialMusic | null>(null);
  const [uploading, setUploading] = useState<SocialMusicTarget | null>(null);

  const sync = () => {
    setPostMusic(getPendingSocialMusic("post"));
    setStoryMusic(getPendingSocialMusic("story"));
  };

  useEffect(() => {
    sync();
    window.addEventListener("roomkhoj:social-music-changed", sync);
    window.addEventListener("roomkhoj:social-music-attached", sync);
    return () => {
      window.removeEventListener("roomkhoj:social-music-changed", sync);
      window.removeEventListener("roomkhoj:social-music-attached", sync);
    };
  }, []);

  const selectMusic = async (target: SocialMusicTarget, file?: File) => {
    if (!file) return;
    if (file.size > 25 * 1024 * 1024) {
      toast.error("Music file 25 MB भन्दा सानो हुनुपर्छ");
      return;
    }

    try {
      setUploading(target);
      const music = await socialService.uploadMusic(file);
      setPendingSocialMusic(target, music);
      if (target === "post") setPostMusic(music);
      else setStoryMusic(music);
      toast.success(`${target === "post" ? "Post" : "Story"} music selected`, {
        description: "अब post/story publish गर्दा यो music automatically attach हुन्छ।",
      });
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Music upload failed");
    } finally {
      setUploading(null);
    }
  };

  const clear = (target: SocialMusicTarget) => {
    clearPendingSocialMusic(target);
    if (target === "post") setPostMusic(null);
    else setStoryMusic(null);
  };

  return (
    <section className="mx-auto mb-2 max-w-[720px] border-y bg-white px-3 py-3 shadow-sm sm:rounded-xl sm:border">
      <div className="flex items-center gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600">
          <Music2 className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-bold text-slate-950">Add music</div>
          <div className="text-[11px] leading-4 text-slate-500">
            Music छान्नुहोस्, अनि आफ्नो next Post वा Story publish गर्नुहोस्।
          </div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => postInput.current?.click()}
          disabled={uploading !== null}
          className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-bold hover:bg-slate-50 disabled:opacity-50"
        >
          {uploading === "post" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Music2 className="h-4 w-4 text-red-600" />}
          Post music
        </button>
        <button
          type="button"
          onClick={() => storyInput.current?.click()}
          disabled={uploading !== null}
          className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-bold hover:bg-slate-50 disabled:opacity-50"
        >
          {uploading === "story" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Music2 className="h-4 w-4 text-red-600" />}
          Story music
        </button>
      </div>

      <input
        ref={postInput}
        type="file"
        accept={acceptAudio}
        className="hidden"
        onChange={async (event) => {
          await selectMusic("post", event.target.files?.[0]);
          event.target.value = "";
        }}
      />
      <input
        ref={storyInput}
        type="file"
        accept={acceptAudio}
        className="hidden"
        onChange={async (event) => {
          await selectMusic("story", event.target.files?.[0]);
          event.target.value = "";
        }}
      />

      <TrackChip target="post" music={postMusic} onClear={() => clear("post")} />
      <TrackChip target="story" music={storyMusic} onClear={() => clear("story")} />
    </section>
  );
}
