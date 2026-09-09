"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Bell,
  BriefcaseBusiness,
  Camera,
  ChevronRight,
  Globe2,
  Heart,
  Home,
  Image as ImageIcon,
  Loader2,
  MapPin,
  Menu,
  MessageCircle,
  MoreHorizontal,
  Plus,
  Search,
  Send,
  Share2,
  UserPlus,
  UserRound,
  UsersRound,
  Video,
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

function absoluteMedia(value?: string | null) {
  const raw = String(value || "");
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  return `${backendUrl}${raw.startsWith("/") ? raw : `/${raw}`}`;
}

function ago(value: string) {
  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.max(0, Math.floor(diff / 60000));
  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return new Date(value).toLocaleDateString();
}

function Avatar({ user, src, size = "md" }: { user?: SocialUser | null; src?: string | null; size?: "sm" | "md" | "lg" | "xl" }) {
  const classes = size === "sm" ? "h-9 w-9" : size === "lg" ? "h-14 w-14" : size === "xl" ? "h-20 w-20" : "h-11 w-11";
  const photo = absoluteMedia(src || user?.profilePhotoUrl);
  if (photo) return <img src={photo} alt={user?.name || "Profile"} className={`${classes} shrink-0 rounded-full object-cover bg-slate-100`} />;
  return <div className={`${classes} flex shrink-0 items-center justify-center rounded-full bg-slate-200 text-lg font-bold text-slate-600`}>{String(user?.name || "R").slice(0, 1).toUpperCase()}</div>;
}

function SocialHeader({ profilePhoto }: { profilePhoto?: string | null }) {
  const { user } = useUserStore();
  return (
    <header className="sticky top-0 z-[80] border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-[58px] max-w-[1380px] items-center gap-2 px-3 sm:px-5">
        <Link href="/feed" className="flex shrink-0 items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-600 text-lg font-black text-white">R</div>
          <span className="hidden text-xl font-black tracking-tight text-slate-950 sm:block">RoomKhoj</span>
        </Link>

        <div className="hidden max-w-[300px] flex-1 items-center rounded-full bg-slate-100 px-3 py-2 md:flex">
          <Search className="mr-2 h-4 w-4 text-slate-500" />
          <input className="w-full bg-transparent text-sm outline-none" placeholder="Search RoomKhoj" />
        </div>

        <nav className="mx-auto flex h-full flex-1 items-center justify-center gap-1 sm:gap-2">
          <HeaderLink href="/feed" label="Home"><Home /></HeaderLink>
          <HeaderLink href="/rooms" label="Rooms"><Home /></HeaderLink>
          <HeaderLink href="/jobs" label="Jobs"><BriefcaseBusiness /></HeaderLink>
          <HeaderLink href="/messages" label="Messages"><MessageCircle /></HeaderLink>
          <HeaderLink href="/user/dashboard/profile" label="People"><UsersRound /></HeaderLink>
        </nav>

        <div className="flex shrink-0 items-center gap-1">
          <Link href="/notifications" className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200"><Bell className="h-5 w-5" /></Link>
          <Link href="/user/dashboard/profile" className="rounded-full"><Avatar user={user ? { id: user.id, name: user.name } : null} src={profilePhoto} size="sm" /></Link>
          <button className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 sm:hidden"><Menu className="h-5 w-5" /></button>
        </div>
      </div>
    </header>
  );
}

function HeaderLink({ href, label, children }: { href: string; label: string; children: React.ReactElement }) {
  return <Link href={href} title={label} className="flex h-full min-w-[46px] items-center justify-center border-b-[3px] border-transparent px-2 text-slate-600 hover:border-red-500 hover:text-red-600 sm:min-w-[70px]">{children && <span className="[&>svg]:h-6 [&>svg]:w-6">{children}</span>}</Link>;
}

