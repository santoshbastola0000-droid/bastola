"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Bell,
  BriefcaseBusiness,
  ChevronRight,
  Heart,
  Image as ImageIcon,
  Loader2,
  MapPin,
  Menu,
  MessageCircle,
  MoreHorizontal,
  Plus,
  Send,
  Share2,
  UserPlus,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { useUserStore } from "@/stores/user-store";
import {
  SocialComment,
  SocialFeedItem,
  SocialPost,
  SocialStory,
  SocialUser,
  socialService,
} from "@/http/services/social.service";

const backendUrl = String(
  process.env.NEXT_PUBLIC_BACKEND_URL || "https://api.roomkhoj.com",
).replace(/\/$/, "");

function mediaUrl(value?: string | null) {
  const raw = String(value || "");
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  return `${backendUrl}${raw.startsWith("/") ? raw : `/${raw}`}`;
}

function ago(value: string) {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60000));
  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return new Date(value).toLocaleDateString();
}

function Avatar({ user, size = "md" }: { user?: SocialUser | null; size?: "sm" | "md" | "lg" }) {
  const sizeClass = size === "lg" ? "h-20 w-20" : size === "sm" ? "h-9 w-9" : "h-11 w-11";
  const photo = mediaUrl(user?.profilePhotoUrl);
  if (photo) {
    return <img src={photo} alt={user?.name || "User"} className={`${sizeClass} shrink-0 rounded-full object-cover bg-slate-100`} />;
  }
  return (
    <div className={`${sizeClass} flex shrink-0 items-center justify-center rounded-full bg-slate-200 font-bold text-slate-600`}>
      {String(user?.name || "R").slice(0, 1).toUpperCase()}
    </div>
  );
}

