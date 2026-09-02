"use client";

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import {
  BadgeCheck,
  Bot,
  BriefcaseBusiness,
  Camera,
  Edit3,
  Globe2,
  Home,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Save,
  Share2,
  Trash2,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import PushNotificationSetup from "@/components/PushNotificationSetup";

import { privateApi } from "@/http/api/privateApi";
import { roomService } from "@/http/services/room.service";
import { jobPostingService } from "@/http/services/job-posting.service";
import { aiProfileService } from "@/http/services/ai-profile.service";
import {
  profileService,
  type PublicProfile,
} from "@/http/services/profile.service";
import { profileMediaUrl } from "@/lib/profile-media";
import { useUserStore } from "@/stores/user-store";
import { RoomStatus } from "@/types/room.types";

type ActivityTab =
  | "rooms"
  | "jobs"
  | "friends"
  | "shares"
  | "about";

export default function ProfilePage() {
  const router = useRouter();

  const {
    user,
    updateUser,
  } = useUserStore();

  const [currentUserId, setCurrentUserId] = useState("");
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [friends, setFriends] = useState<any[]>([]);
  const [changingRoomStatusId, setChangingRoomStatusId] = useState<string | null>(null);
  const [shareSummary, setShareSummary] = useState<{
    totalUniqueOpens: number;
    items: Array<{
      jobPostingId: string;
      jobTitle: string;
      companyName?: string | null;
      shareCount: number;
      requiredShares: number;
      isUnlocked: boolean;
      contactPhone?: string | null;
      lastOpenedAt?: string | null;
    }>;
  }>({ totalUniqueOpens: 0, items: [] });

  const [profileLoading, setProfileLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingProfile, setUploadingProfile] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [tab, setTab] = useState<ActivityTab>("rooms");
  const [form, setForm] = useState({ name: "", bio: "", location: "", website: "" });

  const profileInputRef = useRef<HTMLInputElement | null>(null);
  const coverInputRef = useRef<HTMLInputElement | null>(null);

  const [aiProfile, setAiProfile] = useState<any>(null);
  const [aiForm, setAiForm] = useState<any>({ roomSearch: {}, jobSearch: {} });
  const [aiLoading, setAiLoading] = useState(true);
  const [aiEditing, setAiEditing] = useState(false);
  const [aiSaving, setAiSaving] = useState(false);
  const [deletingField, setDeletingField] = useState<string | null>(null);
  const [clearingAi, setClearingAi] = useState(false);

  const loadAiProfile = async () => {
    try {
      setAiLoading(true);
      const data = await aiProfileService.getMine();
      setAiProfile(data);
      setAiForm({ roomSearch: { ...(data?.roomSearch || {}) }, jobSearch: { ...(data?.jobSearch || {}) } });
    } catch (error) {
      console.error("AI profile load failed:", error);
    } finally {
      setAiLoading(false);
    }
  };

  const updateAiField = (section: "roomSearch" | "jobSearch", field: string, value: string) => {
    setAiForm((prev: any) => ({ ...prev, [section]: { ...(prev?.[section] || {}), [field]: value } }));
  };

  const saveAiProfile = async () => {
    try {
      setAiSaving(true);
      const updated = await aiProfileService.updateMine({ roomSearch: aiForm.roomSearch, jobSearch: aiForm.jobSearch });
      setAiProfile(updated);
      setAiForm({ roomSearch: { ...(updated?.roomSearch || {}) }, jobSearch: { ...(updated?.jobSearch || {}) } });
      setAiEditing(false);
      toast.success("AI information saved");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "AI information save failed");
    } finally {
      setAiSaving(false);
    }
  };

  const deleteAiField = async (field: string) => {
    try {
      setDeletingField(field);
      const updated = await aiProfileService.deleteField(field);
      setAiProfile(updated);
      setAiForm({ roomSearch: { ...(updated?.roomSearch || {}) }, jobSearch: { ...(updated?.jobSearch || {}) } });
      toast.success("Saved AI detail deleted");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Could not delete detail");
    } finally {
      setDeletingField(null);
    }
  };

  const clearAiProfile = async () => {
    const ok = window.confirm("Delete all information saved by RoomKhoj AI?");
    if (!ok) return;
    try {
      setClearingAi(true);
      await aiProfileService.clearMine();
      setAiProfile(null);
      setAiForm({ roomSearch: {}, jobSearch: {} });
      toast.success("AI information cleared");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Could not clear AI information");
    } finally {
      setClearingAi(false);
    }
  };

  const resolveUserId = async () => {
    const storeId = String((user as any)?.id || "");
    if (storeId) return storeId;
    const response = await privateApi.get("/user/active");
    return String(response.data?.data?.id || "");
  };

  const loadProfile = async () => {
    try {
      setProfileLoading(true);
      const userId = currentUserId || await resolveUserId();
      if (!userId) throw new Error("User ID unavailable");
      if (!currentUserId) setCurrentUserId(userId);
      const data = await profileService.getProfile(userId);
      setProfile(data);
      setForm({
        name: data.user.name || "",
        bio: data.user.bio || "",
        location: data.user.location || "",
        website: data.user.website || "",
      });

      try {
        const list = await profileService.getFriends(userId);
        setFriends(Array.isArray(list) ? list : []);
      } catch {
        setFriends([]);
      }

      try {
        const shareResponse = await privateApi.get("/job-posting/share-summary");
        const summary = shareResponse.data || { totalUniqueOpens: 0, items: [] };
        const items = await Promise.all(
          (summary.items || []).map(async (item: any) => {
            if (!item.isUnlocked) return item;
            try {
              const contact = await jobPostingService.getContact(item.jobPostingId);
              return { ...item, contactPhone: contact.contactPhone };
            } catch {
              return item;
            }
          }),
        );
        setShareSummary({ ...summary, items });
      } catch {
        setShareSummary({ totalUniqueOpens: 0, items: [] });
      }
    } catch (error) {
      console.error("Profile load failed:", error);
      toast.error("Profile load हुन सकेन");
    } finally {
      setProfileLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
    loadAiProfile();
  }, []);

  const changeRoomStatus = async (room: any, nextStatus: RoomStatus.AVAILABLE | RoomStatus.RENTED) => {
    if (room.listingStatus === nextStatus) return;
    try {
      setChangingRoomStatusId(room.id);
      await roomService.updateListingStatus(room.id, nextStatus);
      setProfile((prev) => prev ? {
        ...prev,
        rooms: prev.rooms.map((item: any) => item.id === room.id ? { ...item, listingStatus: nextStatus } : item),
      } : prev);
      toast.success(nextStatus === RoomStatus.AVAILABLE ? "Room marked Available" : "Room marked Rented");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Room status update failed");
    } finally {
      setChangingRoomStatusId(null);
    }
  };

  const handleEdit = () => {
    if (!profile) return;
    setForm({ name: profile.user.name || "", bio: profile.user.bio || "", location: profile.user.location || "", website: profile.user.website || "" });
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (profile) {
      setForm({ name: profile.user.name || "", bio: profile.user.bio || "", location: profile.user.location || "", website: profile.user.website || "" });
    }
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("Name खाली राख्न मिल्दैन");
      return;
    }
    try {
      setIsSaving(true);
      const updated = await profileService.updateProfile({
        name: form.name.trim(), bio: form.bio.trim(), location: form.location.trim(), website: form.website.trim(),
      });
      if (updated?.user) {
        setProfile(updated);
        updateUser({ name: updated.user.name } as any);
        setForm({ name: updated.user.name || "", bio: updated.user.bio || "", location: updated.user.location || "", website: updated.user.website || "" });
      } else {
        await loadProfile();
      }
      setIsEditing(false);
      toast.success("Profile saved successfully");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Profile save हुन सकेन");
    } finally {
      setIsSaving(false);
    }
  };

  const uploadProfilePhoto = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Image मात्र select गर्नुहोस्");
      return;
    }
    try {
      setUploadingProfile(true);
      await profileService.uploadProfilePhoto(file);
      await loadProfile();
      toast.success("Profile photo updated");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Profile photo upload failed");
    } finally {
      setUploadingProfile(false);
      event.target.value = "";
    }
  };

  const uploadCoverPhoto = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Image मात्र select गर्नुहोस्");
      return;
    }
    try {
      setUploadingCover(true);
      await profileService.uploadCoverPhoto(file);
      await loadProfile();
      toast.success("Cover photo updated");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Cover upload failed");
    } finally {
      setUploadingCover(false);
      event.target.value = "";
    }
  };

  const renderAiField = (section: "roomSearch" | "jobSearch", field: string, label: string) => {
    const current = aiForm?.[section]?.[field] ?? aiProfile?.[section]?.[field] ?? "";
    if (!aiEditing && (current === "" || current === null || current === undefined)) return null;
    return (
      <div className="rounded-xl border bg-muted/20 p-3">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <p className="mb-1 text-[11px] text-muted-foreground">{label}</p>
            {aiEditing ? (
              <Input value={String(current ?? "")} onChange={(e) => updateAiField(section, field, e.target.value)} className="h-8 rounded-lg text-xs" />
            ) : (
              <p className="break-words text-sm font-medium">{typeof current === "boolean" ? current ? "Yes" : "No" : String(current)}</p>
            )}
          </div>
          {!aiEditing && current !== "" && (
            <button type="button" onClick={() => deleteAiField(field)} disabled={deletingField === field} className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-red-50 hover:text-red-600">
              {deletingField === field ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
            </button>
          )}
        </div>
      </div>
    );
  };

  if (profileLoading) return <div className="flex min-h-[500px] items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-muted-foreground" /></div>;
  if (!profile) return <div className="p-10 text-center">Profile load हुन सकेन।</div>;

  const profilePhoto = profileMediaUrl(profile.user.profilePhotoUrl);
  const coverPhoto = profileMediaUrl(profile.user.coverPhotoUrl);
  const initials = profile.user.name?.split(" ").filter(Boolean).map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "U";
  const websiteHref = profile.user.website ? (/^https?:\/\//i.test(profile.user.website) ? profile.user.website : `https://${profile.user.website}`) : "";

  return (
    <main className="mx-auto max-w-7xl space-y-5 pb-24">
      <div className="lg:hidden"><PushNotificationSetup /></div>
      <Card className="overflow-hidden rounded-3xl border-0 shadow-sm">
        <div className="relative h-44 bg-gradient-to-br from-red-500 via-rose-500 to-pink-600 sm:h-64">
          {coverPhoto && <img src={coverPhoto} alt="" className="h-full w-full object-cover" onError={(e) => { e.currentTarget.style.display = "none"; }} />}
          <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={uploadCoverPhoto} />
          <button type="button" onClick={() => coverInputRef.current?.click()} className="absolute right-4 top-4 rounded-full bg-black/45 p-2 text-white"><Camera className="h-4 w-4" /></button>
        </div>
        <CardContent className="relative p-5 pt-16 sm:px-7">
          <div className="absolute -top-12 left-5 h-24 w-24 overflow-hidden rounded-full border-4 border-white bg-slate-100 sm:left-7">
            {profilePhoto ? <img src={profilePhoto} alt={profile.user.name} className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center text-2xl font-black text-red-600">{initials}</div>}
          </div>
          <input ref={profileInputRef} type="file" accept="image/*" className="hidden" onChange={uploadProfilePhoto} />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-black">{profile.user.name}</h1>
              {profile.user.isVerified && <span className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-sky-600"><BadgeCheck className="h-4 w-4" /> Verified</span>}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => profileInputRef.current?.click()} disabled={uploadingProfile}>{uploadingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}</Button>
              {!isEditing ? <Button onClick={handleEdit}><Edit3 className="mr-2 h-4 w-4" />Edit</Button> : <><Button variant="outline" onClick={handleCancel}><X className="mr-2 h-4 w-4" />Cancel</Button><Button onClick={handleSave} disabled={isSaving}>{isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Save</Button></>}
            </div>
          </div>
          {isEditing ? (
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div><label className="mb-1 block text-xs font-medium">Name</label><Input value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} /></div>
              <div><label className="mb-1 block text-xs font-medium">Location</label><Input value={form.location} onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))} /></div>
              <div className="sm:col-span-2"><label className="mb-1 block text-xs font-medium">Bio</label><textarea value={form.bio} onChange={(e) => setForm((prev) => ({ ...prev, bio: e.target.value }))} maxLength={300} className="min-h-24 w-full rounded-xl border bg-background px-3 py-2 text-sm" /></div>
              <div className="sm:col-span-2"><label className="mb-1 block text-xs font-medium">Website</label><Input value={form.website} onChange={(e) => setForm((prev) => ({ ...prev, website: e.target.value }))} /></div>
            </div>
          ) : (
            <div className="mt-5">
              {profile.user.bio && <p className="max-w-2xl whitespace-pre-wrap text-sm sm:text-base">{profile.user.bio}</p>}
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
                {profile.user.location && <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" />{profile.user.location}</span>}
                {profile.user.website && <a href={websiteHref} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 font-medium text-primary hover:underline"><Globe2 className="h-4 w-4" />{profile.user.website}</a>}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
        <section className="space-y-5">
          <Card className="overflow-hidden rounded-3xl border-0 shadow-sm">
            <div className="flex overflow-x-auto border-b px-2">
              {[["rooms","Rooms"],["jobs","Jobs"],["friends","Friends"],["shares","Interested Vacancies"],["about","About"]].map(([value,label]) => (
                <button key={value} type="button" onClick={() => setTab(value as ActivityTab)} className={`relative min-w-fit px-5 py-4 text-sm font-semibold ${tab === value ? "text-primary" : "text-muted-foreground"}`}>
                  {label}{tab === value && <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-primary" />}
                </button>
              ))}
            </div>
            <CardContent className="p-5">
              {tab === "rooms" && (
                <div className="space-y-3">
                  {profile.rooms.length === 0 ? <div className="py-10 text-center text-sm text-muted-foreground">No room listings yet.</div> : profile.rooms.map((room: any) => {
                    const isApproved = room.approvalStatus === RoomStatus.APPROVED;
                    const isRented = room.listingStatus === RoomStatus.RENTED;
                    const statusLabel = isRented ? "Rented" : room.listingStatus === RoomStatus.AVAILABLE ? "Available" : room.listingStatus || "Pending";
                    return (
                      <div key={room.id} className="w-full rounded-2xl border p-4">
                        <button type="button" onClick={() => router.push(`/property/${room.id}`)} className="w-full text-left">
                          <div className="flex items-start gap-3">
                            <Home className="mt-1 h-5 w-5 shrink-0 text-red-600" />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-3">
                                <h3 className="font-semibold">{room.title || room.roomType || "Room"}</h3>
                                <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${isRented ? "bg-slate-100 text-slate-600" : room.listingStatus === RoomStatus.AVAILABLE ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{statusLabel}</span>
                              </div>
                              <p className="mt-1 text-sm text-muted-foreground">{room.address || room.location || ""}</p>
                              {room.price != null && <p className="mt-2 font-bold">Rs. {Number(room.price).toLocaleString()}</p>}
                            </div>
                          </div>
                        </button>
                        {isApproved && (
                          <div className="mt-3 flex gap-2 border-t pt-3">
                            <Button type="button" size="sm" variant={room.listingStatus === RoomStatus.AVAILABLE ? "default" : "outline"} disabled={changingRoomStatusId === room.id} onClick={() => void changeRoomStatus(room, RoomStatus.AVAILABLE)} className="flex-1 rounded-xl">Available</Button>
                            <Button type="button" size="sm" variant={isRented ? "default" : "outline"} disabled={changingRoomStatusId === room.id} onClick={() => void changeRoomStatus(room, RoomStatus.RENTED)} className="flex-1 rounded-xl">Rented</Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  <Button variant="outline" className="w-full rounded-xl" onClick={() => router.push("/user/dashboard/rooms/create")}>+ Add Room</Button>
                </div>
              )}

              {tab === "jobs" && <div className="space-y-3">{profile.jobs.length === 0 ? <div className="py-10 text-center text-sm text-muted-foreground">No job posts yet.</div> : profile.jobs.map((job: any) => <div key={job.id} className="rounded-2xl border p-4"><div className="flex items-start gap-3"><BriefcaseBusiness className="mt-1 h-5 w-5 shrink-0 text-violet-600" /><div><h3 className="font-semibold">{job.jobTitle}</h3><p className="mt-1 text-sm text-muted-foreground">{job.companyName || "Company"} · {job.location || ""}</p>{job.salary != null && <p className="mt-2 font-bold">Rs. {Number(job.salary).toLocaleString()}</p>}</div></div></div>)}</div>}
              {tab === "friends" && <div className="grid gap-3 sm:grid-cols-2">{friends.length === 0 ? <div className="col-span-full py-10 text-center text-sm text-muted-foreground">No friends yet.</div> : friends.map((friend: any) => <div key={friend.id || friend.userId} className="rounded-2xl border p-4"><div className="flex items-center gap-3"><UserRound className="h-5 w-5" /><span className="font-medium">{friend.name || friend.user?.name || "User"}</span></div></div>)}</div>}
              {tab === "shares" && <div className="space-y-3">{shareSummary.items.length === 0 ? <div className="py-10 text-center text-sm text-muted-foreground">No interested vacancies yet.</div> : shareSummary.items.map((item) => <div key={item.jobPostingId} className="rounded-2xl border p-4"><div className="flex items-start gap-3"><Share2 className="mt-1 h-5 w-5 text-violet-600" /><div><h3 className="font-semibold">{item.jobTitle}</h3><p className="text-sm text-muted-foreground">{item.companyName || "Company"}</p><p className="mt-2 text-sm">Shares: {item.shareCount}/{item.requiredShares}</p></div></div></div>)}</div>}
              {tab === "about" && <div className="space-y-3 text-sm text-muted-foreground"><p>Profile information and RoomKhoj activity.</p></div>}
            </CardContent>
          </Card>
        </section>

        <aside className="space-y-5">
          <Card className="rounded-3xl border-0 shadow-sm"><CardContent className="p-5"><h2 className="mb-4 text-lg font-bold">About</h2><div className="space-y-4 text-sm"><div className="flex items-center gap-3"><Mail className="h-4 w-4 text-muted-foreground" /><div><p className="text-xs text-muted-foreground">Email</p><p className="font-medium">{(user as any)?.email || "Not available"}</p></div></div><Separator /><div className="flex items-center gap-3"><Phone className="h-4 w-4 text-muted-foreground" /><div><p className="text-xs text-muted-foreground">Phone</p><p className="font-medium">{(user as any)?.phone || (user as any)?.phoneNumber || "Not available"}</p></div></div></div></CardContent></Card>
          <Card className="rounded-3xl border-0 shadow-sm"><CardContent className="p-5"><div className="mb-4 flex items-center justify-between"><div className="flex items-center gap-2"><Bot className="h-5 w-5 text-red-600" /><h2 className="text-lg font-bold">AI Profile</h2></div>{!aiEditing ? <Button size="sm" variant="outline" onClick={() => setAiEditing(true)}>Edit</Button> : <div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => setAiEditing(false)}>Cancel</Button><Button size="sm" onClick={saveAiProfile} disabled={aiSaving}>{aiSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save</Button></div>}</div>{aiLoading ? <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin" /></div> : <div className="space-y-3">{renderAiField("roomSearch","city","Preferred city")}{renderAiField("roomSearch","area","Preferred area")}{renderAiField("roomSearch","maxPrice","Maximum budget")}{renderAiField("jobSearch","jobTitle","Job title")}{renderAiField("jobSearch","location","Job location")}<Button variant="outline" size="sm" className="w-full" onClick={clearAiProfile} disabled={clearingAi}>{clearingAi && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Clear AI profile</Button></div>}</CardContent></Card>
        </aside>
      </div>
    </main>
  );
}
