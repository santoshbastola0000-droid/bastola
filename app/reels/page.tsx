"use client";

import Link from "next/link";
import {
  forwardRef,
  type MouseEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Heart,
  Loader2,
  MessageCircle,
  Plus,
  Send,
  Share2,
  Trash2,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";

import {
  socialService,
  type SocialComment,
  type SocialFeedItem,
  type SocialPost,
} from "@/http/services/social.service";
import { useUserStore } from "@/stores/user-store";

const backendUrl = String(
  process.env.NEXT_PUBLIC_BACKEND_URL || "https://api.roomkhoj.com",
).replace(/\/$/, "");

const MAX_REEL_UPLOAD_BYTES = 200 * 1024 * 1024;
const MAX_FALLBACK_REEL_UPLOAD_BYTES = 200 * 1024 * 1024;

function media(value?: string | null) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (/^(https?:)?\/\//i.test(raw)) {
    return raw.startsWith("//") ? `https:${raw}` : raw;
  }
  if (/^(data:|blob:)/i.test(raw)) return raw;
  return `${backendUrl}${raw.startsWith("/") ? raw : `/${raw}`}`;
}

type Reel = {
  id: string;
  post: SocialPost;
  url: string;
};

function reelsFromPost(post: SocialPost) {
  const result: Reel[] = [];

  post.mediaUrls.forEach((url, index) => {
    if (post.mediaTypes[index] !== "VIDEO") return;
    result.push({
      id: `${post.id}-${index}`,
      post,
      url,
    });
  });

  return result;
}

function reelsFromItems(items: SocialFeedItem[]) {
  const result: Reel[] = [];

  for (const item of items || []) {
    if (item.type !== "POST") continue;
    result.push(...reelsFromPost(item.post));
  }

  return result;
}

function mergeReels(current: Reel[], incoming: Reel[]) {
  const seen = new Set(current.map((item) => item.id));
  return [
    ...current,
    ...incoming.filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    }),
  ];
}

const HLS_JS_URL =
  "https://cdn.jsdelivr.net/npm/hls.js@1.7.3/dist/hls.min.js";
let hlsLoader: Promise<any> | null = null;

function isHlsUrl(value: string) {
  return /\.m3u8(?:$|\?)/i.test(String(value || ""));
}

function streamPoster(value: string) {
  if (!isHlsUrl(value)) return undefined;
  return value.replace(
    /\/manifest\/video\.m3u8(?:\?.*)?$/i,
    "/thumbnails/thumbnail.jpg?time=1s&height=720",
  );
}

function loadHlsJs() {
  if (typeof window === "undefined") return Promise.resolve(null);
  const existing = (window as any).Hls;
  if (existing) return Promise.resolve(existing);
  if (hlsLoader) return hlsLoader;

  hlsLoader = new Promise((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(
      `script[src="${HLS_JS_URL}"]`,
    );
    if (existingScript) {
      existingScript.addEventListener("load", () =>
        resolve((window as any).Hls || null),
      );
      existingScript.addEventListener("error", reject);
      return;
    }

    const script = document.createElement("script");
    script.src = HLS_JS_URL;
    script.async = true;
    script.crossOrigin = "anonymous";
    script.onload = () => resolve((window as any).Hls || null);
    script.onerror = reject;
    document.head.appendChild(script);
  });

  return hlsLoader;
}

const AdaptiveReelVideo = forwardRef<
  HTMLVideoElement,
  {
    source: string;
    muted: boolean;
    preload: "auto" | "metadata" | "none";
    onClick: (event: MouseEvent<HTMLVideoElement>) => void;
  }
