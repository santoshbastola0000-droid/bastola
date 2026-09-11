"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  BriefcaseBusiness,
  Camera,
  Image as ImageIcon,
  Loader2,
  MapPin,
  Menu,
  MessageCircle,
  MoreHorizontal,
  Plus,
  Share2,
  UserPlus,
  X,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";

import { useUserStore } from "@/stores/user-store";
import { profileService } from "@/http/services/profile.service";
import {
  SocialFeedItem,
  SocialGroup,
  SocialPost,
  SocialStory,
  SocialUser,
  socialService,
} from "@/http/services/social.service";
import { PostReactions } from "@/components/social/PostReactions";
import { CommentThread } from "@/components/social/CommentThread";
import { MobileMenuDrawer } from "@/components/social/MobileMenuDrawer";

const backendUrl = String(
  process.env.NEXT_PUBLIC_BACKEND_URL || "https://api.roomkhoj.com",
).replace(/\/$/, "");

function media(value?: string | null) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (/^(https?:)?\/\//i.test(raw)) return raw.startsWith("//") ? `https:${raw}` : raw;
  if (/^(data:|blob:)/i.test(raw)) return raw;
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
  size = "md",
}: {
  user?: SocialUser | null;
  src?: string | null;
  size?: "sm" | "md" | "lg";
}) {
  const photo = media(src || user?.profilePhotoUrl);
  const dimensions =
    size === "lg" ? "h-14 w-14" : size === "sm" ? "h-8 w-8" : "h-10 w-10";
  const textSize = size === "lg" ? "text-[16px]" : size === "sm" ? "text-[10px]" : "text-[13px]";
  const [failed, setFailed] = useState(false);

  if (photo && !failed) {
    return (
      <img
        src={photo}
        alt={user?.name || "Profile"}
        loading="lazy"
        decoding="async"
        onError={() => setFailed(true)}
        className={`${dimensions} shrink-0 rounded-full border border-slate-200 bg-slate-100 object-cover shadow-sm`}
      />
    );
  }
  return (
    <div
      className={`${dimensions} ${textSize} flex shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-200 font-bold text-slate-600 shadow-sm`}
    >
      {String(user?.name || "R").slice(0, 1).toUpperCase()}
    </div>
  );
}

function SocialHeader({
  visible,
  onMenu,
}: {
  visible: boolean;
  onMenu: () => void;
}) {
  return (
    <header
      className={`sticky top-0 z-[80] border-b border-slate-200 bg-white/95 backdrop-blur transition-transform duration-200 ease-out ${
        visible ? "translate-y-0" : "-translate-y-full"
      }`}
    >
      <div className="mx-auto flex h-[58px] max-w-[760px] items-center justify-end gap-2 px-3">
        <Link
          href="/notifications"
          aria-label="Notifications"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100"
        >
          <Bell className="h-5 w-5" />
        </Link>
        <button
          type="button"
          aria-label="Open menu"
          onClick={onMenu}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100"
        >
          <Menu className="h-6 w-6" />
        </button>
      </div>
    </header>
  );
}

