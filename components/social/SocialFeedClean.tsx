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
  Plus,
  Send,
  Share2,
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
  socialService,
} from "@/http/services/social.service";

const backendUrl = String(
  process.env.NEXT_PUBLIC_BACKEND_URL || "https://api.roomkhoj.com",
).replace(/\/$/, "");

function mediaUrl(value?: string | null) {
  const valueString = String(value || "");
  if (!valueString) return "";
  if (/^https?:\/\//i.test(valueString)) return valueString;
  return `${backendUrl}${valueString.startsWith("/") ? valueString : `/${valueString}`}`;
}

function money(value?: number | null) {
  return value ? `Rs. ${Number(value).toLocaleString("en-IN")}` : "Negotiable";
}

function Avatar({ name, photo }: { name?: string | null; photo?: string | null }) {
  const src = mediaUrl(photo);
  if (src) {
    return <img src={src} alt={name || "User"} className="h-11 w-11 shrink-0 rounded-full object-cover" />;
  }
  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-200 font-bold text-slate-600">
      {String(name || "R").slice(0, 1).toUpperCase()}
    </div>
  );
}

export function SocialFeedClean() {
  const router = useRouter();
  const { user, isLoaded } = useUserStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [items, setItems] = useState<SocialFeedItem[]>([]);
  const [stories, setStories] = useState<SocialStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [posting, setPosting] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState<Record<string, boolean>>({});
  const [comments, setComments] = useState<Record<string, SocialComment[]>>({});
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [activeStory, setActiveStory] = useState<SocialStory | null>(null);
  const postInput = useRef<HTMLInputElement>(null);
  const storyInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isLoaded && !user) router.replace("/auth/login?redirect=%2Ffeed");
  }, [isLoaded, router, user]);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [feed, storyList] = await Promise.all([
        socialService.feed(),
        socialService.stories().catch(() => []),
      ]);
      setItems(feed.items || []);
      setStories(storyList || []);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Feed load failed");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  const previews = useMemo(() => files.map((file) => URL.createObjectURL(file)), [files]);
  useEffect(() => () => previews.forEach((value) => URL.revokeObjectURL(value)), [previews]);

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
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f0f2f5] pb-24">
      <header className="sticky top-0 z-[90] border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-[58px] max-w-[900px] items-center px-4">
          <Link href="/feed" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-600 font-black text-white">R</div>
            <span className="hidden font-bold sm:inline">RoomKhoj</span>
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
            <MenuLink href="/feed" label="Feed" icon={<UsersRound className="h-5 w-5" />} onClick={() => setMenuOpen(false)} />
            <MenuLink href="/rooms" label="Rooms" icon={<Plus className="h-5 w-5" />} onClick={() => setMenuOpen(false)} />
            <MenuLink href="/jobs" label="Jobs" icon={<BriefcaseBusiness className="h-5 w-5" />} onClick={() => setMenuOpen(false)} />
            <MenuLink href="/messages" label="Messages" icon={<MessageCircle className="h-5 w-5" />} onClick={() => setMenuOpen(false)} />
            <MenuLink href="/user/dashboard/profile" label="Profile" icon={<UserRound className="h-5 w-5" />} onClick={() => setMenuOpen(false)} />
            <MenuLink href="/user/dashboard/rooms/create" label="List Room & Earn" icon={<Plus className="h-5 w-5" />} onClick={() => setMenuOpen(false)} />
          </div>
        )}
      </header>

      <main className="mx-auto w-full max-w-[760px] space-y-3 py-3 sm:px-3">
        <section className="border-y bg-white p-3 shadow-sm sm:rounded-2xl sm:border">
          <div className="flex gap-3 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <button onClick={() => storyInput.current?.click()} className="relative h-[170px] w-[108px] shrink-0 overflow-hidden rounded-xl bg-slate-100">
              <div className="flex h-[118px] items-center justify-center bg-slate-200 text-2xl font-bold text-slate-600">{String(user.name || "R").slice(0, 1).toUpperCase()}</div>
              <span className="absolute left-1/2 top-[106px] -translate-x-1/2 rounded-full border-4 border-white bg-blue-600 p-1 text-white"><Plus className="h-5 w-5" /></span>
              <b className="absolute bottom-3 left-0 right-0 text-xs">Create story</b>
            </button>
            <input ref={storyInput} type="file" accept="image/*,video/*" className="hidden" onChange={async (event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              await socialService.createStory({ file, visibility: "PUBLIC" });
              setStories(await socialService.stories());
            }} />
            {stories.map((story) => (
              <button key={story.id} onClick={() => setActiveStory(story)} className="relative h-[170px] w-[108px] shrink-0 overflow-hidden rounded-xl bg-black">
                {story.mediaType === "VIDEO" ? <video src={mediaUrl(story.mediaUrl)} muted className="h-full w-full object-cover opacity-80" /> : <img src={mediaUrl(story.mediaUrl)} alt="Story" className="h-full w-full object-cover" />}
                <span className="absolute bottom-2 left-2 right-2 line-clamp-2 text-left text-xs font-bold text-white">{story.author.name}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="border-y bg-white p-4 shadow-sm sm:rounded-2xl sm:border">
          <div className="flex items-center gap-3">
            <Avatar name={user.name} />
            <button onClick={() => document.getElementById("composer")?.focus()} className="flex-1 rounded-full bg-slate-100 px-4 py-3 text-left text-slate-500">What's on your mind?</button>
          </div>
          <textarea id="composer" value={text} onChange={(event) => setText(event.target.value)} placeholder="Write a public post..." maxLength={3000} className="mt-3 min-h-[72px] w-full resize-none outline-none" />
          {previews.length > 0 && <div className="grid grid-cols-2 gap-1 overflow-hidden rounded-xl">{previews.slice(0, 4).map((value, index) => files[index]?.type.startsWith("video/") ? <video key={value} src={value} controls className="max-h-60 w-full object-cover" /> : <img key={value} src={value} alt="preview" className="max-h-60 w-full object-cover" />)}</div>}
          <div className="mt-2 flex items-center border-t pt-2">
            <button onClick={() => postInput.current?.click()} className="flex items-center gap-2 rounded-lg px-3 py-2 font-semibold text-slate-700"><ImageIcon className="h-5 w-5 text-green-600" /> Photo/video</button>
            <input ref={postInput} type="file" multiple accept="image/*,video/*" className="hidden" onChange={(event) => setFiles(Array.from(event.target.files || []).slice(0, 6))} />
            <button onClick={publish} disabled={posting || (!text.trim() && !files.length)} className="ml-auto rounded-xl bg-blue-600 px-5 py-2 font-bold text-white disabled:opacity-40">{posting ? "Posting..." : "Post"}</button>
          </div>
        </section>

        {posts.length === 0 && (
          <>
            <DiscoverySection title="Available rooms" subtitle="Swipe sideways to see more rooms" href="/rooms">
              {rooms.length ? rooms.map((item) => <CompactRoomCard key={item.id} item={item} />) : <EmptyCard text="Available room पोस्ट आएपछि यहाँ देखिन्छ।" />}
            </DiscoverySection>
            <DiscoverySection title="Jobs for you" subtitle="Swipe sideways to see more jobs" href="/jobs">
              {jobs.length ? jobs.map((item) => <CompactJobCard key={item.id} item={item} />) : <EmptyCard text="Available job पोस्ट आएपछि यहाँ देखिन्छ।" />}
            </DiscoverySection>
          </>
        )}

        {posts.length > 0 && (
          <>
            {posts.map((entry, index) => (
              <div key={entry.id} className="space-y-3">
                <PostCard post={entry.post} comments={comments[entry.post.id] || []} open={Boolean(commentsOpen[entry.post.id])} draft={commentDrafts[entry.post.id] || ""} setDraft={(value) => setCommentDrafts((current) => ({ ...current, [entry.post.id]: value }))} onLike={async () => {
                  const result = await socialService.toggleLike(entry.post.id);
                  setItems((current) => current.map((item) => item.type === "POST" && item.post.id === entry.post.id ? { ...item, post: { ...item.post, likedByMe: result.liked, likeCount: result.likeCount } } : item));
                }} onComments={async () => {
                  const opening = !commentsOpen[entry.post.id];
                  setCommentsOpen((current) => ({ ...current, [entry.post.id]: opening }));
                  if (opening && !comments[entry.post.id]) setComments((current) => ({ ...current, [entry.post.id]: await socialService.comments(entry.post.id) }));
                }} onComment={async (event) => {
                  event.preventDefault();
                  const content = String(commentDrafts[entry.post.id] || "").trim();
                  if (!content) return;
                  const created = await socialService.addComment(entry.post.id, content);
                  setComments((current) => ({ ...current, [entry.post.id]: [...(current[entry.post.id] || []), created] }));
                  setCommentDrafts((current) => ({ ...current, [entry.post.id]: "" }));
                }} onShare={async () => {
                  const url = `${window.location.origin}/feed?post=${entry.post.id}`;
                  if (navigator.share) await navigator.share({ title: "RoomKhoj post", url }); else await navigator.clipboard.writeText(url);
                  await socialService.registerShare(entry.post.id, navigator.share ? "native" : "copy-link");
                }} />
                {index === 1 && rooms.length > 0 && <DiscoverySection title="Rooms you may like" subtitle="Full details open on tap" href="/rooms">{rooms.map((item) => <CompactRoomCard key={item.id} item={item} />)}</DiscoverySection>}
                {index === 3 && jobs.length > 0 && <DiscoverySection title="Jobs for you" subtitle="Full details open on tap" href="/jobs">{jobs.map((item) => <CompactJobCard key={item.id} item={item} />)}</DiscoverySection>}
              </div>
            ))}
          </>
        )}
      </main>

      {activeStory && <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 p-3"><button onClick={() => setActiveStory(null)} className="absolute right-4 top-4 rounded-full bg-white/20 p-2 text-white"><X className="h-6 w-6" /></button>{activeStory.mediaType === "VIDEO" ? <video src={mediaUrl(activeStory.mediaUrl)} autoPlay controls className="max-h-[90vh] max-w-full" /> : <img src={mediaUrl(activeStory.mediaUrl)} alt="Story" className="max-h-[90vh] max-w-full" />}</div>}
    </div>
  );
}

function MenuLink({ href, label, icon, onClick }: { href: string; label: string; icon: React.ReactNode; onClick: () => void }) {
  return <Link href={href} onClick={onClick} className="flex items-center gap-3 rounded-xl px-3 py-3 font-semibold hover:bg-slate-100">{icon}<span>{label}</span><ChevronRight className="ml-auto h-4 w-4 text-slate-400" /></Link>;
}

function DiscoverySection({ title, subtitle, href, children }: { title: string; subtitle: string; href: string; children: React.ReactNode }) {
  return <section className="border-y bg-white py-4 shadow-sm sm:rounded-2xl sm:border"><div className="mb-3 flex items-end justify-between px-4"><div><h2 className="text-lg font-black">{title}</h2><p className="text-xs text-slate-500">{subtitle}</p></div><Link href={href} className="text-sm font-bold text-blue-600">See all</Link></div><div className="flex gap-3 overflow-x-auto px-4 pb-1 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{children}</div></section>;
}

function CompactRoomCard({ item }: { item: Extract<SocialFeedItem, { type: "ROOM" }> }) {
  const room = item.room;
  return <Link href={`/property/${room.id}`} className="w-[285px] shrink-0 snap-start overflow-hidden rounded-2xl border bg-white shadow-sm"><div className="relative h-44 bg-slate-100">{room.image ? <img src={mediaUrl(room.image)} alt={room.title} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-slate-400">No photo</div>}<span className="absolute left-3 top-3 rounded-full bg-green-600 px-2.5 py-1 text-xs font-bold text-white">{room.listingStatus || "Available"}</span></div><div className="p-4"><h3 className="line-clamp-2 text-base font-black">{room.title}</h3><div className="mt-1 text-lg font-black text-red-600">{money(room.price)}/month</div><p className="mt-1 flex items-center gap-1 text-sm text-slate-600"><MapPin className="h-4 w-4" />{room.area || room.city || "Nepal"}</p><div className="mt-3 grid grid-cols-2 gap-2 text-xs"><Info label="Type" value={room.category || "Room"} /><Info label="Available" value={room.availableFrom || "Now"} /></div><div className="mt-3 rounded-lg bg-slate-900 px-3 py-2 text-center text-sm font-bold text-white">View full room details</div></div></Link>;
}

function CompactJobCard({ item }: { item: Extract<SocialFeedItem, { type: "JOB" }> }) {
  const job = item.job;
  const salary = job.salary ? money(job.salary) : job.salaryMin || job.salaryMax ? `${money(job.salaryMin || 0)} - ${money(job.salaryMax || 0)}` : "Salary negotiable";
  return <Link href={`/job/${job.id}`} className="w-[285px] shrink-0 snap-start rounded-2xl border bg-white p-4 shadow-sm"><div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><BriefcaseBusiness className="h-6 w-6" /></div><h3 className="line-clamp-2 text-lg font-black">{job.jobTitle}</h3><p className="mt-1 text-sm font-semibold text-slate-600">{job.companyName || "RoomKhoj employer"}</p><p className="mt-3 text-base font-black">{salary}</p><p className="mt-2 flex items-center gap-1 text-sm text-slate-600"><MapPin className="h-4 w-4" />{job.location}</p><div className="mt-3 grid grid-cols-2 gap-2 text-xs"><Info label="Experience" value={job.experience || "Not specified"} /><Info label="Job code" value={job.jobCode ? String(job.jobCode) : "-"} /></div><div className="mt-3 rounded-lg bg-blue-600 px-3 py-2 text-center text-sm font-bold text-white">View full job details</div></Link>;
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg bg-slate-50 p-2"><span className="block text-slate-400">{label}</span><b className="line-clamp-1 text-slate-700">{value}</b></div>;
}

function EmptyCard({ text }: { text: string }) {
  return <div className="flex h-36 w-[285px] shrink-0 items-center justify-center rounded-2xl border border-dashed bg-slate-50 p-5 text-center text-sm text-slate-500">{text}</div>;
}

function PostCard({ post, comments, open, draft, setDraft, onLike, onComments, onComment, onShare }: { post: SocialPost; comments: SocialComment[]; open: boolean; draft: string; setDraft: (value: string) => void; onLike: () => Promise<void>; onComments: () => Promise<void>; onComment: (event: FormEvent) => Promise<void>; onShare: () => Promise<void> }) {
  return <article className="border-y bg-white shadow-sm sm:rounded-2xl sm:border"><header className="flex items-center gap-3 p-4"><Avatar name={post.author.name} photo={post.author.profilePhotoUrl} /><div><Link href={`/profile/${post.author.id}`} className="font-bold">{post.author.name}</Link><p className="text-xs text-slate-500">Public post</p></div></header>{post.content && <p className="whitespace-pre-wrap px-4 pb-3 text-[15px]">{post.content}</p>}{post.mediaUrls.length > 0 && <div className={post.mediaUrls.length > 1 ? "grid grid-cols-2 gap-0.5" : ""}>{post.mediaUrls.slice(0, 4).map((value, index) => post.mediaTypes[index] === "VIDEO" ? <video key={value} src={mediaUrl(value)} controls className="max-h-[620px] w-full bg-black object-contain" /> : <img key={value} src={mediaUrl(value)} alt="Post" className="max-h-[620px] w-full object-cover" />)}</div>}<div className="flex justify-between px-4 py-2 text-sm text-slate-500"><span>{post.likeCount ? `👍 ${post.likeCount}` : ""}</span><span>{post.commentCount} comments · {post.shareCount} shares</span></div><div className="grid grid-cols-3 border-t px-2 py-1"><button onClick={() => void onLike()} className={`flex justify-center gap-2 rounded py-2 font-semibold ${post.likedByMe ? "text-blue-600" : "text-slate-600"}`}><Heart className="h-5 w-5" /> Like</button><button onClick={() => void onComments()} className="flex justify-center gap-2 rounded py-2 font-semibold text-slate-600"><MessageCircle className="h-5 w-5" /> Comment</button><button onClick={() => void onShare()} className="flex justify-center gap-2 rounded py-2 font-semibold text-slate-600"><Share2 className="h-5 w-5" /> Share</button></div>{open && <div className="border-t p-3">{comments.map((comment) => <div key={comment.id} className="mb-2 flex gap-2"><Avatar name={comment.author.name} photo={comment.author.profilePhotoUrl} /><div className="rounded-2xl bg-slate-100 px-3 py-2"><b className="text-sm">{comment.author.name}</b><div className="text-sm">{comment.content}</div></div></div>)}<form onSubmit={onComment} className="flex gap-2"><input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Write a comment..." className="flex-1 rounded-full bg-slate-100 px-4 py-2 outline-none" /><button className="text-blue-600"><Send className="h-5 w-5" /></button></form></div>}</article>;
}