>(function AdaptiveReelVideo(
  { source, muted, preload, onClick },
  forwardedRef,
) {
  const innerRef = useRef<HTMLVideoElement | null>(null);

  const setRef = useCallback(
    (node: HTMLVideoElement | null) => {
      innerRef.current = node;
      if (typeof forwardedRef === "function") forwardedRef(node);
      else if (forwardedRef) forwardedRef.current = node;
    },
    [forwardedRef],
  );

  useEffect(() => {
    const video = innerRef.current;
    if (!video || !source) return;

    let destroyed = false;
    let hls: any = null;

    if (!isHlsUrl(source)) {
      video.src = source;
      return;
    }

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = source;
      return;
    }

    void loadHlsJs()
      .then((Hls) => {
        if (destroyed || !Hls || !Hls.isSupported?.()) return;

        hls = new Hls({
          startLevel: -1,
          capLevelToPlayerSize: true,
          maxBufferLength: 8,
          maxMaxBufferLength: 16,
          backBufferLength: 3,
          abrEwmaDefaultEstimate: 1_500_000,
          enableWorker: true,
        });
        hls.attachMedia(video);
        hls.on(Hls.Events.MEDIA_ATTACHED, () => {
          if (!destroyed) hls.loadSource(source);
        });
        hls.on(Hls.Events.ERROR, (_event: unknown, data: any) => {
          if (!data?.fatal || destroyed) return;
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) hls.startLoad();
          else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
            hls.recoverMediaError();
          } else {
            hls.destroy();
          }
        });
      })
      .catch(() => undefined);

    return () => {
      destroyed = true;
      hls?.destroy?.();
    };
  }, [source]);

  return (
    <video
      ref={setRef}
      playsInline
      loop
      muted={muted}
      preload={preload}
      poster={streamPoster(source)}
      controls={false}
      disablePictureInPicture
      onContextMenu={(event) => event.preventDefault()}
      onClick={onClick}
      className="h-full w-full bg-black object-contain"
    />
  );
});