export function SocialFeedScreen() {
  const router = useRouter();
  const { user, isLoaded } = useUserStore();

  const [items, setItems] = useState<SocialFeedItem[]>([]);
  const [stories, setStories] = useState<SocialStory[]>([]);
  const [groups, setGroups] = useState<SocialGroup[]>([]);
  const [requests, setRequests] = useState<Array<SocialUser & { requestedAt: string }>>([]);
  const [suggestions, setSuggestions] = useState<SocialUser[]>([]);
  const [myPhoto, setMyPhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  const [text, setText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [visibility, setVisibility] = useState<"PUBLIC" | "FRIENDS" | "GROUP">("PUBLIC");
  const [groupId, setGroupId] = useState("");
  const [posting, setPosting] = useState(false);

  const [openComments, setOpenComments] = useState<Record<string, boolean>>({});
  const [activeStory, setActiveStory] = useState<SocialStory | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [headerVisible, setHeaderVisible] = useState(true);

  const lastScrollY = useRef(0);
  const postInput = useRef<HTMLInputElement>(null);
  const storyInput = useRef<HTMLInputElement>(null);
  const profileInput = useRef<HTMLInputElement>(null);
  const sentinel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isLoaded && !user) {
      router.replace("/auth/login?redirect=%2Ffeed");
    }
  }, [isLoaded, router, user]);

  useEffect(() => {
    const handleScroll = () => {
      const y = Math.max(0, window.scrollY);
      const delta = y - lastScrollY.current;
      if (y < 20) setHeaderVisible(true);
      else if (delta > 8) setHeaderVisible(false);
      else if (delta < -6) setHeaderVisible(true);
      lastScrollY.current = y;
    };
    lastScrollY.current = window.scrollY;
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Critical path: only wait for the actual feed. Stories, groups, profile
      // data and suggestions are useful, but they must never block Home.
      const feed = await socialService.feed();
      setItems(feed.items || []);
      setNextCursor(feed.nextCursor || null);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Feed load failed");
    } finally {
      setLoading(false);
    }
  }, [user]);

  const loadSecondary = useCallback(async () => {
    if (!user) return;

    const [storyRows, friendRows, groupRows, socialPhoto, profile, prefs] =
      await Promise.all([
        socialService.stories().catch(() => []),
        socialService.friendRequests().catch(() => []),
        socialService.groups().catch(() => []),
        socialService
          .myProfilePhoto()
          .catch(() => ({ profilePhotoUrl: null, createdAt: null })),
        profileService.getProfile(String(user.id)).catch(() => null),
        socialService.preferences().catch(() => null),
      ]);

    setStories(storyRows || []);
    setRequests(friendRows || []);
    setGroups(groupRows || []);
    setMyPhoto(
      socialPhoto.profilePhotoUrl ||
        profile?.user?.profilePhotoUrl ||
        (user as any)?.profilePhotoUrl ||
        null,
    );

    if (prefs?.allowNearbySuggestions) {
      const nearby = await socialService
        .nearbySuggestions()
        .catch(() => ({ enabled: false, suggestions: [] }));
      setSuggestions(nearby.suggestions || []);
    }
  }, [user]);

  useEffect(() => {
    let active = true;

    const boot = async () => {
      await load();
      if (active) void loadSecondary();
    };

    void boot();
    return () => {
      active = false;
    };
  }, [load, loadSecondary]);

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
    if ((!text.trim() && !files.length) || posting) return;
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

  if (!isLoaded || !user || loading) {
    return (
      <div className="min-h-screen bg-[#f0f2f5]">
        <SocialHeader visible={headerVisible} onMenu={() => setMenuOpen(true)} />
        <div className="flex min-h-[70vh] items-center justify-center">
          <Loader2 className="h-7 w-7 animate-spin" />
        </div>
      </div>
    );
  }

  const people = [...requests, ...suggestions].filter(
    (person, index, list) => list.findIndex((candidate) => candidate.id === person.id) === index,
  );

  return (
    <div className="min-h-screen bg-[#f0f2f5] font-sans text-slate-950 antialiased">
      <SocialHeader visible={headerVisible} onMenu={() => setMenuOpen(true)} />
      <MobileMenuDrawer
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        userName={user.name}
      />

      <main className="mx-auto max-w-[720px] space-y-2 pb-24 sm:px-3">
        <StoryCarousel
          stories={stories}
          userName={user.name}
          myPhoto={myPhoto}
          storyInput={storyInput}
          onOpen={async (story) => {
            setActiveStory(story);
            await socialService.viewStory(story.id).catch(() => undefined);
          }}
          onCreated={async (file) => {
            await socialService.createStory({ file, visibility: "PUBLIC" });
            setStories(await socialService.stories());
            toast.success("Story added for 24 hours");
          }}
        />

        <Composer
          userName={user.name}
          myPhoto={myPhoto}
          text={text}
          setText={setText}
          files={files}
          setFiles={setFiles}
          previews={previews}
          visibility={visibility}
          setVisibility={setVisibility}
          groupId={groupId}
          setGroupId={setGroupId}
          groups={groups}
          posting={posting}
          onPublish={publish}
          postInput={postInput}
          profileInput={profileInput}
          onProfilePhoto={async (file) => {
            try {
              const result = await profileService.uploadProfilePhoto(file);
              const nextPhoto = result?.profilePhotoUrl || result?.user?.profilePhotoUrl || result?.data?.profilePhotoUrl || null;
              if (nextPhoto) setMyPhoto(nextPhoto);
              else await loadSecondary();
              toast.success("Profile photo updated");
            } catch {
              const result = await socialService.uploadProfilePhoto(file);
              setMyPhoto(result.profilePhotoUrl);
              toast.success("Profile photo updated");
            }
          }}
        />

        <Link
          href="/rooms"
          aria-label="Browse available rooms and open room cards"
          className="flex items-center gap-3 border-y border-red-100 bg-white px-4 py-3 shadow-sm transition-colors hover:bg-red-50/60 sm:rounded-xl sm:border"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
            <MapPin className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[16px] font-bold text-slate-950">Browse Rooms</div>
            <div className="mt-0.5 text-[12px] font-medium leading-4 text-slate-500">
              Tap here to see all available room cards
            </div>
          </div>
          <span className="shrink-0 rounded-full bg-red-600 px-3 py-2 text-[12px] font-bold text-white">
            View rooms →
          </span>
        </Link>

        {people.length > 0 && (
          <PeopleStrip
            people={people.slice(0, 10)}
            requestIds={new Set(requests.map((item) => item.id))}
            onConfirm={async (id) => {
              await socialService.acceptFriendRequest(id);
              setRequests((current) => current.filter((item) => item.id !== id));
            }}
            onAdd={async (id) => {
              await socialService.sendFriendRequest(id);
              setSuggestions((current) => current.filter((item) => item.id !== id));
            }}
          />
        )}

        {items.map((item) => {
          if (item.type === "ROOM") return <RoomCard key={`room-${item.id}`} item={item} />;
          if (item.type === "JOB") return <JobCard key={`job-${item.id}`} item={item} />;
          if (item.type === "SERVICE") return <ServiceCard key={`service-${item.id}`} item={item} />;
          const post = item.post;
          return (
            <PostCard
              key={`post-${post.id}`}
              post={post}
              currentUserId={user.id}
              commentsOpen={Boolean(openComments[post.id])}
              onToggleComments={() =>
                setOpenComments((current) => ({ ...current, [post.id]: !current[post.id] }))
              }
              onShare={async () => {
                const url = `${window.location.origin}/feed?post=${post.id}`;
                const native = typeof navigator.share === "function";
                if (native) await navigator.share({ title: "RoomKhoj post", url });
                else {
                  await navigator.clipboard.writeText(url);
                  toast.success("Post link copied");
                }
                await socialService.registerShare(post.id, native ? "native" : "copy-link");
              }}
              onChanged={load}
            />
          );
        })}

        <div ref={sentinel} className="flex h-14 items-center justify-center">
          {loadingMore && <Loader2 className="h-5 w-5 animate-spin" />}
        </div>
      </main>

      {activeStory && (
        <StoryViewer
          story={activeStory}
          own={activeStory.author.id === user.id}
          onClose={() => setActiveStory(null)}
          onDelete={async () => {
            await socialService.deleteStory(activeStory.id);
            setStories((current) => current.filter((story) => story.id !== activeStory.id));
            setActiveStory(null);
          }}
        />
      )}
    </div>
  );
}