export function FacebookStyleFeed() {
  const router = useRouter();
  const { user, isLoaded } = useUserStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [items, setItems] = useState<SocialFeedItem[]>([]);
  const [stories, setStories] = useState<SocialStory[]>([]);
  const [requests, setRequests] = useState<Array<SocialUser & { requestedAt: string }>>([]);
  const [suggestions, setSuggestions] = useState<SocialUser[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [text, setText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [posting, setPosting] = useState(false);
  const [activeStory, setActiveStory] = useState<SocialStory | null>(null);
  const [commentsOpen, setCommentsOpen] = useState<Record<string, boolean>>({});
  const [comments, setComments] = useState<Record<string, SocialComment[]>>({});
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const postInput = useRef<HTMLInputElement>(null);
  const storyInput = useRef<HTMLInputElement>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isLoaded && !user) router.replace("/auth/login?redirect=%2Ffeed");
  }, [isLoaded, router, user]);

  const loadInitial = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [feed, storyList, friendList] = await Promise.all([
        socialService.feed(),
        socialService.stories().catch(() => []),
        socialService.friendRequests().catch(() => []),
      ]);
      setItems(feed.items || []);
      setNextCursor(feed.nextCursor || null);
      setStories(storyList || []);
      setRequests(friendList || []);

      const nearby = await socialService.nearbySuggestions().catch(() => ({
        enabled: false,
        suggestions: [] as SocialUser[],
      }));
      setSuggestions(nearby.suggestions || []);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Feed load failed");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void loadInitial();
  }, [loadInitial]);

  const loadMore = useCallback(async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const page = await socialService.feed(nextCursor);
      setItems((current) => {
        const seen = new Set(current.map((item) => `${item.type}:${item.id}`));
        const incoming = (page.items || []).filter((item) => !seen.has(`${item.type}:${item.id}`));
        return [...current, ...incoming];
      });
      setNextCursor(page.nextCursor || null);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, nextCursor]);

  useEffect(() => {
    const node = loadMoreRef.current;
    if (!node) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) void loadMore();
    }, { rootMargin: "600px" });
    observer.observe(node);
    return () => observer.disconnect();
  }, [loadMore]);

  const previews = useMemo(() => files.map((file) => URL.createObjectURL(file)), [files]);
  useEffect(() => () => previews.forEach((url) => URL.revokeObjectURL(url)), [previews]);

  const posts = items.filter((item): item is Extract<SocialFeedItem, { type: "POST" }> => item.type === "POST");
  const rooms = items.filter((item): item is Extract<SocialFeedItem, { type: "ROOM" }> => item.type === "ROOM");
  const jobs = items.filter((item): item is Extract<SocialFeedItem, { type: "JOB" }> => item.type === "JOB");

  const publish = async () => {
    if (!text.trim() && !files.length) return;
    setPosting(true);
    try {
      await socialService.createPost({ content: text, visibility: "PUBLIC", files });
      setText("");
      setFiles([]);
      toast.success("Post published publicly");
      await loadInitial();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Post failed");
    } finally {
      setPosting(false);
    }
  };

  if (!isLoaded || !user || loading) {
    return <div className="flex min-h-screen items-center justify-center bg-[#e9edf3]"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  const people = [...requests, ...suggestions].filter(
    (person, index, list) => list.findIndex((candidate) => candidate.id === person.id) === index,
  );

  return (
    <div className="min-h-screen bg-[#e9edf3] pb-24 text-slate-900">
      <header className="sticky top-0 z-[90] border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-[58px] max-w-[760px] items-center px-4">
          <Link href="/feed" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-600 text-lg font-black text-white">R</div>
            <b className="hidden text-lg sm:block">RoomKhoj</b>
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <Link href="/notifications" aria-label="Notifications" className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
              <Bell className="h-5 w-5" />
            </Link>
            <button onClick={() => setMenuOpen((value) => !value)} aria-label="Menu" className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
        {menuOpen && (
          <div className="absolute right-3 top-[54px] z-[100] w-64 rounded-2xl border bg-white p-2 shadow-2xl">
            <MenuLink href="/feed" label="Feed" icon={<UsersRound className="h-5 w-5" />} close={() => setMenuOpen(false)} />
            <MenuLink href="/rooms" label="Rooms" icon={<Plus className="h-5 w-5" />} close={() => setMenuOpen(false)} />
            <MenuLink href="/jobs" label="Jobs" icon={<BriefcaseBusiness className="h-5 w-5" />} close={() => setMenuOpen(false)} />
            <MenuLink href="/messages" label="Messages" icon={<MessageCircle className="h-5 w-5" />} close={() => setMenuOpen(false)} />
            <MenuLink href="/user/dashboard/profile" label="Profile" icon={<UserRound className="h-5 w-5" />} close={() => setMenuOpen(false)} />
          </div>
        )}
      </header>

      <main className="mx-auto w-full max-w-[710px] space-y-3 py-3">
        <section className="bg-white px-3 py-3 shadow-sm sm:rounded-xl">
          <div className="flex gap-3 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <button onClick={() => storyInput.current?.click()} className="relative h-[170px] w-[108px] shrink-0 overflow-hidden rounded-xl bg-slate-100">
              <div className="flex h-[118px] items-center justify-center bg-slate-200 text-2xl font-bold text-slate-600">{String(user.name || "R").slice(0, 1).toUpperCase()}</div>
              <span className="absolute left-1/2 top-[105px] -translate-x-1/2 rounded-full border-4 border-white bg-blue-600 p-1 text-white"><Plus className="h-5 w-5" /></span>
              <b className="absolute bottom-3 left-0 right-0 text-xs">Create story</b>
            </button>
            <input ref={storyInput} type="file" accept="image/*,video/*" className="hidden" onChange={async (event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              await socialService.createStory({ file, visibility: "PUBLIC" });
              setStories(await socialService.stories());
            }} />
            {stories.map((story) => (
              <button key={story.id} onClick={async () => { setActiveStory(story); await socialService.viewStory(story.id).catch(() => undefined); }} className="relative h-[170px] w-[108px] shrink-0 overflow-hidden rounded-xl bg-black">
                {story.mediaType === "VIDEO" ? <video src={mediaUrl(story.mediaUrl)} muted className="h-full w-full object-cover opacity-85" /> : <img src={mediaUrl(story.mediaUrl)} alt="Story" className="h-full w-full object-cover" />}
                <div className="absolute left-2 top-2 rounded-full border-[3px] border-blue-600"><Avatar user={story.author} size="sm" /></div>
                <b className="absolute bottom-2 left-2 right-2 line-clamp-2 text-left text-xs text-white">{story.author.name}</b>
              </button>
            ))}
          </div>
        </section>

        <section className="bg-white p-4 shadow-sm sm:rounded-xl">
          <div className="flex items-center gap-3">
            <Avatar user={{ id: user.id, name: user.name }} />
            <button onClick={() => document.getElementById("composer")?.focus()} className="flex-1 rounded-full bg-slate-100 px-4 py-3 text-left text-slate-500">What's on your mind?</button>
          </div>
          <textarea id="composer" value={text} onChange={(event) => setText(event.target.value)} placeholder="Write a public post..." maxLength={3000} className="mt-3 min-h-[70px] w-full resize-none outline-none" />
          {previews.length > 0 && <div className="grid grid-cols-2 gap-1 overflow-hidden rounded-xl">{previews.slice(0, 4).map((url, index) => files[index]?.type.startsWith("video/") ? <video key={url} src={url} controls className="max-h-64 w-full object-cover" /> : <img key={url} src={url} alt="Preview" className="max-h-64 w-full object-cover" />)}</div>}
          <div className="mt-2 flex items-center border-t pt-2">
            <button onClick={() => postInput.current?.click()} className="flex items-center gap-2 rounded-lg px-3 py-2 font-semibold text-slate-700 hover:bg-slate-100"><ImageIcon className="h-5 w-5 text-green-600" /> Photo/video</button>
            <input ref={postInput} type="file" multiple accept="image/*,video/*" className="hidden" onChange={(event) => setFiles(Array.from(event.target.files || []).slice(0, 6))} />
            <button onClick={publish} disabled={posting || (!text.trim() && !files.length)} className="ml-auto rounded-lg bg-blue-600 px-5 py-2 font-bold text-white disabled:opacity-40">{posting ? "Posting..." : "Post"}</button>
          </div>
        </section>

        {posts.length === 0 && rooms.length > 0 && <HorizontalRooms rooms={rooms} />}
        {posts.length === 0 && jobs.length > 0 && <HorizontalJobs jobs={jobs} />}
        {people.length > 0 && <PeopleSection people={people} requests={requests} setRequests={setRequests} setSuggestions={setSuggestions} />}

        {posts.map((entry, index) => (
          <div key={entry.id} className="space-y-3">
            <PostCard
              post={entry.post}
              comments={comments[entry.post.id] || []}
              open={Boolean(commentsOpen[entry.post.id])}
              draft={drafts[entry.post.id] || ""}
              setDraft={(value) => setDrafts((current) => ({ ...current, [entry.post.id]: value }))}
              onLike={async () => {
                const result = await socialService.toggleLike(entry.post.id);
                setItems((current) => current.map((item) => item.type === "POST" && item.post.id === entry.post.id ? { ...item, post: { ...item.post, likedByMe: result.liked, likeCount: result.likeCount } } : item));
              }}
              onComments={async () => {
                const opening = !commentsOpen[entry.post.id];
                setCommentsOpen((current) => ({ ...current, [entry.post.id]: opening }));
                if (opening && !comments[entry.post.id]) {
                  const loadedComments = await socialService.comments(entry.post.id);
                  setComments((current) => ({ ...current, [entry.post.id]: loadedComments }));
                }
              }}
              onComment={async (event) => {
                event.preventDefault();
                const content = String(drafts[entry.post.id] || "").trim();
                if (!content) return;
                const created = await socialService.addComment(entry.post.id, content);
                setComments((current) => ({ ...current, [entry.post.id]: [...(current[entry.post.id] || []), created] }));
                setDrafts((current) => ({ ...current, [entry.post.id]: "" }));
              }}
              onShare={async () => {
                const url = `${window.location.origin}/feed?post=${entry.post.id}`;
                if (navigator.share) await navigator.share({ title: "RoomKhoj post", url });
                else { await navigator.clipboard.writeText(url); toast.success("Link copied"); }
                const result = await socialService.registerShare(entry.post.id, navigator.share ? "native" : "copy-link");
                setItems((current) => current.map((item) => item.type === "POST" && item.post.id === entry.post.id ? { ...item, post: { ...item.post, shareCount: result.shareCount } } : item));
              }}
            />
            {index === 0 && people.length > 0 && <PeopleSection people={people} requests={requests} setRequests={setRequests} setSuggestions={setSuggestions} />}
            {index === 1 && rooms.length > 0 && <HorizontalRooms rooms={rooms} />}
            {index === 3 && jobs.length > 0 && <HorizontalJobs jobs={jobs} />}
          </div>
        ))}

        <div ref={loadMoreRef} className="flex h-16 items-center justify-center">
          {loadingMore && <Loader2 className="h-6 w-6 animate-spin" />}
        </div>
      </main>

      {activeStory && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 p-3">
          <button onClick={() => setActiveStory(null)} className="absolute right-4 top-4 rounded-full bg-white/20 p-2 text-white"><X className="h-6 w-6" /></button>
          {activeStory.mediaType === "VIDEO" ? <video src={mediaUrl(activeStory.mediaUrl)} autoPlay controls className="max-h-[90vh] max-w-full" /> : <img src={mediaUrl(activeStory.mediaUrl)} alt="Story" className="max-h-[90vh] max-w-full" />}
        </div>
      )}
    </div>
  );
}

