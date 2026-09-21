"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Heart, MessageCircle, Share2, X } from "lucide-react";
import {
  SocialComment,
  SocialReactionEntry,
  SocialReactionType,
  socialService,
} from "@/http/services/social.service";
import { syntheticBotAvatarDataUrl } from "@/lib/synthetic-bot-avatar";

const backendUrl = String(
  process.env.NEXT_PUBLIC_BACKEND_URL || "https://api.roomkhoj.com",
).replace(/\/$/, "");

const REACTIONS: Array<{ type: SocialReactionType; emoji: string; label: string }> = [
  { type: "LIKE", emoji: "👍", label: "Like" },
  { type: "LOVE", emoji: "❤️", label: "Love" },
  { type: "HAHA", emoji: "😂", label: "Haha" },
  { type: "WOW", emoji: "😮", label: "Wow" },
  { type: "SAD", emoji: "😢", label: "Sad" },
  { type: "ANGRY", emoji: "😡", label: "Angry" },
];

function profilePhoto(value?: string | null) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  return `${backendUrl}${raw.startsWith("/") ? raw : `/${raw}`}`;
}

function reactionButtonColor(reaction: SocialReactionType | null) {
  if (reaction === "LIKE") return "text-red-600";
  if (reaction === "LOVE") return "text-red-500";
  if (reaction === "HAHA" || reaction === "WOW" || reaction === "SAD") return "text-amber-600";
  if (reaction === "ANGRY") return "text-orange-600";
  return "text-slate-600";
}

