"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Bell,
  BriefcaseBusiness,
  Camera,
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

function media(value?: string | null) {
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
  return days < 7 ? `${days}d` : new Date(value).toLocaleDateString();
}

function Avatar({ user, src, large = false }: { user?: SocialUser | null; src?: string | null; large?: boolean }) {
  const photo = media(src || user?.profilePhotoUrl);
  const cls = large ? "h-20 w-20" : "h-11 w-11";
  return photo ? (
    <img src={photo} alt={user?.name || "Profile"} className={`${cls} shrink-0 rounded-full bg-slate-100 object-cover`} />
  ) : (
    <div className={`${cls} flex shrink-0 items-center justify-center rounded-full bg-slate-200 font-bold text-slate-600`}>
      {String(user?.name || "R").slice(0, 1).toUpperCase()}
    </div>
  );
}

function SocialHeader({ photo }: { photo?: string | null }) {
  const { user } = useUserStore();
  const nav = [
    ["/feed", <Home key="h" />, "Home"],
    ["/rooms", <Home key="r" />, "Rooms"],
    ["/jobs", <BriefcaseBusiness key="j" />, "Jobs"],
    ["/messages", <MessageCircle key="m" />, "Messages"],
    ["/user/dashboard/profile", <UsersRound key="p" />, "People"],
  ] as const;

  return (
    <header className="sticky top-0 z-[80] border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-[58px] max-w-[1380px] items-center gap-2 px-3 sm:px-5">
        <Link href="/feed" className="flex shrink-0 items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-600 font-black text-white">R</div>
          <b className="hidden text-xl sm:block">RoomKhoj</b>
        </Link>
        <div className="hidden max-w-[280px] flex-1 items-center rounded-full bg-slate-100 px-3 py-2 md:flex">
          <Search className="mr-2 h-4 w-4 text-slate-500" />
          <input placeholder="Search RoomKhoj" className="w-full bg-transparent text-sm outline-none" />
        </div>
        <nav className="mx-auto flex h-full flex-1 items-center justify-center">
          {nav.map(([href, icon, label]) => (
            <Link key={href} href={href} title={label} className="flex h-full min-w-[48px] items-center justify-center border-b-[3px] border-transparent px-2 text-slate-600 hover:border-red-500 hover:text-red-600 sm:min-w-[70px] [&>svg]:h-6 [&>svg]:w-6">
              {icon}
            </Link>
          ))}
        </nav>
        <Link href="/notifications" className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100"><Bell className="h-5 w-5" /></Link>
        <Link href="/user/dashboard/profile"><Avatar user={user ? { id: user.id, name: user.name } : null} src={photo} /></Link>
        <button className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 sm:hidden"><Menu className="h-5 w-5" /></button>
      </div>
    </header>
  );
}