function MenuLink({ href, label, icon, close }: { href: string; label: string; icon: React.ReactNode; close: () => void }) {
  return <Link href={href} onClick={close} className="flex items-center gap-3 rounded-xl px-3 py-3 font-semibold hover:bg-slate-100">{icon}<span>{label}</span><ChevronRight className="ml-auto h-4 w-4 text-slate-400" /></Link>;
}

function PostCard({ post, comments, open, draft, setDraft, onLike, onComments, onComment, onShare }: {
  post: SocialPost;
  comments: SocialComment[];
  open: boolean;
  draft: string;
  setDraft: (value: string) => void;
  onLike: () => void | Promise<void>;
  onComments: () => void | Promise<void>;
  onComment: (event: FormEvent) => void | Promise<void>;
  onShare: () => void | Promise<void>;
}) {
  return (
    <article className="bg-white shadow-sm sm:rounded-xl">
      <header className="flex items-center gap-3 px-4 pb-2 pt-4">
        <Avatar user={post.author} />
        <div className="min-w-0 flex-1">
          <Link href={`/profile/${post.author.id}`} className="block truncate font-bold">{post.author.name}</Link>
          <div className="text-xs text-slate-500">{ago(post.createdAt)} · 🌐</div>
        </div>
        <button className="rounded-full p-2 text-slate-600 hover:bg-slate-100"><MoreHorizontal className="h-5 w-5" /></button>
      </header>

      {post.content && <p className="whitespace-pre-wrap px-4 pb-3 text-[16px] leading-6">{post.content}</p>}

      {post.mediaUrls.length > 0 && (
        <div className={post.mediaUrls.length > 1 ? "grid grid-cols-2 gap-[2px] bg-slate-200" : "bg-black"}>
          {post.mediaUrls.slice(0, 4).map((url, index) => post.mediaTypes[index] === "VIDEO" ? (
            <video key={url} src={mediaUrl(url)} controls className="max-h-[720px] min-h-[260px] w-full bg-black object-contain" />
          ) : (
            <img key={url} src={mediaUrl(url)} alt="Post" className="max-h-[760px] min-h-[260px] w-full object-cover" />
          ))}
        </div>
      )}

      <div className="flex items-center justify-between px-4 py-2 text-sm text-slate-500">
        <span>{post.likeCount > 0 ? `👍 ${post.likeCount}` : ""}</span>
        <span>{post.commentCount} comments · {post.shareCount} shares</span>
      </div>

      <div className="grid grid-cols-3 border-t border-slate-200 px-2 py-1">
        <button onClick={() => void onLike()} className={`flex items-center justify-center gap-2 rounded-lg py-2.5 font-semibold hover:bg-slate-100 ${post.likedByMe ? "text-blue-600" : "text-slate-600"}`}><Heart className="h-5 w-5" /> Like</button>
        <button onClick={() => void onComments()} className="flex items-center justify-center gap-2 rounded-lg py-2.5 font-semibold text-slate-600 hover:bg-slate-100"><MessageCircle className="h-5 w-5" /> Comment</button>
        <button onClick={() => void onShare()} className="flex items-center justify-center gap-2 rounded-lg py-2.5 font-semibold text-slate-600 hover:bg-slate-100"><Share2 className="h-5 w-5" /> Share</button>
      </div>

      {open && (
        <div className="border-t px-3 py-3">
          {comments.map((comment) => (
            <div key={comment.id} className="mb-2 flex gap-2">
              <Avatar user={comment.author} size="sm" />
              <div className="rounded-2xl bg-slate-100 px-3 py-2">
                <b className="block text-sm">{comment.author.name}</b>
                <span className="text-sm">{comment.content}</span>
              </div>
            </div>
          ))}
          <form onSubmit={onComment} className="flex gap-2">
            <input value={draft} onChange={(event) => setDraft(event.target.value)} className="flex-1 rounded-full bg-slate-100 px-4 py-2 outline-none" placeholder="Write a comment..." maxLength={1000} />
            <button className="text-blue-600"><Send className="h-5 w-5" /></button>
          </form>
        </div>
      )}
    </article>
  );
}

