"use client";

import {
  Suspense,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ArrowLeft,
  Bell,
  Check,
  ChevronDown,
  FileText,
  Heart,
  Loader2,
  MessageCircle,
  UserPlus,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { privateApi } from "@/http/api/privateApi";
import {
  notificationService,
  type UserNotification,
} from "@/http/services/notification.service";
import {
  socialService,
  type SocialPost,
} from "@/http/services/social.service";
import {
  profileService,
  type PublicProfileUser,
} from "@/http/services/profile.service";
import { profileMediaUrl } from "@/lib/profile-media";
import { resolveImageUrl } from "@/lib/utils";

type ActivityPostPreview = Pick<
  SocialPost,
  "id" | "mediaUrls" | "mediaTypes" | "content"
>;

function timeAgo(value: string) {
  const diff = Math.max(
    0,
    Date.now() - new Date(value).getTime(),
  );
  const min = Math.floor(diff / 60000);
  if (min < 1) return "now";
  if (min < 60) return min + "m";
  const hr = Math.floor(min / 60);
  if (hr < 24) return hr + "h";
  const d = Math.floor(hr / 24);
  return d < 7
    ? d + "d"
    : new Date(value).toLocaleDateString();
}

function dataString(
  item: UserNotification,
  key: string,
) {
  const value = item.data?.[key];
  return typeof value === "string"
    ? value
    : value == null
      ? ""
      : String(value);
}

function actorUserId(item: UserNotification) {
  return (
    dataString(item, "actorUserId") ||
    dataString(item, "requesterId") ||
    dataString(item, "friendUserId")
  );
}

function postIdFor(item: UserNotification) {
  return dataString(item, "postId");
}

function isFollowerNotification(
  item: UserNotification,
) {
  const type = String(item.type || "").toUpperCase();
  return (
    type.includes("FOLLOW") ||
    type.includes("FRIEND")
  );
}

function isSocialActivityNotification(
  item: UserNotification,
) {
  const type = String(item.type || "").toUpperCase();
  return (
    type.startsWith("SOCIAL_") ||
    type.includes("STORY")
  );
}

function cleanCommentPreview(
  item: UserNotification,
  actorName: string,
) {
  let body = String(item.body || "").trim();

  if (
    actorName &&
    body.toLowerCase().startsWith(
      actorName.toLowerCase() + ":",
    )
  ) {
    body = body.slice(actorName.length + 1).trim();
  }

  return body
    .replace(/^["“]+/, "")
    .replace(/["”]+$/, "")
    .trim();
}

function activityText(
  item: UserNotification,
  actorName: string,
) {
  const type = String(item.type || "").toUpperCase();
  const actor =
    actorName ||
    String(item.title || "RoomKhoj user").split(
      " commented",
    )[0];

  if (
    type === "SOCIAL_POST_COMMENT" ||
    type === "SOCIAL_LIKED_POST_COMMENT"
  ) {
    const preview = cleanCommentPreview(
      item,
      actorName,
    );
    const target =
      type === "SOCIAL_POST_COMMENT"
        ? "commented on your post"
        : "commented on a post you liked";

    return (
      actor +
      " " +
      target +
      (preview ? ": " + preview : ".")
    );
  }

  if (
    type === "SOCIAL_POST_REACTION" ||
    type === "SOCIAL_LIKE"
  ) {
    const reaction = dataString(
      item,
      "reaction",
    ).toUpperCase();
    const verb =
      reaction === "LOVE"
        ? "loved"
        : reaction === "HAHA"
          ? "reacted 😂 to"
          : reaction === "WOW"
            ? "reacted 😮 to"
            : "liked";

    return actor + " " + verb + " your post.";
  }

  if (type === "SOCIAL_NEW_POST") {
    return actor + " added a post.";
  }

  if (type === "SOCIAL_MENTION") {
    return actor + " mentioned you in a post.";
  }

  const title = String(item.title || "").trim();
  const body = String(item.body || "").trim();

  if (!body || body === title) return title;
  return title + " " + body;
}

function ActivityAvatar({
  user,
  fallbackName,
  unread,
}: {
  user?: PublicProfileUser;
  fallbackName: string;
  unread: boolean;
}) {
  const photo = profileMediaUrl(
    user?.profilePhotoUrl,
  );
  const initial = (
    user?.name ||
    fallbackName ||
    "R"
  )
    .trim()
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className={
        "flex h-[58px] w-[58px] shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100 text-sm font-black text-primary " +
        (unread
          ? "ring-2 ring-primary ring-offset-2 ring-offset-white"
          : "border border-slate-200")
      }
    >
      {photo ? (
        <img
          src={photo}
          alt=""
          className="h-full w-full object-cover"
        />
      ) : (
        initial
      )}
    </div>
  );
}

function NotificationsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const view =
    searchParams.get("view") || "all";

  const [items, setItems] = useState<
    UserNotification[]
  >([]);
  const [loading, setLoading] =
    useState(true);
  const [accepting, setAccepting] =
    useState<string | null>(null);
  const [quickActionId, setQuickActionId] =
    useState<string | null>(null);
  const [actorById, setActorById] =
    useState<Record<string, PublicProfileUser>>(
      {},
    );
  const [postById, setPostById] =
    useState<
      Record<string, ActivityPostPreview>
    >({});

  const hydrateActivity = async (
    rows: UserNotification[],
  ) => {
    const actorIds = Array.from(
      new Set(
        rows
          .map(actorUserId)
          .filter(Boolean),
      ),
    ).slice(0, 30);

    const postIds = Array.from(
      new Set(
        rows
          .map(postIdFor)
          .filter(Boolean),
      ),
    ).slice(0, 30);

    const [profiles, posts] =
      await Promise.all([
        Promise.all(
          actorIds.map(async (id) => {
            try {
              const profile =
                await profileService.getProfile(id);
              return [id, profile.user] as const;
            } catch {
              return null;
            }
          }),
        ),
        Promise.all(
          postIds.map(async (id) => {
            try {
              const response =
                await privateApi.get(
                  "/social/posts/" + id,
                );
              return [
                id,
                response.data as ActivityPostPreview,
              ] as const;
            } catch {
              return null;
            }
          }),
        ),
      ]);

    const nextActors: Record<
      string,
      PublicProfileUser
    > = {};
    for (const entry of profiles) {
      if (entry) {
        nextActors[entry[0]] = entry[1];
      }
    }

    const nextPosts: Record<
      string,
      ActivityPostPreview
    > = {};
    for (const entry of posts) {
      if (entry) {
        nextPosts[entry[0]] = entry[1];
      }
    }

    setActorById(nextActors);
    setPostById(nextPosts);
  };

  const load = async () => {
    try {
      const rows =
        await notificationService.list();
      setItems(rows);
      void hydrateActivity(rows);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const visibleItems = useMemo(() => {
    if (view === "activity") {
      return items.filter(
        isSocialActivityNotification,
      );
    }

    if (view === "followers") {
      return items.filter(
        isFollowerNotification,
      );
    }

    return items;
  }, [items, view]);

  const unread = useMemo(
    () =>
      visibleItems.filter(
        (item) => !item.readAt,
      ).length,
    [visibleItems],
  );

  const pageTitle =
    view === "activity"
      ? "Activity"
      : view === "followers"
        ? "New followers"
        : "Notifications";

  const markReadLocally = (
    id: string,
  ) => {
    setItems((current) =>
      current.map((row) =>
        row.id === id
          ? {
              ...row,
              readAt:
                row.readAt ||
                new Date().toISOString(),
            }
          : row,
      ),
    );
  };

  const ensurePostExists = async (
    item: UserNotification,
  ) => {
    const postId = postIdFor(item);
    const type = String(
      item.type || "",
    ).toUpperCase();

    if (
      !postId ||
      !(
        type.includes("POST") ||
        type.includes("LIKE") ||
        type.includes("COMMENT") ||
        type.includes("MENTION")
      )
    ) {
      return true;
    }

    try {
      await privateApi.get(
        "/social/posts/" + postId,
      );
      return true;
    } catch {
      toast.info(
        "यो post user ले delete गरिसकेको छ।",
      );
      return false;
    }
  };

  const openNotification = async (
    item: UserNotification,
  ) => {
    if (!item.readAt) {
      await notificationService
        .markRead(item.id)
        .catch(() => undefined);
      markReadLocally(item.id);
    }

    if (!(await ensurePostExists(item))) {
      return;
    }

    const url = String(
      item.actionUrl || "/feed",
    );

    if (url.startsWith("/")) {
      router.push(url);
    }
  };

  const acceptFriend = async (
    item: UserNotification,
  ) => {
    const requesterId = dataString(
      item,
      "requesterId",
    );
    if (!requesterId) return;

    setAccepting(item.id);
    try {
      await socialService.acceptFriendRequest(
        requesterId,
      );
      await notificationService
        .markRead(item.id)
        .catch(() => undefined);

      setItems((current) =>
        current.map((row) =>
          row.id === item.id
            ? {
                ...row,
                readAt:
                  new Date().toISOString(),
                title:
                  "Friend request accepted",
                body:
                  "You are now friends on RoomKhoj.",
                data: {
                  ...(row.data || {}),
                  accepted: true,
                },
              }
            : row,
        ),
      );
    } finally {
      setAccepting(null);
    }
  };

  const openPostAction = async (
    item: UserNotification,
    action: "like" | "reply",
  ) => {
    const postId = postIdFor(item);
    if (!postId) {
      void openNotification(item);
      return;
    }

    setQuickActionId(
      action + ":" + item.id,
    );

    try {
      if (!item.readAt) {
        await notificationService
          .markRead(item.id)
          .catch(() => undefined);
        markReadLocally(item.id);
      }

      if (!(await ensurePostExists(item))) {
        return;
      }

      router.push(
        "/post/" +
          postId +
          (action === "reply"
            ? "#comments"
            : ""),
      );
    } finally {
      setQuickActionId(null);
    }
  };

  return (
    <main className="min-h-screen bg-white text-slate-950">
      <section className="mx-auto min-h-screen w-full max-w-[680px] bg-white">
        <header className="sticky top-0 z-30 grid grid-cols-[44px_1fr_44px] items-center border-b border-slate-100 bg-white/95 px-3 pb-3 pt-[calc(0.75rem+env(safe-area-inset-top))] backdrop-blur">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex h-10 w-10 items-center justify-center rounded-full transition active:bg-slate-100"
            aria-label="Back"
          >
            <ArrowLeft className="h-7 w-7" />
          </button>

          <div className="flex min-w-0 items-center justify-center gap-1">
            <h1 className="truncate text-[23px] font-black tracking-tight">
              {pageTitle}
            </h1>
            {view === "activity" && (
              <ChevronDown className="h-5 w-5 text-slate-400" />
            )}
          </div>

          <div className="flex h-10 w-10 items-center justify-center">
            {unread > 0 && (
              <span className="flex min-w-6 items-center justify-center rounded-full bg-primary px-1.5 py-1 text-[10px] font-black text-white">
                {unread > 99
                  ? "99+"
                  : unread}
              </span>
            )}
          </div>
        </header>

        {loading ? (
          <div className="flex min-h-[45vh] items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : visibleItems.length === 0 ? (
          <div className="px-6 py-20 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
              {view === "activity" ? (
                <Heart className="h-7 w-7" />
              ) : (
                <Bell className="h-7 w-7" />
              )}
            </div>
            <p className="mt-4 text-sm font-semibold text-slate-700">
              {view === "activity"
                ? "अहिलेसम्म activity छैन।"
                : "No notifications yet."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {visibleItems.map((item) => {
              const type = String(
                item.type || "",
              ).toUpperCase();
              const actorId =
                actorUserId(item);
              const actor =
                actorById[actorId];
              const actorName =
                actor?.name ||
                String(
                  item.body ||
                    item.title ||
                    "RoomKhoj user",
                ).split(" ")[0];
              const postId =
                postIdFor(item);
              const post =
                postById[postId];
              const thumb =
                post?.mediaUrls?.[0]
                  ? resolveImageUrl(
                      post.mediaUrls[0],
                    )
                  : "";
              const thumbType =
                post?.mediaTypes?.[0] ||
                "";
              const unreadItem =
                !item.readAt;
              const friendRequest =
                type ===
                  "FRIEND_REQUEST" &&
                Boolean(
                  dataString(
                    item,
                    "requesterId",
                  ),
                ) &&
                !item.data?.accepted;
              const commentActivity =
                type.includes("COMMENT");
              const activityCopy =
                activityText(
                  item,
                  actorName,
                );

              return (
                <article
                  key={item.id}
                  className={
                    "px-3 py-3.5 sm:px-4 " +
                    (unreadItem
                      ? "bg-primary/[0.025]"
                      : "bg-white")
                  }
                >
                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        if (actorId) {
                          router.push(
                            "/profile/" +
                              actorId,
                          );
                        }
                      }}
                      disabled={!actorId}
                      className="shrink-0 rounded-full disabled:cursor-default"
                      aria-label={
                        actorId
                          ? "Open profile"
                          : undefined
                      }
                    >
                      <ActivityAvatar
                        user={actor}
                        fallbackName={
                          actorName
                        }
                        unread={
                          unreadItem
                        }
                      />
                    </button>

                    <div className="min-w-0 flex-1 pt-0.5">
                      <button
                        type="button"
                        onClick={() =>
                          void openNotification(
                            item,
                          )
                        }
                        className="block w-full text-left"
                      >
                        <p className="text-[15px] font-semibold leading-[1.35] text-slate-950">
                          {activityCopy}
                          <span className="ml-1.5 whitespace-nowrap text-[13px] font-medium text-slate-400">
                            {timeAgo(
                              item.createdAt,
                            )}
                          </span>
                        </p>
                      </button>

                      {commentActivity &&
                        postId && (
                          <div className="mt-2 flex items-center gap-2">
                            <button
                              type="button"
                              disabled={
                                quickActionId ===
                                "like:" +
                                  item.id
                              }
                              onClick={() =>
                                void openPostAction(
                                  item,
                                  "like",
                                )
                              }
                              className="inline-flex h-9 items-center gap-1.5 rounded-full bg-slate-100 px-4 text-[13px] font-semibold text-slate-700 transition active:scale-95 disabled:opacity-60"
                            >
                              <Heart className="h-4 w-4" />
                              Like
                            </button>
                            <button
                              type="button"
                              disabled={
                                quickActionId ===
                                "reply:" +
                                  item.id
                              }
                              onClick={() =>
                                void openPostAction(
                                  item,
                                  "reply",
                                )
                              }
                              className="inline-flex h-9 items-center gap-1.5 rounded-full bg-slate-100 px-4 text-[13px] font-semibold text-slate-700 transition active:scale-95 disabled:opacity-60"
                            >
                              <MessageCircle className="h-4 w-4" />
                              Reply
                            </button>
                          </div>
                        )}

                      {friendRequest && (
                        <div className="mt-2 flex items-center gap-2">
                          <button
                            type="button"
                            disabled={
                              accepting ===
                              item.id
                            }
                            onClick={() =>
                              void acceptFriend(
                                item,
                              )
                            }
                            className="rounded-full bg-primary px-4 py-2 text-[13px] font-bold text-white disabled:opacity-50"
                          >
                            {accepting ===
                            item.id
                              ? "Accepting..."
                              : "Accept"}
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              void openNotification(
                                item,
                              )
                            }
                            className="rounded-full bg-slate-100 px-4 py-2 text-[13px] font-semibold text-slate-700"
                          >
                            View
                          </button>
                        </div>
                      )}

                      {type ===
                        "FRIEND_REQUEST_ACCEPTED" && (
                        <div className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-emerald-600">
                          <Check className="h-4 w-4" />
                          Friends
                        </div>
                      )}
                    </div>

                    {postId && (
                      <button
                        type="button"
                        onClick={() =>
                          void openNotification(
                            item,
                          )
                        }
                        className="mt-0.5 h-[72px] w-[72px] shrink-0 overflow-hidden rounded-[14px] bg-slate-100"
                        aria-label="Open post"
                      >
                        {thumb ? (
                          thumbType ===
                          "VIDEO" ? (
                            <video
                              src={thumb}
                              muted
                              playsInline
                              preload="metadata"
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <img
                              src={thumb}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          )
                        ) : (
                          <span className="flex h-full w-full items-center justify-center bg-primary/10 text-primary">
                            <FileText className="h-6 w-6" />
                          </span>
                        )}
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

export default function NotificationsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-white">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      }
    >
      <NotificationsContent />
    </Suspense>
  );
}
