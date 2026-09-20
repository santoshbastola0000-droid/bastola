"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Info,
  Loader2,
  MoreHorizontal,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { messageService } from "@/http/services/message.service";
import { profileService } from "@/http/services/profile.service";
import {
  socialService,
  type SocialUser,
} from "@/http/services/social.service";
import { profileMediaUrl } from "@/lib/profile-media";
import { useUserStore } from "@/stores/user-store";

type IncomingFriend = SocialUser & {
  requestedAt?: string;
};

type ExistingFriend = SocialUser & {
  friendsSince?: string;
};

function timeAgo(value?: string | null) {
  if (!value) return "";
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return "";

  const minutes = Math.max(
    0,
    Math.floor((Date.now() - timestamp) / 60000),
  );

  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;

  return new Date(value).toLocaleDateString();
}

function syntheticAvatarDataUrl(person: SocialUser) {
  const seed = `${person.id}:${person.name}`;
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }

  const hue = hash % 360;
  const hue2 = (hue + 64) % 360;
  const initial = String(person.name || "B").slice(0, 1).toUpperCase();
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="hsl(${hue} 70% 66%)"/>
          <stop offset="100%" stop-color="hsl(${hue2} 68% 52%)"/>
        </linearGradient>
      </defs>
      <rect width="160" height="160" rx="80" fill="url(#g)"/>
      <circle cx="80" cy="65" r="33" fill="#d9a066"/>
      <path d="M48 61c4-25 18-38 33-38 21 0 34 16 34 41-12-9-23-14-36-14-10 0-21 4-31 11z" fill="#2d241f"/>
      <path d="M35 147c7-31 24-47 45-47s38 16 45 47" fill="rgba(255,255,255,.9)"/>
      <circle cx="126" cy="126" r="21" fill="rgba(17,24,39,.84)"/>
      <text x="126" y="133" text-anchor="middle" font-family="Arial,sans-serif" font-size="18" font-weight="700" fill="#fff">${initial}</text>
    </svg>
  `;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function Avatar({
  person,
  size = "md",
}: {
  person: SocialUser;
  size?: "md" | "lg";
}) {
  const photo = person.isSynthetic
    ? syntheticAvatarDataUrl(person)
    : profileMediaUrl(person.profilePhotoUrl);

  const dimensions =
    size === "lg"
      ? "h-[62px] w-[62px]"
      : "h-14 w-14";

  return (
    <div
      className={`${dimensions} flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted`}
    >
      {photo ? (
        <img
          src={photo}
          alt={person.name}
          className="h-full w-full object-cover"
        />
      ) : (
        <UserRound className="h-7 w-7 text-muted-foreground" />
      )}
    </div>
  );
}

export default function PeoplePage() {
  const router = useRouter();
  const user = useUserStore(
    (state) => state.user,
  );

  const [requests, setRequests] =
    useState<IncomingFriend[]>([]);
  const [friends, setFriends] =
    useState<ExistingFriend[]>([]);
  const [suggestions, setSuggestions] =
    useState<SocialUser[]>([]);
  const [hiddenSuggestionIds, setHiddenSuggestionIds] =
    useState<Set<string>>(() => new Set());
  const [expanded, setExpanded] =
    useState(false);
  const [loading, setLoading] =
    useState(true);
  const [busyId, setBusyId] =
    useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;

    let cancelled = false;

    const load = async () => {
      setLoading(true);

      const [
        requestResult,
        friendResult,
        suggestionResult,
      ] = await Promise.allSettled([
        socialService.friendRequests(),
        profileService.getFriends(
          String(user.id),
        ),
        socialService.friendSuggestions(),
      ]);

      if (cancelled) return;

      if (
        requestResult.status ===
        "fulfilled"
      ) {
        setRequests(
          Array.isArray(
            requestResult.value,
          )
            ? requestResult.value
            : [],
        );
      }

      if (
        friendResult.status ===
        "fulfilled"
      ) {
        setFriends(
          Array.isArray(friendResult.value)
            ? friendResult.value
            : [],
        );
      }

      if (
        suggestionResult.status ===
        "fulfilled"
      ) {
        setSuggestions(
          Array.isArray(
            suggestionResult.value,
          )
            ? suggestionResult.value
            : [],
        );
      }

      setLoading(false);
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const newFriendRows = useMemo(() => {
    const seen = new Set<string>();
    const rows: Array<
      | {
          kind: "REQUEST";
          person: IncomingFriend;
        }
      | {
          kind: "FRIEND";
          person: ExistingFriend;
        }
    > = [];

    for (const person of requests) {
      if (seen.has(person.id)) continue;
      seen.add(person.id);
      rows.push({
        kind: "REQUEST",
        person,
      });
    }

    for (const person of friends) {
      if (seen.has(person.id)) continue;
      seen.add(person.id);
      rows.push({
        kind: "FRIEND",
        person,
      });
    }

    return rows;
  }, [friends, requests]);

  const visibleNewFriends = expanded
    ? newFriendRows
    : newFriendRows.slice(0, 3);

  const visibleSuggestions =
    suggestions.filter(
      (person) =>
        !hiddenSuggestionIds.has(
          person.id,
        ),
    );

  const acceptRequest = async (
    person: IncomingFriend,
  ) => {
    try {
      setBusyId(person.id);
      await socialService.acceptFriendRequest(
        person.id,
      );

      setRequests((current) =>
        current.filter(
          (item) =>
            item.id !== person.id,
        ),
      );
      setFriends((current) => [
        person,
        ...current.filter(
          (item) =>
            item.id !== person.id,
        ),
      ]);
      setSuggestions((current) =>
        current.filter(
          (item) =>
            item.id !== person.id,
        ),
      );

      toast.success(
        "अब तपाईंहरू friends हुनुहुन्छ।",
      );
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          "Friend request accept गर्न सकिएन।",
      );
    } finally {
      setBusyId(null);
    }
  };

  const messageFriend = async (
    person: SocialUser,
  ) => {
    try {
      setBusyId(person.id);
      const conversation =
        await messageService.startByUser(
          person.id,
        );

      const conversationId =
        conversation?.id ||
        conversation?.conversationId;

      router.push(
        conversationId
          ? `/messages?conversation=${conversationId}`
          : "/messages",
      );
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          "Message खोल्न सकिएन।",
      );
    } finally {
      setBusyId(null);
    }
  };

  const addFriend = async (
    person: SocialUser,
  ) => {
    try {
      setBusyId(person.id);
      const response =
        await socialService.sendFriendRequest(
          person.id,
        );

      if (
        String(
          response?.status || "",
        ) === "FRIENDS"
      ) {
        setFriends((current) => [
          person,
          ...current.filter(
            (item) =>
              item.id !== person.id,
          ),
        ]);
        toast.success(
          "अब तपाईंहरू friends हुनुहुन्छ।",
        );
      } else {
        toast.success(
          "Friend request पठाइयो।",
        );
      }

      setHiddenSuggestionIds(
        (current) =>
          new Set([
            ...current,
            person.id,
          ]),
      );
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          "Friend request पठाउन सकिएन।",
      );
    } finally {
      setBusyId(null);
    }
  };

  return (
    <main className="min-h-screen bg-white pb-24 text-foreground">
      <header className="sticky top-0 z-30 border-b border-border/50 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[760px] items-center px-4">
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Back"
            className="flex h-10 w-10 items-center justify-center rounded-full transition hover:bg-muted"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>

          <h1 className="pointer-events-none absolute left-1/2 -translate-x-1/2 text-xl font-black tracking-tight">
            New friends
          </h1>
        </div>
      </header>

      <div className="mx-auto max-w-[760px] px-4">
        {loading ? (
          <div className="flex min-h-[55vh] items-center justify-center">
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {visibleNewFriends.length >
              0 && (
              <section className="pt-4">
                <div className="space-y-2">
                  {visibleNewFriends.map(
                    (row) => {
                      const {
                        person,
                        kind,
                      } = row;
                      const when =
                        kind ===
                        "REQUEST"
                          ? timeAgo(
                              person.requestedAt,
                            )
                          : timeAgo(
                              person.friendsSince,
                            );

                      return (
                        <div
                          key={`${kind}-${person.id}`}
                          className="flex items-center gap-3 py-2"
                        >
                          <button
                            type="button"
                            onClick={() => {
                              if (!person.isSynthetic) {
                                router.push(`/profile/${person.id}`);
                              }
                            }}
                            disabled={Boolean(person.isSynthetic)}
                            className="shrink-0 disabled:cursor-default"
                            aria-label={
                              person.isSynthetic
                                ? `${person.name} bot account`
                                : `Open ${person.name} profile`
                            }
                          >
                            <Avatar
                              person={
                                person
                              }
                              size="lg"
                            />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              if (!person.isSynthetic) {
                                router.push(`/profile/${person.id}`);
                              }
                            }}
                            disabled={Boolean(person.isSynthetic)}
                            className="min-w-0 flex-1 text-left disabled:cursor-default"
                          >
                            <p className="flex items-center gap-2 truncate text-[16px] font-black">
                              <span className="truncate">{person.name}</span>
                              {person.isSynthetic && (
                                <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600">
                                  Bot
                                </span>
                              )}
                            </p>
                            {person.isSynthetic && person.bio && (
                              <p className="mt-0.5 truncate text-[13px] font-medium text-muted-foreground">
                                {person.bio}
                              </p>
                            )}
                            <p className="mt-0.5 text-[15px] font-semibold leading-5 text-foreground">
                              {kind ===
                              "REQUEST"
                                ? "sent you a friend request."
                                : "is now your friend."}
                              {when && (
                                <span className="ml-1 font-medium text-muted-foreground">
                                  {
                                    when
                                  }
                                </span>
                              )}
                            </p>
                          </button>

                          {kind ===
                          "REQUEST" ? (
                            <Button
                              type="button"
                              disabled={
                                busyId ===
                                person.id
                              }
                              onClick={() =>
                                void acceptRequest(
                                  person,
                                )
                              }
                              className="h-11 shrink-0 rounded-full bg-primary px-5 font-bold text-primary-foreground hover:bg-primary/90"
                            >
                              {busyId ===
                              person.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                "Accept"
                              )}
                            </Button>
                          ) : person.isSynthetic ? (
                            <Button
                              type="button"
                              variant="secondary"
                              disabled
                              className="h-11 shrink-0 rounded-full px-5 font-bold"
                            >
                              Bot
                            </Button>
                          ) : (
                            <Button
                              type="button"
                              variant="secondary"
                              disabled={
                                busyId ===
                                person.id
                              }
                              onClick={() =>
                                void messageFriend(
                                  person,
                                )
                              }
                              className="h-11 shrink-0 rounded-full px-5 font-bold"
                            >
                              {busyId ===
                              person.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                "Message"
                              )}
                            </Button>
                          )}
                        </div>
                      );
                    },
                  )}
                </div>

                {newFriendRows.length >
                  3 && (
                  <div className="flex justify-center py-3">
                    <button
                      type="button"
                      onClick={() =>
                        setExpanded(
                          (current) =>
                            !current,
                        )
                      }
                      className="text-[15px] font-bold text-muted-foreground"
                    >
                      {expanded
                        ? "View less"
                        : "View more"}
                    </button>
                  </div>
                )}
              </section>
            )}

            <section
              className={
                visibleNewFriends.length >
                0
                  ? "border-t border-border/60 pt-5"
                  : "pt-5"
              }
            >
              <div className="mb-4 flex items-center gap-1.5">
                <h2 className="text-[20px] font-black tracking-tight">
                  Suggested accounts
                </h2>
                <Info className="h-4 w-4 text-muted-foreground" />
              </div>

              {visibleSuggestions.length ===
              0 ? (
                <div className="rounded-3xl border border-border/70 bg-muted/25 px-5 py-7 text-center">
                  <h3 className="text-base font-black text-foreground">
                    Find more friends
                  </h3>
                  <p className="mx-auto mt-1 max-w-sm text-sm leading-5 text-muted-foreground">
                    Mutual, location, similar interests, recent activity र public posts बाट नयाँ suggestions आउँछन्।
                  </p>
                  <Button
                    type="button"
                    className="mt-4 rounded-full px-6 font-bold"
                    onClick={() => router.push("/search")}
                  >
                    Search people
                  </Button>
                </div>
              ) : (
                <div className="space-y-7">
                  {visibleSuggestions.map(
                    (person) => {
                      const previews = (
                        person.previewMediaUrls ||
                        []
                      )
                        .map(
                          (url) =>
                            profileMediaUrl(
                              url,
                            ),
                        )
                        .filter(
                          (
                            url,
                          ): url is string =>
                            Boolean(url),
                        )
                        .slice(0, 4);

                      return (
                        <article
                          key={
                            person.id
                          }
                          className="overflow-hidden border-b border-border/60 pb-6"
                        >
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() =>
                                router.push(
                                  `/profile/${person.id}`,
                                )
                              }
                              className="shrink-0"
                              aria-label={`Open ${person.name} profile`}
                            >
                              <Avatar
                                person={
                                  person
                                }
                              />
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                router.push(
                                  `/profile/${person.id}`,
                                )
                              }
                              className="min-w-0 flex-1 text-left"
                            >
                              <p className="truncate text-[16px] font-black">
                                {
                                  person.name
                                }
                              </p>
                              <p className="mt-0.5 truncate text-[14px] font-semibold text-muted-foreground">
                                {person.reason ||
                                  person.location ||
                                  "People you may know"}
                              </p>
                            </button>

                            <button
                              type="button"
                              aria-label="More options"
                              onClick={() =>
                                toast.info(
                                  "Suggestion options",
                                )
                              }
                              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted"
                            >
                              <MoreHorizontal className="h-5 w-5" />
                            </button>
                          </div>

                          {previews.length >
                            0 && (
                            <div
                              className={`mt-3 grid overflow-hidden rounded-2xl bg-muted ${previews.length === 1 ? "grid-cols-1" : previews.length === 2 ? "grid-cols-2" : "grid-cols-4"}`}
                            >
                              {previews.map(
                                (
                                  preview,
                                  index,
                                ) => (
                                  <button
                                    key={`${person.id}-preview-${index}`}
                                    type="button"
                                    onClick={() =>
                                      router.push(
                                        `/profile/${person.id}`,
                                      )
                                    }
                                    className="relative aspect-square overflow-hidden border-r border-white/70 last:border-r-0"
                                  >
                                    <img
                                      src={
                                        preview
                                      }
                                      alt=""
                                      loading="lazy"
                                      className="h-full w-full object-cover"
                                    />
                                    {index <
                                      2 && (
                                      <span className="absolute bottom-2 left-2 rounded-md bg-black/55 px-2 py-0.5 text-[11px] font-black text-white">
                                        New
                                      </span>
                                    )}
                                  </button>
                                ),
                              )}
                            </div>
                          )}

                          <div className="mt-3 grid grid-cols-2 gap-3">
                            <Button
                              type="button"
                              variant="secondary"
                              className="h-12 rounded-full text-[16px] font-black"
                              onClick={() =>
                                setHiddenSuggestionIds(
                                  (
                                    current,
                                  ) =>
                                    new Set([
                                      ...current,
                                      person.id,
                                    ]),
                                )
                              }
                            >
                              Remove
                            </Button>

                            <Button
                              type="button"
                              disabled={
                                busyId ===
                                person.id
                              }
                              className="h-12 rounded-full bg-primary text-[16px] font-black text-primary-foreground hover:bg-primary/90"
                              onClick={() =>
                                void addFriend(
                                  person,
                                )
                              }
                            >
                              {busyId ===
                              person.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                "Add friend"
                              )}
                            </Button>
                          </div>
                        </article>
                      );
                    },
                  )}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}
