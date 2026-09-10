"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Heart, MessageCircle, Share2, X } from "lucide-react";
import {
  SocialReactionEntry,
  SocialReactionType,
  socialService,
} from "@/http/services/social.service";

const backendUrl = String(
  process.env.NEXT_PUBLIC_BACKEND_URL || "https://api.roomkhoj.com",
).replace(/\/$/, "");

const REACTIONS: Array<{
  type: SocialReactionType;
  emoji: string;
  label: string;
}> = [
  { type: "LOVE", emoji: "❤️", label: "Love" },
  { type: "LIKE", emoji: "👍", label: "Like" },
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
  const [reaction, setReaction] = useState<SocialReactionType | null>(
    initialLiked ? "LOVE" : null,
  );
  const [likers, setLikers] = useState<SocialReactionEntry[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [listOpen, setListOpen] = useState(false);
  const [loadingList, setLoadingList] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressed = useRef(false);

  const loadLikers = async (limit = 3) => {
    if (!initialLikeCount && !liked) {
      setLikers([]);
      return;
    }
    try {
      const rows = await socialService.likes(postId, 100);
      setLikers(rows.slice(0, limit));
      const mine = rows.find((entry) => String(entry.user.id) === String(currentUserId));
      if (mine) {
        setLiked(true);
        setReaction(mine.reaction);
      } else if (!initialLiked) {
        setLiked(false);
        setReaction(null);
      }
    } catch {
      setLiked(initialLiked);
      if (initialLiked && !reaction) setReaction("LOVE");
    }
  };

  useEffect(() => {
    setLikeCount(initialLikeCount);
    setLiked(initialLiked);
    setReaction(initialLiked ? "LOVE" : null);
    void loadLikers(3);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId, initialLikeCount, initialLiked, currentUserId]);

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
    else await loadLikers(3);
  };

  const tapHeart = async () => {
    if (longPressed.current) {
      longPressed.current = false;
      return;
    }
    if (submitting) return;
    setSubmitting(true);
    try {
      const summary = liked
        ? await socialService.removeLike(postId)
        : await socialService.toggleLike(postId, "LOVE");
      await applySummary(summary);
    } finally {
      setSubmitting(false);
    }
  };

  const chooseReaction = async (type: SocialReactionType) => {
    if (submitting) return;
    setPickerOpen(false);
    setSubmitting(true);
    try {
      const summary = await socialService.toggleLike(postId, type);
      await applySummary(summary);
    } finally {
      setSubmitting(false);
    }
  };

  const openReactionList = async () => {
    if (!likeCount) return;
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
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate?.(25);
      }
    }, 450);
  };

  const cancelLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const previewText = useMemo(() => {
    if (!likeCount) return "";
    const names = likers.slice(0, 2).map((entry) => entry.user.name).filter(Boolean);
    if (!names.length) return `${likeCount} reactions`;
    const rest = Math.max(0, likeCount - names.length);
    return rest ? `${names.join(", ")} and ${rest} others` : names.join(", ");
  }, [likeCount, likers]);

  const selectedReaction = REACTIONS.find((item) => item.type === reaction);
  const reactionEmoji = selectedReaction?.emoji || "❤️";
  const reactionLabel = selectedReaction?.label || "Like";

  return (
    <>
      <div className="flex min-h-9 items-center justify-between gap-3 px-4 py-2 text-[13px] text-slate-500">
        <button
          type="button"
          onClick={() => void openReactionList()}
          className="flex min-w-0 items-center gap-2 text-left hover:underline"
          aria-label={likeCount ? `View ${likeCount} reactions` : "No reactions"}
        >
          {likeCount > 0 && (
            <>
              <div className="flex -space-x-2">
                {likers.slice(0, 3).map((entry) => {
                  const photo = profilePhoto(entry.user.profilePhotoUrl);
                  return photo ? (
                    <img
                      key={entry.user.id}
                      src={photo}
                      alt={entry.user.name}
                      className="h-6 w-6 rounded-full border-2 border-white bg-slate-100 object-cover"
                    />
                  ) : (
                    <span
                      key={entry.user.id}
                      className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-slate-200 text-[9px] font-bold text-slate-600"
                    >
                      {entry.user.name.slice(0, 1).toUpperCase()}
                    </span>
                  );
                })}
              </div>
              <span className="truncate">{reactionEmoji} {previewText}</span>
            </>
          )}
        </button>
        <span className="shrink-0">
          {commentCount} comments · {shareCount} shares
        </span>
      </div>

      <div className="grid grid-cols-3 border-t px-2 py-1">
        <div className="relative">
          {pickerOpen && (
            <div
              className="absolute bottom-[48px] left-1/2 z-40 flex -translate-x-1/2 items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-1.5 shadow-2xl"
              onPointerLeave={() => setPickerOpen(false)}
            >
              {REACTIONS.map((item) => (
                <button
                  key={item.type}
                  type="button"
                  title={item.label}
                  onClick={() => void chooseReaction(item.type)}
                  className="flex h-10 w-10 items-center justify-center rounded-full text-2xl transition hover:-translate-y-1 hover:scale-125 active:scale-110"
                >
                  {item.emoji}
                </button>
              ))}
            </div>
          )}

          <button
            type="button"
            disabled={submitting}
            onPointerDown={startLongPress}
            onPointerUp={cancelLongPress}
            onPointerCancel={cancelLongPress}
            onPointerLeave={cancelLongPress}
            onContextMenu={(event) => event.preventDefault()}
            onClick={() => void tapHeart()}
            className={`flex w-full select-none items-center justify-center gap-2 rounded py-2 text-[14px] font-semibold hover:bg-slate-100 disabled:opacity-60 ${
              liked ? "text-red-500" : "text-slate-600"
            }`}
          >
            {liked && reaction && reaction !== "LOVE" ? (
              <span className="text-xl leading-none" aria-hidden="true">{reactionEmoji}</span>
            ) : (
              <Heart className="h-5 w-5" fill={liked ? "currentColor" : "none"} />
            )}
            <span>{liked ? reactionLabel : "Like"}</span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => void onToggleComments()}
          className="flex justify-center gap-2 rounded py-2 text-[14px] font-semibold text-slate-600 hover:bg-slate-100"
        >
          <MessageCircle className="h-5 w-5" />
          <span>Comment</span>
        </button>

        <button
          type="button"
          onClick={() => void onShare()}
          className="flex justify-center gap-2 rounded py-2 text-[14px] font-semibold text-slate-600 hover:bg-slate-100"
        >
          <Share2 className="h-5 w-5" />
          <span>Share</span>
        </button>
      </div>

      {listOpen && (
        <div
          className="fixed inset-0 z-[250] flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
          onClick={() => setListOpen(false)}
        >
          <div
            className="max-h-[72vh] w-full max-w-md overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b px-4 py-3">
              <div>
                <b className="text-[15px]">Reactions</b>
                <p className="text-xs text-slate-500">{likeCount} people reacted</p>
              </div>
              <button type="button" onClick={() => setListOpen(false)} className="rounded-full p-2 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto p-2">
              {loadingList && (
                <div className="px-3 py-5 text-center text-sm text-slate-500">Loading reactions...</div>
              )}
              {!loadingList && likers.length === 0 && (
                <div className="px-3 py-5 text-center text-sm text-slate-500">No reactions yet.</div>
              )}
              {!loadingList && likers.map((entry) => {
                const photo = profilePhoto(entry.user.profilePhotoUrl);
                const emoji = REACTIONS.find((item) => item.type === entry.reaction)?.emoji || "❤️";
                const label = REACTIONS.find((item) => item.type === entry.reaction)?.label || "Love";
                return (
                  <div key={`${entry.user.id}-${entry.createdAt}`} className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-slate-50">
                    <div className="relative shrink-0">
                      {photo ? (
                        <img
                          src={photo}
                          alt={entry.user.name}
                          className="h-11 w-11 rounded-full bg-slate-100 object-cover"
                        />
                      ) : (
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-200 text-[14px] font-bold text-slate-600">
                          {entry.user.name.slice(0, 1).toUpperCase()}
                        </div>
                      )}
                      <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-white text-sm shadow-sm">
                        {emoji}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[14px] font-semibold text-slate-900">
                        {entry.user.name}
                      </div>
                      <div className="text-xs text-slate-500">{label}</div>
                    </div>
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