export function SocialFeedScreen() {
  const router = useRouter();
  const { user, isLoaded } = useUserStore();
  const [items, setItems] = useState<SocialFeedItem[]>([]);
  const [stories, setStories] = useState<SocialStory[]>([]);
  const [friendRequests, setFriendRequests] = useState<Array<SocialUser & { requestedAt: string }>>([]);
  const [suggestions, setSuggestions] = useState<SocialUser[]>([]);
  const [mySocialPhoto, setMySocialPhoto] = useState<string | null>(null);
  const [composer, setComposer] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [posting, setPosting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [activeStory, setActiveStory] = useState<SocialStory | null>(null);
  const [commentOpen, setCommentOpen] = useState<Record<string, boolean>>({});
  const [comments, setComments] = useState<Record<string, SocialComment[]>>({});
  const [commentDraft, setCommentDraft] = useState<Record<string, string>>({});
  const postFileRef = useRef<HTMLInputElement>(null);
  const storyFileRef = useRef<HTMLInputElement>(null);
  const profileFileRef = useRef<HTMLInputElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isLoaded && !user) router.replace("/auth/login?redirect=%2Ffeed");
  }, [isLoaded, router, user]);

  const loadFirst = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [feed, storyData, requests, ownPhoto] = await Promise.all([
        socialService.feed(),
        socialService.stories(),
        socialService.friendRequests(),
        socialService.myProfilePhoto().catch(() => ({ profilePhotoUrl: null, createdAt: null })),
      ]);
      setItems(feed.items || []);
      setNextCursor(feed.nextCursor || null);
      setStories(storyData || []);
      setFriendRequests(requests || []);
      setMySocialPhoto(ownPhoto.profilePhotoUrl || null);
      const nearby = await socialService.nearbySuggestions().catch(() => ({ enabled: false, suggestions: [] as SocialUser[] }));
      setSuggestions(nearby.suggestions || []);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Feed load failed");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { loadFirst(); }, [loadFirst]);

  const loadMore = useCallback(async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const feed = await socialService.feed(nextCursor);
      setItems((current) => [...current, ...(feed.items || [])]);
      setNextCursor(feed.nextCursor || null);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, nextCursor]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) loadMore();
    }, { rootMargin: "700px" });
    observer.observe(node);
    return () => observer.disconnect();
  }, [loadMore]);

  const previews = useMemo(() => files.map((file) => URL.createObjectURL(file)), [files]);
  useEffect(() => () => previews.forEach(URL.revokeObjectURL), [previews]);

  const publish = async () => {
    if (!composer.trim() && !files.length) return;
    setPosting(true);
    try {
      await socialService.createPost({ content: composer, visibility: "PUBLIC", files });
      setComposer("");
      setFiles([]);
      toast.success("Public post published");
      await loadFirst();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Post failed");
    } finally {
      setPosting(false);
    }
  };

  const uploadStory = async (file?: File) => {
    if (!file) return;
    try {
      await socialService.createStory({ file, visibility: "PUBLIC" });
      setStories(await socialService.stories());
      toast.success("Story added for 24 hours");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Story upload failed");
    }
  };

  const uploadProfile = async (file?: File) => {
    if (!file) return;
    try {
      const result = await socialService.uploadProfilePhoto(file);
      setMySocialPhoto(result.profilePhotoUrl);
      toast.success("Profile photo updated");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Profile photo upload failed");
    }
  };

  const posts = items.filter((item): item is Extract<SocialFeedItem, { type: "POST" }> => item.type === "POST");
  const discoveries = items.filter((item) => item.type === "ROOM" || item.type === "JOB");

  if (!isLoaded || !user || loading) {
    return <div className="min-h-screen bg-[#f0f2f5]"><SocialHeader profilePhoto={mySocialPhoto} /><div className="flex min-h-[70vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-slate-500" /></div></div>;
  }

  return (
    <div className="min-h-screen bg-[#f0f2f5] text-slate-900">
      <SocialHeader profilePhoto={mySocialPhoto} />

      <main className="mx-auto grid max-w-[1380px] grid-cols-1 gap-5 px-0 py-3 lg:grid-cols-[230px_minmax(0,680px)_300px] lg:px-5">
        <aside className="hidden lg:block">
          <div className="sticky top-[74px] space-y-1 p-2">
            <SideLink href="/feed" icon={<Home />} label="Home" />
            <SideLink href="/user/dashboard/profile" icon={<Avatar user={{ id: user.id, name: user.name }} src={mySocialPhoto} size="sm" />} label={user.name || "Profile"} />
            <SideLink href="/rooms" icon={<Home />} label="Rooms" />
            <SideLink href="/jobs" icon={<BriefcaseBusiness />} label="Jobs" />
            <SideLink href="/user/dashboard/profile" icon={<UsersRound />} label="Friends" />
            <Link href="/user/dashboard/rooms/create" className="mt-3 flex items-center gap-3 rounded-xl bg-slate-900 px-3 py-3 font-semibold text-white"><Plus className="h-5 w-5" /> List Room & Earn</Link>
          </div>
        </aside>

        <section className="min-w-0 space-y-3">
          <div className="border-y border-slate-200 bg-white p-3 shadow-sm sm:rounded-xl sm:border">
            <div className="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <button onClick={() => storyFileRef.current?.click()} className="relative h-[190px] w-[112px] shrink-0 overflow-hidden rounded-xl bg-slate-100 text-left shadow-sm">
                <div className="h-[135px] w-full overflow-hidden bg-slate-200"><Avatar user={{ id: user.id, name: user.name }} src={mySocialPhoto} size="xl" /></div>
                <div className="absolute left-1/2 top-[122px] -translate-x-1/2 rounded-full border-4 border-white bg-blue-600 p-1.5 text-white"><Plus className="h-5 w-5" /></div>
                <span className="absolute bottom-3 left-0 right-0 text-center text-xs font-bold">Create story</span>
              </button>
              <input ref={storyFileRef} type="file" accept="image/*,video/*" className="hidden" onChange={(event) => uploadStory(event.target.files?.[0])} />
              {stories.map((story) => (
                <button key={story.id} onClick={async () => { setActiveStory(story); await socialService.viewStory(story.id).catch(() => undefined); }} className="relative h-[190px] w-[112px] shrink-0 overflow-hidden rounded-xl bg-slate-900 shadow-sm">
                  {story.mediaType === "VIDEO" ? <video src={absoluteMedia(story.mediaUrl)} muted className="h-full w-full object-cover opacity-80" /> : <img src={absoluteMedia(story.mediaUrl)} alt="Story" className="h-full w-full object-cover opacity-90" />}
                  <div className="absolute left-2 top-2 rounded-full border-4 border-blue-600 bg-white"><Avatar user={story.author} size="sm" /></div>
                  <span className="absolute bottom-2 left-2 right-2 line-clamp-2 text-left text-xs font-bold text-white drop-shadow">{story.author.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="border-y border-slate-200 bg-white px-4 py-3 shadow-sm sm:rounded-xl sm:border">
            <div className="flex items-center gap-3">
              <button className="relative" onClick={() => profileFileRef.current?.click()} title="Update profile photo">
                <Avatar user={{ id: user.id, name: user.name }} src={mySocialPhoto} />
                <span className="absolute -bottom-1 -right-1 rounded-full bg-white p-1 shadow"><Camera className="h-3 w-3" /></span>
              </button>
              <input ref={profileFileRef} type="file" accept="image/*" className="hidden" onChange={(event) => uploadProfile(event.target.files?.[0])} />
              <button onClick={() => document.getElementById("rk-composer")?.focus()} className="flex-1 rounded-full bg-slate-100 px-4 py-3 text-left text-[15px] text-slate-500 hover:bg-slate-200">What's on your mind, {String(user.name || "").split(" ")[0]}?</button>
            </div>
            <textarea id="rk-composer" value={composer} onChange={(event) => setComposer(event.target.value)} maxLength={3000} placeholder="Write a public post..." className="mt-3 min-h-[76px] w-full resize-none border-0 bg-white px-1 text-[15px] outline-none" />
            {previews.length > 0 && <div className="grid grid-cols-2 gap-1 overflow-hidden rounded-xl">{previews.slice(0, 4).map((url, index) => files[index]?.type.startsWith("video/") ? <video key={url} src={url} controls className="max-h-72 w-full object-cover" /> : <img key={url} src={url} alt="Preview" className="max-h-72 w-full object-cover" />)}</div>}
            <div className="mt-2 flex items-center border-t border-slate-100 pt-2">
              <button onClick={() => postFileRef.current?.click()} className="flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"><ImageIcon className="h-5 w-5 text-green-600" /> Photo/video</button>
              <input ref={postFileRef} type="file" multiple accept="image/*,video/*" className="hidden" onChange={(event) => setFiles(Array.from(event.target.files || []).slice(0, 6))} />
              <span className="hidden flex-1 items-center justify-center gap-2 py-2 text-sm font-semibold text-slate-600 sm:flex"><Globe2 className="h-5 w-5 text-blue-600" /> Public</span>
              <button disabled={posting || (!composer.trim() && !files.length)} onClick={publish} className="ml-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-bold text-white disabled:opacity-40">{posting ? "Posting..." : "Post"}</button>
            </div>
          </div>

          {posts.length === 0 && <div className="bg-white p-8 text-center text-slate-500 sm:rounded-xl">No public posts yet. Be the first to post.</div>}

          {posts.map((entry, index) => (
            <div key={entry.id} className="space-y-3">
              <PostCard post={entry.post} comments={comments[entry.post.id] || []} commentOpen={!!commentOpen[entry.post.id]} commentDraft={commentDraft[entry.post.id] || ""} setCommentDraft={(value) => setCommentDraft((current) => ({ ...current, [entry.post.id]: value }))} onLike={async () => {
                const result = await socialService.toggleLike(entry.post.id);
                setItems((current) => current.map((item) => item.type === "POST" && item.id === entry.id ? { ...item, post: { ...item.post, likedByMe: result.liked, likeCount: result.likeCount } } : item));
              }} onComments={async () => {
                const opening = !commentOpen[entry.post.id];
                setCommentOpen((current) => ({ ...current, [entry.post.id]: opening }));
                if (opening && !comments[entry.post.id]) setComments((current) => ({ ...current, [entry.post.id]: await socialService.comments(entry.post.id) }));
              }} onComment={async (event) => {
                event.preventDefault();
                const text = String(commentDraft[entry.post.id] || "").trim();
                if (!text) return;
                const created = await socialService.addComment(entry.post.id, text);
                setComments((current) => ({ ...current, [entry.post.id]: [...(current[entry.post.id] || []), created] }));
                setCommentDraft((current) => ({ ...current, [entry.post.id]: "" }));
              }} onShare={async () => {
                const url = `${window.location.origin}/feed?post=${entry.post.id}`;
                if (navigator.share) await navigator.share({ title: "RoomKhoj post", url }); else { await navigator.clipboard.writeText(url); toast.success("Post link copied"); }
                await socialService.registerShare(entry.post.id, navigator.share ? "native" : "copy-link");
              }} />

              {index === 1 && (suggestions.length > 0 || friendRequests.length > 0) && <PeopleStrip suggestions={suggestions} friendRequests={friendRequests} onAdd={async (id) => { await socialService.sendFriendRequest(id); setSuggestions((current) => current.filter((u) => u.id !== id)); toast.success("Friend request sent"); }} onAccept={async (id) => { await socialService.acceptFriendRequest(id); setFriendRequests((current) => current.filter((u) => u.id !== id)); toast.success("Friend added"); }} onRemove={async (id) => { await socialService.rejectFriendRequest(id); setFriendRequests((current) => current.filter((u) => u.id !== id)); setSuggestions((current) => current.filter((u) => u.id !== id)); }} />}

              {index === 3 && discoveries.length > 0 && <DiscoveryStrip items={discoveries} />}

              {index > 3 && index % 6 === 0 && suggestions.length > 0 && <PeopleStrip suggestions={suggestions.slice(0, 8)} friendRequests={[]} onAdd={async (id) => { await socialService.sendFriendRequest(id); setSuggestions((current) => current.filter((u) => u.id !== id)); }} onAccept={async () => undefined} onRemove={async (id) => setSuggestions((current) => current.filter((u) => u.id !== id))} />}
            </div>
          ))}

          <div ref={sentinelRef} className="flex h-16 items-center justify-center">{loadingMore && <Loader2 className="h-6 w-6 animate-spin text-slate-500" />}</div>
        </section>

        <aside className="hidden lg:block">
          <div className="sticky top-[74px] space-y-5">
            {friendRequests.length > 0 && <div><div className="mb-2 flex items-center justify-between"><h3 className="font-bold text-slate-700">Friend requests</h3><span className="text-sm text-blue-600">See all</span></div>{friendRequests.slice(0, 3).map((request) => <div key={request.id} className="mb-3 flex gap-3"><Avatar user={request} /><div className="min-w-0 flex-1"><Link href={`/profile/${request.id}`} className="font-semibold">{request.name}</Link><div className="mt-2 flex gap-2"><button onClick={async () => { await socialService.acceptFriendRequest(request.id); setFriendRequests((current) => current.filter((x) => x.id !== request.id)); }} className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-bold text-white">Confirm</button><button onClick={async () => { await socialService.rejectFriendRequest(request.id); setFriendRequests((current) => current.filter((x) => x.id !== request.id)); }} className="rounded-md bg-slate-200 px-3 py-1.5 text-sm font-bold">Delete</button></div></div></div>)}</div>}
            <div className="border-t border-slate-300 pt-4 text-sm text-slate-500">RoomKhoj Social · Rooms · Jobs · Earn · Privacy · Safety</div>
          </div>
        </aside>
      </main>

      {activeStory && <StoryViewer story={activeStory} onClose={() => setActiveStory(null)} />}
    </div>
  );
}

function SideLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return <Link href={href} className="flex items-center gap-3 rounded-xl px-3 py-2.5 font-semibold hover:bg-slate-200"><span className="flex h-9 w-9 items-center justify-center [&>svg]:h-6 [&>svg]:w-6">{icon}</span><span className="line-clamp-1">{label}</span></Link>;
}

function PostCard({ post, comments, commentOpen, commentDraft, setCommentDraft, onLike, onComments, onComment, onShare }: {
  post: SocialPost;
  comments: SocialComment[];
  commentOpen: boolean;
  commentDraft: string;
  setCommentDraft: (value: string) => void;
  onLike: () => void;
  onComments: () => void;
  onComment: (event: FormEvent) => void;
  onShare: () => void;
}) {
  return <article className="border-y border-slate-200 bg-white shadow-sm sm:rounded-xl sm:border">
    <header className="flex items-center gap-3 px-4 py-3"><Link href={`/profile/${post.author.id}`}><Avatar user={post.author} /></Link><div className="min-w-0 flex-1"><Link href={`/profile/${post.author.id}`} className="font-bold hover:underline">{post.author.name}</Link><p className="flex items-center gap-1 text-xs text-slate-500">{ago(post.createdAt)} · <Globe2 className="h-3 w-3" /></p></div><button className="rounded-full p-2 hover:bg-slate-100"><MoreHorizontal className="h-5 w-5" /></button></header>
    {post.content && <p className="whitespace-pre-wrap px-4 pb-3 text-[15px] leading-6">{post.content}</p>}
    {post.mediaUrls.length > 0 && <div className={`${post.mediaUrls.length > 1 ? "grid grid-cols-2" : ""} gap-0.5 bg-slate-100`}>{post.mediaUrls.slice(0, 4).map((url, index) => post.mediaTypes[index] === "VIDEO" ? <video key={url} controls playsInline src={absoluteMedia(url)} className="max-h-[650px] w-full bg-black object-contain" /> : <img key={url} src={absoluteMedia(url)} alt="Post" className="max-h-[650px] w-full object-cover" />)}</div>}
    <div className="flex items-center justify-between px-4 py-2 text-sm text-slate-500"><span>{post.likeCount > 0 ? `👍 ${post.likeCount}` : ""}</span><span>{post.commentCount} comments · {post.shareCount} shares</span></div>
    <div className="grid grid-cols-3 border-t border-slate-200 px-2 py-1"><button onClick={onLike} className={`flex items-center justify-center gap-2 rounded-md py-2 font-semibold hover:bg-slate-100 ${post.likedByMe ? "text-blue-600" : "text-slate-600"}`}><Heart className={`h-5 w-5 ${post.likedByMe ? "fill-current" : ""}`} /> Like</button><button onClick={onComments} className="flex items-center justify-center gap-2 rounded-md py-2 font-semibold text-slate-600 hover:bg-slate-100"><MessageCircle className="h-5 w-5" /> Comment</button><button onClick={onShare} className="flex items-center justify-center gap-2 rounded-md py-2 font-semibold text-slate-600 hover:bg-slate-100"><Share2 className="h-5 w-5" /> Share</button></div>
    {commentOpen && <div className="border-t border-slate-100 px-4 py-3">{comments.map((comment) => <div key={comment.id} className="mb-2 flex gap-2"><Avatar user={comment.author} size="sm" /><div className="rounded-2xl bg-slate-100 px-3 py-2"><div className="text-sm font-bold">{comment.author.name}</div><div className="text-sm">{comment.content}</div></div></div>)}<form onSubmit={onComment} className="mt-2 flex gap-2"><input value={commentDraft} onChange={(e) => setCommentDraft(e.target.value)} placeholder="Write a comment..." className="flex-1 rounded-full bg-slate-100 px-4 py-2 text-sm outline-none" /><button className="rounded-full p-2 text-blue-600"><Send className="h-5 w-5" /></button></form></div>}
  </article>;
}

function PeopleStrip({ suggestions, friendRequests, onAdd, onAccept, onRemove }: { suggestions: SocialUser[]; friendRequests: Array<SocialUser & { requestedAt?: string }>; onAdd: (id: string) => void; onAccept: (id: string) => void; onRemove: (id: string) => void }) {
  const people = [...friendRequests.map((u) => ({ ...u, request: true })), ...suggestions.map((u) => ({ ...u, request: false }))].slice(0, 12);
  if (!people.length) return null;
  return <section className="border-y border-slate-200 bg-white py-3 shadow-sm sm:rounded-xl sm:border"><div className="flex items-center justify-between px-4 pb-3"><h3 className="text-lg font-bold">People you may know</h3><button className="rounded-full p-2 hover:bg-slate-100"><MoreHorizontal className="h-5 w-5" /></button></div><div className="flex gap-2 overflow-x-auto px-3 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{people.map((person) => <div key={`${person.request}-${person.id}`} className="w-[220px] shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-white"><div className="flex h-[210px] items-center justify-center bg-slate-100"><Avatar user={person} size="xl" /></div><div className="p-3"><Link href={`/profile/${person.id}`} className="line-clamp-1 text-lg font-bold">{person.name}</Link>{person.nearbyLabel && <p className="mt-1 text-xs text-slate-500">{person.nearbyLabel}</p>}<div className="mt-3 grid grid-cols-2 gap-2">{person.request ? <button onClick={() => onAccept(person.id)} className="rounded-lg bg-blue-600 px-2 py-2 font-bold text-white">Confirm</button> : <button onClick={() => onAdd(person.id)} className="flex items-center justify-center gap-1 rounded-lg bg-blue-600 px-2 py-2 font-bold text-white"><UserPlus className="h-4 w-4" /> Add</button>}<button onClick={() => onRemove(person.id)} className="rounded-lg bg-slate-200 px-2 py-2 font-bold">Remove</button></div></div></div>)}</div><div className="border-t border-slate-100 pt-2 text-center"><button className="font-semibold text-slate-600">See all</button></div></section>;
}

function DiscoveryStrip({ items }: { items: SocialFeedItem[] }) {
  const discovery = items.filter((item) => item.type === "ROOM" || item.type === "JOB").slice(0, 10);
  return <section className="border-y border-slate-200 bg-white py-3 shadow-sm sm:rounded-xl sm:border"><div className="flex items-center justify-between px-4 pb-3"><div><h3 className="text-lg font-bold">Rooms & jobs for you</h3><p className="text-xs text-slate-500">Swipe sideways — your public feed continues below</p></div><Link href="/rooms" className="text-sm font-bold text-blue-600">See all</Link></div><div className="flex gap-3 overflow-x-auto px-3 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{discovery.map((item) => item.type === "ROOM" ? <Link key={`r-${item.id}`} href={`/property/${item.room.id}`} className="w-[235px] shrink-0 overflow-hidden rounded-xl border border-slate-200"><div className="h-36 bg-slate-100">{item.room.image ? <img src={absoluteMedia(item.room.image)} alt={item.room.title} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center"><Home className="h-10 w-10 text-slate-300" /></div>}</div><div className="p-3"><div className="line-clamp-1 font-bold">{item.room.title}</div><div className="mt-1 text-sm font-bold text-red-600">Rs. {Number(item.room.price).toLocaleString("en-IN")}/mo</div><div className="mt-1 flex items-center gap-1 text-xs text-slate-500"><MapPin className="h-3 w-3" />{item.room.area || item.room.city || "Nepal"}</div></div></Link> : item.type === "JOB" ? <Link key={`j-${item.id}`} href={`/job/${item.job.id}`} className="w-[235px] shrink-0 rounded-xl border border-slate-200 p-4"><div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><BriefcaseBusiness className="h-5 w-5" /></div><div className="line-clamp-2 font-bold">{item.job.jobTitle}</div><div className="mt-1 text-sm text-slate-600">{item.job.companyName || "RoomKhoj employer"}</div><div className="mt-2 text-sm font-bold">{item.job.salary ? `Rs. ${Number(item.job.salary).toLocaleString("en-IN")}` : "Salary negotiable"}</div><div className="mt-1 flex items-center gap-1 text-xs text-slate-500"><MapPin className="h-3 w-3" />{item.job.location}</div></Link> : null)}</div></section>;
}

function StoryViewer({ story, onClose }: { story: SocialStory; onClose: () => void }) {
  return <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 p-3"><button onClick={onClose} className="absolute right-4 top-4 rounded-full bg-white/15 p-2 text-white"><X className="h-6 w-6" /></button><div className="relative flex h-[85vh] w-full max-w-[440px] items-center justify-center overflow-hidden rounded-2xl bg-black">{story.mediaType === "VIDEO" ? <video src={absoluteMedia(story.mediaUrl)} autoPlay controls className="max-h-full max-w-full" /> : <img src={absoluteMedia(story.mediaUrl)} alt="Story" className="max-h-full max-w-full object-contain" />}<div className="absolute left-3 top-3 flex items-center gap-2 text-white"><Avatar user={story.author} size="sm" /><div><div className="font-bold">{story.author.name}</div><div className="text-xs opacity-80">{ago(story.createdAt)}</div></div></div></div></div>;
}