export function PostReactions({
  postId,
  currentUserId,
  initialLikeCount,
  initialLiked,
  commentCount,
  shareCount,
  onToggleComments,
  onShare,
}: {
  postId: string;
  currentUserId: string;
  initialLikeCount: number;
  initialLiked: boolean;
  commentCount: number;
  shareCount: number;
  onToggleComments: () => void | Promise<void>;
  onShare: () => void | Promise<void>;
}) {
  const [liked, setLiked] = useState(initialLiked);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [reaction, setReaction] = useState<SocialReactionType | null>(initialLiked ? "LIKE" : null);
  const [likers, setLikers] = useState<SocialReactionEntry[]>([]);
  const [commentPreview, setCommentPreview] = useState<SocialComment[]>([]);
  const [commentPreviewLoaded, setCommentPreviewLoaded] = useState(commentCount <= 0);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [listOpen, setListOpen] = useState(false);
  const [loadingList, setLoadingList] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState<"ALL" | SocialReactionType>("ALL");
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressed = useRef(false);
  const activePostId = useRef(postId);
  const submittingRef = useRef(false);
  const interactionVersionRef = useRef(0);
  const commentPreviewAnchor = useRef<HTMLDivElement | null>(null);

  const loadLikers = async (limit = 3, syncMyReaction = true) => {
    const requestVersion = interactionVersionRef.current;
    try {
      const rows = await socialService.likes(postId, 100);
      setLikers(rows.slice(0, limit));

      // The reactions endpoint is capped, so absence from this list must never
      // be interpreted as "not liked". The feed response and mutation summary
      // are authoritative for liked/count state. We only use the list to recover
      // the exact reaction emoji when this user's row is present.
      if (syncMyReaction && requestVersion === interactionVersionRef.current) {
        const mine = rows.find((entry) => String(entry.user.id) === String(currentUserId));
        if (mine) {
          setLiked(true);
          setReaction(mine.reaction);
        }
      }
    } catch {
      // Keep the locally known state if the list call fails.
    }
  };

  useEffect(() => {
    if (activePostId.current !== postId) {
      interactionVersionRef.current += 1;
      activePostId.current = postId;
      setLikeCount(initialLikeCount);
      setLiked(initialLiked);
      setReaction(initialLiked ? "LIKE" : null);
    }
    void loadLikers(3, true);
    // Do not reset local reaction state merely because the parent feed still has stale
    // initialLikeCount/initialLiked values after an optimistic update.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId, currentUserId]);

  useEffect(() => {
    setCommentPreview([]);
    setCommentPreviewLoaded(commentCount <= 0);
    if (commentCount <= 0) return;

    const node = commentPreviewAnchor.current;
    if (!node) return;

    let cancelled = false;
    let observer: IntersectionObserver | null = null;

    const loadComments = async () => {
      try {
        const rows = await socialService.comments(postId);
        if (!cancelled) setCommentPreview(rows.slice(-2));
      } catch {
        if (!cancelled) setCommentPreview([]);
      } finally {
        if (!cancelled) setCommentPreviewLoaded(true);
      }
    };

    if (typeof IntersectionObserver === "undefined") {
      void loadComments();
      return () => {
        cancelled = true;
      };
    }

    observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        observer?.disconnect();
        void loadComments();
      },
      { rootMargin: "300px 0px" },
    );
    observer.observe(node);

    return () => {
      cancelled = true;
      observer?.disconnect();
    };
  }, [postId, commentCount]);

  const applySummary = async (summary: {
    liked: boolean;
    reaction: SocialReactionType | null;
    likeCount: number;
    likePreview?: SocialReactionEntry[];
  }) => {
    setLiked(summary.liked);
    setReaction(summary.reaction);
    setLikeCount(summary.likeCount);
    if (summary.likePreview) setLikers(summary.likePreview.slice(0, 3));
    else await loadLikers(3, false);
  };

  const tapLike = async () => {
    if (longPressed.current) {
      longPressed.current = false;
      return;
    }
    if (submittingRef.current) return;

    const previousLiked = liked;
    const previousReaction = reaction;
    const previousCount = likeCount;

    interactionVersionRef.current += 1;
    submittingRef.current = true;

    if (liked) {
      setLiked(false);
      setReaction(null);
      setLikeCount((count) => Math.max(0, count - 1));
    } else {
      setLiked(true);
      setReaction("LIKE");
      setLikeCount((count) => count + 1);
    }

    setSubmitting(true);
    try {
      const summary = previousLiked
        ? await socialService.removeLike(postId)
        : await socialService.toggleLike(postId, "LIKE");
      await applySummary(summary);
    } catch {
      setLiked(previousLiked);
      setReaction(previousReaction);
      setLikeCount(previousCount);
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  const chooseReaction = async (type: SocialReactionType) => {
    if (submittingRef.current) return;
    setPickerOpen(false);
    const previousLiked = liked;
    const previousReaction = reaction;
    const previousCount = likeCount;

    interactionVersionRef.current += 1;
    submittingRef.current = true;
    setLiked(true);
    setReaction(type);
    if (!previousLiked) setLikeCount((count) => count + 1);

    setSubmitting(true);
    try {
      const summary = await socialService.toggleLike(postId, type);
      await applySummary(summary);
    } catch {
      setLiked(previousLiked);
      setReaction(previousReaction);
      setLikeCount(previousCount);
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  const openReactionList = async () => {
    if (!likeCount) return;
    setFilter("ALL");
    setListOpen(true);
    setLoadingList(true);
    try {
      const rows = await socialService.likes(postId, 100);
      setLikers(rows);
    } finally {
      setLoadingList(false);
    }
  };

  const startLongPress = () => {
    longPressed.current = false;
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    longPressTimer.current = setTimeout(() => {
      longPressed.current = true;
      setPickerOpen(true);
      if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate?.(25);
    }, 450);
  };

  const cancelLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const reactionCounts = useMemo(() => {
    const counts = new Map<SocialReactionType, number>();
    for (const entry of likers) counts.set(entry.reaction, (counts.get(entry.reaction) || 0) + 1);
    return counts;
  }, [likers]);

  const filteredLikers = useMemo(
    () => (filter === "ALL" ? likers : likers.filter((entry) => entry.reaction === filter)),
    [filter, likers],
  );

  const selectedReaction = REACTIONS.find((item) => item.type === reaction);
  const reactionEmoji = selectedReaction?.emoji || "👍";
  const reactionLabel = selectedReaction?.label || "Like";

  const reactionSummary = useMemo(() => {
    if (!likeCount) return "";
    if (!likers.length) return `${likeCount} ${likeCount === 1 ? "reaction" : "reactions"}`;

    const names = likers.slice(0, 2).map((entry) =>
      String(entry.user.id) === String(currentUserId) ? "You" : entry.user.name,
    );
    const remaining = Math.max(0, likeCount - names.length);

    if (remaining > 0) {
      return `${names.join(" and ")} and ${remaining} ${remaining === 1 ? "other" : "others"}`;
    }
    return names.join(" and ");
  }, [currentUserId, likeCount, likers]);

  const summaryEmojis = useMemo(() => {
    const unique: string[] = [];
    for (const entry of likers) {
      const emoji = REACTIONS.find((item) => item.type === entry.reaction)?.emoji || "👍";
      if (!unique.includes(emoji)) unique.push(emoji);
      if (unique.length === 3) break;
    }
    return unique;
  }, [likers]);

  return (
    <>
      <div className="flex min-h-9 items-center justify-between gap-3 px-4 py-2 text-[13px] text-slate-500">
        <button type="button" onClick={() => void openReactionList()} className="flex min-w-0 items-center gap-1.5 text-left hover:underline">
          {likeCount > 0 && (
            <>
              <span className="flex shrink-0 items-center -space-x-1 text-base leading-none">
                {(summaryEmojis.length ? summaryEmojis : [reactionEmoji]).map((emoji, index) => (
                  <span key={`${emoji}-${index}`}>{emoji}</span>
                ))}
              </span>
              <span className="truncate">{reactionSummary}</span>
            </>
          )}
        </button>
        <button type="button" onClick={() => void onToggleComments()} className="shrink-0 hover:underline">
          {commentCount} comments · {shareCount} shares
        </button>
      </div>


      <div className="grid grid-cols-3 border-t px-2 py-1">
        <div className="relative">
          {pickerOpen && (
            <div className="absolute bottom-[48px] left-1/2 z-40 flex -translate-x-1/2 items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-1.5 shadow-2xl">
              {REACTIONS.map((item) => (
                <button key={item.type} type="button" title={item.label} disabled={submitting} onClick={() => void chooseReaction(item.type)} className="flex h-10 w-10 items-center justify-center rounded-full text-2xl transition active:scale-110 disabled:opacity-50">
                  {item.emoji}
                </button>
              ))}
            </div>
          )}

          <button
            type="button"
            aria-busy={submitting}
            disabled={submitting}
            onTouchStart={startLongPress}
            onTouchEnd={cancelLongPress}
            onTouchCancel={cancelLongPress}
            onMouseDown={startLongPress}
            onMouseUp={cancelLongPress}
            onMouseLeave={cancelLongPress}
            onContextMenu={(event) => event.preventDefault()}
            onClick={() => void tapLike()}
            style={{ touchAction: "manipulation", WebkitTapHighlightColor: "transparent" }}
            className={`flex w-full select-none items-center justify-center gap-2 rounded py-2 text-[14px] font-semibold hover:bg-slate-100 active:bg-slate-100 disabled:cursor-wait disabled:opacity-70 ${liked ? reactionButtonColor(reaction) : "text-slate-600"}`}
          >
            {liked && reaction ? <span className="text-xl leading-none">{reactionEmoji}</span> : <Heart className="h-5 w-5" fill="none" />}
            <span>{liked ? reactionLabel : "Like"}</span>
          </button>
        </div>

        <button type="button" onClick={() => void onToggleComments()} className="flex justify-center gap-2 rounded py-2 text-[14px] font-semibold text-slate-600 hover:bg-slate-100">
          <MessageCircle className="h-5 w-5" /><span>Comment</span>
        </button>
        <button type="button" onClick={() => void onShare()} className="flex justify-center gap-2 rounded py-2 text-[14px] font-semibold text-slate-600 hover:bg-slate-100">
          <Share2 className="h-5 w-5" /><span>Share</span>
        </button>
      </div>

      {listOpen && (
        <div className="fixed inset-0 z-[250] flex items-end justify-center bg-black/35" onClick={() => setListOpen(false)}>
          <div className="max-h-[82vh] w-full overflow-hidden rounded-t-[28px] bg-white shadow-[0_-16px_50px_rgba(15,23,42,0.18)] sm:max-w-lg sm:rounded-[28px]" onClick={(event) => event.stopPropagation()}>
            <div className="relative px-4 pb-3 pt-3">
              <div className="mx-auto h-1.5 w-16 rounded-full bg-slate-400" />
              <button type="button" onClick={() => setListOpen(false)} className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-slate-100"><X className="h-5 w-5" /></button>
            </div>

            <div className="flex items-center gap-6 border-b px-5 pb-3 text-[15px] font-bold text-slate-950">
              <button type="button" onClick={() => setFilter("ALL")} className={`flex items-center gap-2 rounded-full px-3 py-2 ${filter === "ALL" ? "bg-red-50 text-red-600" : ""}`}>
                <span>{likeCount}</span>
                <span className="flex items-center -space-x-1">{REACTIONS.filter((item) => reactionCounts.get(item.type)).slice(0, 3).map((item) => <span key={item.type}>{item.emoji}</span>)}</span>
              </button>
              <span>{commentCount} comments</span><span>{shareCount} shares</span>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto px-5 py-3">
              <button type="button" onClick={() => setFilter("ALL")} className="shrink-0 rounded-full bg-slate-100 px-3 py-2 text-sm font-semibold">All reactions</button>
              {REACTIONS.map((item) => {
                const count = reactionCounts.get(item.type) || 0;
                if (!count) return null;
                return <button key={item.type} type="button" onClick={() => setFilter(item.type)} className="shrink-0 rounded-full px-3 py-2 text-sm font-semibold">{item.emoji} {count}</button>;
              })}
            </div>

            <div className="max-h-[60vh] overflow-y-auto px-3 pb-[calc(env(safe-area-inset-bottom)+20px)]">
              {loadingList && <div className="px-3 py-7 text-center text-sm text-slate-500">Loading reactions...</div>}
              {!loadingList && filteredLikers.length === 0 && <div className="px-3 py-7 text-center text-sm text-slate-500">No reactions yet.</div>}
              {!loadingList && filteredLikers.map((entry) => {
                const photo = entry.user.isSynthetic
                  ? syntheticBotAvatarDataUrl({ id: entry.user.id, name: entry.user.name })
                  : profilePhoto(entry.user.profilePhotoUrl);
                const emoji = REACTIONS.find((item) => item.type === entry.reaction)?.emoji || "👍";
                return (
                  <div key={`${entry.user.id}-${entry.createdAt}`} className="flex items-center gap-3 rounded-2xl px-2 py-2.5">
                    <a
                      href={`/profile/${encodeURIComponent(entry.user.id)}`}
                      className="relative shrink-0"
                      aria-label={`Open ${entry.user.name} profile`}
                    >
                      {photo ? <img src={photo} alt={entry.user.name} className="h-12 w-12 rounded-full bg-slate-100 object-cover" /> : <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-200 font-bold">{entry.user.name.slice(0, 1).toUpperCase()}</div>}
                      <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-white text-sm shadow-sm">{emoji}</span>
                    </a>
                    <div className="min-w-0 flex-1">
                      <div className="flex min-w-0 items-center gap-2">
                        <a
                          href={`/profile/${encodeURIComponent(entry.user.id)}`}
                          className="truncate text-[15px] font-semibold hover:underline"
                        >
                          {entry.user.name}
                        </a>
                        {entry.user.isSynthetic && (
                          <span className="shrink-0 rounded-full border border-slate-200 bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-slate-500">
                            Content
                          </span>
                        )}
                      </div>
                    </div>
                    {!entry.user.isSynthetic && String(entry.user.id) !== String(currentUserId) && (
                      <button type="button" onClick={() => { window.location.href = `/messages?userId=${encodeURIComponent(entry.user.id)}`; }} className="shrink-0 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white">
                        Message
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