function PeopleSection({ people, requests, setRequests, setSuggestions }: {
  people: SocialUser[];
  requests: Array<SocialUser & { requestedAt: string }>;
  setRequests: React.Dispatch<React.SetStateAction<Array<SocialUser & { requestedAt: string }>>>;
  setSuggestions: React.Dispatch<React.SetStateAction<SocialUser[]>>;
}) {
  const requestIds = new Set(requests.map((request) => request.id));
  return (
    <section className="bg-white py-3 shadow-sm sm:rounded-xl">
      <div className="flex items-center justify-between px-4 pb-3">
        <h3 className="text-xl font-bold">People you may know</h3>
        <MoreHorizontal className="h-5 w-5 text-slate-500" />
      </div>
      <div className="flex gap-3 overflow-x-auto px-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {people.slice(0, 12).map((person) => (
          <div key={person.id} className="w-[210px] shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="flex h-[210px] items-center justify-center bg-slate-100"><Avatar user={person} size="lg" /></div>
            <div className="p-3">
              <Link href={`/profile/${person.id}`} className="block truncate text-lg font-bold">{person.name}</Link>
              {person.nearbyLabel && <p className="text-xs text-slate-500">{person.nearbyLabel}</p>}
              {requestIds.has(person.id) ? (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button onClick={async () => { await socialService.acceptFriendRequest(person.id); setRequests((current) => current.filter((item) => item.id !== person.id)); }} className="rounded-lg bg-blue-600 py-2 text-sm font-bold text-white">Confirm</button>
                  <button onClick={async () => { await socialService.rejectFriendRequest(person.id); setRequests((current) => current.filter((item) => item.id !== person.id)); }} className="rounded-lg bg-slate-200 py-2 text-sm font-bold">Delete</button>
                </div>
              ) : (
                <button onClick={async () => { await socialService.sendFriendRequest(person.id); setSuggestions((current) => current.filter((item) => item.id !== person.id)); toast.success("Friend request sent"); }} className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-2 text-sm font-bold text-white"><UserPlus className="h-4 w-4" /> Add friend</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function HorizontalRooms({ rooms }: { rooms: Array<Extract<SocialFeedItem, { type: "ROOM" }>> }) {
  return (
    <section className="bg-white py-3 shadow-sm sm:rounded-xl">
      <div className="flex items-center justify-between px-4 pb-3"><div><h3 className="text-xl font-bold">Available rooms</h3><p className="text-xs text-slate-500">Swipe sideways for more</p></div><Link href="/rooms" className="font-bold text-blue-600">See all</Link></div>
      <div className="flex gap-3 overflow-x-auto px-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {rooms.map((item) => <Link key={item.id} href={`/property/${item.room.id}`} className="w-[280px] shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="h-44 bg-slate-100">{item.room.image ? <img src={mediaUrl(item.room.image)} alt={item.room.title} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-slate-400">No photo</div>}</div>
          <div className="p-3"><div className="mb-1 inline-flex rounded-full bg-green-50 px-2 py-1 text-[11px] font-bold text-green-700">AVAILABLE</div><h4 className="line-clamp-2 text-lg font-bold">{item.room.title}</h4><div className="text-lg font-black text-red-600">Rs. {Number(item.room.price).toLocaleString("en-IN")}/mo</div><p className="mt-1 flex items-center gap-1 text-sm text-slate-500"><MapPin className="h-4 w-4" />{item.room.area || item.room.city || "Nepal"}</p><p className="mt-1 text-xs text-slate-500">Type: {item.room.category || "Room"}{item.room.availableFrom ? ` · Available ${item.room.availableFrom}` : ""}</p><div className="mt-3 border-t pt-2 text-sm font-bold text-blue-600">View full room details →</div></div>
        </Link>)}
      </div>
    </section>
  );
}

function HorizontalJobs({ jobs }: { jobs: Array<Extract<SocialFeedItem, { type: "JOB" }>> }) {
  return (
    <section className="bg-white py-3 shadow-sm sm:rounded-xl">
      <div className="flex items-center justify-between px-4 pb-3"><div><h3 className="text-xl font-bold">Jobs for you</h3><p className="text-xs text-slate-500">Swipe sideways for more</p></div><Link href="/jobs" className="font-bold text-blue-600">See all</Link></div>
      <div className="flex gap-3 overflow-x-auto px-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {jobs.map((item) => <Link key={item.id} href={`/job/${item.job.id}`} className="w-[280px] shrink-0 rounded-xl border border-slate-200 bg-white p-4"><div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><BriefcaseBusiness className="h-7 w-7" /></div><h4 className="line-clamp-2 text-lg font-bold">{item.job.jobTitle}</h4><p className="text-sm text-slate-600">{item.job.companyName || "RoomKhoj employer"}</p><p className="mt-2 font-bold">{item.job.salary ? `Rs. ${Number(item.job.salary).toLocaleString("en-IN")}` : item.job.salaryMin || item.job.salaryMax ? `Rs. ${Number(item.job.salaryMin || 0).toLocaleString("en-IN")}–${Number(item.job.salaryMax || 0).toLocaleString("en-IN")}` : "Salary negotiable"}</p><p className="mt-1 flex items-center gap-1 text-sm text-slate-500"><MapPin className="h-4 w-4" />{item.job.location}</p>{item.job.experience && <p className="mt-1 text-xs text-slate-500">Experience: {item.job.experience}</p>}<div className="mt-3 border-t pt-2 text-sm font-bold text-blue-600">View full job details →</div></Link>)}
      </div>
    </section>
  );
}
