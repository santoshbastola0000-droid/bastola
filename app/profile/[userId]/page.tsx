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
        <section className="overflow-hidden bg-background shadow-sm sm:rounded-b-[28px]">
          <div className="relative h-56 bg-gradient-to-br from-primary/90 via-primary to-primary/75 sm:h-80">
            {coverPhoto ? (
              <img
                src={coverPhoto}
                alt="Cover"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.25),transparent_42%)]" />
            )}
          </div>

          <div className="relative px-4 pb-4 sm:px-8">
            <div className="-mt-20 flex flex-col items-center text-center sm:-mt-24">
              <div className="h-40 w-40 shrink-0 overflow-hidden rounded-full border-[5px] border-background bg-primary shadow-xl sm:h-48 sm:w-48">
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
                  <div className="flex h-full w-full items-center justify-center text-4xl font-black text-primary-foreground">
                    {initials}
                  </div>
                )}
              </div>

              <div className="mt-3 flex max-w-full items-center justify-center gap-2">
                <h1 className="truncate text-[30px] font-black tracking-tight sm:text-4xl">
                  {profile.user.name}
                </h1>
                {profile.user.isVerified && (
                  <BadgeCheck className="h-6 w-6 shrink-0 text-primary" />
                )}
              </div>

              <p className="mt-1 text-sm font-bold text-muted-foreground sm:text-base">
                {friends.length} {friends.length === 1 ? "friend" : "friends"}
                <span className="mx-1.5">•</span>
                {profile.rooms.length} rooms
                <span className="mx-1.5">•</span>
                {profile.jobs.length} jobs
              </p>

              {profile.user.bio && (
                <p className="mt-4 max-w-2xl whitespace-pre-wrap text-[15px] font-medium leading-6">
                  {profile.user.bio}
                </p>
              )}

              <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm font-semibold text-muted-foreground">
                {profile.user.location && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-primary" />
                    {profile.user.location}
                  </span>
                )}

                {profile.user.website && (
                  <a
                    href={profile.user.website}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-primary hover:underline"
                  >
                    <Globe2 className="h-4 w-4" />
                    Website
                  </a>
                )}
              </div>

              {friendStatus !== "SELF" && (
                <div className="mt-5 grid w-full max-w-xl grid-cols-2 gap-2">
                  <Button
                    onClick={handleFriend}
                    disabled={
                      friendLoading ||
                      friendStatus === "REQUEST_SENT" ||
                      friendStatus === "FRIENDS"
                    }
                    className="h-11 rounded-xl bg-primary font-bold text-primary-foreground hover:bg-primary/90"
                  >
                    {friendStatus === "FRIENDS" ? (
                      <Check className="mr-2 h-4 w-4" />
                    ) : friendStatus === "REQUEST_SENT" ? (
                      <Clock3 className="mr-2 h-4 w-4" />
                    ) : (
                      <UserPlus className="mr-2 h-4 w-4" />
                    )}
                    {friendLabel}
                  </Button>

                  <Button
                    variant="secondary"
                    className="h-11 rounded-xl font-bold"
                    onClick={handleMessage}
                    disabled={messageLoading}
                  >
                    <MessageCircle className="mr-2 h-4 w-4" />
                    {messageLoading ? "Opening..." : "Message"}
                  </Button>
                </div>
              )}
            </div>

            <div className="mt-5 border-t border-border">
              <div className="flex overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {[
                  ["posts", "All"],
                  ["rooms", "Rooms"],
                  ["jobs", "Jobs"],
                  ["friends", "Friends"],
                  ["about", "About"],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setTab(value as Tab)}
                    className={`relative min-w-fit px-5 py-4 text-sm font-black transition sm:px-7 ${tab === value ? "text-primary" : "text-foreground"}`}
                  >
                    {label}
                    {tab === value && (
                      <span className="absolute inset-x-3 bottom-0 h-[3px] rounded-full bg-primary" />
                    )}
                  </button>
                ))}
              </div>
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

            {tab === "rooms" &&
              profile.rooms.map(
                (room: any) => (
                  <div
                    key={room.id}
                    className="rounded-2xl bg-background p-5 shadow-sm"
                  >
                    <div className="mb-2 flex items-center gap-2 font-semibold">
                      <Home className="h-5 w-5 text-primary" />
                      Room Listing
                    </div>

                    <h3 className="text-lg font-bold">
                      {room.title ||
                        room.roomType ||
                        "Room"}
                    </h3>

                    <p className="mt-1 text-sm text-muted-foreground">
                      {room.address ||
                        room.location ||
                        ""}
                    </p>

                    {room.price != null && (
                      <p className="mt-3 font-bold">
                        Rs.{" "}
                        {Number(
                          room.price,
                        ).toLocaleString()}
                      </p>
                    )}

                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() =>
                        router.push(
                          `/property/${room.id}`,
                        )
                      }
                    >
                      View Room
                    </Button>
                  </div>
                ),
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