export function SocialFeedScreen() {
  const router = useRouter();
  const { user, isLoaded } = useUserStore();
  const [items, setItems] = useState<SocialFeedItem[]>([]);
  const [stories, setStories] = useState<SocialStory[]>([]);
  const [requests, setRequests] = useState<Array<SocialUser & { requestedAt: string }>>([]);
  const [suggestions, setSuggestions] = useState<SocialUser[]>([]);
  const [myPhoto, setMyPhoto] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [posting, setPosting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [activeStory, setActiveStory] = useState<SocialStory | null>(null);
  const [openComments, setOpenComments] = useState<Record<string, boolean>>({});
  const [comments, setComments] = useState<Record<string, SocialComment[]>>({});
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const postInput = useRef<HTMLInputElement>(null);
  const storyInput = useRef<HTMLInputElement>(null);
  const profileInput = useRef<HTMLInputElement>(null);
  const sentinel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isLoaded && !user) router.replace("/auth/login?redirect=%2Ffeed");
  }, [isLoaded, router, user]);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [feed, storyList, friendList, ownPhoto] = await Promise.all([
        socialService.feed(),
        socialService.stories(),
        socialService.friendRequests(),
        socialService.myProfilePhoto().catch(() => ({ profilePhotoUrl: null, createdAt: null })),
      ]);
      setItems(feed.items || []);
      setNextCursor(feed.nextCursor || null);
      setStories(storyList || []);
      setRequests(friendList || []);
      setMyPhoto(ownPhoto.profilePhotoUrl || null);
      const nearby = await socialService.nearbySuggestions().catch(() => ({ enabled: false, suggestions: [] as SocialUser[] }));
      setSuggestions(nearby.suggestions || []);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Feed load failed");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

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
    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) void loadMore();
    }, { rootMargin: "700px" });
    observer.observe(node);
    return () => observer.disconnect();
  }, [loadMore]);

  const previews = useMemo(() => files.map((file) => URL.createObjectURL(file)), [files]);
  useEffect(() => () => previews.forEach((url) => URL.revokeObjectURL(url)), [previews]);

  const posts = items.filter((item): item is Extract<SocialFeedItem, { type: "POST" }> => item.type === "POST");
  const discoveries = items.filter((item) => item.type === "ROOM" || item.type === "JOB");

  const publish = async () => {
    if (!text.trim() && !files.length) return;
    setPosting(true);
    try {
      await socialService.createPost({ content: text, visibility: "PUBLIC", files });
      setText(""); setFiles([]);
      toast.success("Public post published");
      await load();
    } finally { setPosting(false); }
  };

  if (!isLoaded || !user || loading) {
    return <div className="min-h-screen bg-[#f0f2f5]"><SocialHeader photo={myPhoto} /><div className="flex min-h-[70vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div></div>;
  }

  return (
    <div className="min-h-screen bg-[#f0f2f5]">
      <SocialHeader photo={myPhoto} />
      <main className="mx-auto grid max-w-[1380px] grid-cols-1 gap-5 py-3 lg:grid-cols-[230px_minmax(0,680px)_300px] lg:px-5">
        <aside className="hidden lg:block"><div className="sticky top-[74px] space-y-1 p-2"><Side href="/feed" label="Home" /><Side href="/rooms" label="Rooms" /><Side href="/jobs" label="Jobs" /><Side href="/user/dashboard/profile" label="Friends" /><Link href="/user/dashboard/rooms/create" className="mt-3 flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-3 font-bold text-white"><Plus className="h-5 w-5" /> List Room & Earn</Link></div></aside>

        <section className="min-w-0 space-y-3">
          <section className="border-y bg-white p-3 shadow-sm sm:rounded-xl sm:border">
            <div className="flex gap-3 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <button onClick={() => storyInput.current?.click()} className="relative h-[190px] w-[112px] shrink-0 overflow-hidden rounded-xl bg-slate-100">
                <div className="flex h-[135px] items-center justify-center bg-slate-200"><Avatar user={{ id: user.id, name: user.name }} src={myPhoto} large /></div>
                <span className="absolute left-1/2 top-[122px] -translate-x-1/2 rounded-full border-4 border-white bg-blue-600 p-1 text-white"><Plus className="h-5 w-5" /></span>
                <b className="absolute bottom-3 left-0 right-0 text-xs">Create story</b>
              </button>
              <input ref={storyInput} type="file" accept="image/*,video/*" className="hidden" onChange={async (e) => { const f = e.target.files?.[0]; if (!f) return; await socialService.createStory({ file: f, visibility: "PUBLIC" }); setStories(await socialService.stories()); }} />
              {stories.map((story) => <button key={story.id} onClick={() => setActiveStory(story)} className="relative h-[190px] w-[112px] shrink-0 overflow-hidden rounded-xl bg-black">{story.mediaType === "VIDEO" ? <video src={media(story.mediaUrl)} muted className="h-full w-full object-cover opacity-80" /> : <img src={media(story.mediaUrl)} alt="Story" className="h-full w-full object-cover opacity-90" />}<div className="absolute left-2 top-2 rounded-full border-4 border-blue-600"><Avatar user={story.author} /></div><b className="absolute bottom-2 left-2 right-2 line-clamp-2 text-left text-xs text-white">{story.author.name}</b></button>)}
            </div>
          </section>

          <section className="border-y bg-white p-4 shadow-sm sm:rounded-xl sm:border">
            <div className="flex gap-3"><button className="relative" onClick={() => profileInput.current?.click()}><Avatar user={{ id: user.id, name: user.name }} src={myPhoto} /><Camera className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-white p-0.5" /></button><input ref={profileInput} type="file" accept="image/*" className="hidden" onChange={async (e) => { const f = e.target.files?.[0]; if (!f) return; const result = await socialService.uploadProfilePhoto(f); setMyPhoto(result.profilePhotoUrl); toast.success("Profile photo updated"); }} /><button onClick={() => document.getElementById("composer")?.focus()} className="flex-1 rounded-full bg-slate-100 px-4 text-left text-slate-500">What's on your mind?</button></div>
            <textarea id="composer" value={text} onChange={(e) => setText(e.target.value)} placeholder="Write a public post..." className="mt-3 min-h-[75px] w-full resize-none outline-none" maxLength={3000} />
            {previews.length > 0 && <div className="grid grid-cols-2 gap-1">{previews.slice(0,4).map((url,i) => files[i]?.type.startsWith("video/") ? <video key={url} src={url} controls className="max-h-72 w-full object-cover" /> : <img key={url} src={url} alt="preview" className="max-h-72 w-full object-cover" />)}</div>}
            <div className="mt-2 flex border-t pt-2"><button onClick={() => postInput.current?.click()} className="flex flex-1 items-center justify-center gap-2 rounded-lg py-2 font-semibold text-slate-600 hover:bg-slate-100"><ImageIcon className="h-5 w-5 text-green-600" /> Photo/video</button><input ref={postInput} type="file" multiple accept="image/*,video/*" className="hidden" onChange={(e) => setFiles(Array.from(e.target.files || []).slice(0,6))} /><span className="hidden flex-1 items-center justify-center gap-2 sm:flex"><Globe2 className="h-5 w-5 text-blue-600" /> Public</span><button onClick={publish} disabled={posting || (!text.trim() && !files.length)} className="rounded-lg bg-blue-600 px-5 py-2 font-bold text-white disabled:opacity-40">{posting ? "Posting..." : "Post"}</button></div>
          </section>

          {posts.map((entry, index) => {
            const post = entry.post;
            return <div key={entry.id} className="space-y-3">
              <Post post={post} comments={comments[post.id] || []} open={!!openComments[post.id]} draft={drafts[post.id] || ""} setDraft={(v) => setDrafts((c) => ({ ...c, [post.id]: v }))} like={async () => { const result = await socialService.toggleLike(post.id); setItems((current) => current.map((item) => item.type === "POST" && item.id === entry.id ? { ...item, post: { ...item.post, likedByMe: result.liked, likeCount: result.likeCount } } : item)); }} toggleComments={async () => { const opening = !openComments[post.id]; setOpenComments((c) => ({ ...c, [post.id]: opening })); if (opening && !comments[post.id]) { const loadedComments = await socialService.comments(post.id); setComments((c) => ({ ...c, [post.id]: loadedComments })); } }} addComment={async (e) => { e.preventDefault(); const value = String(drafts[post.id] || "").trim(); if (!value) return; const created = await socialService.addComment(post.id, value); setComments((c) => ({ ...c, [post.id]: [...(c[post.id] || []), created] })); setDrafts((c) => ({ ...c, [post.id]: "" })); }} share={async () => { const url = `${window.location.origin}/feed?post=${post.id}`; const canShare = typeof navigator.share === "function"; if (canShare) await navigator.share({ title: "RoomKhoj post", url }); else { await navigator.clipboard.writeText(url); toast.success("Post link copied"); } await socialService.registerShare(post.id, canShare ? "native" : "copy-link"); }} />
              {index === 1 && (requests.length > 0 || suggestions.length > 0) && <PeopleStrip requests={requests} suggestions={suggestions} confirm={async (id) => { await socialService.acceptFriendRequest(id); setRequests((c) => c.filter((x) => x.id !== id)); }} add={async (id) => { await socialService.sendFriendRequest(id); setSuggestions((c) => c.filter((x) => x.id !== id)); }} remove={async (id) => { await socialService.rejectFriendRequest(id).catch(() => undefined); setRequests((c) => c.filter((x) => x.id !== id)); setSuggestions((c) => c.filter((x) => x.id !== id)); }} />}
              {index === 3 && discoveries.length > 0 && <DiscoveryStrip items={discoveries} />}
              {index > 3 && index % 6 === 0 && suggestions.length > 0 && <PeopleStrip requests={[]} suggestions={suggestions.slice(0,8)} confirm={async () => undefined} add={async (id) => { await socialService.sendFriendRequest(id); setSuggestions((c) => c.filter((x) => x.id !== id)); }} remove={async (id) => setSuggestions((c) => c.filter((x) => x.id !== id))} />}
            </div>;
          })}
          <div ref={sentinel} className="flex h-16 items-center justify-center">{loadingMore && <Loader2 className="h-6 w-6 animate-spin" />}</div>
        </section>

        <aside className="hidden lg:block"><div className="sticky top-[74px]">{requests.length > 0 && <><div className="mb-3 flex justify-between"><b>Friend requests</b><span className="text-blue-600">See all</span></div>{requests.slice(0,3).map((r) => <div key={r.id} className="mb-4 flex gap-2"><Avatar user={r} /><div><b>{r.name}</b><div className="mt-2 flex gap-2"><button onClick={async () => { await socialService.acceptFriendRequest(r.id); setRequests((c) => c.filter((x) => x.id !== r.id)); }} className="rounded bg-blue-600 px-3 py-1.5 text-sm font-bold text-white">Confirm</button><button onClick={async () => { await socialService.rejectFriendRequest(r.id); setRequests((c) => c.filter((x) => x.id !== r.id)); }} className="rounded bg-slate-200 px-3 py-1.5 text-sm font-bold">Delete</button></div></div></div>)}</>}</div></aside>
      </main>
      {activeStory && <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 p-3"><button onClick={() => setActiveStory(null)} className="absolute right-4 top-4 rounded-full bg-white/20 p-2 text-white"><X className="h-6 w-6" /></button><div className="max-h-[90vh] max-w-[440px]">{activeStory.mediaType === "VIDEO" ? <video src={media(activeStory.mediaUrl)} autoPlay controls className="max-h-[90vh] max-w-full" /> : <img src={media(activeStory.mediaUrl)} alt="Story" className="max-h-[90vh] max-w-full" />}</div></div>}
    </div>
  );
}

function Side({ href, label }: { href: string; label: string }) { return <Link href={href} className="block rounded-xl px-3 py-3 font-semibold hover:bg-slate-200">{label}</Link>; }

function Post({ post, comments, open, draft, setDraft, like, toggleComments, addComment, share }: { post: SocialPost; comments: SocialComment[]; open: boolean; draft: string; setDraft: (v:string)=>void; like:()=>void; toggleComments:()=>void; addComment:(e:FormEvent)=>void; share:()=>void }) {
  return <article className="border-y bg-white shadow-sm sm:rounded-xl sm:border"><header className="flex items-center gap-3 p-4"><Avatar user={post.author} /><div className="flex-1"><Link href={`/profile/${post.author.id}`} className="font-bold">{post.author.name}</Link><p className="flex items-center gap-1 text-xs text-slate-500">{ago(post.createdAt)} · <Globe2 className="h-3 w-3" /></p></div><MoreHorizontal className="h-5 w-5" /></header>{post.content && <p className="whitespace-pre-wrap px-4 pb-3 text-[15px]">{post.content}</p>}{post.mediaUrls.length > 0 && <div className={post.mediaUrls.length > 1 ? "grid grid-cols-2 gap-0.5" : ""}>{post.mediaUrls.slice(0,4).map((url,i) => post.mediaTypes[i] === "VIDEO" ? <video key={url} src={media(url)} controls className="max-h-[650px] w-full bg-black object-contain" /> : <img key={url} src={media(url)} alt="Post" className="max-h-[650px] w-full object-cover" />)}</div>}<div className="flex justify-between px-4 py-2 text-sm text-slate-500"><span>{post.likeCount ? `👍 ${post.likeCount}` : ""}</span><span>{post.commentCount} comments · {post.shareCount} shares</span></div><div className="grid grid-cols-3 border-t px-2 py-1"><button onClick={like} className={`flex justify-center gap-2 rounded py-2 font-semibold hover:bg-slate-100 ${post.likedByMe ? "text-blue-600" : "text-slate-600"}`}><Heart className="h-5 w-5" /> Like</button><button onClick={toggleComments} className="flex justify-center gap-2 rounded py-2 font-semibold text-slate-600 hover:bg-slate-100"><MessageCircle className="h-5 w-5" /> Comment</button><button onClick={share} className="flex justify-center gap-2 rounded py-2 font-semibold text-slate-600 hover:bg-slate-100"><Share2 className="h-5 w-5" /> Share</button></div>{open && <div className="border-t p-3">{comments.map((c) => <div key={c.id} className="mb-2 flex gap-2"><Avatar user={c.author} /><div className="rounded-2xl bg-slate-100 px-3 py-2"><b className="text-sm">{c.author.name}</b><div className="text-sm">{c.content}</div></div></div>)}<form onSubmit={addComment} className="flex gap-2"><input value={draft} onChange={(e)=>setDraft(e.target.value)} className="flex-1 rounded-full bg-slate-100 px-4 py-2 outline-none" placeholder="Write a comment..." /><button className="text-blue-600"><Send className="h-5 w-5" /></button></form></div>}</article>;
}

function PeopleStrip({ requests, suggestions, confirm, add, remove }: { requests:Array<SocialUser & {requestedAt?:string}>; suggestions:SocialUser[]; confirm:(id:string)=>void; add:(id:string)=>void; remove:(id:string)=>void }) {
  const people = [...requests.map((u)=>({...u, request:true})), ...suggestions.map((u)=>({...u, request:false}))].slice(0,12);
  return <section className="border-y bg-white py-3 shadow-sm sm:rounded-xl sm:border"><div className="flex justify-between px-4 pb-3"><h3 className="text-lg font-bold">People you may know</h3><MoreHorizontal /></div><div className="flex gap-2 overflow-x-auto px-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{people.map((p)=><div key={`${p.request}-${p.id}`} className="w-[220px] shrink-0 overflow-hidden rounded-xl border"><div className="flex h-[210px] items-center justify-center bg-slate-100"><Avatar user={p} large /></div><div className="p-3"><Link href={`/profile/${p.id}`} className="text-lg font-bold">{p.name}</Link>{p.nearbyLabel && <p className="text-xs text-slate-500">{p.nearbyLabel}</p>}<div className="mt-3 grid grid-cols-2 gap-2">{p.request ? <button onClick={()=>confirm(p.id)} className="rounded-lg bg-blue-600 py-2 font-bold text-white">Confirm</button> : <button onClick={()=>add(p.id)} className="flex items-center justify-center gap-1 rounded-lg bg-blue-600 py-2 font-bold text-white"><UserPlus className="h-4 w-4" /> Add</button>}<button onClick={()=>remove(p.id)} className="rounded-lg bg-slate-200 py-2 font-bold">Remove</button></div></div></div>)}</div><div className="mt-3 border-t pt-2 text-center font-semibold text-slate-600">See all</div></section>;
}

function DiscoveryStrip({ items }: { items: SocialFeedItem[] }) {
  return <section className="border-y bg-white py-3 shadow-sm sm:rounded-xl sm:border"><div className="flex justify-between px-4 pb-3"><div><h3 className="text-lg font-bold">Rooms & jobs for you</h3><p className="text-xs text-slate-500">Swipe sideways — public posts continue below</p></div><Link href="/rooms" className="font-bold text-blue-600">See all</Link></div><div className="flex gap-3 overflow-x-auto px-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{items.slice(0,10).map((item)=>item.type === "ROOM" ? <Link key={item.id} href={`/property/${item.room.id}`} className="w-[235px] shrink-0 overflow-hidden rounded-xl border"><div className="h-36 bg-slate-100">{item.room.image && <img src={media(item.room.image)} alt={item.room.title} className="h-full w-full object-cover" />}</div><div className="p-3"><b>{item.room.title}</b><div className="font-bold text-red-600">Rs. {Number(item.room.price).toLocaleString("en-IN")}/mo</div><div className="flex items-center gap-1 text-xs text-slate-500"><MapPin className="h-3 w-3" />{item.room.area || item.room.city || "Nepal"}</div></div></Link> : item.type === "JOB" ? <Link key={item.id} href={`/job/${item.job.id}`} className="w-[235px] shrink-0 rounded-xl border p-4"><BriefcaseBusiness className="mb-3 h-7 w-7 text-blue-600" /><b className="line-clamp-2">{item.job.jobTitle}</b><p className="text-sm text-slate-600">{item.job.companyName || "RoomKhoj employer"}</p><p className="mt-2 font-bold">{item.job.salary ? `Rs. ${Number(item.job.salary).toLocaleString("en-IN")}` : "Salary negotiable"}</p><p className="flex items-center gap-1 text-xs text-slate-500"><MapPin className="h-3 w-3" />{item.job.location}</p></Link> : null)}</div></section>;
}
