"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  Loader2,
  Music2,
  Play,
  Search,
  Sparkles,
  Volume2,
  X,
} from "lucide-react";
import { toast } from "sonner";

import {
  socialService,
  type StoryMusicTrack,
} from "@/http/services/social.service";

type CreateStoryPayload = {
  file: File;
  caption?: string;
  musicTrackId?: string;
  musicAutoSelected?: boolean;
};

export function StoryCreator({
  userName,
  myPhoto,
  onCreated,
}: {
  userName: string;
  myPhoto: string | null;
  onCreated: (payload: CreateStoryPayload) => void | Promise<void>;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [query, setQuery] = useState("");
  const [tracks, setTracks] = useState<StoryMusicTrack[]>([]);
  const [selected, setSelected] = useState<StoryMusicTrack | null>(null);
  const [autoSelected, setAutoSelected] = useState(false);
  const [musicConfigured, setMusicConfigured] = useState(true);
  const [musicLoading, setMusicLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const previewUrl = useMemo(
    () => (file ? URL.createObjectURL(file) : ""),
    [file],
  );

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    return () => {
      previewAudioRef.current?.pause();
      previewAudioRef.current = null;
    };
  }, []);

  const reset = () => {
    previewAudioRef.current?.pause();
    previewAudioRef.current = null;
    setFile(null);
    setCaption("");
    setQuery("");
    setTracks([]);
    setSelected(null);
    setAutoSelected(false);
    setMusicConfigured(true);
    setMusicLoading(false);
    setPublishing(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  const loadMusic = async (
    searchQuery = "",
    automatic = false,
  ) => {
    try {
      setMusicLoading(true);
      const result = await socialService.searchStoryMusic(searchQuery, {
        automatic,
        limit: 14,
      });

      setMusicConfigured(Boolean(result.configured));
      setTracks(result.tracks || []);

      if (automatic && result.tracks?.length) {
        setSelected(result.tracks[0]);
        setAutoSelected(true);
      }
    } catch {
      setTracks([]);
      setMusicConfigured(false);
    } finally {
      setMusicLoading(false);
    }
  };

  const chooseFile = (nextFile: File) => {
    setFile(nextFile);
    setCaption("");
    setQuery("");
    setTracks([]);
    setSelected(null);
    setAutoSelected(false);

    // First music choice is automatic. User can replace it or choose No music.
    void loadMusic("", true);
  };

  const previewTrack = (track: StoryMusicTrack) => {
    previewAudioRef.current?.pause();

    const audio = new Audio(track.audioUrl);
    audio.preload = "auto";
    audio.volume = 0.7;
    previewAudioRef.current = audio;
    void audio.play().catch(() => {
      toast.info("Tap the track again to preview audio.");
    });
  };

  const publish = async () => {
    if (!file || publishing) return;

    try {
      setPublishing(true);
      await onCreated({
        file,
        caption: caption.trim() || undefined,
        musicTrackId: selected?.trackId,
        musicAutoSelected: Boolean(selected && autoSelected),
      });
      reset();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          "Story upload गर्न सकिएन।",
      );
      setPublishing(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="relative h-[164px] w-[104px] shrink-0 overflow-hidden rounded-xl border bg-white shadow-sm"
      >
        <div className="flex h-[110px] items-center justify-center bg-slate-100">
          {myPhoto ? (
            <img
              src={myPhoto}
              alt={userName}
              className="h-14 w-14 rounded-full border border-slate-200 object-cover"
            />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-200 text-base font-bold text-slate-600">
              {userName.slice(0, 1).toUpperCase()}
            </div>
          )}
        </div>
        <span className="absolute left-1/2 top-[98px] flex h-10 w-10 -translate-x-1/2 items-center justify-center rounded-full border-4 border-white bg-red-600 text-white">
          <span className="text-3xl font-light leading-none">+</span>
        </span>
        <span className="absolute bottom-3 left-1 right-1 text-[13px] font-bold">
          Create story
        </span>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*,video/*"
        className="hidden"
        onChange={(event) => {
          const nextFile = event.target.files?.[0];
          if (nextFile) chooseFile(nextFile);
        }}
      />

      {file && (
        <div
          className="fixed inset-0 z-[260] flex flex-col bg-black/95 text-white"
          role="dialog"
          aria-modal="true"
          aria-label="Create story"
        >
          <div className="flex items-center justify-between border-b border-white/10 px-3 py-3">
            <div>
              <h2 className="text-base font-black">Create story</h2>
              <p className="text-xs text-white/60">
                Music automatically suggested — change it if you want.
              </p>
            </div>

            <button
              type="button"
              onClick={reset}
              disabled={publishing}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 disabled:opacity-50"
              aria-label="Close story creator"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto pb-32">
            <div className="mx-auto max-w-md p-3">
              <div className="relative overflow-hidden rounded-2xl bg-black">
                {file.type.startsWith("video/") ? (
                  <video
                    src={previewUrl}
                    autoPlay
                    muted
                    loop
                    playsInline
                    controls={false}
                    disablePictureInPicture
                    className="max-h-[48dvh] w-full object-contain"
                  />
                ) : (
                  <img
                    src={previewUrl}
                    alt="Story preview"
                    className="max-h-[48dvh] w-full object-contain"
                  />
                )}

                {selected && (
                  <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2 rounded-xl bg-black/65 px-3 py-2 backdrop-blur">
                    <Music2 className="h-4 w-4 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs font-bold">
                        {selected.title}
                      </div>
                      <div className="truncate text-[10px] text-white/65">
                        {selected.artist}
                        {autoSelected ? " · Auto selected" : ""}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <input
                value={caption}
                onChange={(event) => setCaption(event.target.value)}
                maxLength={500}
                placeholder="Add a caption (optional)"
                className="mt-3 w-full rounded-xl border border-white/10 bg-white/10 px-3 py-3 text-sm text-white outline-none placeholder:text-white/45"
              />

              <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 font-bold">
                      <Music2 className="h-4 w-4" />
                      Music
                    </div>
                    <p className="mt-0.5 text-[11px] text-white/55">
                      Auto select or search a song.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setQuery("");
                      void loadMusic("", true);
                    }}
                    disabled={musicLoading}
                    className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-2 text-xs font-bold disabled:opacity-50"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    Auto
                  </button>
                </div>

                <div className="mt-3 flex items-center gap-2 rounded-xl bg-white/10 px-3">
                  <Search className="h-4 w-4 text-white/55" />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        setAutoSelected(false);
                        void loadMusic(query, false);
                      }
                    }}
                    placeholder="Search music"
                    className="min-w-0 flex-1 bg-transparent py-2.5 text-sm outline-none placeholder:text-white/45"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setAutoSelected(false);
                      void loadMusic(query, false);
                    }}
                    className="text-xs font-bold text-white/80"
                  >
                    Search
                  </button>
                </div>

                {!musicConfigured ? (
                  <div className="mt-3 rounded-xl bg-amber-400/10 px-3 py-3 text-xs leading-5 text-amber-100">
                    Music API key अझै server मा सेट गरिएको छैन। Story चाहिँ music बिना post गर्न मिल्छ।
                  </div>
                ) : musicLoading ? (
                  <div className="flex justify-center py-6">
                    <Loader2 className="h-5 w-5 animate-spin" />
                  </div>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        previewAudioRef.current?.pause();
                        setSelected(null);
                        setAutoSelected(false);
                      }}
                      className={`mt-3 flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-left ${
                        !selected
                          ? "border-red-400 bg-red-500/15"
                          : "border-white/10 bg-white/5"
                      }`}
                    >
                      <div>
                        <div className="text-sm font-bold">No music</div>
                        <div className="text-[11px] text-white/50">
                          Keep original story audio only
                        </div>
                      </div>
                      {!selected && <Check className="h-4 w-4" />}
                    </button>

                    <div className="mt-2 max-h-64 space-y-1.5 overflow-y-auto">
                      {tracks.map((track) => {
                        const active =
                          selected?.trackId === track.trackId;

                        return (
                          <div
                            key={track.trackId}
                            className={`flex items-center gap-2 rounded-xl border p-2 ${
                              active
                                ? "border-red-400 bg-red-500/15"
                                : "border-white/10 bg-white/5"
                            }`}
                          >
                            {track.imageUrl ? (
                              <img
                                src={track.imageUrl}
                                alt=""
                                className="h-10 w-10 rounded-lg object-cover"
                              />
                            ) : (
                              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10">
                                <Music2 className="h-4 w-4" />
                              </div>
                            )}

                            <button
                              type="button"
                              onClick={() => {
                                setSelected(track);
                                setAutoSelected(false);
                              }}
                              className="min-w-0 flex-1 text-left"
                            >
                              <div className="truncate text-xs font-bold">
                                {track.title}
                              </div>
                              <div className="truncate text-[10px] text-white/55">
                                {track.artist}
                              </div>
                            </button>

                            <button
                              type="button"
                              onClick={() => previewTrack(track)}
                              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10"
                              aria-label={`Preview ${track.title}`}
                            >
                              {active ? (
                                <Volume2 className="h-4 w-4" />
                              ) : (
                                <Play className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="fixed inset-x-0 bottom-0 border-t border-white/10 bg-black/90 px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur">
            <button
              type="button"
              onClick={() => void publish()}
              disabled={publishing}
              className="mx-auto flex h-12 w-full max-w-md items-center justify-center rounded-xl bg-red-600 text-sm font-black text-white disabled:opacity-50"
            >
              {publishing ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                "Add to story"
              )}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
