"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CornerUpLeft, Send } from "lucide-react";
import { toast } from "sonner";
import {
  SocialComment,
  SocialUser,
  socialService,
} from "@/http/services/social.service";
import { MentionInput } from "@/components/social/MentionInput";
import { syntheticBotAvatarDataUrl } from "@/lib/synthetic-bot-avatar";
import { useUserStore } from "@/stores/user-store";
import { UserRole } from "@/types/user.types";

const backendUrl = String(
  process.env.NEXT_PUBLIC_BACKEND_URL || "https://api.roomkhoj.com",
).replace(/\/$/, "");

function initials(user?: SocialUser | null) {
  return String(user?.name || "R").slice(0, 1).toUpperCase();
}

function profilePhoto(value?: string | null) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  return `${backendUrl}${raw.startsWith("/") ? raw : `/${raw}`}`;
}

function ago(value: string) {
  const diff = Math.max(0, Date.now() - new Date(value).getTime());
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

export function CommentThread({
  postId,
  currentUserId,
  currentUserPhotoUrl,
}: {
  postId: string;
  currentUserId: string;
  currentUserPhotoUrl?: string | null;
}) {
  const viewer = useUserStore((state) => state.user);
  const isAdmin = viewer?.role === UserRole.ADMIN;
  const [comments, setComments] = useState<SocialComment[]>([]);
  const [draft, setDraft] = useState("");
  const [mentionUserIds, setMentionUserIds] = useState<string[]>([]);
  const [replyTo, setReplyTo] = useState<SocialComment | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const load = async () => {
    try {
      setComments(await socialService.comments(postId));
    } catch {
      setComments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    void load();
  }, [postId]);

  const roots = useMemo(
    () => comments.filter((comment) => !comment.parentCommentId),
    [comments],
  );

  const repliesByParent = useMemo(() => {
    const map = new Map<string, SocialComment[]>();
    for (const comment of comments) {
      if (!comment.parentCommentId) continue;
      const list = map.get(comment.parentCommentId) || [];
      list.push(comment);
      map.set(comment.parentCommentId, list);
    }
    return map;
  }, [comments]);

  const commenterNames = useMemo(() => {
    const names: string[] = [];
    const seen = new Set<string>();
    for (const comment of comments) {
      const id = String(comment.author?.id || "");
      if (!id || seen.has(id)) continue;
      seen.add(id);
      names.push(comment.author?.name || "RoomKhoj User");
    }
    return names;
  }, [comments]);

  const commenterSummary = useMemo(() => {
    if (!commenterNames.length) return "";
    if (commenterNames.length === 1) return `${commenterNames[0]} commented`;
    if (commenterNames.length === 2) return `${commenterNames[0]} and ${commenterNames[1]} commented`;
    return `${commenterNames[0]}, ${commenterNames[1]} and ${commenterNames.length - 2} others commented`;
  }, [commenterNames]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const content = draft.trim();
    if (!content || sending) return;
    setSending(true);
    try {
      const rootParentId = replyTo?.parentCommentId || replyTo?.id;
      const created = rootParentId
        ? await socialService.replyComment(
            rootParentId,
            postId,
            content,
            mentionUserIds,
          )
        : await socialService.addComment(
            postId,
            content,
            undefined,
            mentionUserIds,
          );
      setComments((current) => [...current, created]);
      setDraft("");
      setMentionUserIds([]);
      setReplyTo(null);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Comment send failed");
    } finally {
      setSending(false);
    }
  };

  const edit = async (comment: SocialComment) => {
    const value = window.prompt("Edit comment", comment.content);
    if (!value?.trim()) return;
    await socialService.updateComment(comment.id, value.trim());
    setComments((current) =>
      current.map((item) =>
        item.id === comment.id ? { ...item, content: value.trim() } : item,
      ),
    );
  };

  const remove = async (comment: SocialComment) => {
    if (!isAdmin) return;
    if (!window.confirm("Remove this comment?")) return;

    try {
      await socialService.deleteComment(comment.id);
      setComments((current) =>
        current.filter(
          (item) => item.id !== comment.id && item.parentCommentId !== comment.id,
        ),
      );
      toast.success("Comment removed");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Comment remove failed");
    }
  };

  return (
    <section className="border-t bg-white px-3 pb-3 pt-2">
      {!loading && comments.length > 0 && (
        <div className="mb-2 rounded-xl bg-slate-50 px-3 py-2">
          <div className="text-[13px] font-semibold text-slate-900">
            Comments · {comments.length}
          </div>
          <div className="mt-0.5 text-[12px] text-slate-500">{commenterSummary}</div>
        </div>
      )}

      {loading ? (
        <div className="py-3 text-center text-[13px] text-slate-400">Loading comments…</div>
      ) : roots.length === 0 ? (
        <div className="py-2 text-center text-[13px] text-slate-400">Be the first to comment</div>
      ) : (
        <div className="space-y-2">
          {roots.map((comment) => {
            const replies = repliesByParent.get(comment.id) || [];
            return (
              <div key={comment.id} className="space-y-1.5">
                <CommentRow
                  comment={comment}
                  currentUserId={currentUserId}
                  onReply={() => setReplyTo(comment)}
                  onEdit={() => void edit(comment)}
                  canDelete={isAdmin}
                  onDelete={() => void remove(comment)}
                />
                {replies.length > 0 && (
                  <div className="ml-10 space-y-1.5 border-l border-slate-200 pl-2.5">
                    {replies.map((reply) => (
                      <CommentRow
                        key={reply.id}
                        comment={reply}
                        currentUserId={currentUserId}
                        compact
                        canDelete={isAdmin}
                        onReply={() => setReplyTo(reply)}
                        onEdit={() => void edit(reply)}
                        onDelete={() => void remove(reply)}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {replyTo && (
        <div className="mt-2 flex items-center justify-between rounded-lg bg-red-50 px-3 py-1.5 text-[12px] text-slate-600">
          <span>Replying to <b className="text-slate-800">{replyTo.author.name}</b></span>
          <button type="button" onClick={() => setReplyTo(null)} className="font-semibold text-red-600">
            Cancel
          </button>
        </div>
      )}

      <form onSubmit={submit} className="mt-2 flex items-center gap-2">
        {profilePhoto(currentUserPhotoUrl) ? (
          <img
            src={profilePhoto(currentUserPhotoUrl)}
            alt="Your profile"
            className="h-8 w-8 shrink-0 rounded-full border border-slate-200 bg-slate-100 object-cover"
          />
        ) : (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 text-[12px] font-bold text-slate-600">
            R
          </div>
        )}
        <div className="flex min-w-0 flex-1 items-center rounded-full bg-slate-100 px-3">
          <MentionInput
            userId={currentUserId}
            value={draft}
            onChange={setDraft}
            onMentionIdsChange={setMentionUserIds}
            placeholder={replyTo ? `Reply to ${replyTo.author.name}…` : "Write a comment…"}
            className="w-full min-w-0 bg-transparent py-2 text-[14px] outline-none placeholder:text-slate-400"
            maxLength={1000}
          />
          <button
            type="submit"
            disabled={sending || !draft.trim()}
            className="ml-1 text-red-600 disabled:opacity-40"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </form>
    </section>
  );
}

function CommentRow({
  comment,
  currentUserId,
  compact = false,
  canDelete = false,
  onReply,
  onEdit,
  onDelete,
}: {
  comment: SocialComment;
  currentUserId: string;
  compact?: boolean;
  canDelete?: boolean;
  onReply: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const mine =
    !comment.author.isSynthetic &&
    String(comment.author.id) === String(currentUserId);
  const photo = comment.author.isSynthetic
    ? syntheticBotAvatarDataUrl({
        id: comment.author.id,
        name: comment.author.name,
      })
    : profilePhoto(comment.author.profilePhotoUrl);
  const avatarSize = compact ? "h-7 w-7" : "h-8 w-8";

  return (
    <div className="flex items-start gap-2">
      <Link
        href={`/profile/${encodeURIComponent(comment.author.id)}`}
        className="shrink-0"
        aria-label={`Open ${comment.author.name} profile`}
      >
        {photo ? (
          <img
            src={photo}
            alt={comment.author.name}
            className={`${avatarSize} rounded-full bg-slate-100 object-cover`}
          />
        ) : (
          <div className={`${avatarSize} flex items-center justify-center rounded-full bg-slate-200 text-[11px] font-bold text-slate-600`}>
            {initials(comment.author)}
          </div>
        )}
      </Link>
      <div className="min-w-0 flex-1">
        <Link
          href={`/profile/${encodeURIComponent(comment.author.id)}`}
          className="inline-block max-w-full rounded-2xl bg-slate-100 px-3 py-2 align-top transition hover:bg-slate-200/80"
          aria-label={`Open ${comment.author.name} profile`}
        >
          <div className="flex items-center gap-2 text-[13px] font-semibold leading-tight text-slate-950">
            <span className="hover:underline">
              {comment.author.name}
            </span>
            {comment.author.isSynthetic && (
              <span className="rounded-full border border-slate-200 bg-white px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-slate-500">
                Content
              </span>
            )}
          </div>
          <div className="mt-0.5 whitespace-pre-wrap break-words text-[14px] leading-[1.3] text-slate-900">{comment.content}</div>
        </Link>
        <div className="mt-0.5 flex items-center gap-3 pl-2 text-[11px] font-medium text-slate-500">
          <span>{ago(comment.createdAt)}</span>
          {!comment.author.isSynthetic && (
            <button type="button" onClick={onReply} className="font-semibold text-slate-600 hover:underline">
              Reply
            </button>
          )}
          {mine && (
            <button type="button" onClick={onEdit} className="hover:underline">Edit</button>
          )}
          {canDelete && (
            <button type="button" onClick={onDelete} className="text-red-500 hover:underline">Remove</button>
          )}
          {compact && <CornerUpLeft className="h-3 w-3 text-slate-300" />}
        </div>
      </div>
    </div>
  );
}