function timeAgo(value: string) {
  const time = new Date(value).getTime();
  const seconds = Math.max(1, Math.floor((Date.now() - time) / 1000));
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

export default function ReelsPage() {
  const { user, isLoaded } = useUserStore();

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [reels, setReels] = useState<Reel[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [soundOn, setSoundOn] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const fastReelsApiAvailable = useRef<boolean | null>(null);

  const fetchReelPage = useCallback(async (before?: string) => {
    if (fastReelsApiAvailable.current !== false) {
      try {
        const result = await socialService.reels(before, 12);
        fastReelsApiAvailable.current = true;
        return result;
      } catch {
        // Keep Reels working while an older API deployment is still live.
        fastReelsApiAvailable.current = false;
      }
    }

    return socialService.feed(before);
  }, []);

  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState("");
  const [uploadCaption, setUploadCaption] = useState("");
  const [uploadVisibility, setUploadVisibility] = useState<"PUBLIC" | "FRIENDS">(
    "PUBLIC",
  );
  const [uploading, setUploading] = useState(false);
  const [uploadStage, setUploadStage] = useState("");
  const [uploadError, setUploadError] = useState("");

  const [commentsPostId, setCommentsPostId] = useState<string | null>(null);
  const [comments, setComments] = useState<SocialComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [commentSending, setCommentSending] = useState(false);

  const updatePost = useCallback(
    (postId: string, updater: (post: SocialPost) => SocialPost) => {
      setReels((current) =>
        current.map((reel) =>
          reel.post.id === postId
            ? { ...reel, post: updater(reel.post) }
            : reel,
        ),
      );
    },
    [],
  );

  useEffect(() => {
    if (!isLoaded) return;
    if (!user) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const params =
          typeof window !== "undefined"
            ? new URLSearchParams(window.location.search)
            : new URLSearchParams();
        const requestedPostId = params.get("post");
        const requestedMediaIndex = Number(params.get("media"));

        // Fetch the selected deep-link post and the first video-only page in
        // parallel. The first visible reel no longer waits for 4-5 feed requests.
        const [requestedPost, firstPage] = await Promise.all([
          requestedPostId
            ? socialService.post(requestedPostId).catch(() => null)
            : Promise.resolve(null),
          fetchReelPage(),
        ]);

        let pinned: Reel[] = [];
        if (requestedPost) {
          const requestedReels = reelsFromPost(requestedPost);
          const requestedId =
            Number.isInteger(requestedMediaIndex) && requestedMediaIndex >= 0
              ? `${requestedPost.id}-${requestedMediaIndex}`
              : null;
          const selected = requestedId
            ? requestedReels.find((item) => item.id === requestedId)
            : requestedReels[0];

          pinned = selected
            ? [
                selected,
                ...requestedReels.filter((item) => item.id !== selected.id),
              ]
            : requestedReels;
        }

        let next = firstPage.nextCursor || undefined;
        let collected = reelsFromItems(firstPage.items || []);

        // Old API fallback can return a page without a video. Only in that case
        // walk a couple more pages; the new /social/reels endpoint never needs it.
        for (
          let page = 0;
          collected.length === 0 && next && page < 2;
          page += 1
        ) {
          const result = await fetchReelPage(next);
          collected = mergeReels(collected, reelsFromItems(result.items || []));
          next = result.nextCursor || undefined;
        }

        if (cancelled) return;
        const combined = mergeReels(pinned, collected);
        setReels(combined);
        setCursor(next || null);
        setHasMore(Boolean(next));
        setActiveId(combined[0]?.id || null);
      } catch {
        if (!cancelled) {
          setReels([]);
          setCursor(null);
          setHasMore(false);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [fetchReelPage, isLoaded, user, refreshKey]);

  useEffect(() => {
    const nodes = Array.from(
      document.querySelectorAll<HTMLElement>("[data-reel-id]"),
    );
    if (!nodes.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (visible && visible.intersectionRatio >= 0.6) {
          const id = (visible.target as HTMLElement).dataset.reelId;
          if (id) setActiveId(id);
        }
      },
      {
        threshold: [0.4, 0.6, 0.8, 1],
      },
    );

    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [reels]);

  useEffect(() => {
    Object.entries(videoRefs.current).forEach(([id, video]) => {
      if (!video) return;

      if (id === activeId) {
        video.muted = !soundOn;
        void video.play().catch(() => {
          // iOS/browser autoplay rules can reject audio autoplay. Keep the stream
          // moving by falling back to muted autoplay.
          video.muted = true;
          setSoundOn(false);
          void video.play().catch(() => undefined);
        });
      } else {
        video.pause();
      }
    });
  }, [activeId, soundOn]);

  const loadMore = useCallback(async () => {
    if (!user || !hasMore || !cursor || loadingMore) return;

    setLoadingMore(true);
    try {
      let next: string | undefined = cursor;
      let collected: Reel[] = [];

      // The dedicated endpoint already returns video posts only, so one request
      // normally fills the next batch. Fallback pages are only walked when an
      // older backend returns no videos at all.
      for (let page = 0; page < 3 && collected.length === 0; page += 1) {
        const result = await fetchReelPage(next);
        collected = mergeReels(collected, reelsFromItems(result.items || []));
        next = result.nextCursor || undefined;
        if (!next) break;
      }

      setReels((current) => mergeReels(current, collected));
      setCursor(next || null);
      setHasMore(Boolean(next));
    } finally {
      setLoadingMore(false);
    }
  }, [cursor, fetchReelPage, hasMore, loadingMore, user]);

  useEffect(() => {
    if (!activeId || reels.length < 2) return;
    const index = reels.findIndex((item) => item.id === activeId);
    if (index >= Math.max(0, reels.length - 3)) {
      void loadMore();
    }
  }, [activeId, loadMore, reels]);

  useEffect(() => {
    if (!uploadFile) {
      setUploadPreview("");
      return;
    }

    const objectUrl = URL.createObjectURL(uploadFile);
    setUploadPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [uploadFile]);

  const empty = useMemo(
    () => !loading && reels.length === 0,
    [loading, reels.length],
  );
  const activeIndex = useMemo(
    () => Math.max(0, reels.findIndex((item) => item.id === activeId)),
    [activeId, reels],
  );

  const toggleSound = () => {
    setSoundOn((value) => !value);
  };

  const toggleLike = async (post: SocialPost) => {
    const wasLiked = Boolean(post.likedByMe);
    const oldCount = Number(post.likeCount || 0);

    updatePost(post.id, (current) => ({
      ...current,
      likedByMe: !wasLiked,
      reactionByMe: wasLiked ? null : "LOVE",
      likeCount: Math.max(0, oldCount + (wasLiked ? -1 : 1)),
    }));

    try {
      const result = wasLiked
        ? await socialService.removeLike(post.id)
        : await socialService.toggleLike(post.id, "LOVE");

      updatePost(post.id, (current) => ({
        ...current,
        likedByMe: Boolean(result.liked),
        reactionByMe: result.reaction,
        likeCount: Number(result.likeCount || 0),
      }));
    } catch {
      updatePost(post.id, (current) => ({
        ...current,
        likedByMe: wasLiked,
        reactionByMe: post.reactionByMe || null,
        likeCount: oldCount,
      }));
    }
  };

  const deleteReel = async (post: SocialPost) => {
    if (String(post.author?.id || post.userId) !== String(user?.id || "")) return;
    if (!window.confirm("Delete this reel?")) return;

    try {
      await socialService.deletePost(post.id);
      setReels((current) =>
        current.filter((item) => item.post.id !== post.id),
      );
      if (commentsPostId === post.id) {
        setCommentsPostId(null);
        setComments([]);
      }
    } catch (error: any) {
      const message = error?.response?.data?.message;
      window.alert(
        String(message || "Reel delete गर्न सकिएन। फेरि try गर्नुहोस्।"),
      );
    }
  };

  const shareReel = async (post: SocialPost) => {
    const url = `${window.location.origin}/reels?post=${post.id}`;
    const native = Boolean(navigator.share);

    try {
      if (navigator.share) {
        await navigator.share({
          title: "RoomKhoj reel",
          text: post.content || "Watch this RoomKhoj reel",
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);
      }

      const result = await socialService.registerShare(
        post.id,
        native ? "native" : "copy-link",
      );
      updatePost(post.id, (current) => ({
        ...current,
        shareCount: Number(result.shareCount || current.shareCount || 0),
      }));
    } catch {
      // Native share sheets are commonly cancelled by users; no error UI needed.
    }
  };

  const openComments = async (postId: string) => {
    setCommentsPostId(postId);
    setComments([]);
    setCommentText("");
    setCommentsLoading(true);
    try {
      setComments(await socialService.comments(postId));
    } finally {
      setCommentsLoading(false);
    }
  };

  const submitComment = async () => {
    if (!commentsPostId || !commentText.trim() || commentSending) return;

    const value = commentText.trim();
    setCommentSending(true);
    try {
      const created = await socialService.addComment(commentsPostId, value);
      setComments((current) => [...current, created]);
      setCommentText("");
      updatePost(commentsPostId, (current) => ({
        ...current,
        commentCount: Number(current.commentCount || 0) + 1,
      }));
    } finally {
      setCommentSending(false);
    }
  };

  const closeUpload = () => {
    if (uploading) return;
    setUploadFile(null);
    setUploadCaption("");
    setUploadVisibility("PUBLIC");
    setUploadError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const publishReel = async () => {
    if (!uploadFile || uploading) return;

    setUploading(true);
    setUploadStage("Preparing fast video upload…");
    setUploadError("");
    try {
      const stream = await socialService
        .createStreamUpload({
          name: uploadFile.name,
          maxDurationSeconds: 600,
        })
        .catch(() => ({ configured: false, uid: null, uploadURL: null }));

      if (stream.configured && stream.uid && stream.uploadURL) {
        setUploadStage("Uploading video to CDN…");
        const form = new FormData();
        form.append("file", uploadFile);

        let uploadResponse: Response | null = null;
        try {
          uploadResponse = await fetch(stream.uploadURL, {
            method: "POST",
            body: form,
          });
        } catch {
          uploadResponse = null;
        }

        let uploadedViaFallback = false;
        if (!uploadResponse || !uploadResponse.ok) {
          if (uploadFile.size > MAX_FALLBACK_REEL_UPLOAD_BYTES) {
            const statusText = uploadResponse
              ? ` (${uploadResponse.status})`
              : "";
            throw new Error(
              `Fast video upload failed${statusText}. 200 MB भन्दा सानो video try गर्नुहोस् वा फेरि प्रयास गर्नुहोस्।`,
            );
          }

          setUploadStage("Fast upload unavailable — using backup upload…");
          await socialService.createPost({
            content: uploadCaption.trim(),
            visibility: uploadVisibility,
            files: [uploadFile],
          });
          uploadedViaFallback = true;
        }

        if (!uploadedViaFallback) {
          setUploadStage("Optimizing video for fast playback…");
          let finalized:
            | Awaited<ReturnType<typeof socialService.finalizeStreamPost>>
            | undefined;

          for (let attempt = 0; attempt < 45; attempt += 1) {
            finalized = await socialService.finalizeStreamPost({
              uid: stream.uid,
              content: uploadCaption.trim(),
              visibility: uploadVisibility,
            });
            if (finalized.ready) break;
            await new Promise((resolve) =>
              window.setTimeout(resolve, attempt < 8 ? 1000 : 2000),
            );
          }

          if (!finalized?.ready) {
            throw new Error(
              "Video upload भयो तर processing अझै सकिएको छैन। केही समयपछि फेरि try गर्नुहोस्।",
            );
          }
        }
      } else {
        if (uploadFile.size > MAX_FALLBACK_REEL_UPLOAD_BYTES) {
          throw new Error(
            "Fast video upload अहिले उपलब्ध छैन। 200 MB भन्दा सानो video try गर्नुहोस् वा फेरि प्रयास गर्नुहोस्।",
          );
        }
        setUploadStage("Uploading reel…");
        await socialService.createPost({
          content: uploadCaption.trim(),
          visibility: uploadVisibility,
          files: [uploadFile],
        });
      }

      setUploadFile(null);
      setUploadCaption("");
      setUploadVisibility("PUBLIC");
      setUploadStage("");
      setUploadError("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      setRefreshKey((value) => value + 1);
    } catch (error: any) {
      const status = Number(error?.response?.status || 0);
      const rawMessage = error?.response?.data?.message;
      const message = Array.isArray(rawMessage)
        ? rawMessage.join(", ")
        : String(rawMessage || "").trim();
      const localMessage = String(error?.message || "").trim();

      if (status === 413) {
        setUploadError("Video धेरै ठूलो छ। 200 MB भन्दा सानो reel upload गर्नुहोस्।");
      } else if (status === 401) {
        setUploadError("Session expire भएको छ। फेरि login गरेर upload गर्नुहोस्।");
      } else if (message) {
        setUploadError(message);
      } else if (
        localMessage &&
        !["Failed to fetch", "Network Error"].includes(localMessage)
      ) {
        setUploadError(localMessage);
      } else if (!error?.response) {
        setUploadError(
          "Upload server सम्म पुग्न सकेन। Internet check गरेर फेरि try गर्नुहोस्।",
        );
      } else {
        setUploadError("Reel upload failed. Please try again.");
      }
    } finally {
      setUploading(false);
      setUploadStage("");
    }
  };

  if (!isLoaded || loading) {
    return (
      <div className="fixed inset-0 z-30 flex items-center justify-center bg-black text-white">
        <Loader2 className="h-7 w-7 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <main className="fixed inset-0 z-30 flex flex-col items-center justify-center bg-black px-6 text-center text-white">
        <h1 className="text-2xl font-black">Reels</h1>
        <p className="mt-2 max-w-sm text-sm text-white/65">
          Reels हेर्न र upload गर्न login गर्नुहोस्।
        </p>
        <Link
          href="/login?redirect=/reels"
          className="mt-5 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-black"
        >
          Log in
        </Link>
      </main>
    );
  }

  return (
    <>
      <main className="fixed inset-0 z-30 bg-black text-white">
        <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-center justify-center bg-gradient-to-b from-black/60 to-transparent px-4 pb-10 pt-[calc(0.75rem+env(safe-area-inset-top))]">
          <Link
            href="/live"
            className="pointer-events-auto absolute left-4 top-[calc(0.65rem+env(safe-area-inset-top))] rounded-full bg-red-600 px-3 py-2 text-[12px] font-black tracking-wide text-white shadow-lg"
          >
            LIVE
          </Link>

          <div className="pointer-events-auto rounded-full bg-black/25 px-4 py-2 text-[15px] font-black tracking-tight backdrop-blur-sm">
            For You
          </div>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="pointer-events-auto absolute right-4 top-[calc(0.65rem+env(safe-area-inset-top))] flex h-10 w-10 items-center justify-center rounded-full bg-black/45 text-white shadow-lg backdrop-blur"
            aria-label="Upload reel"
          >
            <Plus className="h-6 w-6" strokeWidth={2.6} />
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="video/*,.mp4,.mov,.m4v,.webm"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0] || null;
              setUploadError("");

              if (file && file.size > MAX_REEL_UPLOAD_BYTES) {
                setUploadFile(null);
                setUploadError("Reel 200 MB भन्दा सानो हुनुपर्छ।");
                event.target.value = "";
                return;
              }

              setUploadFile(file);
            }}
          />
        </div>

        {empty ? (
          <div className="flex h-[100dvh] flex-col items-center justify-center px-6 pb-24 text-center">
            <h1 className="text-2xl font-black">Reels</h1>
            <p className="mt-2 max-w-sm text-sm text-white/65">
              अहिलेसम्म video reel छैन। माथिको + थिचेर पहिलो reel हाल्नुहोस्।
            </p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mt-5 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-black"
            >
              Upload Reel
            </button>
          </div>
        ) : (
          <div className="h-[100dvh] snap-y snap-mandatory overflow-y-auto overscroll-y-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {reels.map((reel, reelIndex) => {
              const active = activeId === reel.id;
              const liked = Boolean(reel.post.likedByMe);

              return (
                <section
                  key={reel.id}
                  data-reel-id={reel.id}
                  className="relative h-[100dvh] snap-start snap-always overflow-hidden bg-black"
                >
                  <AdaptiveReelVideo
                    ref={(node) => {
                      videoRefs.current[reel.id] = node;
                    }}
                    source={media(reel.url)}
                    muted={!soundOn}
                    preload={
                      reelIndex >= activeIndex - 1 && reelIndex <= activeIndex + 2
                        ? "auto"
                        : "none"
                    }
                    onClick={(event) => {
                      const video = event.currentTarget;
                      if (video.paused) {
                        void video.play().catch(() => undefined);
                      } else {
                        video.pause();
                      }
                    }}
                  />

                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[48%] bg-gradient-to-t from-black/85 via-black/25 to-transparent" />

                  <button
                    type="button"
                    onClick={toggleSound}
                    className="absolute right-4 top-[calc(4.25rem+env(safe-area-inset-top))] z-20 flex h-9 w-9 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur"
                    aria-label={soundOn ? "Mute reel" : "Unmute reel"}
                  >
                    {soundOn ? (
                      <Volume2 className="h-5 w-5" />
                    ) : (
                      <VolumeX className="h-5 w-5" />
                    )}
                  </button>

                  <div className="absolute bottom-[calc(6.7rem+env(safe-area-inset-bottom))] left-4 right-[5.4rem] z-20">
                    <Link
                      href={`/profile/${reel.post.author.id}`}
                      className="inline-flex max-w-full items-center gap-2.5"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/70 bg-white/15 text-sm font-black">
                        {reel.post.author.profilePhotoUrl ? (
                          <img
                            src={media(reel.post.author.profilePhotoUrl)}
                            alt={reel.post.author.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          reel.post.author.name.slice(0, 1).toUpperCase()
                        )}
                      </div>
                      <span className="truncate text-[15px] font-black drop-shadow">
                        @{reel.post.author.name.replace(/\s+/g, "")}
                      </span>
                    </Link>

                    {reel.post.content && (
                      <p className="mt-2 line-clamp-3 whitespace-pre-wrap text-[14px] font-medium leading-5 text-white drop-shadow">
                        {reel.post.content}
                      </p>
                    )}

                    <div className="mt-2 text-[11px] font-semibold text-white/65">
                      {timeAgo(reel.post.createdAt)} · RoomKhoj Reels
                    </div>
                  </div>

                  <div className="absolute bottom-[calc(7rem+env(safe-area-inset-bottom))] right-3 z-20 flex flex-col items-center gap-5">
                    <button
                      type="button"
                      onClick={() => void toggleLike(reel.post)}
                      className="text-center"
                      aria-label={liked ? "Unlike reel" : "Like reel"}
                    >
                      <Heart
                        className={`mx-auto h-8 w-8 drop-shadow ${liked ? "fill-red-500 text-red-500" : "text-white"}`}
                        strokeWidth={2.1}
                      />
                      <span className="mt-1 block min-w-8 text-[11px] font-bold drop-shadow">
                        {Number(reel.post.likeCount || 0)}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => void openComments(reel.post.id)}
                      className="text-center"
                      aria-label="Open comments"
                    >
                      <MessageCircle
                        className="mx-auto h-8 w-8 text-white drop-shadow"
                        strokeWidth={2.1}
                      />
                      <span className="mt-1 block min-w-8 text-[11px] font-bold drop-shadow">
                        {Number(reel.post.commentCount || 0)}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => void shareReel(reel.post)}
                      className="text-center"
                      aria-label="Share reel"
                    >
                      <Share2
                        className="mx-auto h-8 w-8 text-white drop-shadow"
                        strokeWidth={2.1}
                      />
                      <span className="mt-1 block min-w-8 text-[11px] font-bold drop-shadow">
                        {Number(reel.post.shareCount || 0)}
                      </span>
                    </button>

                    {String(reel.post.author?.id || reel.post.userId) ===
                      String(user?.id || "") && (
                      <button
                        type="button"
                        onClick={() => void deleteReel(reel.post)}
                        className="text-center text-red-400"
                        aria-label="Delete reel"
                      >
                        <Trash2
                          className="mx-auto h-8 w-8 drop-shadow"
                          strokeWidth={2.1}
                        />
                        <span className="mt-1 block min-w-8 text-[11px] font-bold drop-shadow">
                          Delete
                        </span>
                      </button>
                    )}
                  </div>
                </section>
              );
            })}

            {loadingMore && (
              <div className="pointer-events-none fixed bottom-[calc(6.25rem+env(safe-area-inset-bottom))] left-1/2 z-30 -translate-x-1/2 rounded-full bg-black/55 p-2 backdrop-blur">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            )}
          </div>
        )}
      </main>

      {commentsPostId && (
        <div
          className="fixed inset-0 z-[70] flex items-end bg-black/45"
          onClick={() => setCommentsPostId(null)}
        >
          <section
            className="flex max-h-[72dvh] w-full flex-col rounded-t-[28px] bg-white text-slate-950 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="relative flex items-center justify-center border-b px-4 py-4">
              <h2 className="text-[15px] font-black">
                {comments.length} Comments
              </h2>
              <button
                type="button"
                onClick={() => setCommentsPostId(null)}
                className="absolute right-4 rounded-full p-2 hover:bg-slate-100"
                aria-label="Close comments"
              >
                <X className="h-5 w-5" />
              </button>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
              {commentsLoading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
                </div>
              ) : comments.length ? (
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-200 text-xs font-black">
                        {comment.author.profilePhotoUrl ? (
                          <img
                            src={media(comment.author.profilePhotoUrl)}
                            alt={comment.author.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          comment.author.name.slice(0, 1).toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-black">
                          {comment.author.name}
                        </div>
                        <p className="mt-0.5 whitespace-pre-wrap break-words text-[14px] leading-5">
                          {comment.content}
                        </p>
                        <div className="mt-1 text-[10px] font-semibold text-slate-400">
                          {timeAgo(comment.createdAt)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-10 text-center text-sm font-semibold text-slate-400">
                  No comments yet
                </div>
              )}
            </div>

            <div className="flex items-end gap-2 border-t bg-white px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3">
              <textarea
                value={commentText}
                onChange={(event) => setCommentText(event.target.value)}
                onKeyDown={(event) => {
                  if (
                    event.key === "Enter" &&
                    !event.shiftKey &&
                    commentText.trim()
                  ) {
                    event.preventDefault();
                    void submitComment();
                  }
                }}
                rows={1}
                placeholder="Add comment..."
                className="max-h-28 min-h-10 flex-1 resize-none rounded-2xl bg-slate-100 px-4 py-2.5 text-[14px] outline-none ring-red-500 focus:ring-2"
              />
              <button
                type="button"
                disabled={!commentText.trim() || commentSending}
                onClick={() => void submitComment()}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-red-600 text-white disabled:opacity-40"
                aria-label="Post comment"
              >
                {commentSending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </button>
            </div>
          </section>
        </div>
      )}

      {uploadFile && (
        <div className="fixed inset-0 z-[80] flex flex-col bg-black text-white">
          <header className="flex items-center justify-between px-4 pb-3 pt-[calc(0.75rem+env(safe-area-inset-top))]">
            <button
              type="button"
              disabled={uploading}
              onClick={closeUpload}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 disabled:opacity-50"
              aria-label="Close reel upload"
            >
              <X className="h-6 w-6" />
            </button>
            <div className="text-[16px] font-black">New Reel</div>
            <button
              type="button"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
              className="text-sm font-bold text-white/80 disabled:opacity-50"
            >
              Change
            </button>
          </header>

          <div className="min-h-0 flex-1 px-3">
            {uploadPreview && (
              <video
                src={uploadPreview}
                playsInline
                autoPlay
                loop
                muted
                controls={false}
                className="h-full w-full rounded-2xl bg-black object-contain"
              />
            )}
          </div>

          <div className="space-y-3 bg-gradient-to-t from-black via-black to-black/80 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4">
            <textarea
              value={uploadCaption}
              onChange={(event) => setUploadCaption(event.target.value)}
              placeholder="Write a caption..."
              rows={2}
              className="w-full resize-none rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-white outline-none placeholder:text-white/45 focus:border-white/40"
            />

            <div className="flex items-center gap-2">
              <select
                value={uploadVisibility}
                onChange={(event) =>
                  setUploadVisibility(
                    event.target.value as "PUBLIC" | "FRIENDS",
                  )
                }
                className="h-11 flex-1 rounded-xl border border-white/15 bg-white/10 px-3 text-sm font-bold text-white outline-none"
              >
                <option className="text-black" value="PUBLIC">
                  Public
                </option>
                <option className="text-black" value="FRIENDS">
                  Friends
                </option>
              </select>

              <button
                type="button"
                disabled={uploading}
                onClick={() => void publishReel()}
                className="flex h-11 min-w-32 items-center justify-center rounded-xl bg-red-600 px-5 text-sm font-black text-white disabled:opacity-60"
              >
                {uploading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  "Post Reel"
                )}
              </button>
            </div>

            {uploadStage && (
              <p className="text-center text-xs font-semibold text-white/70">
                {uploadStage}
              </p>
            )}

            {uploadError && (
              <p className="text-center text-xs font-semibold text-red-400">
                {uploadError}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
