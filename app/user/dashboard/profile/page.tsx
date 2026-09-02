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
  CircleDollarSign,
  Crown,
  Edit3,
  Globe2,
  Home,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Save,
  Share2,
  Sparkles,
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
import { walletService } from "@/http/services/wallet.service";
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

  const [
    currentUserId,
    setCurrentUserId,
  ] = useState("");

  const [
    profile,
    setProfile,
  ] =
    useState<PublicProfile | null>(
      null,
    );

  const [friends, setFriends] =
    useState<any[]>([]);

  const [changingRoomStatusId, setChangingRoomStatusId] =
    useState<string | null>(null);

  const [monetization, setMonetization] = useState<{
    isMonetized: boolean;
    monetizedAt: string | null;
    monetizationFeePaid: number;
    monetizationFee: number;
    canEarnFromRooms: boolean;
    currentPlan: "FREE" | "STARTER";
    totalEarned: number;
    freeEarningLimit: number;
    freeEarningRemaining: number;
  } | null>(null);
  const [monetizationLoading, setMonetizationLoading] = useState(true);
  const [monetizationActivating, setMonetizationActivating] = useState(false);

  const [shareSummary, setShareSummary] =
    useState<{
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
    }>({
      totalUniqueOpens: 0,
      items: [],
    });

  const [profileLoading, setProfileLoading] =
    useState(true);

  const [isEditing, setIsEditing] =
    useState(false);

  const [isSaving, setIsSaving] =
    useState(false);

  const [
    uploadingProfile,
    setUploadingProfile,
  ] = useState(false);

  const [
    uploadingCover,
    setUploadingCover,
  ] = useState(false);

  const [tab, setTab] =
    useState<ActivityTab>("rooms");

  const [form, setForm] =
    useState({
      name: "",
      bio: "",
      location: "",
      website: "",
    });

  const profileInputRef =
    useRef<HTMLInputElement | null>(
      null,
    );

  const coverInputRef =
    useRef<HTMLInputElement | null>(
      null,
    );

  /*
   * ==========================
   * AI PROFILE
   * ==========================
   */

  const [
    aiProfile,
    setAiProfile,
  ] = useState<any>(null);

  const [aiForm, setAiForm] =
    useState<any>({
      roomSearch: {},
      jobSearch: {},
    });

  const [
    aiLoading,
    setAiLoading,
  ] = useState(true);

  const [
    aiEditing,
    setAiEditing,
  ] = useState(false);

  const [
    aiSaving,
    setAiSaving,
  ] = useState(false);

  const [
    deletingField,
    setDeletingField,
  ] = useState<string | null>(
    null,
  );

  const [
    clearingAi,
    setClearingAi,
  ] = useState(false);

  const loadAiProfile = async () => {
    try {
      setAiLoading(true);
      const data = await aiProfileService.getMine();
      setAiProfile(data);
      setAiForm({
        roomSearch: { ...(data?.roomSearch || {}) },
        jobSearch: { ...(data?.jobSearch || {}) },
      });
    } catch (error) {
      console.error("AI profile load failed:", error);
    } finally {
      setAiLoading(false);
    }
  };

  const updateAiField = (
    section: "roomSearch" | "jobSearch",
    field: string,
    value: string,
  ) => {
    setAiForm((prev: any) => ({
      ...prev,
      [section]: {
        ...(prev?.[section] || {}),
        [field]: value,
      },
    }));
  };

  const saveAiProfile = async () => {
    try {
      setAiSaving(true);
      const updated = await aiProfileService.updateMine({
        roomSearch: aiForm.roomSearch,
        jobSearch: aiForm.jobSearch,
      });
      setAiProfile(updated);
      setAiForm({
        roomSearch: { ...(updated?.roomSearch || {}) },
        jobSearch: { ...(updated?.jobSearch || {}) },
      });
      setAiEditing(false);
      toast.success("AI information saved");
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "AI information save failed",
      );
    } finally {
      setAiSaving(false);
    }
  };

  const deleteAiField = async (field: string) => {
    try {
      setDeletingField(field);
      const updated = await aiProfileService.deleteField(field);
      setAiProfile(updated);
      setAiForm({
        roomSearch: { ...(updated?.roomSearch || {}) },
        jobSearch: { ...(updated?.jobSearch || {}) },
      });
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
      toast.error(
        error?.response?.data?.message || "Could not clear AI information",
      );
    } finally {
      setClearingAi(false);
    }
  };

  /* MAIN PROFILE */

  const resolveUserId = async () => {
    const storeId = String((user as any)?.id || "");
    if (storeId) return storeId;
    const response = await privateApi.get("/user/active");
    return String(response.data?.data?.id || "");
  };

  const loadMonetization = async () => {
    try {
      setMonetizationLoading(true);
      const data = await walletService.getMonetizationStatus();
      setMonetization(data);
    } catch {
      setMonetization(null);
    } finally {
      setMonetizationLoading(false);
    }
  };

  const activateMonetization = async () => {
    try {
      setMonetizationActivating(true);
      await walletService.activateMonetization();
      await loadMonetization();
      toast.success("Account monetized successfully");
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          "Account monetization activate गर्न सकिएन.",
      );
    } finally {
      setMonetizationActivating(false);
    }
  };

  const loadProfile = async () => {
    try {
      setProfileLoading(true);
      const userId = currentUserId || (await resolveUserId());
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
        const summary = shareResponse.data || {
          totalUniqueOpens: 0,
          items: [],
        };
        const items = await Promise.all(
          (summary.items || []).map(async (item: any) => {
            if (!item.isUnlocked) return item;
            try {
              const contact = await jobPostingService.getContact(
                item.jobPostingId,
              );
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
    } catch (error: any) {
      console.error("Profile load failed:", error);
      toast.error("Profile load हुन सकेन");
    } finally {
      setProfileLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
    loadAiProfile();
    loadMonetization();
  }, []);

  const changeRoomStatus = async (
    roomId: string,
    status: RoomStatus.AVAILABLE | RoomStatus.RENTED,
  ) => {
    if (changingRoomStatusId) return;
    try {
      setChangingRoomStatusId(roomId);
      const response = await roomService.updateListingStatus(roomId, status);
      const updatedRoom = response.data;
      setProfile((current) =>
        current
          ? {
              ...current,
              rooms: current.rooms.map((room: any) =>
                room.id === roomId
                  ? { ...room, listingStatus: updatedRoom.listingStatus }
                  : room,
              ),
            }
          : current,
      );
      toast.success(
        status === RoomStatus.AVAILABLE
          ? "Room marked Available"
          : "Room marked Rented",
      );
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Room status update हुन सकेन",
      );
    } finally {
      setChangingRoomStatusId(null);
    }
  };

  const handleEdit = () => {
    if (!profile) return;
    setForm({
      name: profile.user.name || "",
      bio: profile.user.bio || "",
      location: profile.user.location || "",
      website: profile.user.website || "",
    });
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (profile) {
      setForm({
        name: profile.user.name || "",
        bio: profile.user.bio || "",
        location: profile.user.location || "",
        website: profile.user.website || "",
      });
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
        name: form.name.trim(),
        bio: form.bio.trim(),
        location: form.location.trim(),
        website: form.website.trim(),
      });
      if (updated?.user) {
        setProfile(updated);
        updateUser({ name: updated.user.name } as any);
        setForm({
          name: updated.user.name || "",
          bio: updated.user.bio || "",
          location: updated.user.location || "",
          website: updated.user.website || "",
        });
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
      toast.error(
        error?.response?.data?.message || "Profile photo upload failed",
      );
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

  const renderAiField = (
    section: "roomSearch" | "jobSearch",
    field: string,
    label: string,
  ) => {
    const current =
      aiForm?.[section]?.[field] ?? aiProfile?.[section]?.[field] ?? "";
    if (!aiEditing && (current === "" || current == null)) return null;
    return (
      <div className="rounded-xl border bg-muted/20 p-3">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <p className="mb-1 text-[11px] text-muted-foreground">{label}</p>
            {aiEditing ? (
              <Input
                value={String(current ?? "")}
                onChange={(e) =>
                  updateAiField(section, field, e.target.value)
                }
                className="h-8 rounded-lg text-xs"
              />
            ) : (
              <p className="break-words text-sm font-medium">
                {typeof current === "boolean"
                  ? current
                    ? "Yes"
                    : "No"
                  : String(current)}
              </p>
            )}
          </div>
          {!aiEditing && current !== "" && (
            <button
              type="button"
              onClick={() => deleteAiField(field)}
              disabled={deletingField === field}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-red-50 hover:text-red-600"
            >
              {deletingField === field ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Trash2 className="h-3 w-3" />
              )}
            </button>
          )}
        </div>
      </div>
    );
  };

  if (profileLoading) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!profile) {
    return <div className="p-10 text-center">Profile load हुन सकेन।</div>;
  }

  const profilePhoto = profileMediaUrl(profile.user.profilePhotoUrl);
  const coverPhoto = profileMediaUrl(profile.user.coverPhotoUrl);
  const initials =
    profile.user.name
      ?.split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "U";
  const websiteHref = profile.user.website
    ? /^https?:\/\//i.test(profile.user.website)
      ? profile.user.website
      : `https://${profile.user.website}`
    : "";

  return (
    <main className="mx-auto max-w-7xl space-y-5 pb-24">
      <div className="lg:hidden">
        <PushNotificationSetup />
      </div>

      <Card className="overflow-hidden rounded-3xl border-0 shadow-sm">
        <div className="relative h-44 bg-gradient-to-br from-red-500 via-rose-500 to-pink-600 sm:h-64">
          {coverPhoto && (
            <img src={coverPhoto} alt="" className="h-full w-full object-cover" />
          )}
          <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={uploadCoverPhoto} />
          <Button type="button" size="sm" variant="secondary" className="absolute bottom-3 right-3 gap-2 rounded-full shadow" disabled={uploadingCover} onClick={() => coverInputRef.current?.click()}>
            {uploadingCover ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
            Change Cover
          </Button>
        </div>

        <CardContent className="px-5 pb-6 sm:px-8">
          <div className="-mt-12 flex flex-col gap-4 sm:-mt-16 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-4">
              <div className="relative">
                <div className="h-28 w-28 overflow-hidden rounded-full border-4 border-background bg-gradient-to-br from-red-500 to-rose-600 shadow-xl sm:h-36 sm:w-36">
                  {profilePhoto ? <img src={profilePhoto} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-white">{initials}</div>}
                </div>
                {profile.user.isVerified && <div className="absolute bottom-1 right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-background bg-blue-500"><BadgeCheck className="h-4 w-4 text-white" /></div>}
                <input ref={profileInputRef} type="file" accept="image/*" className="hidden" onChange={uploadProfilePhoto} />
                <button type="button" disabled={uploadingProfile} onClick={() => profileInputRef.current?.click()} className="absolute bottom-1 left-1 flex h-9 w-9 items-center justify-center rounded-full border-2 border-background bg-background shadow">
                  {uploadingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                </button>
              </div>
              <div className="mb-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="truncate text-2xl font-bold sm:text-3xl">{profile.user.name}</h1>
                  {monetization?.isMonetized && <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-[11px] font-bold text-amber-800"><Crown className="h-3 w-3" /> Monetized</span>}
                </div>
                <p className="text-sm text-muted-foreground">{friends.length} {friends.length === 1 ? "friend" : "friends"} · {profile.rooms.length} rooms · {profile.jobs.length} jobs</p>
              </div>
            </div>
            <div className="flex gap-2 sm:pb-1">
              {isEditing ? (
                <>
                  <Button variant="outline" className="gap-2 rounded-full" onClick={handleCancel}><X className="h-4 w-4" />Cancel</Button>
                  <Button className="gap-2 rounded-full" onClick={handleSave} disabled={isSaving}>{isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}Save</Button>
                </>
              ) : (
                <Button variant="outline" className="gap-2 rounded-full" onClick={handleEdit}><Edit3 className="h-4 w-4" />Edit Profile</Button>
              )}
            </div>
          </div>

          {!isEditing && (
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

      <Card className="overflow-hidden rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-yellow-50 shadow-sm">
        <CardContent className="p-5 sm:p-6">
          <div className="mb-5">
            <div className="flex items-center gap-2"><Crown className="h-5 w-5 text-amber-700" /><span className="text-xs font-black uppercase tracking-[0.18em] text-amber-700">Earn with RoomKhoj</span></div>
            <h2 className="mt-1 text-xl font-black">Choose your earning plan</h2>
            <p className="mt-1 text-sm text-muted-foreground">पहिला plan हेर्नुहोस्। Free बाट सुरु गर्न सकिन्छ; मन परेपछि paid plan activate गर्न सकिन्छ।</p>
          </div>

          {monetizationLoading ? (
            <div className="flex items-center gap-3"><Loader2 className="h-5 w-5 animate-spin" /><span className="text-sm text-muted-foreground">Checking plans...</span></div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              {[
                {
                  name: "Free",
                  price: 0,
                  note: "Start earning without payment",
                  active: !monetization?.isMonetized,
                  action: false,
                  features: [
                    "Room post गर्न मिल्ने",
                    "Room browse, save र message",
                    "Chat बाट payment request",
                    "Escrow payment receive",
                    "Rs. 1,500 सम्म total earning",
                    "Basic wallet & transaction history",
                  ],
                },
                {
                  name: "Starter",
                  price: Number(monetization?.monetizationFee || 499),
                  note: "Best for new earning users",
                  active: !!monetization?.isMonetized,
                  action: !monetization?.isMonetized,
                  features: [
                    "Free plan का सबै सुविधा",
                    "Rs. 1,500 earning limit हट्ने",
                    "Unlimited service-charge earning",
                    "Escrow release request",
                    "10% RoomKhoj platform fee",
                    "Monetized profile badge",
                    "Wallet withdrawal eligibility",
                  ],
                },
                {
                  name: "Growth",
                  price: 899,
                  note: "For users growing their room business",
                  active: false,
                  action: false,
                  features: [
                    "Starter का सबै सुविधा",
                    "Priority room visibility",
                    "More active room listings",
                    "Basic earning analytics",
                    "Lead activity insights",
                    "Faster support priority",
                  ],
                },
                {
                  name: "Pro",
                  price: 999,
                  note: "For active agents and frequent earners",
                  active: false,
                  action: false,
                  features: [
                    "Growth का सबै सुविधा",
                    "Featured room boosts",
                    "Advanced earning analytics",
                    "Lead & payment history tools",
                    "Priority placement",
                    "Agent-friendly earning dashboard",
                  ],
                },
                {
                  name: "VIP",
                  price: 1999,
                  note: "Premium plan for serious agents",
                  active: false,
                  action: false,
                  features: [
                    "Pro का सबै सुविधा",
                    "VIP profile badge",
                    "Highest room visibility priority",
                    "Premium featured placement",
                    "Advanced agent analytics",
                    "Priority support",
                    "Early access to new earning features",
                  ],
                },
              ].map((plan) => (
                <div key={plan.name} className={`relative rounded-2xl border p-4 ${plan.active ? "border-amber-400 bg-amber-50 shadow-sm" : "border-border bg-background"}`}>
                  {plan.active && <span className="absolute right-3 top-3 rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-bold text-emerald-700">ACTIVE</span>}
                  <p className="text-sm font-black">{plan.name}</p>
                  <p className="mt-2 text-2xl font-black">{plan.price === 0 ? "Free" : `Rs. ${plan.price.toLocaleString()}`}</p>
                  <p className="mt-2 min-h-10 text-xs text-muted-foreground">{plan.note}</p>
                  <div className="mt-3 space-y-2">
                    {plan.features.map((feature) => (
                      <div key={feature} className="flex items-start gap-2 text-xs">
                        <BadgeCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                  {plan.name === "Free" && !monetization?.isMonetized && (
                    <div className="mt-3 rounded-xl bg-muted/60 p-2 text-xs font-semibold">
                      Remaining: Rs. {Number(monetization?.freeEarningRemaining ?? 1500).toLocaleString()} / 1,500
                    </div>
                  )}
                  {plan.action && (
                    <Button type="button" onClick={activateMonetization} disabled={monetizationActivating} className="mt-3 w-full rounded-full font-bold">
                      {monetizationActivating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Crown className="mr-2 h-4 w-4" />}
                      Choose Starter
                    </Button>
                  )}
                  {!plan.active && !plan.action && plan.price > 499 && (
                    <Button type="button" variant="outline" disabled className="mt-3 w-full rounded-full">Coming soon</Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
        <section className="space-y-5">
          <Card className="rounded-3xl border-0 shadow-sm"><CardContent className="p-5"><h2 className="mb-4 text-lg font-bold">About</h2><div className="space-y-4 text-sm"><div className="flex items-center gap-3"><Mail className="h-4 w-4 text-muted-foreground" /><div><p className="text-xs text-muted-foreground">Email</p><p className="font-medium">{(user as any)?.email || "Not available"}</p></div></div><Separator /><div className="flex items-center gap-3"><Phone className="h-4 w-4 text-muted-foreground" /><div><p className="text-xs text-muted-foreground">Phone</p><p className="font-medium">{(user as any)?.phone || (user as any)?.phoneNumber || "Not available"}</p></div></div>{profile.user.location && <><Separator /><div className="flex items-center gap-3"><MapPin className="h-4 w-4 text-muted-foreground" /><div><p className="text-xs text-muted-foreground">Location</p><p className="font-medium">{profile.user.location}</p></div></div></>}</div></CardContent></Card>
          <Card className="overflow-hidden rounded-3xl border-0 shadow-sm">
            <div className="flex overflow-x-auto border-b px-2">{[["rooms","Rooms"],["jobs","Jobs"],["friends","Friends"],["shares","Interested Vacancies"],["about","About"]].map(([value,label]) => <button key={value} type="button" onClick={() => setTab(value as ActivityTab)} className={`relative min-w-fit px-5 py-4 text-sm font-semibold ${tab===value?"text-primary":"text-muted-foreground"}`}>{label}{tab===value && <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-primary" />}</button>)}</div>
            <CardContent className="p-5"><p className="text-sm text-muted-foreground">Profile activity is available in this section.</p></CardContent>
          </Card>
        </section>
        <aside className="space-y-5">
          <Card className="rounded-3xl border-0 shadow-sm"><CardContent className="p-5"><div className="mb-3 flex items-center gap-2"><Bot className="h-5 w-5 text-primary" /><h2 className="font-bold">AI Profile</h2></div><p className="text-sm text-muted-foreground">RoomKhoj AI remembers your room and job preferences here.</p></CardContent></Card>
        </aside>
      </div>
    </main>
  );
}
