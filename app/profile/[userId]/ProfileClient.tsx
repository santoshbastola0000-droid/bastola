"use client";

import {
  type ChangeEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  BadgeCheck,
  BriefcaseBusiness,
  Camera,
  Check,
  Clock3,
  Globe2,
  Home,
  MapPin,
  Loader2,
  MessageCircle,
  Trash2,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import {
  useParams,
  useRouter,
} from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  profileService,
  type FollowStatus,
  type PublicProfile,
} from "@/http/services/profile.service";
import { profileMediaUrl } from "@/lib/profile-media";
import { syntheticBotAvatarDataUrl } from "@/lib/synthetic-bot-avatar";
import { messageService } from "@/http/services/message.service";
import { useUserStore } from "@/stores/user-store";
import {
  socialService,
  type SocialPost,
} from "@/http/services/social.service";
import { ProfileSocialPostCard } from "@/components/social/ProfileSocialPostCard";

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
  const currentUser = useUserStore((state) => state.user);

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
    useState<FollowStatus>("NONE");

  const [friends, setFriends] =
    useState<any[]>([]);

  const [socialPosts, setSocialPosts] =
    useState<SocialPost[]>([]);

  const [
    verifiedBadgeEnabled,
    setVerifiedBadgeEnabled,
  ] = useState(false);

  const [tab, setTab] =
    useState<Tab>("posts");

  const [loading, setLoading] =
    useState(true);

  const [friendLoading, setFriendLoading] =
    useState(false);

  const [messageLoading, setMessageLoading] =
    useState(false);

  const [photoViewerOpen, setPhotoViewerOpen] =
    useState(false);
  const [photoActionLoading, setPhotoActionLoading] =
    useState(false);
  const profilePhotoInputRef =
    useRef<HTMLInputElement | null>(null);

  const isOwnProfile =
    Boolean(currentUser?.id) &&
    String(currentUser?.id) === userId;

  const load = async () => {
    try {
      setLoading(true);

      const data =
        await profileService
          .getProfile(userId);

      setProfile(data);

      const fallbackPosts = (Array.isArray(data.posts) ? data.posts : []).map(
        (post: any) =>
          ({
            ...post,
            mediaUrls: Array.isArray(post.mediaUrls) ? post.mediaUrls : [],
            mediaTypes: Array.isArray(post.mediaTypes) ? post.mediaTypes : [],
            author: {
              id: data.user.id,
              name: data.user.name,
              profilePhotoUrl: data.user.profilePhotoUrl || null,
              isVerified: data.user.isVerified,
            },
            likeCount: Number(post.likeCount || 0),
            commentCount: Number(post.commentCount || 0),
            shareCount: Number(post.shareCount || 0),
            likedByMe: Boolean(post.likedByMe),
          }) as SocialPost,
      );
      setSocialPosts(fallbackPosts);

      const [uiSettingsResult, socialPostsResult] =
        await Promise.allSettled([
          profileService.getProfileUiSettings(),
          currentUser?.id && !data.user.isSynthetic
            ? socialService.userPosts(userId, 100)
            : Promise.resolve(fallbackPosts),
        ]);

      if (uiSettingsResult.status === "fulfilled") {
        setVerifiedBadgeEnabled(
          Boolean(uiSettingsResult.value.verifiedBadgeEnabled),
        );
      } else {
        setVerifiedBadgeEnabled(false);
      }

      if (socialPostsResult.status === "fulfilled") {
        setSocialPosts(
          Array.isArray(socialPostsResult.value)
            ? socialPostsResult.value
            : fallbackPosts,
        );
      }

      if (
        currentUser?.id &&
        !data.user.isSynthetic &&
        String(currentUser.id) !== userId
      ) {
        void profileService
          .recordProfileView(userId)
          .catch(() => undefined);
      }

      if (data.user.isSynthetic) {
        setFriendStatus("NONE");
        setFriends([]);
      } else {
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
      }
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
  }, [userId, currentUser?.id]);

  const handleFriend = async () => {
    try {
      setFriendLoading(true);

      if (friendStatus === "FOLLOWING" || friendStatus === "MUTUAL") {
        await profileService.unfollow(userId);
        setFriendStatus(friendStatus === "MUTUAL" ? "FOLLOWED_BY" : "NONE");
        toast.success("Unfollow भयो");
      } else {
        const result = await profileService.sendFriendRequest(userId);
        setFriendStatus(result.status);
        toast.success("Follow गर्नुभयो");
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

  const handleProfilePhotoChange = async (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();
    const isImage =
      file.type.startsWith("image/") ||
      /\.(jpg|jpeg|png|webp|gif|heic|heif)$/i.test(fileName);

    if (!isImage) {
      toast.error("Photo file मात्र select गर्नुहोस्.");
      event.target.value = "";
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      toast.error("Profile photo 20 MB भन्दा सानो हुनुपर्छ.");
      event.target.value = "";
      return;
    }

    try {
      setPhotoActionLoading(true);
      await profileService.uploadProfilePhoto(file);
      const refreshed = await profileService.getProfile(userId);
      setProfile(refreshed);
      toast.success("Profile photo changed");
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          "Profile photo change गर्न सकिएन.",
      );
    } finally {
      setPhotoActionLoading(false);
      event.target.value = "";
    }
  };

  const handleProfilePhotoDelete = async () => {
    if (!profile?.user.profilePhotoUrl || photoActionLoading) return;

    const confirmed = window.confirm(
      "Profile photo delete गर्ने हो?",
    );
    if (!confirmed) return;

    try {
      setPhotoActionLoading(true);
      await profileService.deleteProfilePhoto();
      const refreshed = await profileService.getProfile(userId);
      setProfile(refreshed);
      setPhotoViewerOpen(false);
      toast.success("Profile photo deleted");
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          "Profile photo delete गर्न सकिएन.",
      );
    } finally {
      setPhotoActionLoading(false);
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
        )}&returnTo=${encodeURIComponent(`/people/${userId}`)}`,
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
    profile.user.isBanned
      ? null
      : profile.user.isSynthetic
        ? syntheticBotAvatarDataUrl({
            id: profile.user.id,
            name: profile.user.name,
          })
        : profileMediaUrl(
            profile.user
              .profilePhotoUrl,
          );

  const coverPhoto =
    profileMediaUrl(
      profile.user
        .coverPhotoUrl,
    );

  const friendLabel =
    friendStatus === "FOLLOWING" || friendStatus === "MUTUAL"
      ? "Following"
      : friendStatus === "FOLLOWED_BY"
        ? "Follow back"
        : "Follow";

  return (
    <main className="min-h-screen bg-white pb-24 text-slate-950">
      <div className="mx-auto max-w-5xl sm:px-3">
        <section className="overflow-hidden bg-white sm:rounded-b-[24px] sm:shadow-sm">
          <div className="relative h-32 bg-gradient-to-r from-red-700 via-red-600 to-red-500 sm:h-48">
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
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-6">
              <div className="flex min-w-0 items-end gap-3 sm:block">
                <button
                  type="button"
                  onClick={() => setPhotoViewerOpen(true)}
                  className={`relative -mt-14 h-28 w-28 shrink-0 overflow-hidden rounded-full border-4 border-white shadow-lg transition active:scale-[0.98] sm:-mt-16 sm:h-36 sm:w-36 ${profile.user.isBanned ? "bg-white" : "bg-red-600"}`}
                  aria-label="Open profile photo"
                >
                  {profilePhoto ? (
                    <img
                      src={profilePhoto}
                      alt={`${profile.user.name} profile photo`}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  ) : profile.user.isBanned ? (
                    <div className="h-full w-full bg-white" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-4xl font-black text-white">
                      {initials}
                    </div>
                  )}
                  {isOwnProfile && (
                    <span className="absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-black/75 text-white shadow-lg">
                      <Camera className="h-4 w-4" />
                    </span>
                  )}
                </button>
                {isOwnProfile && (
                  <input
                    ref={profilePhotoInputRef}
                    type="file"
                    accept="image/*,.heic,.heif"
                    className="hidden"
                    onChange={handleProfilePhotoChange}
                  />
                )}
                <div className="min-w-0 pb-1 sm:hidden">
                  <div className="flex min-w-0 items-center gap-1.5">
                    <h1 className="truncate text-xl font-black tracking-tight">
                      {profile.user.name}
                    </h1>
                    {verifiedBadgeEnabled && profile.user.isVerified && (
                      <BadgeCheck className="h-5 w-5 shrink-0 text-red-600" />
                    )}
                  </div>
                </div>
              </div>

              <div className="min-w-0 flex-1">
                <div className="hidden min-w-0 items-center gap-2 sm:flex">
                  <h1 className="truncate text-2xl font-black tracking-tight sm:text-3xl">
                    {profile.user.name}
                  </h1>
                  {verifiedBadgeEnabled && profile.user.isVerified && (
                    <BadgeCheck className="h-6 w-6 shrink-0 text-red-600" />
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2 rounded-2xl bg-slate-50 px-3 py-3 text-center sm:mt-3 sm:max-w-md">
                  <div className="min-w-0">
                    <p className="text-lg font-black tabular-nums">{friends.length}</p>
                    <p className="text-xs font-semibold text-slate-600">Friends</p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-lg font-black tabular-nums">{profile.rooms.length}</p>
                    <p className="text-xs font-semibold text-slate-600">Rooms</p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-lg font-black tabular-nums">{profile.jobs.length}</p>
                    <p className="text-xs font-semibold text-slate-600">Jobs</p>
                  </div>
                </div>

                {profile.user.bio && (
                  <p className="mt-3 max-w-2xl whitespace-pre-wrap text-sm font-medium leading-5 text-slate-700">
                    {profile.user.bio}
                  </p>
                )}

                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs font-semibold text-slate-600">
                  {profile.user.location && (
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="h-4 w-4 shrink-0 text-red-600" />
                      <span className="break-words">{profile.user.location}</span>
                    </span>
                  )}
                  {profile.user.website && (
                    <a
                      href={profile.user.website}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-red-700 hover:underline"
                    >
                      <Globe2 className="h-4 w-4" />
                      Website
                    </a>
                  )}
                </div>

                {friendStatus !== "SELF" && !isOwnProfile && (
                  <div className={`mt-4 grid w-full gap-2 ${profile.user.isSynthetic ? "grid-cols-1" : "grid-cols-2"} sm:max-w-md`}>
                    {!profile.user.isSynthetic && (
                      <Button
                        onClick={handleFriend}
                        disabled={
                          friendLoading ||
                          friendStatus === "REQUEST_SENT" ||
                          friendStatus === "FRIENDS"
                        }
                        className="h-11 min-w-0 rounded-xl bg-red-600 px-2 text-sm font-bold text-white hover:bg-red-700"
                      >
                        {friendStatus === "FOLLOWING" || friendStatus === "MUTUAL" ? (
                          <Check className="mr-1.5 h-4 w-4 shrink-0" />
                        ) : friendStatus === "REQUEST_SENT" ? (
                          <Clock3 className="mr-1.5 h-4 w-4 shrink-0" />
                        ) : (
                          <UserPlus className="mr-1.5 h-4 w-4 shrink-0" />
                        )}
                        <span className="truncate">{friendLabel}</span>
                      </Button>
                    )}
                    <Button
                      variant="secondary"
                      className="h-11 min-w-0 rounded-xl px-2 text-sm font-bold"
                      onClick={handleMessage}
                      disabled={messageLoading}
                    >
                      <MessageCircle className="mr-1.5 h-4 w-4 shrink-0" />
                      <span className="truncate">{messageLoading ? "Opening..." : "Message"}</span>
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-5 border-t border-slate-200">
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
                    className={`relative min-w-fit px-5 py-4 text-sm font-black transition sm:px-7 ${tab === value ? "text-red-700" : "text-slate-600"}`}
                  >
                    {label}
                    {tab === value && (
                      <span className="absolute inset-x-3 bottom-0 h-[3px] rounded-full bg-red-600" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-4 p-3 sm:p-5 lg:grid-cols-[300px_1fr]">
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
                            `/people/${friend.id}`,
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
              <div className="space-y-4">
                {socialPosts.length === 0 ? (
                  <div className="rounded-2xl bg-background p-8 text-center shadow-sm">
                    <p className="font-bold">No posts yet</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      यो user ले अहिलेसम्म देखाउन मिल्ने post राखेको छैन।
                    </p>
                  </div>
                ) : (
                  socialPosts.map((post) => (
                    <ProfileSocialPostCard
                      key={post.id}
                      post={post}
                      currentUserId={String(currentUser?.id || "")}
                      currentUserPhotoUrl={currentUser?.profilePhotoUrl || null}
                      onChanged={load}
                    />
                  ))
                )}
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
                            `/people/${friend.id}`,
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

      {photoViewerOpen && (
        <div
          className="fixed inset-0 z-[200] flex flex-col bg-black/95"
          role="dialog"
          aria-modal="true"
          aria-label="Profile photo"
          onClick={() => {
            if (!photoActionLoading) setPhotoViewerOpen(false);
          }}
        >
          <div className="flex items-center justify-between gap-3 px-3 py-3 text-white sm:px-5">
            <div className="min-w-0">
              <p className="truncate text-sm font-bold">
                {profile.user.name}
              </p>
              <p className="text-xs text-white/65">
                Profile photo
              </p>
            </div>

            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                if (!photoActionLoading) setPhotoViewerOpen(false);
              }}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/10 text-white"
              aria-label="Close profile photo"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div
            className="flex min-h-0 flex-1 items-center justify-center p-3 sm:p-6"
            onClick={(event) => event.stopPropagation()}
          >
            {profilePhoto ? (
              <img
                src={profilePhoto}
                alt={`${profile.user.name} profile photo`}
                className="max-h-full max-w-full object-contain"
              />
            ) : (
              <div className="flex h-56 w-56 items-center justify-center rounded-full bg-primary text-6xl font-black text-primary-foreground">
                {initials}
              </div>
            )}
          </div>

          {isOwnProfile && (
            <div
              className="border-t border-white/10 bg-black/90 px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 sm:px-5"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mx-auto grid w-full max-w-md grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  className="h-11 rounded-xl font-bold"
                  disabled={photoActionLoading}
                  onClick={() => profilePhotoInputRef.current?.click()}
                >
                  {photoActionLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Camera className="mr-2 h-4 w-4" />
                  )}
                  Change photo
                </Button>

                <Button
                  type="button"
                  variant="destructive"
                  className="h-11 rounded-xl font-bold"
                  disabled={photoActionLoading || !profilePhoto}
                  onClick={() => void handleProfilePhotoDelete()}
                >
                  {photoActionLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="mr-2 h-4 w-4" />
                  )}
                  Delete photo
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </main>
  );
}