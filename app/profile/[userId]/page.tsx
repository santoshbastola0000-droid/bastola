"use client";

import {
  useEffect,
  useState,
} from "react";
import {
  BadgeCheck,
  BriefcaseBusiness,
  Check,
  Clock3,
  Globe2,
  Home,
  MapPin,
  MessageCircle,
  UserPlus,
  Users,
} from "lucide-react";
import {
  useParams,
  useRouter,
} from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { PropertyCard } from "@/components/rooms/PropertyCard";
import {
  profileService,
  type FriendStatus,
  type PublicProfile,
} from "@/http/services/profile.service";
import { profileMediaUrl } from "@/lib/profile-media";
import { messageService } from "@/http/services/message.service";

type Tab =
  | "posts"
  | "rooms"
  | "jobs"
  | "friends"
  | "about";

export default function PublicProfilePage() {
  const params = useParams<{
    userId: string;
  }>();

  const router = useRouter();

  const userId =
    String(params.userId);

  const [
    profile,
    setProfile,
  ] =
    useState<PublicProfile | null>(
      null,
    );

  const [
    friendStatus,
    setFriendStatus,
  ] =
    useState<FriendStatus>("NONE");

  const [friends, setFriends] =
    useState<any[]>([]);

  const [incomingRequests, setIncomingRequests] =
    useState<any[]>([]);

  const [tab, setTab] =
    useState<Tab>("posts");

  const [loading, setLoading] =
    useState(true);

  const [friendLoading, setFriendLoading] =
    useState(false);

  const [messageLoading, setMessageLoading] =
    useState(false);

  const load = async () => {
    try {
      setLoading(true);

      const data =
        await profileService
          .getProfile(userId);

      setProfile(data);

      try {
        const status =
          await profileService
            .getFriendStatus(
              userId,
            );

        setFriendStatus(
          status.status,
        );

        if (status.status === "SELF") {
          try {
            const requests =
              await profileService
                .getIncomingFriendRequests();

            setIncomingRequests(
              Array.isArray(requests)
                ? requests
                : [],
            );
          } catch {
            setIncomingRequests([]);
          }
        } else {
          setIncomingRequests([]);
        }
      } catch {}

      try {
        const list =
          await profileService
            .getFriends(userId);

        setFriends(
          Array.isArray(list)
            ? list
            : [],
        );
      } catch {}
    } catch {
      toast.error(
        "Profile load हुन सकेन",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [userId]);

  const handleFriend = async () => {
    try {
      setFriendLoading(true);

      if (
        friendStatus ===
        "REQUEST_RECEIVED"
      ) {
        const result =
          await profileService
            .acceptFriendRequest(
              userId,
            );

        setFriendStatus(
          result.status,
        );

        toast.success(
          "Friend request accepted",
        );

        return;
      }

      if (
        friendStatus === "NONE"
      ) {
        const result =
          await profileService
            .sendFriendRequest(
              userId,
            );

        setFriendStatus(
          result.status,
        );

        toast.success(
          "Friend request sent",
        );
      }
    } catch (error: any) {
      toast.error(
        error?.response?.data
          ?.message ||
          "Friend action failed",
      );
    } finally {
      setFriendLoading(false);
    }
  };

  const acceptIncomingRequest = async (
    requesterId: string,
  ) => {
    try {
      setFriendLoading(true);

      await profileService
        .acceptFriendRequest(
          requesterId,
        );

      setIncomingRequests(
        (current) =>
          current.filter(
            (request) =>
              request.id !== requesterId,
          ),
      );

      try {
        const list =
          await profileService
            .getFriends(userId);

        setFriends(
          Array.isArray(list)
            ? list
            : [],
        );
      } catch {}

      toast.success(
        "Friend request accepted",
      );
    } catch (error: any) {
      toast.error(
        error?.response?.data
          ?.message ||
          "Friend request accept गर्न सकिएन",
      );
    } finally {
      setFriendLoading(false);
    }
  };

  const handleMessage = async () => {
    if (messageLoading) return;

    try {
      setMessageLoading(true);
      const result =
        await messageService.startByUser(userId);
      const conversationId =
        result?.conversation?.id || result?.id;

      if (!conversationId) {
        throw new Error("Conversation could not be created");
      }

      router.push(
        `/messages?conversation=${encodeURIComponent(
          conversationId,
        )}`,
      );
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Message सुरु गर्न सकिएन।",
      );
    } finally {
      setMessageLoading(false);
    }
  };

  const initials =
    profile?.user?.name
      ?.split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "U";

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl p-6 text-center text-sm text-muted-foreground">
        Loading profile...
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-6 text-center">
        Profile not found.
      </div>
    );
  }

  const profilePhoto =
    profileMediaUrl(
      profile.user
        .profilePhotoUrl,
    );

  const coverPhoto =
    profileMediaUrl(
      profile.user
        .coverPhotoUrl,
    );

  const friendLabel =
    friendStatus === "FRIENDS"
      ? "Friends"
      : friendStatus ===
          "REQUEST_SENT"
        ? "Request Sent"
        : friendStatus ===
            "REQUEST_RECEIVED"
          ? "Confirm"
          : "Add Friend";

  return (
    <main className="min-h-screen bg-muted/30 pb-24">
      <div className="mx-auto max-w-5xl">
        <section className="overflow-hidden bg-background shadow-sm md:rounded-b-3xl">
          <div className="relative h-48 bg-gradient-to-br from-red-500 via-rose-500 to-pink-600 sm:h-72">
            {coverPhoto && (
              <img
                src={coverPhoto}
                alt="Cover"
                className="h-full w-full object-cover"
              />
            )}
          </div>

          <div className="px-4 pb-4 sm:px-8">
            <div className="-mt-14 flex flex-col gap-4 sm:-mt-16 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex items-end gap-4">
                <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-full border-4 border-background bg-gradient-to-br from-red-500 to-rose-600 shadow-lg sm:h-36 sm:w-36">
                  {profilePhoto ? (
                    <img
                      src={profilePhoto}
                      alt=""
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-white">
                      {initials}
                    </div>
                  )}
                </div>

                <div className="mb-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h1 className="truncate text-2xl font-bold sm:text-3xl">
                      {
                        profile.user
                          .name
                      }
                    </h1>

                    {profile.user
                      .isVerified && (
                      <BadgeCheck className="h-5 w-5 shrink-0 text-blue-500" />
                    )}
                  </div>

                  <p className="text-sm font-medium text-muted-foreground">
                    {friends.length}{" "}
                    {friends.length === 1
                      ? "friend"
                      : "friends"}
                  </p>
                </div>
              </div>

              {friendStatus !==
                "SELF" && (
                <div className="flex gap-2 sm:pb-1">
                  <Button
                    onClick={
                      handleFriend
                    }
                    disabled={
                      friendLoading ||
                      friendStatus ===
                        "REQUEST_SENT" ||
                      friendStatus ===
                        "FRIENDS"
                    }
                    className="flex-1 gap-2 sm:flex-none"
                  >
                    {friendStatus ===
                    "FRIENDS" ? (
                      <Check className="h-4 w-4" />
                    ) : friendStatus ===
                      "REQUEST_SENT" ? (
                      <Clock3 className="h-4 w-4" />
                    ) : (
                      <UserPlus className="h-4 w-4" />
                    )}

                    {friendLabel}
                  </Button>

                  <Button
                    variant="secondary"
                    className="flex-1 gap-2 sm:flex-none"
                    onClick={handleMessage}
                    disabled={messageLoading}
                  >
                    <MessageCircle className="h-4 w-4" />
                    {messageLoading
                      ? "Opening..."
                      : "Message"}
                  </Button>               </div>
              )}
            </div>

            {profile.user.bio && (
              <p className="mt-4 max-w-2xl whitespace-pre-wrap text-sm sm:text-base">
                {profile.user.bio}
              </p>
            )}

            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
              {profile.user.location && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" />
                  {
                    profile.user
                      .location
                  }
                </span>
              )}

              {profile.user.website && (
                <a
                  href={
                    profile.user
                      .website
                  }
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 font-medium text-primary hover:underline"
                >
                  <Globe2 className="h-4 w-4" />
                  Website
                </a>
              )}
            </div>
          </div>

          <div className="border-t px-2 sm:px-6">
            <div className="flex overflow-x-auto">
              {[
                ["posts", "Posts"],
                ["rooms", `Rooms (${profile.rooms.length})`],
                ["jobs", "Jobs"],
                ["friends", friendStatus === "SELF" && incomingRequests.length > 0
                  ? `Friends (${incomingRequests.length})`
                  : "Friends"],
                ["about", "About"],
              ].map(
                ([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() =>
                      setTab(
                        value as Tab,
                      )
                    }
                    className={`relative min-w-fit px-5 py-4 text-sm font-semibold ${
                      tab === value
                        ? "text-primary"
                        : "text-muted-foreground"
                    }`}
                  >
                    {label}

                    {tab === value && (
                      <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-primary" />
                    )}
                  </button>
                ),
              )}
            </div>
          </div>
        </section>

        <div className="grid gap-4 p-3 sm:p-5 lg:grid-cols-[320px_1fr]">
          <aside className="space-y-4">
            <section className="rounded-2xl bg-background p-5 shadow-sm">
              <h2 className="mb-4 text-lg font-bold">
                Intro
              </h2>

              <div className="space-y-3 text-sm">
                {profile.user
                  .location && (
                  <div className="flex gap-2">
                    <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />
                    <span>
                      Lives in{" "}
                      <strong>
                        {
                          profile.user
                            .location
                        }
                      </strong>
                    </span>
                  </div>
                )}

                <div className="flex gap-2">
                  <Home className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <span>
                    {
                      profile.rooms
                        .length
                    }{" "}
                    room listings
                  </span>
                </div>

                <div className="flex gap-2">
                  <BriefcaseBusiness className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <span>
                    {
                      profile.jobs
                        .length
                    }{" "}
                    job posts
                  </span>
                </div>
              </div>
            </section>

            <section className="rounded-2xl bg-background p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold">
                  Friends
                </h2>

                <button
                  onClick={() =>
                    setTab(
                      "friends",
                    )
                  }
                  className="text-sm text-primary"
                >
                  See all
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {friends
                  .slice(0, 6)
                  .map(
                    (friend) => (
                      <button
                        key={
                          friend.id
                        }
                        onClick={() =>
                          router.push(
                            `/profile/${friend.id}`,
                          )
                        }
                        className="min-w-0 text-left"
                      >
                        <div className="aspect-square overflow-hidden rounded-xl bg-muted">
                          {friend.profilePhotoUrl ? (
                            <img
                              src={
                                profileMediaUrl(
                                  friend.profilePhotoUrl,
                                ) ||
                                ""
                              }
                              alt={
                                friend.name
                              }
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center">
                              <Users className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                        </div>

                        <p className="mt-1 truncate text-xs font-semibold">
                          {
                            friend.name
                          }
                        </p>
                      </button>
                    ),
                  )}
              </div>
            </section>
          </aside>

          <section className="space-y-4">
            {tab === "posts" && (
              <div className="rounded-2xl bg-background p-6 text-center shadow-sm">
                <p className="font-semibold">
                  Posts
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Normal social posts
                  अर्को चरणमा जोड्दैछौँ।
                </p>
              </div>
            )}

            {tab === "rooms" && (
              <div>
                {profile.rooms.length === 0 ? (
                  <div className="rounded-2xl bg-background p-6 text-center shadow-sm">
                    <Home className="mx-auto h-10 w-10 text-muted-foreground" />
                    <p className="mt-3 font-semibold">
                      No room listings yet
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      This user has not posted any visible rooms.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-2">
                    {profile.rooms.map(
                      (room: any, index: number) => (
                        <PropertyCard
                          key={room.id}
                          room={room}
                          index={index}
                        />
                      ),
                    )}
                  </div>
                )}
              </div>
            )}

            {tab === "jobs" &&
              profile.jobs.map(
                (job: any) => (
                  <div
                    key={job.id}
                    className="rounded-2xl bg-background p-5 shadow-sm"
                  >
                    <div className="mb-2 flex items-center gap-2 font-semibold">
                      <BriefcaseBusiness className="h-5 w-5 text-primary" />
                      Job Vacancy
                    </div>

                    <h3 className="text-lg font-bold">
                      {job.jobTitle}
                    </h3>

                    <p className="mt-1 text-sm text-muted-foreground">
                      {job.companyName ||
                        "Company"}{" "}
                      ·{" "}
                      {job.location ||
                        ""}
                    </p>

                    {job.salary != null && (
                      <p className="mt-3 font-bold">
                        Rs.{" "}
                        {Number(
                          job.salary,
                        ).toLocaleString()}
                      </p>
                    )}
                  </div>
                ),
              )}

            {tab === "friends" && (
              <div className="space-y-4">
                {friendStatus === "SELF" &&
                  incomingRequests.length > 0 && (
                  <div className="rounded-2xl bg-background p-5 shadow-sm">
                    <h2 className="mb-4 text-xl font-bold">
                      Friend Requests
                    </h2>

                    <div className="space-y-3">
                      {incomingRequests.map(
                        (request) => (
                          <div
                            key={request.id}
                            className="flex items-center gap-3 rounded-xl border p-3"
                          >
                            <button
                              type="button"
                              onClick={() =>
                                router.push(
                                  `/profile/${request.id}`,
                                )
                              }
                              className="flex min-w-0 flex-1 items-center gap-3 text-left"
                            >
                              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-muted">
                                {request.profilePhotoUrl ? (
                                  <img
                                    src={
                                      profileMediaUrl(
                                        request.profilePhotoUrl,
                                      ) || ""
                                    }
                                    alt={request.name}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="flex h-full items-center justify-center">
                                    <Users className="h-5 w-5 text-muted-foreground" />
                                  </div>
                                )}
                              </div>

                              <div className="min-w-0">
                                <p className="truncate font-semibold">
                                  {request.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Sent you a friend request
                                </p>
                              </div>
                            </button>

                            <Button
                              type="button"
                              size="sm"
                              onClick={() =>
                                void acceptIncomingRequest(
                                  request.id,
                                )
                              }
                              disabled={friendLoading}
                            >
                              Accept
                            </Button>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                )}

                <div className="rounded-2xl bg-background p-5 shadow-sm">
                  <h2 className="mb-4 text-xl font-bold">
                    Friends
                  </h2>

                <div className="grid gap-3 sm:grid-cols-2">
                  {friends.map(
                    (friend) => (
                      <button
                        key={
                          friend.id
                        }
                        onClick={() =>
                          router.push(
                            `/profile/${friend.id}`,
                          )
                        }
                        className="flex items-center gap-3 rounded-xl border p-3 text-left hover:bg-muted/50"
                      >
                        <div className="h-14 w-14 overflow-hidden rounded-full bg-muted">
                          {friend.profilePhotoUrl && (
                            <img
                              src={
                                profileMediaUrl(
                                  friend.profilePhotoUrl,
                                ) ||
                                ""
                              }
                              alt={
                                friend.name
                              }
                              className="h-full w-full object-cover"
                            />
                          )}
                        </div>

                        <span className="font-semibold">
                          {
                            friend.name
                          }
                        </span>
                      </button>
                    ),
                  )}
                </div>
                </div>
              </div>
            )}

            {tab === "about" && (
              <div className="rounded-2xl bg-background p-5 shadow-sm">
                <h2 className="mb-4 text-xl font-bold">
                  About
                </h2>

                {profile.user.bio ? (
                  <p className="whitespace-pre-wrap">
                    {
                      profile.user
                        .bio
                    }
                  </p>
                ) : (
                  <p className="text-muted-foreground">
                    No bio added.
                  </p>
                )}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