function StoryCarousel({
  stories,
  userName,
  myPhoto,
  storyInput,
  onOpen,
  onCreated,
}: {
  stories: SocialStory[];
  userName: string;
  myPhoto: string | null;
  storyInput: React.RefObject<HTMLInputElement | null>;
  onOpen: (story: SocialStory) => void | Promise<void>;
  onCreated: (file: File) => void | Promise<void>;
}) {
  return (
    <section className="border-y bg-white px-2 py-3 shadow-sm sm:rounded-xl sm:border">
      <div className="flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <button
          onClick={() => storyInput.current?.click()}
          className="relative h-[176px] w-[108px] shrink-0 overflow-hidden rounded-xl border bg-white"
        >
          <div className="flex h-[120px] items-center justify-center bg-slate-100">
            <Avatar user={{ id: "me", name: userName }} src={myPhoto} size="lg" />
          </div>
          <span className="absolute left-1/2 top-[108px] flex h-10 w-10 -translate-x-1/2 items-center justify-center rounded-full border-4 border-white bg-blue-600 text-white">
            <Plus className="h-6 w-6" />
          </span>
          <span className="absolute bottom-3 left-1 right-1 text-[13px] font-bold">Create story</span>
        </button>
        <input
          ref={storyInput}
          type="file"
          accept="image/*,video/*"
          className="hidden"
          onChange={async (event) => {
            const file = event.target.files?.[0];
            if (file) await onCreated(file);
            event.target.value = "";
          }}
        />
        {stories.map((story) => (
          <button
            key={story.id}
            onClick={() => void onOpen(story)}
            className="relative h-[176px] w-[108px] shrink-0 overflow-hidden rounded-xl bg-slate-900"
          >
            {story.mediaType === "VIDEO" ? (
              <video src={media(story.mediaUrl)} muted preload="none" className="h-full w-full object-cover opacity-85" />
            ) : (
              <img src={media(story.mediaUrl)} alt="Story" loading="lazy" decoding="async" className="h-full w-full object-cover" />
            )}
            <div className="absolute left-2 top-2 rounded-full border-[3px] border-blue-600 bg-white p-[1px]">
              <Avatar user={story.author} size="sm" />
            </div>
            <span className="absolute bottom-2 left-2 right-2 line-clamp-2 text-left text-[12px] font-bold text-white drop-shadow">
              {story.author.name}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

function Composer({
  userName,
  myPhoto,
  text,
  setText,
  files,
  setFiles,
  previews,
  visibility,
  setVisibility,
  groupId,
  setGroupId,
  groups,
  posting,
  onPublish,
  postInput,
  profileInput,
  onProfilePhoto,
}: {
  userName: string;
  myPhoto: string | null;
  text: string;
  setText: (value: string) => void;
  files: File[];
  setFiles: (files: File[]) => void;
  previews: string[];
  visibility: "PUBLIC" | "FRIENDS" | "GROUP";
  setVisibility: (value: "PUBLIC" | "FRIENDS" | "GROUP") => void;
  groupId: string;
  setGroupId: (value: string) => void;
  groups: SocialGroup[];
  posting: boolean;
  onPublish: () => void | Promise<void>;
  postInput: React.RefObject<HTMLInputElement | null>;
  profileInput: React.RefObject<HTMLInputElement | null>;
  onProfilePhoto: (file: File) => void | Promise<void>;
}) {
  return (
    <section className="border-y bg-white p-3 shadow-sm sm:rounded-xl sm:border">
      <div className="flex items-center gap-2.5">
        <button className="relative" onClick={() => profileInput.current?.click()}>
          <Avatar user={{ id: "me", name: userName }} src={myPhoto} />
          <Camera className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-white p-0.5" />
        </button>
        <input
          ref={profileInput}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={async (event) => {
            const file = event.target.files?.[0];
            if (file) await onProfilePhoto(file);
            event.target.value = "";
          }}
        />
        <input
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="What's on your mind?"
          className="min-w-0 flex-1 rounded-full bg-slate-100 px-4 py-2.5 text-[16px] outline-none placeholder:text-slate-500"
          maxLength={3000}
        />
      </div>

      {previews.length > 0 && (
        <div className="mt-3 grid grid-cols-2 gap-1 overflow-hidden rounded-xl">
          {previews.slice(0, 4).map((url, index) =>
            files[index]?.type.startsWith("video/") ? (
              <video key={url} src={url} controls className="max-h-72 w-full object-cover" />
            ) : (
              <img key={url} src={url} alt="Preview" className="max-h-72 w-full object-cover" />
            ),
          )}
        </div>
      )}

      <div className="mt-3 flex items-center gap-2 border-t pt-2">
        <button
          onClick={() => postInput.current?.click()}
          className="flex items-center gap-1.5 rounded-lg px-2 py-2 text-[14px] font-semibold text-slate-600 hover:bg-slate-100"
        >
          <ImageIcon className="h-5 w-5 text-green-600" /> Photo/video
        </button>
        <input
          ref={postInput}
          type="file"
          multiple
          accept="image/*,video/*"
          className="hidden"
          onChange={(event) => setFiles(Array.from(event.target.files || []).slice(0, 6))}
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
          className="min-w-0 rounded-lg border border-slate-200 bg-white px-2 py-2 text-[13px] font-semibold"
        >
          <option value="PUBLIC">Public</option>
          <option value="FRIENDS">Friends</option>
          {groups
            .filter((group) => group.membership === "ACTIVE")
            .map((group) => (
              <option key={group.id} value={`GROUP:${group.id}`}>Group: {group.name}</option>
            ))}
        </select>

        <button
          onClick={() => void onPublish()}
          disabled={posting || (!text.trim() && !files.length)}
          className="ml-auto rounded-lg bg-blue-600 px-4 py-2 text-[14px] font-bold text-white disabled:opacity-40"
        >
          {posting ? "Posting…" : "Post"}
        </button>
      </div>
    </section>
  );
}

function PostCard({
  post,
  currentUserId,
  commentsOpen,
  onToggleComments,
  onShare,
  onChanged,
}: {
  post: SocialPost;
  currentUserId: string;
  commentsOpen: boolean;
  onToggleComments: () => void;
  onShare: () => void | Promise<void>;
  onChanged: () => void | Promise<void>;
}) {
  const [postMenu, setPostMenu] = useState(false);
  const own = post.author.id === currentUserId;

  return (
    <article className="border-y bg-white font-sans text-slate-950 shadow-sm sm:rounded-xl sm:border">
      <header className="relative flex items-center gap-2.5 px-3 pb-2 pt-3">
        <Avatar user={post.author} />
        <div className="min-w-0 flex-1">
          <Link href={`/profile/${post.author.id}`} className="block truncate text-[15px] font-semibold leading-tight">
            {post.author.name}
          </Link>
          <div className="mt-0.5 text-[12px] font-medium leading-tight text-slate-500">
            {ago(post.createdAt)} · {post.visibility === "FRIENDS" ? "Friends" : post.visibility === "GROUP" ? "Group" : "Public"}
          </div>
        </div>
        <button onClick={() => setPostMenu((value) => !value)} className="rounded-full p-2 hover:bg-slate-100">
          <MoreHorizontal className="h-5 w-5" />
        </button>
        {postMenu && (
          <div className="absolute right-3 top-12 z-30 w-48 rounded-xl border bg-white p-1 shadow-xl">
            {own ? (
              <>
                <ActionButton label="Edit post" onClick={async () => {
                  const value = window.prompt("Edit post", post.content || "");
                  if (value === null) return;
                  await socialService.updatePost(post.id, { content: value });
                  setPostMenu(false);
                  await onChanged();
                }} />
                <ActionButton danger label="Delete post" onClick={async () => {
                  if (!window.confirm("Delete this post?")) return;
                  await socialService.deletePost(post.id);
                  await onChanged();
                }} />
              </>
            ) : (
              <>
                <ActionButton label="Mute user" onClick={async () => {
                  await socialService.updateRelation(post.author.id, { muted: true });
                  await onChanged();
                }} />
                <ActionButton danger label="Block user" onClick={async () => {
                  if (!window.confirm(`Block ${post.author.name}?`)) return;
                  await socialService.updateRelation(post.author.id, { blocked: true });
                  await onChanged();
                }} />
                <ActionButton danger label="Report post" onClick={async () => {
                  const reason = window.prompt("Why are you reporting this post?");
                  if (!reason?.trim()) return;
                  await socialService.report({ targetType: "POST", targetId: post.id, reason: reason.trim() });
                  toast.success("Report submitted");
                }} />
              </>
            )}
          </div>
        )}
      </header>

      {post.content && (
        <p className="whitespace-pre-wrap px-3 pb-3 text-[16px] font-normal leading-[1.35] text-slate-950">
          {post.content}
        </p>
      )}

      <PostMedia post={post} />

      <PostReactions
        postId={post.id}
        currentUserId={currentUserId}
        initialLikeCount={post.likeCount}
        initialLiked={post.likedByMe}
        commentCount={post.commentCount}
        shareCount={post.shareCount}
        onToggleComments={onToggleComments}
        onShare={onShare}
      />

      {commentsOpen && <CommentThread postId={post.id} currentUserId={currentUserId} />}
    </article>
  );
}

function PostMedia({ post }: { post: SocialPost }) {
  const [active, setActive] = useState(0);
  const scroller = useRef<HTMLDivElement>(null);
  const allImages = post.mediaUrls.length > 1 && post.mediaTypes.every((type) => type === "IMAGE");

  if (!post.mediaUrls.length) return null;

  if (!allImages) {
    return (
      <div className={post.mediaUrls.length > 1 ? "grid grid-cols-2 gap-0.5" : ""}>
        {post.mediaUrls.slice(0, 4).map((url, index) =>
          post.mediaTypes[index] === "VIDEO" ? (
            <video key={url} src={media(url)} controls preload="metadata" className="max-h-[640px] w-full bg-black object-contain" />
          ) : (
            <img key={url} src={media(url)} alt="Post" loading="lazy" decoding="async" className="max-h-[640px] w-full object-cover" />
          ),
        )}
      </div>
    );
  }

  return (
    <div className="relative bg-black">
      <div
        ref={scroller}
        onScroll={(event) => {
          const el = event.currentTarget;
          const width = el.clientWidth || 1;
          setActive(Math.max(0, Math.min(post.mediaUrls.length - 1, Math.round(el.scrollLeft / width))));
        }}
        className="flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {post.mediaUrls.map((url, index) => (
          <div key={`${url}-${index}`} className="w-full shrink-0 snap-center">
            <img src={media(url)} alt={`Post photo ${index + 1}`} loading="lazy" decoding="async" className="max-h-[680px] w-full object-contain" />
          </div>
        ))}
      </div>
      <div className="absolute right-3 top-3 rounded-full bg-black/60 px-2.5 py-1 text-xs font-bold text-white">
        {active + 1}/{post.mediaUrls.length}
      </div>
      <div className="pointer-events-none absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
        {post.mediaUrls.map((_, index) => (
          <span key={index} className={`h-1.5 w-1.5 rounded-full ${index === active ? "bg-white" : "bg-white/45"}`} />
        ))}
      </div>
    </div>
  );
}

function PeopleStrip({
  people,
  requestIds,
  onConfirm,
  onAdd,
}: {
  people: SocialUser[];
  requestIds: Set<string>;
  onConfirm: (id: string) => void | Promise<void>;
  onAdd: (id: string) => void | Promise<void>;
}) {
  return (
    <section className="border-y bg-white py-3 shadow-sm sm:rounded-xl sm:border">
      <div className="px-3 pb-2 text-[15px] font-semibold">People you may know</div>
      <div className="flex gap-2 overflow-x-auto px-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {people.map((person) => (
          <div key={person.id} className="w-[155px] shrink-0 rounded-xl border p-3 text-center">
            <div className="mx-auto w-fit"><Avatar user={person} size="lg" /></div>
            <Link href={`/profile/${person.id}`} className="mt-2 block truncate text-[14px] font-semibold">{person.name}</Link>
            {person.nearbyLabel && <div className="truncate text-[11px] text-slate-500">{person.nearbyLabel}</div>}
            <button
              onClick={() => void (requestIds.has(person.id) ? onConfirm(person.id) : onAdd(person.id))}
              className="mt-2 flex w-full items-center justify-center gap-1 rounded-lg bg-blue-600 py-1.5 text-[12px] font-bold text-white"
            >
              <UserPlus className="h-3.5 w-3.5" /> {requestIds.has(person.id) ? "Confirm" : "Add"}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

function RoomCard({ item }: { item: Extract<SocialFeedItem, { type: "ROOM" }> }) {
  return (
    <Link href={`/property/${item.room.id}`} className="block overflow-hidden border-y bg-white shadow-sm sm:rounded-xl sm:border">
      {item.room.image && <img src={media(item.room.image)} alt={item.room.title} loading="lazy" decoding="async" className="max-h-[420px] w-full object-cover" />}
      <div className="p-3">
        <div className="text-[11px] font-bold uppercase tracking-wide text-red-600">Room near you</div>
        <div className="mt-0.5 text-[16px] font-semibold leading-tight">{item.room.title}</div>
        <div className="mt-1 text-[15px] font-bold text-red-600">Rs. {Number(item.room.price).toLocaleString("en-IN")}/mo</div>
        <div className="mt-1 flex items-center gap-1 text-[12px] text-slate-500">
          <MapPin className="h-3.5 w-3.5" /> {item.room.area || item.room.city || "Nepal"}
        </div>
      </div>
    </Link>
  );
}

function JobCard({ item }: { item: Extract<SocialFeedItem, { type: "JOB" }> }) {
  return (
    <Link href={`/job/${item.job.id}`} className="block border-y bg-white p-4 shadow-sm sm:rounded-xl sm:border">
      <div className="flex gap-3">
        <div className="rounded-xl bg-blue-50 p-3 text-blue-600"><BriefcaseBusiness className="h-6 w-6" /></div>
        <div className="min-w-0">
          <div className="text-[11px] font-bold uppercase tracking-wide text-blue-600">Job opportunity</div>
          <div className="truncate text-[16px] font-semibold">{item.job.jobTitle}</div>
          <div className="text-[13px] text-slate-600">{item.job.companyName || "RoomKhoj employer"}</div>
          <div className="mt-1 text-[13px] font-semibold">
            {item.job.salary ? `Rs. ${Number(item.job.salary).toLocaleString("en-IN")}` : "Salary negotiable"}
          </div>
          <div className="mt-1 flex items-center gap-1 text-[12px] text-slate-500"><MapPin className="h-3.5 w-3.5" /> {item.job.location}</div>
        </div>
      </div>
    </Link>
  );
}

function ServiceCard({ item }: { item: Extract<SocialFeedItem, { type: "SERVICE" }> }) {
  return (
    <Link
      href={item.service.href}
      className="block border-y bg-white p-4 shadow-sm sm:rounded-xl sm:border"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
          <Plus className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-bold uppercase tracking-wide text-red-600">RoomKhoj service</div>
          <div className="mt-0.5 text-[16px] font-semibold leading-tight">{item.service.title}</div>
          <p className="mt-1 text-[13px] leading-5 text-slate-600">{item.service.body}</p>
          <div className="mt-2 text-[12px] font-bold text-red-600">Open →</div>
        </div>
      </div>
    </Link>
  );
}

function StoryViewer({
  story,
  own,
  onClose,
  onDelete,
}: {
  story: SocialStory;
  own: boolean;
  onClose: () => void;
  onDelete: () => void | Promise<void>;
}) {
  return (
    <div className="fixed inset-0 z-[240] flex items-center justify-center bg-black/95 p-3">
      <button onClick={onClose} className="absolute right-4 top-4 rounded-full bg-white/20 p-2 text-white"><X className="h-6 w-6" /></button>
      {own && (
        <button onClick={() => void onDelete()} className="absolute left-4 top-4 rounded-full bg-red-600 px-4 py-2 text-[13px] font-bold text-white">Delete</button>
      )}
      {story.mediaType === "VIDEO" ? (
        <video src={media(story.mediaUrl)} autoPlay controls className="max-h-[90vh] max-w-full" />
      ) : (
        <img src={media(story.mediaUrl)} alt="Story" className="max-h-[90vh] max-w-full" />
      )}
    </div>
  );
}

function ActionButton({
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
      className={`block w-full rounded-lg px-3 py-2 text-left text-[13px] font-semibold hover:bg-slate-100 ${danger ? "text-red-600" : "text-slate-700"}`}
    >
      {label}
    </button>
  );
}
