"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Heart, MessageCircle, Share2, X } from "lucide-react";
import {
  SocialReactionEntry,
  SocialReactionType,
  socialService,
} from "@/http/services/social.service";

const REACTIONS: Array<{
  type: SocialReactionType;
  emoji: string;
  label: string;
}> = [
  { type: "LOVE", emoji: "❤️", label: "Love" },
  { type: "HAHA", emoji: "😂", label: "Haha" },
  { type: "WOW", emoji: "😮", label: "Wow" },
  { type: "SAD", emoji: "😢", label: "Sad" },
  { type: "ANGRY", emoji: "😡", label: "Angry" },
];

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
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressed = useRef(false);

  const loadLikers = async (limit = 3) => {
    if (!likeCount) {
      setLikers([]);
      return;
    }
    try {
      const rows = await socialService.likes(postId, limit);
      setLikers(rows);
      const mine = rows.find((entry) => entry.user.id === currentUserId);
      if (mine) {
        setLiked(true);
        setReaction(mine.reaction);
      }
    } catch {
      // Reaction summary remains usable even if the optional name preview fails.
    }
  };

  useEffect(() => {
    void loadLikers(3);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId, initialLikeCount]);

  const applySummary = async (summary: {
    liked: boolean;
    reaction: SocialReactionType | null;
    likeCount: number;
    likePreview?: SocialReactionEntry[];
  }) => {
    setLiked(summary.liked);
    setReaction(summary.reaction);
    setLikeCount(summary.likeCount);
    if (summary.likePreview) setLikers(summary.likePreview);
    else await loadLikers(3);
  };

  const tapHeart = async () => {
    if (longPressed.current) {
      longPressed.current = false;
      return;
    }
    try {
      const summary = liked
        ? await socialService.removeLike(postId)
        : await socialService.toggleLike(postId, "LOVE");
      await applySummary(summary);
    } catch {
      // Keep the current UI state if the request fails.
    }
  };

  const chooseReaction = async (type: SocialReactionType) => {
    setPickerOpen(false);
    try {
      const summary = await socialService.toggleLike(postId, type);
      await applySummary(summary);
    } catch {
      // Keep the current UI state if the request fails.
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
    return rest ? `${names.join(", ")} +${rest}` : names.join(", ");
  }, [likeCount, likers]);

  const reactionEmoji =
    REACTIONS.find((item) => item.type === reaction)?.emoji || "❤️";

  return (
    <>
      <div className="flex min-h-9 items-center justify-between gap-3 px-4 py-2 text-xs text-slate-500">
        <button
          type="button"
          onClick={async () => {
            if (!likeCount) return;
            const rows = await socialService.likes(postId, 50).catch(() => []);
            if (rows.length) setLikers(rows);
            setListOpen(true);
          }}
          className="min-w-0 truncate text-left hover:underline"
        >
          {likeCount ? `${reactionEmoji} ${previewText}` : ""}
        </button>
        <span className="shrink-0">
          {commentCount} comments · {shareCount} shares
        </span>
      </div>

      <div className="grid grid-cols-3 border-t px-2 py-1">
        <div className="relative">
          {pickerOpen && (
            <div
              className="absolute bottom-[46px] left-1/2 z-40 flex -translate-x-1/2 items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-1.5 shadow-2xl"
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
            onPointerDown={startLongPress}
            onPointerUp={cancelLongPress}
            onPointerCancel={cancelLongPress}
            onPointerLeave={cancelLongPress}
            onContextMenu={(event) => event.preventDefault()}
            onClick={() => void tapHeart()}
            className={`flex w-full select-none items-center justify-center gap-2 rounded py-2 font-semibold hover:bg-slate-100 ${
              liked ? "text-red-500" : "text-slate-600"
            }`}
          >
            <Heart
              className="h-5 w-5"
              fill={liked ? "currentColor" : "none"}
            />
            <span className="hidden sm:inline">Like</span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => void onToggleComments()}
          className="flex justify-center gap-2 rounded py-2 font-semibold text-slate-600 hover:bg-slate-100"
        >
          <MessageCircle className="h-5 w-5" />
          <span className="hidden sm:inline">Comment</span>
        </button>

        <button
          type="button"
          onClick={() => void onShare()}
          className="flex justify-center gap-2 rounded py-2 font-semibold text-slate-600 hover:bg-slate-100"
        >
          <Share2 className="h-5 w-5" />
          <span className="hidden sm:inline">Share</span>
        </button>
      </div>

      {listOpen && (
        <div className="fixed inset-0 z-[250] flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4">
          <div className="max-h-[70vh] w-full max-w-md overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <b>Reactions · {likeCount}</b>
              <button
                type="button"
                onClick={() => setListOpen(false)}
                className="rounded-full p-2 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="max-h-[58vh] overflow-y-auto p-2">
              {likers.map((entry) => (
                <div key={`${entry.user.id}-${entry.createdAt}`} className="flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-slate-50">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 font-bold text-slate-600">
                    {entry.user.name.slice(0, 1).toUpperCase()}
                  </div>
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                    {entry.user.name}
                  </span>
                  <span className="text-xl">
                    {REACTIONS.find((item) => item.type === entry.reaction)?.emoji || "❤️"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
