"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Bell,
  BriefcaseBusiness,
  Camera,
  ChevronDown,
  Globe2,
  Heart,
  Home,
  Image as ImageIcon,
  Loader2,
  MapPin,
  MessageCircle,
  MoreHorizontal,
  Plus,
  Send,
  Settings2,
  Share2,
  Shield,
  UserPlus,
  UsersRound,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { useUserStore } from "@/stores/user-store";
import {
  hashContactValue,
  SocialComment,
  SocialFeedItem,
  SocialGroup,
  SocialPost,
  SocialPreferences,
  SocialStory,
  SocialUser,
  socialService,
} from "@/http/services/social.service";

const backendUrl = String(
  process.env.NEXT_PUBLIC_BACKEND_URL || "https://api.roomkhoj.com",
).replace(/\/$/, "");

function media(value?: string | null) {
  const raw = String(value || "");
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  return `${backendUrl}${raw.startsWith("/") ? raw : `/${raw}`}`;
}

function ago(value: string) {
  const minutes = Math.max(
    0,
    Math.floor((Date.now() - new Date(value).getTime()) / 60000),
  );
  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return days < 7 ? `${days}d` : new Date(value).toLocaleDateString();
}

function Avatar({
  user,
  src,
  large = false,
}: {
  user?: SocialUser | null;
  src?: string | null;
  large?: boolean;
}) {
  const photo = media(src || user?.profilePhotoUrl);
  const cls = large ? "h-16 w-16" : "h-11 w-11";

  return photo ? (
    <img
      src={photo}
      alt={user?.name || "Profile"}
      className={`${cls} shrink-0 rounded-full bg-slate-100 object-cover ring-1 ring-slate-200`}
    />
  ) : (
    <div
      className={`${cls} flex shrink-0 items-center justify-center rounded-full bg-slate-200 font-bold text-slate-600 ring-1 ring-slate-200`}
    >
      {String(user?.name || "R").slice(0, 1).toUpperCase()}
    </div>
  );
}

function SocialHeader({ photo }: { photo?: string | null }) {
  const { user } = useUserStore();
  const nav = [
    ["/feed", Home, "Feed"],
    ["/rooms", Home, "Rooms"],
    ["/jobs", BriefcaseBusiness, "Jobs"],
    ["/messages", MessageCircle, "Messages"],
    ["/user/dashboard/profile", UsersRound, "People"],
  ] as const;

  return (
    <header className="sticky top-0 z-[80] border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-[58px] max-w-[1380px] items-center gap-2 px-3 sm:px-5">
        <Link href="/feed" className="flex shrink-0 items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-600 font-black text-white">
            R
          </div>
          <b className="hidden text-xl sm:block">RoomKhoj</b>
        </Link>

        <nav className="mx-auto flex h-full flex-1 items-center justify-center">
          {nav.map(([href, Icon, label]) => (
            <Link
              key={href}
              href={href}
              title={label}
              className="flex h-full min-w-[48px] items-center justify-center border-b-[3px] border-transparent px-2 text-slate-600 hover:border-red-500 hover:text-red-600 sm:min-w-[70px]"
            >
              <Icon className="h-6 w-6" />
            </Link>
          ))}
        </nav>

        <Link
          href="/notifications"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100"
        >
          <Bell className="h-5 w-5" />
        </Link>
        <Link href="/user/dashboard/profile">
          <Avatar
            user={user ? { id: user.id, name: user.name } : null}
            src={photo}
          />
        </Link>
      </div>
    </header>
  );
}

