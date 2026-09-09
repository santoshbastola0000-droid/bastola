"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Bell,
  BriefcaseBusiness,
  Camera,
  ContactRound,
  Globe2,
  Heart,
  Home,
  Image as ImageIcon,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  MoreHorizontal,
  Plus,
  Send,
  Settings2,
  Share2,
  Sparkles,
  UserPlus,
  UserRound,
  UsersRound,
  Video,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { NavBar } from "@/components/common/navbar";
import { useUserStore } from "@/stores/user-store";
import {
  hashContactValue,
  SocialComment,
  SocialFeedItem,
  SocialGroup,
  SocialPreferences,
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

function money(value?: number | null) {
  if (!value) return "Salary negotiable";
  return `Rs. ${Number(value).toLocaleString("en-IN")}`;
}

function ago(date: string) {
  const ms = Date.now() - new Date(date).getTime();
  const minutes = Math.floor(ms / 60000);
  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return new Date(date).toLocaleDateString();
}

function Avatar({ user, size = "md" }: { user?: SocialUser | null; size?: "sm" | "md" | "lg" }) {
  const dimension = size === "sm" ? "h-9 w-9" : size === "lg" ? "h-14 w-14" : "h-11 w-11";
  const photo = mediaUrl(user?.profilePhotoUrl);
  return photo ? (
    <img src={photo} alt={user?.name || "User"} className={`${dimension} shrink-0 rounded-full object-cover ring-1 ring-slate-200`} />
  ) : (
    <div className={`${dimension} flex shrink-0 items-center justify-center rounded-full bg-slate-100 font-bold text-slate-600 ring-1 ring-slate-200`}>
      {String(user?.name || "R").slice(0, 1).toUpperCase()}
    </div>
  );
}

export default function FeedPage() {
  const router = useRouter();
  const { user, isLoaded } = useUserStore();
  const [items, setItems] = useState<SocialFeedItem[]>([]);
  const [stories, setStories] = useState<SocialStory[]>([]);
  const [friendRequests, setFriendRequests] = useState<Array<SocialUser & { requestedAt: string }>>([]);
  const [suggestions, setSuggestions] = useState<SocialUser[]>([]);
  const [groups, setGroups] = useState<SocialGroup[]>([]);
  const [preferences, setPreferences] = useState<SocialPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [composer, setComposer] = useState("");
  const [visibility, setVisibility] = useState<"PUBLIC" | "FRIENDS">("PUBLIC");
  const [postFiles, setPostFiles] = useState<File[]>([]);
  const [posting, setPosting] = useState(false);
  const [activeStory, setActiveStory] = useState<SocialStory | null>(null);
  const [commentsOpen, setCommentsOpen] = useState<Record<string, boolean>>({});
  const [comments, setComments] = useState<Record<string, SocialComment[]>>({});
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [contactMatches, setContactMatches] = useState<SocialUser[]>([]);
  const [contactLoading, setContactLoading] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [creatingGroup, setCreatingGroup] = useState(false);
  const postInputRef = useRef<HTMLInputElement>(null);
  const storyInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isLoaded && !user) {
      router.replace("/auth/login?redirect=%2Ffeed");
    }
  }, [isLoaded, router, user]);

  const loadSidePanels = useCallback(async () => {
    try {
      const [storyData, requestData, groupData, preferenceData] = await Promise.all([
        socialService.stories(),
        socialService.friendRequests(),
        socialService.groups(),
        socialService.preferences(),
      ]);
      setStories(storyData);
      setFriendRequests(requestData);
      setGroups(groupData);
      setPreferences(preferenceData);

      if (preferenceData.allowNearbySuggestions) {
        const nearby = await socialService.nearbySuggestions();
        setSuggestions(nearby.suggestions || []);
      }
    } catch {
      // Main feed can still work even if one discovery panel fails.
    }
  }, []);

  const loadFeed = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const response = await socialService.feed();
      setItems(response.items || []);
      setNextCursor(response.nextCursor || null);
      await loadSidePanels();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Feed load failed");
    } finally {
      setLoading(false);
    }
  }, [loadSidePanels, user]);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  const postPreviewUrls = useMemo(
    () => postFiles.map((file) => URL.createObjectURL(file)),
    [postFiles],
  );

  useEffect(() => {
    return () => postPreviewUrls.forEach((url) => URL.revokeObjectURL(url));
  }, [postPreviewUrls]);

  const createPost = async () => {
    if (!composer.trim() && !postFiles.length) return;
    setPosting(true);
    try {
      await socialService.createPost({
        content: composer,
        visibility,
        files: postFiles,
      });
      setComposer("");
      setPostFiles([]);
      toast.success("Post published");
      await loadFeed();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Post failed");
    } finally {
      setPosting(false);
    }
  };

  const createStory = async (file?: File) => {
    if (!file) return;
    try {
      await socialService.createStory({ file, visibility: "PUBLIC" });
      toast.success("Story added for 24 hours");
      setStories(await socialService.stories());
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Story upload failed");
    }
  };

  const loadMore = async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const response = await socialService.feed(nextCursor);
      setItems((current) => [...current, ...(response.items || [])]);
      setNextCursor(response.nextCursor || null);
    } finally {
      setLoadingMore(false);
    }
  };

  const patchPost = (postId: string, patch: Record<string, unknown>) => {
    setItems((current) =>
      current.map((item) =>
        item.type === "POST" && item.post.id === postId
          ? { ...item, post: { ...item.post, ...patch } }
          : item,
      ),
    );
  };

  const toggleLike = async (postId: string) => {
    try {
      const result = await socialService.toggleLike(postId);
      patchPost(postId, { likedByMe: result.liked, likeCount: result.likeCount });
    } catch {
      toast.error("Like update failed");
    }
  };

  const toggleComments = async (postId: string) => {
    const next = !commentsOpen[postId];
    setCommentsOpen((current) => ({ ...current, [postId]: next }));
    if (next && !comments[postId]) {
      try {
        const data = await socialService.comments(postId);
        setComments((current) => ({ ...current, [postId]: data }));
      } catch {
        toast.error("Comments load failed");
      }
    }
  };

  const submitComment = async (event: FormEvent, postId: string) => {
    event.preventDefault();
    const text = String(commentDrafts[postId] || "").trim();
    if (!text) return;
    try {
      const created = await socialService.addComment(postId, text);
      setComments((current) => ({
        ...current,
        [postId]: [...(current[postId] || []), created],
      }));
      setCommentDrafts((current) => ({ ...current, [postId]: "" }));
      const item = items.find((entry) => entry.type === "POST" && entry.post.id === postId);
      if (item?.type === "POST") patchPost(postId, { commentCount: item.post.commentCount + 1 });
    } catch {
      toast.error("Comment failed");
    }
  };

  const sharePost = async (postId: string) => {
    const url = `${window.location.origin}/feed?post=${postId}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "RoomKhoj post", url });
        await socialService.registerShare(postId, "native");
      } else {
        await navigator.clipboard.writeText(url);
        await socialService.registerShare(postId, "copy-link");
        toast.success("Post link copied");
      }
      const item = items.find((entry) => entry.type === "POST" && entry.post.id === postId);
      if (item?.type === "POST") patchPost(postId, { shareCount: item.post.shareCount + 1 });
    } catch {
      // Native share cancellation should not show a scary error.
    }
  };

  const acceptRequest = async (userId: string) => {
    await socialService.acceptFriendRequest(userId);
    setFriendRequests((current) => current.filter((item) => item.id !== userId));
    toast.success("Friend added");
  };

  const rejectRequest = async (userId: string) => {
    await socialService.rejectFriendRequest(userId);
    setFriendRequests((current) => current.filter((item) => item.id !== userId));
  };

  const addSuggestedFriend = async (userId: string) => {
    await socialService.sendFriendRequest(userId);
    setSuggestions((current) => current.filter((item) => item.id !== userId));
    setContactMatches((current) => current.filter((item) => item.id !== userId));
    toast.success("Friend request sent");
  };

  const enableNearby = async () => {
    try {
      const updated = await socialService.updatePreferences({ allowNearbySuggestions: true });
      setPreferences(updated);
      const nearby = await socialService.nearbySuggestions();
      setSuggestions(nearby.suggestions || []);
      if (nearby.reason === "LOCATION_REQUIRED") {
        toast.info("Location अनुमति दिनुहोस्; त्यसपछि नजिकका user देखिन्छन्।");
      }
    } catch {
      toast.error("Nearby suggestions enable गर्न सकिएन");
    }
  };

  const importContacts = async () => {
    const contactsApi = (navigator as any).contacts;
    if (!contactsApi?.select) {
      toast.info("यो browser मा Contact Picker उपलब्ध छैन। Mobile Chrome/compatible browser प्रयोग गर्नुहोस्।");
      return;
    }

    setContactLoading(true);
    try {
      const updated = await socialService.updatePreferences({ allowContactDiscovery: true });
      setPreferences(updated);
      const selected = await contactsApi.select(["name", "tel", "email"], { multiple: true });
      const values = selected.flatMap((contact: any) => [
        ...(Array.isArray(contact.tel) ? contact.tel : []),
        ...(Array.isArray(contact.email) ? contact.email : []),
      ]);
      const hashes = await Promise.all(values.map((value: string) => hashContactValue(value)));
      const matches = await socialService.contactSuggestions([...new Set(hashes)]);
      setContactMatches(matches);
      toast.success(matches.length ? `${matches.length} RoomKhoj contacts found` : "No matching contacts yet");
    } catch (error: any) {
      if (error?.name !== "AbortError") {
        toast.error(error?.response?.data?.message || "Contact discovery failed");
      }
    } finally {
      setContactLoading(false);
    }
  };

  const updatePreference = async (patch: Partial<SocialPreferences>) => {
    try {
      const updated = await socialService.updatePreferences(patch);
      setPreferences(updated);
    } catch {
      toast.error("Setting update failed");
    }
  };

  const createGroup = async (event: FormEvent) => {
    event.preventDefault();
    if (!groupName.trim()) return;
    setCreatingGroup(true);
    try {
      await socialService.createGroup({ name: groupName.trim(), privacy: "PUBLIC" });
      setGroupName("");
      setGroups(await socialService.groups());
      toast.success("Group created");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Group create failed");
    } finally {
      setCreatingGroup(false);
    }
  };

  if (!isLoaded || (loading && !items.length)) {
    return (
      <div className="min-h-screen bg-slate-50">
        <NavBar />
        <div className="flex min-h-[70vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#f4f6f8] text-slate-900">
      <NavBar />

      <main className="mx-auto grid w-full max-w-[1480px] grid-cols-1 gap-5 px-3 py-4 sm:px-4 lg:grid-cols-[230px_minmax(0,720px)_320px] lg:px-6">
        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-2 rounded-3xl bg-white p-3 shadow-sm ring-1 ring-slate-200/80">
            <FeedNav href="/feed" icon={<Sparkles className="h-5 w-5" />} label="Feed" active />
            <FeedNav href="/rooms" icon={<Home className="h-5 w-5" />} label="Rooms" />
            <FeedNav href="/jobs" icon={<BriefcaseBusiness className="h-5 w-5" />} label="Jobs" />
            <FeedNav href="/messages" icon={<MessageCircle className="h-5 w-5" />} label="Messages" />
            <FeedNav href="/user/dashboard/profile" icon={<UserRound className="h-5 w-5" />} label="My profile" />
            <FeedNav href="/notifications" icon={<Bell className="h-5 w-5" />} label="Notifications" />
            <div className="my-2 h-px bg-slate-100" />
            <Link href="/user/dashboard/rooms/create" className="flex items-center gap-3 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white">
              <Plus className="h-5 w-5" /> List room & earn
            </Link>
          </div>
        </aside>

        <section className="min-w-0 space-y-4">
          <div className="overflow-hidden rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200/80">
            <div className="flex gap-3 overflow-x-auto pb-1">
              <button onClick={() => storyInputRef.current?.click()} className="flex w-[78px] shrink-0 flex-col items-center gap-2 text-center">
                <div className="relative">
                  <Avatar user={{ id: user.id, name: user.name, profilePhotoUrl: (user as any).profilePhotoUrl }} size="lg" />
                  <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-slate-950 text-white ring-2 ring-white"><Plus className="h-4 w-4" /></span>
                </div>
                <span className="line-clamp-1 text-xs font-semibold">Your story</span>
              </button>
              <input ref={storyInputRef} type="file" accept="image/*,video/*" className="hidden" onChange={(event) => createStory(event.target.files?.[0])} />
              {stories.map((story) => (
                <button key={story.id} onClick={async () => { setActiveStory(story); await socialService.viewStory(story.id).catch(() => undefined); }} className="flex w-[78px] shrink-0 flex-col items-center gap-2 text-center">
                  <div className={`rounded-full p-[2px] ${story.viewedByMe ? "bg-slate-200" : "bg-gradient-to-br from-pink-500 via-red-500 to-amber-400"}`}>
                    <div className="rounded-full bg-white p-[2px]"><Avatar user={story.author} size="lg" /></div>
                  </div>
                  <span className="line-clamp-1 text-xs font-medium">{story.author.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200/80">
            <div className="flex gap-3">
              <Avatar user={{ id: user.id, name: user.name, profilePhotoUrl: (user as any).profilePhotoUrl }} />
              <div className="min-w-0 flex-1">
                <textarea value={composer} onChange={(event) => setComposer(event.target.value)} placeholder={`What's happening, ${String(user.name || "").split(" ")[0]}?`} className="min-h-[74px] w-full resize-none rounded-2xl bg-slate-50 px-4 py-3 text-sm outline-none ring-1 ring-slate-200 focus:ring-slate-400" maxLength={3000} />
                {postPreviewUrls.length > 0 && (
                  <div className="mt-3 grid grid-cols-2 gap-2 overflow-hidden rounded-2xl">
                    {postPreviewUrls.slice(0, 4).map((url, index) => postFiles[index]?.type.startsWith("video/") ? (
                      <video key={url} src={url} controls className="max-h-72 w-full rounded-xl object-cover" />
                    ) : (
                      <img key={url} src={url} alt="Post preview" className="max-h-72 w-full rounded-xl object-cover" />
                    ))}
                  </div>
                )}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button onClick={() => postInputRef.current?.click()} className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"><ImageIcon className="h-5 w-5" /> Photo/video</button>
                  <input ref={postInputRef} type="file" multiple accept="image/*,video/*" className="hidden" onChange={(event) => setPostFiles(Array.from(event.target.files || []).slice(0, 6))} />
                  <button onClick={() => setVisibility((current) => current === "PUBLIC" ? "FRIENDS" : "PUBLIC")} className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100">
                    {visibility === "PUBLIC" ? <Globe2 className="h-5 w-5" /> : <UsersRound className="h-5 w-5" />}
                    {visibility === "PUBLIC" ? "Public" : "Friends"}
                  </button>
                  {postFiles.length > 0 && <button onClick={() => setPostFiles([])} className="ml-auto rounded-xl p-2 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button>}
                  <button onClick={createPost} disabled={posting || (!composer.trim() && !postFiles.length)} className="ml-auto inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-40">
                    {posting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Post
                  </button>
                </div>
              </div>
            </div>
          </div>

          {items.map((item) => {
            if (item.type === "ROOM") {
              return (
                <Link key={`room-${item.id}`} href={`/property/${item.room.id}`} className="block overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200/80 transition hover:-translate-y-0.5 hover:shadow-md">
                  {item.room.image && <img src={mediaUrl(item.room.image)} alt={item.room.title} className="h-64 w-full object-cover sm:h-80" />}
                  <div className="p-5">
                    <div className="mb-2 flex items-center justify-between gap-3"><span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">Available room</span><span className="text-xs text-slate-400">{ago(item.createdAt)}</span></div>
                    <h2 className="text-xl font-bold">{item.room.title}</h2>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-600"><span className="font-bold text-slate-950">Rs. {Number(item.room.price).toLocaleString("en-IN")}/month</span><span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" />{item.room.area || item.room.city || "Nepal"}</span></div>
                    <p className="mt-3 text-sm font-semibold text-red-600">View room details →</p>
                  </div>
                </Link>
              );
            }

            if (item.type === "JOB") {
              return (
                <Link key={`job-${item.id}`} href={`/job/${item.job.id}`} className="block rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200/80 transition hover:-translate-y-0.5 hover:shadow-md">
                  <div className="flex gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600"><BriefcaseBusiness className="h-7 w-7" /></div>
                    <div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-3"><div><span className="text-xs font-bold uppercase tracking-wide text-indigo-600">New vacancy</span><h2 className="mt-1 text-xl font-bold">{item.job.jobTitle}</h2></div><span className="text-xs text-slate-400">{ago(item.createdAt)}</span></div><p className="mt-1 text-sm text-slate-600">{item.job.companyName || "RoomKhoj employer"} · {item.job.location}</p><p className="mt-3 font-bold text-slate-900">{money(item.job.salary || item.job.salaryMax || item.job.salaryMin)}</p></div>
                  </div>
                </Link>
              );
            }

            const post = item.post;
            return (
              <article key={post.id} className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200/80">
                <header className="flex items-center gap-3 p-4">
                  <Link href={`/profile/${post.author.id}`}><Avatar user={post.author} /></Link>
                  <div className="min-w-0 flex-1"><Link href={`/profile/${post.author.id}`} className="font-bold hover:underline">{post.author.name}</Link><p className="flex items-center gap-1 text-xs text-slate-500">{ago(post.createdAt)} · {post.visibility === "PUBLIC" ? <Globe2 className="h-3 w-3" /> : <UsersRound className="h-3 w-3" />}</p></div>
                  <button className="rounded-full p-2 text-slate-400 hover:bg-slate-100" onClick={() => { const reason = window.prompt("Report reason"); if (reason) socialService.report({ targetType: "POST", targetId: post.id, reason }).then(() => toast.success("Report submitted")); }}><MoreHorizontal className="h-5 w-5" /></button>
                </header>
                {post.content && <p className="whitespace-pre-wrap px-4 pb-4 text-[15px] leading-6 text-slate-800">{post.content}</p>}
                {post.mediaUrls.length > 0 && (
                  <div className={`grid ${post.mediaUrls.length > 1 ? "grid-cols-2" : "grid-cols-1"} gap-0.5 bg-slate-100`}>
                    {post.mediaUrls.slice(0, 4).map((url, index) => post.mediaTypes[index] === "VIDEO" ? (
                      <video key={url} src={mediaUrl(url)} controls playsInline className="max-h-[620px] w-full bg-black object-contain" />
                    ) : (
                      <img key={url} src={mediaUrl(url)} alt="Post media" className="max-h-[620px] w-full object-cover" />
                    ))}
                  </div>
                )}
                <div className="flex items-center justify-between px-4 py-3 text-xs text-slate-500"><span>{post.likeCount} likes</span><span>{post.commentCount} comments · {post.shareCount} shares</span></div>
                <div className="grid grid-cols-3 border-t border-slate-100 px-2 py-1">
                  <button onClick={() => toggleLike(post.id)} className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold hover:bg-slate-50 ${post.likedByMe ? "text-red-600" : "text-slate-600"}`}><Heart className={`h-5 w-5 ${post.likedByMe ? "fill-current" : ""}`} /> Like</button>
                  <button onClick={() => toggleComments(post.id)} className="flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"><MessageCircle className="h-5 w-5" /> Comment</button>
                  <button onClick={() => sharePost(post.id)} className="flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"><Share2 className="h-5 w-5" /> Share</button>
                </div>
                {commentsOpen[post.id] && (
                  <div className="border-t border-slate-100 bg-slate-50/70 p-4">
                    <div className="space-y-3">
                      {(comments[post.id] || []).map((comment) => <div key={comment.id} className="flex gap-2"><Avatar user={comment.author} size="sm" /><div className="rounded-2xl bg-white px-3 py-2 ring-1 ring-slate-200"><p className="text-xs font-bold">{comment.author.name}</p><p className="mt-0.5 text-sm">{comment.content}</p></div></div>)}
                    </div>
                    <form onSubmit={(event) => submitComment(event, post.id)} className="mt-3 flex gap-2"><input value={commentDrafts[post.id] || ""} onChange={(event) => setCommentDrafts((current) => ({ ...current, [post.id]: event.target.value }))} placeholder="Write a comment..." className="min-w-0 flex-1 rounded-full bg-white px-4 py-2.5 text-sm outline-none ring-1 ring-slate-200 focus:ring-slate-400" /><button className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-950 text-white"><Send className="h-4 w-4" /></button></form>
                  </div>
                )}
              </article>
            );
          })}

          {nextCursor && <button onClick={loadMore} disabled={loadingMore} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-3 text-sm font-bold shadow-sm ring-1 ring-slate-200">{loadingMore && <Loader2 className="h-4 w-4 animate-spin" />} Load more</button>}
        </section>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <Panel title="Friend requests" icon={<UserPlus className="h-5 w-5" />}>
            {friendRequests.length === 0 ? <Empty text="No pending requests" /> : friendRequests.slice(0, 5).map((request) => <div key={request.id} className="flex items-center gap-3 py-2"><Avatar user={request} size="sm" /><div className="min-w-0 flex-1"><Link href={`/profile/${request.id}`} className="block truncate text-sm font-bold">{request.name}</Link><div className="mt-1 flex gap-2"><button onClick={() => acceptRequest(request.id)} className="rounded-lg bg-slate-950 px-3 py-1.5 text-xs font-bold text-white">Accept</button><button onClick={() => rejectRequest(request.id)} className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600">Remove</button></div></div></div>)}
          </Panel>

          <Panel title="People you may know" icon={<UsersRound className="h-5 w-5" />}>
            {!preferences?.allowNearbySuggestions ? <button onClick={enableNearby} className="mb-3 flex w-full items-center gap-2 rounded-xl bg-blue-50 px-3 py-2.5 text-left text-xs font-semibold text-blue-700"><MapPin className="h-4 w-4" /> Enable nearby friend suggestions</button> : null}
            {suggestions.slice(0, 6).map((person) => <SuggestionRow key={person.id} person={person} onAdd={() => addSuggestedFriend(person.id)} />)}
            <button onClick={importContacts} disabled={contactLoading} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-bold text-slate-700"><ContactRound className="h-4 w-4" />{contactLoading ? "Checking contacts..." : "Find friends from contacts"}</button>
            {contactMatches.slice(0, 5).map((person) => <SuggestionRow key={`contact-${person.id}`} person={person} onAdd={() => addSuggestedFriend(person.id)} />)}
          </Panel>

          <Panel title="Groups" icon={<UsersRound className="h-5 w-5" />}>
            <form onSubmit={createGroup} className="mb-3 flex gap-2"><input value={groupName} onChange={(event) => setGroupName(event.target.value)} placeholder="New group name" className="min-w-0 flex-1 rounded-xl bg-slate-50 px-3 py-2 text-xs outline-none ring-1 ring-slate-200" /><button disabled={creatingGroup} className="rounded-xl bg-slate-950 px-3 text-white"><Plus className="h-4 w-4" /></button></form>
            {groups.slice(0, 6).map((group) => <div key={group.id} className="flex items-center gap-3 border-t border-slate-100 py-3 first:border-0"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600"><UsersRound className="h-5 w-5" /></div><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{group.name}</p><p className="text-xs text-slate-500">{group.memberCount} members · {group.privacy.toLowerCase()}</p></div>{group.membership === "NONE" && <button onClick={() => socialService.joinGroup(group.id).then(() => loadSidePanels())} className="text-xs font-bold text-blue-600">Join</button>}</div>)}
          </Panel>

          <Panel title="Social & notifications" icon={<Settings2 className="h-5 w-5" />}>
            {preferences && <div className="space-y-3"><PreferenceToggle label="Nearby friend suggestions" checked={preferences.allowNearbySuggestions} onChange={(checked) => updatePreference({ allowNearbySuggestions: checked })} /><PreferenceToggle label="Discover me from contacts" checked={preferences.allowContactDiscovery} onChange={(checked) => updatePreference({ allowContactDiscovery: checked })} /><PreferenceToggle label="Social push notifications" checked={preferences.socialPushOptIn} onChange={(checked) => updatePreference({ socialPushOptIn: checked })} /><PreferenceToggle label="Room earning emails" checked={preferences.roomOpportunityEmailOptIn} onChange={(checked) => updatePreference({ roomOpportunityEmailOptIn: checked })} icon={<Mail className="h-4 w-4" />} /><PreferenceToggle label="Jobs → earning tips email" checked={preferences.jobVisitorEarningEmailOptIn} onChange={(checked) => updatePreference({ jobVisitorEarningEmailOptIn: checked })} icon={<Mail className="h-4 w-4" />} /></div>}
          </Panel>
        </aside>
      </main>

      {activeStory && <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/95 p-3" onClick={() => setActiveStory(null)}><button className="absolute right-5 top-5 rounded-full bg-white/10 p-2 text-white"><X className="h-6 w-6" /></button><div className="w-full max-w-lg" onClick={(event) => event.stopPropagation()}><div className="mb-3 flex items-center gap-3 text-white"><Avatar user={activeStory.author} size="sm" /><div><p className="text-sm font-bold">{activeStory.author.name}</p><p className="text-xs text-white/60">{ago(activeStory.createdAt)}</p></div></div>{activeStory.mediaType === "VIDEO" ? <video src={mediaUrl(activeStory.mediaUrl)} autoPlay controls playsInline className="max-h-[80vh] w-full rounded-2xl object-contain" /> : <img src={mediaUrl(activeStory.mediaUrl)} alt="Story" className="max-h-[80vh] w-full rounded-2xl object-contain" />}{activeStory.caption && <p className="mt-3 text-center text-sm text-white">{activeStory.caption}</p>}</div></div>}
    </div>
  );
}

function FeedNav({ href, icon, label, active = false }: { href: string; icon: React.ReactNode; label: string; active?: boolean }) {
  return <Link href={href} className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold ${active ? "bg-slate-100 text-slate-950" : "text-slate-600 hover:bg-slate-50"}`}>{icon}{label}</Link>;
}

function Panel({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return <section className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200/80"><div className="mb-3 flex items-center gap-2"><span className="text-slate-500">{icon}</span><h3 className="font-bold">{title}</h3></div>{children}</section>;
}

function Empty({ text }: { text: string }) {
  return <p className="py-3 text-center text-xs text-slate-400">{text}</p>;
}

function SuggestionRow({ person, onAdd }: { person: SocialUser; onAdd: () => void }) {
  return <div className="flex items-center gap-3 py-2"><Avatar user={person} size="sm" /><div className="min-w-0 flex-1"><Link href={`/profile/${person.id}`} className="block truncate text-sm font-bold">{person.name}</Link><p className="truncate text-xs text-slate-500">{person.nearbyLabel || person.location || "RoomKhoj user"}</p></div><button onClick={onAdd} className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200"><UserPlus className="h-4 w-4" /></button></div>;
}

function PreferenceToggle({ label, checked, onChange, icon }: { label: string; checked: boolean; onChange: (checked: boolean) => void; icon?: React.ReactNode }) {
  return <label className="flex cursor-pointer items-center gap-3 text-xs font-medium text-slate-700"><span className="flex min-w-0 flex-1 items-center gap-2">{icon}{label}</span><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="h-4 w-4 accent-slate-950" /></label>;
}