export function SocialFeedScreen() {
  const router = useRouter();
  const { user, isLoaded } = useUserStore();

  const [items, setItems] = useState<SocialFeedItem[]>([]);
  const [stories, setStories] = useState<SocialStory[]>([]);
  const [requests, setRequests] = useState<
    Array<SocialUser & { requestedAt: string }>
  >([]);
  const [suggestions, setSuggestions] = useState<SocialUser[]>([]);
  const [contactMatches, setContactMatches] = useState<SocialUser[]>([]);
  const [groups, setGroups] = useState<SocialGroup[]>([]);
  const [preferences, setPreferences] = useState<SocialPreferences | null>(null);
  const [myPhoto, setMyPhoto] = useState<string | null>(null);

  const [text, setText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [visibility, setVisibility] = useState<"PUBLIC" | "FRIENDS" | "GROUP">(
    "PUBLIC",
  );
  const [groupId, setGroupId] = useState<string>("");
  const [posting, setPosting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [contactLoading, setContactLoading] = useState(false);

  const [activeStory, setActiveStory] = useState<SocialStory | null>(null);
  const [openComments, setOpenComments] = useState<Record<string, boolean>>({});
  const [comments, setComments] = useState<Record<string, SocialComment[]>>({});
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const postInput = useRef<HTMLInputElement>(null);
  const storyInput = useRef<HTMLInputElement>(null);
  const profileInput = useRef<HTMLInputElement>(null);
  const sentinel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isLoaded && !user) {
      router.replace("/auth/login?redirect=%2Ffeed");
    }
  }, [isLoaded, router, user]);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    try {
      const [feed, storyList, friendList, ownPhoto, groupList, prefs] =
        await Promise.all([
          socialService.feed(),
          socialService.stories(),
          socialService.friendRequests(),
          socialService
            .myProfilePhoto()
            .catch(() => ({ profilePhotoUrl: null, createdAt: null })),
          socialService.groups().catch(() => []),
          socialService.preferences().catch(() => null),
        ]);

      setItems(feed.items || []);
      setNextCursor(feed.nextCursor || null);
      setStories(storyList || []);
      setRequests(friendList || []);
      setMyPhoto(ownPhoto.profilePhotoUrl || null);
      setGroups(groupList || []);
      setPreferences(prefs);

      if (prefs?.allowNearbySuggestions) {
        const nearby = await socialService
          .nearbySuggestions()
          .catch(() => ({ enabled: false, suggestions: [] as SocialUser[] }));
        setSuggestions(nearby.suggestions || []);
      } else {
        setSuggestions([]);
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Feed load failed");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  const loadMore = useCallback(async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const result = await socialService.feed(nextCursor);
      setItems((current) => [...current, ...(result.items || [])]);
      setNextCursor(result.nextCursor || null);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, nextCursor]);

  useEffect(() => {
    const node = sentinel.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) void loadMore();
      },
      { rootMargin: "700px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [loadMore]);

  const previews = useMemo(
    () => files.map((file) => URL.createObjectURL(file)),
    [files],
  );

  useEffect(
    () => () => previews.forEach((url) => URL.revokeObjectURL(url)),
    [previews],
  );

  const publish = async () => {
    if (!text.trim() && !files.length) return;
    if (visibility === "GROUP" && !groupId) {
      toast.info("पहिले group छान्नुहोस्।");
      return;
    }

    setPosting(true);
    try {
      await socialService.createPost({
        content: text,
        visibility,
        groupId: visibility === "GROUP" ? groupId : undefined,
        files,
      });
      setText("");
      setFiles([]);
      toast.success("Post published");
      await load();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Post failed");
    } finally {
      setPosting(false);
    }
  };

  const setPreference = async (patch: Partial<SocialPreferences>) => {
    try {
      const updated = await socialService.updatePreferences(patch);
      setPreferences(updated);

      if (patch.allowNearbySuggestions === true) {
        const nearby = await socialService.nearbySuggestions();
        setSuggestions(nearby.suggestions || []);
        if (nearby.reason === "LOCATION_REQUIRED") {
          toast.info("Nearby suggestions का लागि location अनुमति चाहिन्छ।");
        }
      }
      if (patch.allowNearbySuggestions === false) setSuggestions([]);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Setting update failed");
    }
  };

  const discoverContacts = async () => {
    const contactsApi = (navigator as any).contacts;
    if (!contactsApi?.select) {
      toast.info(
        "Contact Picker यो browser मा उपलब्ध छैन। Compatible mobile browser प्रयोग गर्नुहोस्।",
      );
      return;
    }

    setContactLoading(true);
    try {
      const updated = await socialService.updatePreferences({
        allowContactDiscovery: true,
      });
      setPreferences(updated);

      const selected = await contactsApi.select(["name", "tel", "email"], {
        multiple: true,
      });
      const values = selected.flatMap((contact: any) => [
        ...(Array.isArray(contact.tel) ? contact.tel : []),
        ...(Array.isArray(contact.email) ? contact.email : []),
      ]);
      const hashes = await Promise.all(
        values.map((value: string) => hashContactValue(value)),
      );
      const matches = await socialService.contactSuggestions([
        ...new Set(hashes),
      ]);
      setContactMatches(matches);
      toast.success(
        matches.length
          ? `${matches.length} RoomKhoj contact भेटियो`
          : "अहिले matching contact भेटिएन",
      );
    } catch (error: any) {
      if (error?.name !== "AbortError") {
        toast.error(error?.response?.data?.message || "Contact discovery failed");
      }
    } finally {
      setContactLoading(false);
    }
  };

  const createGroup = async () => {
    const name = window.prompt("Group name");
    if (!name?.trim()) return;
    const privacy = window.confirm(
      "Private group बनाउने? OK = Private, Cancel = Public",
    )
      ? "PRIVATE"
      : "PUBLIC";

    try {
      await socialService.createGroup({ name: name.trim(), privacy });
      setGroups(await socialService.groups());
      toast.success("Group created");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Group create failed");
    }
  };

  const addFriend = async (id: string) => {
    await socialService.sendFriendRequest(id);
    setSuggestions((current) => current.filter((item) => item.id !== id));
    setContactMatches((current) => current.filter((item) => item.id !== id));
    toast.success("Friend request sent");
  };

  const removePostFromFeed = (postId: string) => {
    setItems((current) =>
      current.filter(
        (item) => !(item.type === "POST" && item.post.id === postId),
      ),
    );
  };

  if (!isLoaded || !user || loading) {
    return (
      <div className="min-h-screen bg-[#f0f2f5]">
        <SocialHeader photo={myPhoto} />
        <div className="flex min-h-[70vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  const combinedPeople = [
    ...requests,
    ...suggestions,
    ...contactMatches,
  ].filter(
    (person, index, list) =>
      list.findIndex((candidate) => candidate.id === person.id) === index,
  );

  return (
    <div className="min-h-screen bg-[#f0f2f5]">
      <SocialHeader photo={myPhoto} />

      <main className="mx-auto grid max-w-[1380px] grid-cols-1 gap-5 py-3 lg:grid-cols-[230px_minmax(0,680px)_310px] lg:px-5">
        <aside className="hidden lg:block">
          <div className="sticky top-[74px] space-y-1 p-2">
            <Side href="/feed" label="Feed" />
            <Side href="/rooms" label="Rooms" />
            <Side href="/jobs" label="Jobs" />
            <Side href="/user/dashboard/profile" label="Friends" />
            <button
              onClick={createGroup}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-3 text-left font-semibold hover:bg-slate-200"
            >
              <UsersRound className="h-5 w-5" /> Create group
            </button>
            <Link
              href="/user/dashboard/rooms/create"
              className="mt-3 flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-3 font-bold text-white"
            >
              <Plus className="h-5 w-5" /> List Room & Earn
            </Link>
          </div>
        </aside>

        <section className="min-w-0 space-y-3">
          <section className="border-y bg-white p-3 shadow-sm sm:rounded-xl sm:border">
            <div className="flex gap-3 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <button
                onClick={() => storyInput.current?.click()}
                className="relative h-[180px] w-[112px] shrink-0 overflow-hidden rounded-xl bg-slate-100"
              >
                <div className="flex h-[125px] items-center justify-center bg-slate-200">
                  <Avatar
                    user={{ id: user.id, name: user.name }}
                    src={myPhoto}
                    large
                  />
                </div>
                <span className="absolute left-1/2 top-[113px] -translate-x-1/2 rounded-full border-4 border-white bg-blue-600 p-1 text-white">
                  <Plus className="h-5 w-5" />
                </span>
                <b className="absolute bottom-3 left-0 right-0 text-xs">
                  Create story
                </b>
              </button>
              <input
                ref={storyInput}
                type="file"
                accept="image/*,video/*"
                className="hidden"
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  try {
                    await socialService.createStory({ file, visibility: "PUBLIC" });
                    setStories(await socialService.stories());
                    toast.success("Story added for 24 hours");
                  } catch (error: any) {
                    toast.error(error?.response?.data?.message || "Story failed");
                  }
                }}
              />

              {stories.map((story) => (
                <button
                  key={story.id}
                  onClick={async () => {
                    setActiveStory(story);
                    await socialService.viewStory(story.id).catch(() => undefined);
                  }}
                  className="relative h-[180px] w-[112px] shrink-0 overflow-hidden rounded-xl bg-black"
                >
                  {story.mediaType === "VIDEO" ? (
                    <video
                      src={media(story.mediaUrl)}
                      muted
                      className="h-full w-full object-cover opacity-80"
                    />
                  ) : (
                    <img
                      src={media(story.mediaUrl)}
                      alt="Story"
                      className="h-full w-full object-cover opacity-90"
                    />
                  )}
                  <div className="absolute left-2 top-2 rounded-full border-4 border-blue-600">
                    <Avatar user={story.author} />
                  </div>
                  <b className="absolute bottom-2 left-2 right-2 line-clamp-2 text-left text-xs text-white">
                    {story.author.name}
                  </b>
                </button>
              ))}
            </div>
          </section>

          <section className="border-y bg-white p-4 shadow-sm sm:rounded-xl sm:border">
            <div className="flex gap-3">
              <button
                className="relative"
                onClick={() => profileInput.current?.click()}
              >
                <Avatar
                  user={{ id: user.id, name: user.name }}
                  src={myPhoto}
                />
                <Camera className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-white p-0.5" />
              </button>
              <input
                ref={profileInput}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  try {
                    const result = await socialService.uploadProfilePhoto(file);
                    setMyPhoto(result.profilePhotoUrl);
                    toast.success("Profile photo updated");
                  } catch (error: any) {
                    toast.error(
                      error?.response?.data?.message || "Profile photo failed",
                    );
                  }
                }}
              />
              <button
                onClick={() => document.getElementById("composer")?.focus()}
                className="flex-1 rounded-full bg-slate-100 px-4 text-left text-slate-500"
              >
                What's on your mind?
              </button>
            </div>

            <textarea
              id="composer"
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="Share with the RoomKhoj community..."
              className="mt-3 min-h-[75px] w-full resize-none outline-none"
              maxLength={3000}
            />

            {previews.length > 0 && (
              <div className="grid grid-cols-2 gap-1 overflow-hidden rounded-xl">
                {previews.slice(0, 4).map((url, index) =>
                  files[index]?.type.startsWith("video/") ? (
                    <video
                      key={url}
                      src={url}
                      controls
                      className="max-h-72 w-full object-cover"
                    />
                  ) : (
                    <img
                      key={url}
                      src={url}
                      alt="preview"
                      className="max-h-72 w-full object-cover"
                    />
                  ),
                )}
              </div>
            )}

            <div className="mt-2 flex flex-wrap items-center gap-2 border-t pt-2">
              <button
                onClick={() => postInput.current?.click()}
                className="flex items-center gap-2 rounded-lg px-3 py-2 font-semibold text-slate-600 hover:bg-slate-100"
              >
                <ImageIcon className="h-5 w-5 text-green-600" /> Photo/video
              </button>
              <input
                ref={postInput}
                type="file"
                multiple
                accept="image/*,video/*"
                className="hidden"
                onChange={(event) =>
                  setFiles(Array.from(event.target.files || []).slice(0, 6))
                }
              />

              <select
                value={visibility === "GROUP" ? `GROUP:${groupId}` : visibility}
                onChange={(event) => {
                  const value = event.target.value;
                  if (value.startsWith("GROUP:")) {
                    setVisibility("GROUP");
                    setGroupId(value.slice(6));
                  } else {
                    setVisibility(value as "PUBLIC" | "FRIENDS");
                    setGroupId("");
                  }
                }}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold"
              >
                <option value="PUBLIC">Public</option>
                <option value="FRIENDS">Friends</option>
                {groups
                  .filter((group) => group.membership === "ACTIVE")
                  .map((group) => (
                    <option key={group.id} value={`GROUP:${group.id}`}>
                      Group: {group.name}
                    </option>
                  ))}
              </select>

              <button
                onClick={publish}
                disabled={posting || (!text.trim() && !files.length)}
                className="ml-auto rounded-lg bg-blue-600 px-5 py-2 font-bold text-white disabled:opacity-40"
              >
                {posting ? "Posting..." : "Post"}
              </button>
            </div>
          </section>

          {combinedPeople.length > 0 && (
            <PeopleStrip
              requests={requests}
              suggestions={[...suggestions, ...contactMatches]}
              confirm={async (id) => {
                await socialService.acceptFriendRequest(id);
                setRequests((current) =>
                  current.filter((item) => item.id !== id),
                );
              }}
              add={addFriend}
              remove={async (id) => {
                await socialService.rejectFriendRequest(id).catch(() => undefined);
                setRequests((current) =>
                  current.filter((item) => item.id !== id),
                );
                setSuggestions((current) =>
                  current.filter((item) => item.id !== id),
                );
                setContactMatches((current) =>
                  current.filter((item) => item.id !== id),
                );
              }}
            />
          )}

          {items.map((item) => {
            if (item.type === "ROOM") {
              return <RoomCard key={`room-${item.id}`} item={item} />;
            }
            if (item.type === "JOB") {
              return <JobCard key={`job-${item.id}`} item={item} />;
            }

            const post = item.post;
            return (
              <PostCard
                key={`post-${post.id}`}
                post={post}
                currentUserId={user.id}
                comments={comments[post.id] || []}
                open={Boolean(openComments[post.id])}
                draft={drafts[post.id] || ""}
                setDraft={(value) =>
                  setDrafts((current) => ({ ...current, [post.id]: value }))
                }
                onLike={async () => {
                  const result = await socialService.toggleLike(post.id);
                  setItems((current) =>
                    current.map((entry) =>
                      entry.type === "POST" && entry.post.id === post.id
                        ? {
                            ...entry,
                            post: {
                              ...entry.post,
                              likedByMe: result.liked,
                              likeCount: result.likeCount,
                            },
                          }
                        : entry,
                    ),
                  );
                }}
                onToggleComments={async () => {
                  const opening = !openComments[post.id];
                  setOpenComments((current) => ({
                    ...current,
                    [post.id]: opening,
                  }));
                  if (opening && !comments[post.id]) {
                    const loadedComments = await socialService.comments(post.id);
                    setComments((current) => ({
                      ...current,
                      [post.id]: loadedComments,
                    }));
                  }
                }}
                onAddComment={async (event) => {
                  event.preventDefault();
                  const value = String(drafts[post.id] || "").trim();
                  if (!value) return;
                  const created = await socialService.addComment(post.id, value);
                  setComments((current) => ({
                    ...current,
                    [post.id]: [...(current[post.id] || []), created],
                  }));
                  setDrafts((current) => ({ ...current, [post.id]: "" }));
                  setItems((current) =>
                    current.map((entry) =>
                      entry.type === "POST" && entry.post.id === post.id
                        ? {
                            ...entry,
                            post: {
                              ...entry.post,
                              commentCount: entry.post.commentCount + 1,
                            },
                          }
                        : entry,
                    ),
                  );
                }}
                onShare={async () => {
                  const url = `${window.location.origin}/feed?post=${post.id}`;
                  const canShare = typeof navigator.share === "function";
                  if (canShare) {
                    await navigator.share({ title: "RoomKhoj post", url });
                  } else {
                    await navigator.clipboard.writeText(url);
                    toast.success("Post link copied");
                  }
                  const result = await socialService.registerShare(
                    post.id,
                    canShare ? "native" : "copy-link",
                  );
                  setItems((current) =>
                    current.map((entry) =>
                      entry.type === "POST" && entry.post.id === post.id
                        ? {
                            ...entry,
                            post: {
                              ...entry.post,
                              shareCount: result.shareCount,
                            },
                          }
                        : entry,
                    ),
                  );
                }}
                onDeletePost={async () => {
                  await socialService.deletePost(post.id);
                  removePostFromFeed(post.id);
                  toast.success("Post deleted");
                }}
                onEditPost={async () => {
                  const updated = window.prompt("Edit post", post.content || "");
                  if (updated === null) return;
                  await socialService.updatePost(post.id, { content: updated });
                  setItems((current) =>
                    current.map((entry) =>
                      entry.type === "POST" && entry.post.id === post.id
                        ? {
                            ...entry,
                            post: { ...entry.post, content: updated },
                          }
                        : entry,
                    ),
                  );
                }}
                onMute={async () => {
                  await socialService.updateRelation(post.author.id, { muted: true });
                  setItems((current) =>
                    current.filter(
                      (entry) =>
                        !(
                          entry.type === "POST" &&
                          entry.post.author.id === post.author.id
                        ),
                    ),
                  );
                  toast.success(`${post.author.name} muted`);
                }}
                onBlock={async () => {
                  if (!window.confirm(`Block ${post.author.name}?`)) return;
                  await socialService.updateRelation(post.author.id, {
                    blocked: true,
                  });
                  setItems((current) =>
                    current.filter(
                      (entry) =>
                        !(
                          entry.type === "POST" &&
                          entry.post.author.id === post.author.id
                        ),
                    ),
                  );
                  toast.success(`${post.author.name} blocked`);
                }}
                onReport={async () => {
                  const reason = window.prompt("Why are you reporting this post?");
                  if (!reason?.trim()) return;
                  await socialService.report({
                    targetType: "POST",
                    targetId: post.id,
                    reason: reason.trim(),
                  });
                  toast.success("Report submitted");
                }}
                onDeleteComment={async (commentId) => {
                  await socialService.deleteComment(commentId);
                  setComments((current) => ({
                    ...current,
                    [post.id]: (current[post.id] || []).filter(
                      (comment) => comment.id !== commentId,
                    ),
                  }));
                }}
                onEditComment={async (comment) => {
                  const value = window.prompt("Edit comment", comment.content);
                  if (!value?.trim()) return;
                  await socialService.updateComment(comment.id, value.trim());
                  setComments((current) => ({
                    ...current,
                    [post.id]: (current[post.id] || []).map((item) =>
                      item.id === comment.id
                        ? { ...item, content: value.trim() }
                        : item,
                    ),
                  }));
                }}
              />
            );
          })}

          <div ref={sentinel} className="flex h-16 items-center justify-center">
            {loadingMore && <Loader2 className="h-6 w-6 animate-spin" />}
          </div>
        </section>

        <aside className="hidden lg:block">
          <div className="sticky top-[74px] space-y-4">
            <SocialSettingsCard
              preferences={preferences}
              onChange={setPreference}
              onContacts={discoverContacts}
              contactLoading={contactLoading}
            />

            <GroupsCard
              groups={groups}
              onCreate={createGroup}
              onJoin={async (id) => {
                await socialService.joinGroup(id);
                setGroups(await socialService.groups());
              }}
            />

            {requests.length > 0 && (
              <div className="rounded-xl bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <b>Friend requests</b>
                  <span className="text-sm text-blue-600">{requests.length}</span>
                </div>
                {requests.slice(0, 4).map((request) => (
                  <div key={request.id} className="mb-4 flex gap-2">
                    <Avatar user={request} />
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/profile/${request.id}`}
                        className="line-clamp-1 font-bold"
                      >
                        {request.name}
                      </Link>
                      <div className="mt-2 flex gap-2">
                        <button
                          onClick={async () => {
                            await socialService.acceptFriendRequest(request.id);
                            setRequests((current) =>
                              current.filter((item) => item.id !== request.id),
                            );
                          }}
                          className="rounded bg-blue-600 px-3 py-1.5 text-sm font-bold text-white"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={async () => {
                            await socialService.rejectFriendRequest(request.id);
                            setRequests((current) =>
                              current.filter((item) => item.id !== request.id),
                            );
                          }}
                          className="rounded bg-slate-200 px-3 py-1.5 text-sm font-bold"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>
      </main>

      <div className="mx-auto mb-24 block max-w-[680px] space-y-3 px-3 lg:hidden">
        <SocialSettingsCard
          preferences={preferences}
          onChange={setPreference}
          onContacts={discoverContacts}
          contactLoading={contactLoading}
        />
        <GroupsCard
          groups={groups}
          onCreate={createGroup}
          onJoin={async (id) => {
            await socialService.joinGroup(id);
            setGroups(await socialService.groups());
          }}
        />
      </div>

      {activeStory && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 p-3">
          <button
            onClick={() => setActiveStory(null)}
            className="absolute right-4 top-4 rounded-full bg-white/20 p-2 text-white"
          >
            <X className="h-6 w-6" />
          </button>

          {activeStory.author.id === user.id && (
            <button
              onClick={async () => {
                await socialService.deleteStory(activeStory.id);
                setStories((current) =>
                  current.filter((story) => story.id !== activeStory.id),
                );
                setActiveStory(null);
                toast.success("Story deleted");
              }}
              className="absolute left-4 top-4 rounded-full bg-red-600 px-4 py-2 text-sm font-bold text-white"
            >
              Delete
            </button>
          )}

          <div className="max-h-[90vh] max-w-[440px]">
            {activeStory.mediaType === "VIDEO" ? (
              <video
                src={media(activeStory.mediaUrl)}
                autoPlay
                controls
                className="max-h-[90vh] max-w-full"
              />
            ) : (
              <img
                src={media(activeStory.mediaUrl)}
                alt="Story"
                className="max-h-[90vh] max-w-full"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Side({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="block rounded-xl px-3 py-3 font-semibold hover:bg-slate-200"
    >
      {label}
    </Link>
  );
}

function PostCard({
  post,
  currentUserId,
  comments,
  open,
  draft,
  setDraft,
  onLike,
  onToggleComments,
  onAddComment,
  onShare,
  onDeletePost,
  onEditPost,
  onMute,
  onBlock,
  onReport,
  onDeleteComment,
  onEditComment,
}: {
  post: SocialPost;
  currentUserId: string;
  comments: SocialComment[];
  open: boolean;
  draft: string;
  setDraft: (value: string) => void;
  onLike: () => void | Promise<void>;
  onToggleComments: () => void | Promise<void>;
  onAddComment: (event: FormEvent) => void | Promise<void>;
  onShare: () => void | Promise<void>;
  onDeletePost: () => void | Promise<void>;
  onEditPost: () => void | Promise<void>;
  onMute: () => void | Promise<void>;
  onBlock: () => void | Promise<void>;
  onReport: () => void | Promise<void>;
  onDeleteComment: (commentId: string) => void | Promise<void>;
  onEditComment: (comment: SocialComment) => void | Promise<void>;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const own = post.author.id === currentUserId;

  return (
    <article className="border-y bg-white shadow-sm sm:rounded-xl sm:border">
      <header className="relative flex items-center gap-3 p-4">
        <Avatar user={post.author} />
        <div className="flex-1">
          <Link href={`/profile/${post.author.id}`} className="font-bold">
            {post.author.name}
          </Link>
          <p className="flex items-center gap-1 text-xs text-slate-500">
            {ago(post.createdAt)} · {post.visibility === "FRIENDS" ? "Friends" : post.visibility === "GROUP" ? "Group" : "Public"}
          </p>
        </div>
        <button
          onClick={() => setMenuOpen((value) => !value)}
          className="rounded-full p-2 hover:bg-slate-100"
        >
          <MoreHorizontal className="h-5 w-5" />
        </button>

        {menuOpen && (
          <div className="absolute right-3 top-14 z-20 w-48 rounded-xl border bg-white p-1 shadow-xl">
            {own ? (
              <>
                <MenuButton label="Edit post" onClick={onEditPost} />
                <MenuButton label="Delete post" danger onClick={onDeletePost} />
              </>
            ) : (
              <>
                <MenuButton label="Mute user" onClick={onMute} />
                <MenuButton label="Block user" danger onClick={onBlock} />
                <MenuButton label="Report post" danger onClick={onReport} />
              </>
            )}
          </div>
        )}
      </header>

      {post.content && (
        <p className="whitespace-pre-wrap px-4 pb-3 text-[15px]">
          {post.content}
        </p>
      )}

      {post.mediaUrls.length > 0 && (
        <div className={post.mediaUrls.length > 1 ? "grid grid-cols-2 gap-0.5" : ""}>
          {post.mediaUrls.slice(0, 4).map((url, index) =>
            post.mediaTypes[index] === "VIDEO" ? (
              <video
                key={url}
                src={media(url)}
                controls
                className="max-h-[650px] w-full bg-black object-contain"
              />
            ) : (
              <img
                key={url}
                src={media(url)}
                alt="Post"
                className="max-h-[650px] w-full object-cover"
              />
            ),
          )}
        </div>
      )}

      <div className="flex justify-between px-4 py-2 text-sm text-slate-500">
        <span>{post.likeCount ? `👍 ${post.likeCount}` : ""}</span>
        <span>
          {post.commentCount} comments · {post.shareCount} shares
        </span>
      </div>

      <div className="grid grid-cols-3 border-t px-2 py-1">
        <button
          onClick={() => void onLike()}
          className={`flex justify-center gap-2 rounded py-2 font-semibold hover:bg-slate-100 ${
            post.likedByMe ? "text-blue-600" : "text-slate-600"
          }`}
        >
          <Heart className="h-5 w-5" /> Like
        </button>
        <button
          onClick={() => void onToggleComments()}
          className="flex justify-center gap-2 rounded py-2 font-semibold text-slate-600 hover:bg-slate-100"
        >
          <MessageCircle className="h-5 w-5" /> Comment
        </button>
        <button
          onClick={() => void onShare()}
          className="flex justify-center gap-2 rounded py-2 font-semibold text-slate-600 hover:bg-slate-100"
        >
          <Share2 className="h-5 w-5" /> Share
        </button>
      </div>

      {open && (
        <div className="border-t p-3">
          {comments.map((comment) => (
            <div key={comment.id} className="mb-2 flex gap-2">
              <Avatar user={comment.author} />
              <div className="min-w-0 flex-1 rounded-2xl bg-slate-100 px-3 py-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <b className="text-sm">{comment.author.name}</b>
                    <div className="break-words text-sm">{comment.content}</div>
                  </div>
                  {comment.author.id === currentUserId && (
                    <div className="flex gap-2 text-xs">
                      <button
                        onClick={() => void onEditComment(comment)}
                        className="text-blue-600"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => void onDeleteComment(comment.id)}
                        className="text-red-600"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          <form onSubmit={onAddComment} className="flex gap-2">
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              className="flex-1 rounded-full bg-slate-100 px-4 py-2 outline-none"
              placeholder="Write a comment..."
              maxLength={1000}
            />
            <button className="text-blue-600">
              <Send className="h-5 w-5" />
            </button>
          </form>
        </div>
      )}
    </article>
  );
}

function MenuButton({
  label,
  onClick,
  danger = false,
}: {
  label: string;
  onClick: () => void | Promise<void>;
  danger?: boolean;
}) {
  return (
    <button
      onClick={() => void onClick()}
      className={`block w-full rounded-lg px-3 py-2 text-left text-sm font-semibold hover:bg-slate-100 ${
        danger ? "text-red-600" : "text-slate-700"
      }`}
    >
      {label}
    </button>
  );
}

function PeopleStrip({
  requests,
  suggestions,
  confirm,
  add,
  remove,
}: {
  requests: Array<SocialUser & { requestedAt?: string }>;
  suggestions: SocialUser[];
  confirm: (id: string) => void | Promise<void>;
  add: (id: string) => void | Promise<void>;
  remove: (id: string) => void | Promise<void>;
}) {
  const people = [
    ...requests.map((user) => ({ ...user, request: true })),
    ...suggestions.map((user) => ({ ...user, request: false })),
  ]
    .filter(
      (person, index, list) =>
        list.findIndex((candidate) => candidate.id === person.id) === index,
    )
    .slice(0, 12);

  return (
    <section className="border-y bg-white py-3 shadow-sm sm:rounded-xl sm:border">
      <div className="px-4 pb-3">
        <h3 className="text-lg font-bold">People you may know</h3>
      </div>
      <div className="flex gap-2 overflow-x-auto px-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {people.map((person) => (
          <div
            key={`${person.request}-${person.id}`}
            className="w-[190px] shrink-0 overflow-hidden rounded-xl border"
          >
            <div className="flex h-[150px] items-center justify-center bg-slate-100">
              <Avatar user={person} large />
            </div>
            <div className="p-3">
              <Link href={`/profile/${person.id}`} className="font-bold">
                {person.name}
              </Link>
              {person.nearbyLabel && (
                <p className="text-xs text-slate-500">{person.nearbyLabel}</p>
              )}
              <div className="mt-3 grid grid-cols-2 gap-2">
                {person.request ? (
                  <button
                    onClick={() => void confirm(person.id)}
                    className="rounded-lg bg-blue-600 py-2 text-sm font-bold text-white"
                  >
                    Confirm
                  </button>
                ) : (
                  <button
                    onClick={() => void add(person.id)}
                    className="flex items-center justify-center gap-1 rounded-lg bg-blue-600 py-2 text-sm font-bold text-white"
                  >
                    <UserPlus className="h-4 w-4" /> Add
                  </button>
                )}
                <button
                  onClick={() => void remove(person.id)}
                  className="rounded-lg bg-slate-200 py-2 text-sm font-bold"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function RoomCard({
  item,
}: {
  item: Extract<SocialFeedItem, { type: "ROOM" }>;
}) {
  return (
    <Link
      href={`/property/${item.room.id}`}
      className="block overflow-hidden border-y bg-white shadow-sm sm:rounded-xl sm:border"
    >
      {item.room.image && (
        <img
          src={media(item.room.image)}
          alt={item.room.title}
          className="max-h-[420px] w-full object-cover"
        />
      )}
      <div className="p-4">
        <div className="mb-1 text-xs font-bold uppercase tracking-wide text-red-600">
          Room near you
        </div>
        <h3 className="text-lg font-bold">{item.room.title}</h3>
        <div className="text-lg font-black text-red-600">
          Rs. {Number(item.room.price).toLocaleString("en-IN")}/mo
        </div>
        <p className="mt-1 flex items-center gap-1 text-sm text-slate-500">
          <MapPin className="h-4 w-4" />
          {item.room.area || item.room.city || "Nepal"}
        </p>
      </div>
    </Link>
  );
}

function JobCard({
  item,
}: {
  item: Extract<SocialFeedItem, { type: "JOB" }>;
}) {
  return (
    <Link
      href={`/job/${item.job.id}`}
      className="block border-y bg-white p-5 shadow-sm sm:rounded-xl sm:border"
    >
      <div className="mb-1 text-xs font-bold uppercase tracking-wide text-blue-600">
        Job opportunity
      </div>
      <div className="flex gap-3">
        <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
          <BriefcaseBusiness className="h-7 w-7" />
        </div>
        <div>
          <h3 className="text-lg font-bold">{item.job.jobTitle}</h3>
          <p className="text-sm text-slate-600">
            {item.job.companyName || "RoomKhoj employer"}
          </p>
          <p className="mt-1 font-bold">
            {item.job.salary
              ? `Rs. ${Number(item.job.salary).toLocaleString("en-IN")}`
              : item.job.salaryMin || item.job.salaryMax
                ? `Rs. ${Number(item.job.salaryMin || 0).toLocaleString("en-IN")}–${Number(item.job.salaryMax || 0).toLocaleString("en-IN")}`
                : "Salary negotiable"}
          </p>
          <p className="flex items-center gap-1 text-xs text-slate-500">
            <MapPin className="h-3 w-3" /> {item.job.location}
          </p>
        </div>
      </div>
    </Link>
  );
}

function SocialSettingsCard({
  preferences,
  onChange,
  onContacts,
  contactLoading,
}: {
  preferences: SocialPreferences | null;
  onChange: (patch: Partial<SocialPreferences>) => void | Promise<void>;
  onContacts: () => void | Promise<void>;
  contactLoading: boolean;
}) {
  if (!preferences) return null;

  const rows: Array<{
    key: keyof SocialPreferences;
    title: string;
    description: string;
  }> = [
    {
      key: "allowNearbySuggestions",
      title: "Nearby people",
      description: "Show opted-in RoomKhoj users near you without exposing exact location.",
    },
    {
      key: "roomOpportunityEmailOptIn",
      title: "Room earning email",
      description: "Receive occasional tips about listing rooms and earning.",
    },
    {
      key: "jobVisitorEarningEmailOptIn",
      title: "Jobs + earning email",
      description: "After visiting jobs, receive occasional room-earning education.",
    },
  ];

  return (
    <section className="rounded-xl bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <Settings2 className="h-5 w-5" />
        <b>Social & discovery</b>
      </div>

      <div className="space-y-3">
        {rows.map((row) => (
          <label key={row.key} className="flex cursor-pointer gap-3">
            <input
              type="checkbox"
              checked={Boolean(preferences[row.key])}
              onChange={(event) =>
                void onChange({ [row.key]: event.target.checked })
              }
              className="mt-1 h-4 w-4"
            />
            <span>
              <span className="block text-sm font-semibold">{row.title}</span>
              <span className="block text-xs leading-5 text-slate-500">
                {row.description}
              </span>
            </span>
          </label>
        ))}
      </div>

      <button
        onClick={() => void onContacts()}
        disabled={contactLoading}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-sm font-bold text-white disabled:opacity-60"
      >
        {contactLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
        Find friends from contacts
      </button>

      <p className="mt-2 text-[11px] leading-4 text-slate-400">
        Contact values are hashed in your browser before matching. Raw contacts are not uploaded as an address book.
      </p>
    </section>
  );
}

function GroupsCard({
  groups,
  onCreate,
  onJoin,
}: {
  groups: SocialGroup[];
  onCreate: () => void | Promise<void>;
  onJoin: (id: string) => void | Promise<void>;
}) {
  return (
    <section className="rounded-xl bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <UsersRound className="h-5 w-5" />
          <b>Groups</b>
        </div>
        <button onClick={() => void onCreate()} className="text-sm font-bold text-blue-600">
          Create
        </button>
      </div>

      {groups.length === 0 ? (
        <p className="text-sm text-slate-500">Create the first community group.</p>
      ) : (
        <div className="space-y-3">
          {groups.slice(0, 6).map((group) => (
            <div key={group.id} className="rounded-lg border p-3">
              <div className="font-bold">{group.name}</div>
              <div className="text-xs text-slate-500">
                {group.memberCount} members · {group.privacy.toLowerCase()}
              </div>
              {group.membership === "NONE" && (
                <button
                  onClick={() => void onJoin(group.id)}
                  className="mt-2 rounded bg-blue-600 px-3 py-1.5 text-xs font-bold text-white"
                >
                  Join
                </button>
              )}
              {group.membership === "PENDING" && (
                <span className="mt-2 inline-block text-xs font-semibold text-amber-600">
                  Join request pending
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
