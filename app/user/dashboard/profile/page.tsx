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
  Eye,
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
import { unlockService } from "@/http/services/unlock.service";
import { TopUpRequestDialog } from "@/components/wallet/TopUpRequestDialog";
import {
  profileService,
  type ProfileViewSummary,
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

const PROFILE_IMAGE_MAX_BYTES = 20 * 1024 * 1024;
const COVER_IMAGE_MAX_BYTES = 30 * 1024 * 1024;
const IMAGE_FILE_NAME = /\.(?:jpe?g|png|webp|gif|heic|heif)$/i;

function isImageFile(file: File) {
  return file.type.startsWith("image/") || IMAGE_FILE_NAME.test(file.name);
}

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

  const [profileViews, setProfileViews] =
    useState<ProfileViewSummary>({
      totalViews: 0,
      uniqueViewers: 0,
      viewers: [],
    });

  const [showProfileViewers, setShowProfileViewers] =
    useState(false);

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
  const [selectedMonetizationPlan, setSelectedMonetizationPlan] = useState<any>(null);
  const [showMonetizationConfirm, setShowMonetizationConfirm] = useState(false);
  const [showMonetizationTopup, setShowMonetizationTopup] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [topupSettings, setTopupSettings] = useState<any>(null);
  const [kyc, setKyc] = useState<any>(null);
  const [kycLoading, setKycLoading] = useState(true);
  const [kycSubmitting, setKycSubmitting] = useState(false);
  const [showKycForm, setShowKycForm] = useState(false);
  const [kycForm, setKycForm] = useState({
    fullName: "",
    phoneNumber: "",
    address: "",
    documentType: "CITIZENSHIP",
    documentNumber: "",
  });
  const [kycDocument, setKycDocument] = useState<File | null>(null);

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

  const [profilePhotoFailed, setProfilePhotoFailed] = useState(false);
  const [coverPhotoFailed, setCoverPhotoFailed] = useState(false);

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

  const loadMonetizationKyc = async () => {
    try {
      setKycLoading(true);
      const data = await walletService.getMonetizationKyc();
      setKyc(data);
      if (data?.fullName || data?.phoneNumber || data?.address) {
        setKycForm((prev) => ({
          ...prev,
          fullName: data.fullName || prev.fullName,
          phoneNumber: data.phoneNumber || prev.phoneNumber,
          address: data.address || prev.address,
          documentType: data.documentType || prev.documentType,
        }));
      }
    } catch {
      setKyc(null);
    } finally {
      setKycLoading(false);
    }
  };

  const submitMonetizationKyc = async () => {
    if (
      !kycForm.fullName.trim() ||
      !kycForm.phoneNumber.trim() ||
      !kycForm.address.trim() ||
      !kycForm.documentNumber.trim() ||
      !kycDocument
    ) {
      toast.error("सबै identity details र document upload गर्नुहोस्.");
      return;
    }
    try {
      setKycSubmitting(true);
      await walletService.submitMonetizationKyc({
        ...kycForm,
        document: kycDocument,
      });
      await loadMonetizationKyc();
      setShowKycForm(false);
      toast.success("Identity verification review का लागि पठाइयो");
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          "Identity verification submit गर्न सकिएन.",
      );
    } finally {
      setKycSubmitting(false);
    }
  };

  const chooseMonetizationPlan = async (plan: any) => {
    setSelectedMonetizationPlan(plan);
    if (kyc?.status !== "APPROVED") {
      setShowKycForm(true);
      if (kyc?.accountVerified && !kyc?.hasIdentityDocument) {
        toast.success("Account verified छ। Name र phone pre-filled छन्; identity document details पूरा गर्नुहोस्।");
      } else if (kyc?.status === "PENDING") {
        toast.success("Identity verification review मा छ। आवश्यक भए details update गर्न सक्नुहुन्छ।");
      } else {
        toast.success("पहिले name, phone र identity document सहित verification पूरा गर्नुहोस्।");
      }
      return;
    }
    try {
      const [balance, settings] = await Promise.all([
        walletService.getBalance(),
        unlockService.getSettings(),
      ]);
      setWalletBalance(Number(balance?.balance || 0));
      setTopupSettings(settings);
      setShowMonetizationConfirm(true);
    } catch {
      toast.error("Wallet balance load गर्न सकिएन.");
    }
  };

  const activateMonetization = async () => {
    const fee = Number(selectedMonetizationPlan?.price || monetization?.monetizationFee || 499);
    if (walletBalance < fee) {
      setShowMonetizationConfirm(false);
      setShowMonetizationTopup(true);
      return;
    }
    if (!window.confirm(`Rs. ${fee.toLocaleString()} wallet बाट काटेर Starter plan activate गर्ने?`)) return;
    try {
      setMonetizationActivating(true);
      await walletService.activateMonetization();
      await loadMonetization();
      setShowMonetizationConfirm(false);
      toast.success("Account Monetize Starter plan activated");
    } catch (error: any) {
      const message = error?.response?.data?.message || "Account monetization activate गर्न सकिएन.";
      if (String(message).toLowerCase().includes("insufficient")) {
        setShowMonetizationConfirm(false);
        setShowMonetizationTopup(true);
      }
      toast.error(message);
    } finally {
      setMonetizationActivating(false);
    }
  };

  const loadProfileViews = async () => {
    try {
      const data = await profileService.getMyProfileViews(50);
      setProfileViews({
        totalViews: Number(data?.totalViews || 0),
        uniqueViewers: Number(data?.uniqueViewers || 0),
        viewers: Array.isArray(data?.viewers) ? data.viewers : [],
      });
    } catch {
      setProfileViews({
        totalViews: 0,
        uniqueViewers: 0,
        viewers: [],
      });
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
    loadProfileViews();
    loadAiProfile();
    loadMonetization();
    loadMonetizationKyc();
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
    if (!isImageFile(file)) {
      toast.error("JPG, PNG, WEBP, HEIC वा HEIF photo select गर्नुहोस्");
      event.target.value = "";
      return;
    }
    if (file.size > PROFILE_IMAGE_MAX_BYTES) {
      toast.error("Profile photo 20 MB भन्दा सानो हुनुपर्छ");
      event.target.value = "";
      return;
    }
    try {
      setUploadingProfile(true);
      setProfilePhotoFailed(false);
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
    if (!isImageFile(file)) {
      toast.error("JPG, PNG, WEBP, HEIC वा HEIF photo select गर्नुहोस्");
      event.target.value = "";
      return;
    }
    if (file.size > COVER_IMAGE_MAX_BYTES) {
      toast.error("Cover photo 30 MB भन्दा सानो हुनुपर्छ");
      event.target.value = "";
      return;
    }
    try {
      setUploadingCover(true);
      setCoverPhotoFailed(false);
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

  const profileViewAgo = (value?: string | null) => {
    if (!value) return "";
    const time = new Date(value).getTime();
    if (!Number.isFinite(time)) return "";
    const minutes = Math.max(0, Math.floor((Date.now() - time) / 60000));
    if (minutes < 1) return "now";
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return days < 7 ? `${days}d` : new Date(value).toLocaleDateString();
  };

  return (
    <main className="mx-auto min-h-screen max-w-6xl space-y-5 bg-muted/30 pb-24 sm:px-4">
      <div className="lg:hidden">
        <PushNotificationSetup />
      </div>

      <div className="flex justify-end px-4 sm:px-0">
        <button
          type="button"
          onClick={() => setShowProfileViewers(true)}
          className="flex max-w-[76vw] items-center gap-2 rounded-full border border-border bg-background px-3 py-2 text-left shadow-sm transition hover:bg-muted"
          aria-label="Open profile viewers"
        >
          <Eye className="h-4 w-4 shrink-0 text-primary" />
          <span className="whitespace-nowrap text-sm font-black">
            {profileViews.totalViews} profile views
          </span>
          {profileViews.viewers.length > 0 && (
            <span className="ml-1 flex -space-x-2">
              {profileViews.viewers.slice(0, 3).map((viewer) => {
                const viewerPhoto = profileMediaUrl(viewer.profilePhotoUrl);
                return viewerPhoto ? (
                  <img
                    key={viewer.id}
                    src={viewerPhoto}
                    alt=""
                    className="h-7 w-7 rounded-full border-2 border-background object-cover"
                  />
                ) : (
                  <span
                    key={viewer.id}
                    className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-background bg-muted text-[9px] font-black"
                  >
                    {viewer.name.slice(0, 1).toUpperCase()}
                  </span>
                );
              })}
            </span>
          )}
        </button>
      </div>

      <section className="overflow-hidden bg-background shadow-sm sm:rounded-b-[28px]">
        <div className="relative h-56 bg-gradient-to-br from-primary/90 via-primary to-primary/75 sm:h-80">
          {coverPhoto && !coverPhotoFailed ? (
            <img
              src={coverPhoto}
              alt="Profile cover"
              onError={() => setCoverPhotoFailed(true)}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.25),transparent_42%)]" />
          )}

          <input
            ref={coverInputRef}
            type="file"
            accept="image/*,.heic,.heif"
            className="hidden"
            onChange={uploadCoverPhoto}
          />

          <button
            type="button"
            disabled={uploadingCover}
            onClick={() => coverInputRef.current?.click()}
            className="absolute bottom-4 right-4 flex h-11 w-11 items-center justify-center rounded-full bg-background/95 text-foreground shadow-lg backdrop-blur"
            aria-label="Change cover photo"
          >
            {uploadingCover ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Camera className="h-5 w-5" />
            )}
          </button>
        </div>

        <div className="relative px-4 pb-4 sm:px-8">
          <div className="-mt-20 flex flex-col items-center text-center sm:-mt-24">
            <div className="relative">
              <div className="h-40 w-40 overflow-hidden rounded-full border-[5px] border-background bg-primary shadow-xl sm:h-48 sm:w-48">
                {profilePhoto && !profilePhotoFailed ? (
                  <img
                    src={profilePhoto}
                    alt={`${profile.user.name} profile photo`}
                    onError={() => setProfilePhotoFailed(true)}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-4xl font-black text-primary-foreground">
                    {initials}
                  </div>
                )}
              </div>

              <input
                ref={profileInputRef}
                type="file"
                accept="image/*,.heic,.heif"
                className="hidden"
                onChange={uploadProfilePhoto}
              />

              <button
                type="button"
                disabled={uploadingProfile}
                onClick={() => profileInputRef.current?.click()}
                className="absolute bottom-2 right-2 flex h-11 w-11 items-center justify-center rounded-full border-[3px] border-background bg-muted text-foreground shadow-md"
                aria-label="Change profile photo"
              >
                {uploadingProfile ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Camera className="h-5 w-5" />
                )}
              </button>
            </div>

            <div className="mt-3 flex max-w-full items-center justify-center gap-2">
              <h1 className="truncate text-[30px] font-black tracking-tight sm:text-4xl">
                {profile.user.name}
              </h1>
              {profile.user.isVerified && (
                <BadgeCheck className="h-6 w-6 shrink-0 text-primary" />
              )}
            </div>

            <p className="mt-1 text-sm font-bold text-muted-foreground sm:text-base">
              {friends.length} {friends.length === 1 ? "friend" : "friends"}
              <span className="mx-1.5">•</span>
              {profile.rooms.length} rooms
              <span className="mx-1.5">•</span>
              {profile.jobs.length} jobs
            </p>

            {profile.user.bio && (
              <p className="mt-4 max-w-2xl whitespace-pre-wrap text-[15px] font-medium leading-6 text-foreground">
                {profile.user.bio}
              </p>
            )}

            <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm font-semibold text-muted-foreground">
              {profile.user.location && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-primary" />
                  {profile.user.location}
                </span>
              )}
              {profile.user.website && (
                <a
                  href={websiteHref}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-primary hover:underline"
                >
                  <Globe2 className="h-4 w-4" />
                  {profile.user.website}
                </a>
              )}
              {monetization?.isMonetized && (
                <span className="inline-flex items-center gap-1.5">
                  <Crown className="h-4 w-4 text-primary" />
                  Monetized
                </span>
              )}
            </div>

            {!profile.user.isVerified && (
              <div className="mt-3 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-bold text-primary">
                Unverified
              </div>
            )}

            <div className="mt-5 grid w-full max-w-2xl grid-cols-[1fr_1fr_auto] gap-2">
              <Button
                type="button"
                className="h-11 rounded-xl bg-primary font-bold text-primary-foreground hover:bg-primary/90"
                onClick={() => router.push("/feed")}
              >
                <Share2 className="mr-2 h-4 w-4" />
                Create
              </Button>

              <Button
                type="button"
                variant="secondary"
                className="h-11 rounded-xl font-bold"
                onClick={() => router.push("/user/dashboard")}
              >
                <Home className="mr-2 h-4 w-4" />
                Dashboard
              </Button>

              <Button
                type="button"
                variant="secondary"
                size="icon"
                className="h-11 w-11 rounded-xl"
                onClick={handleEdit}
                aria-label="Edit profile"
              >
                <Edit3 className="h-5 w-5" />
              </Button>
            </div>

            {isEditing && (
              <div className="mt-4 w-full max-w-2xl rounded-2xl border border-border bg-muted/30 p-4 text-left">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input
                    value={form.name}
                    onChange={(e) => setForm((current) => ({ ...current, name: e.target.value }))}
                    placeholder="Name"
                  />
                  <Input
                    value={form.location}
                    onChange={(e) => setForm((current) => ({ ...current, location: e.target.value }))}
                    placeholder="Location"
                  />
                  <Input
                    value={form.website}
                    onChange={(e) => setForm((current) => ({ ...current, website: e.target.value }))}
                    placeholder="Website"
                  />
                  <Input
                    value={form.bio}
                    onChange={(e) => setForm((current) => ({ ...current, bio: e.target.value }))}
                    placeholder="Bio"
                  />
                </div>
                <div className="mt-3 flex justify-end gap-2">
                  <Button variant="outline" onClick={handleCancel} className="rounded-xl">
                    <X className="mr-2 h-4 w-4" />
                    Cancel
                  </Button>
                  <Button onClick={handleSave} disabled={isSaving} className="rounded-xl">
                    {isSaving ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Save
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="mt-5 border-t border-border">
            <div className="flex overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {[
                ["rooms", "All"],
                ["jobs", "Jobs"],
                ["friends", "Friends"],
                ["shares", "Activity"],
                ["about", "About"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setTab(value as ActivityTab)}
                  className={`relative min-w-fit px-5 py-4 text-sm font-black transition sm:px-7 ${tab === value ? "text-primary" : "text-foreground"}`}
                >
                  {label}
                  {tab === value && (
                    <span className="absolute inset-x-3 bottom-0 h-[3px] rounded-full bg-primary" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-4">
          <Card className="rounded-2xl border-0 shadow-sm">
            <CardContent className="p-4 sm:p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-black">Personal details</h2>
                <button
                  type="button"
                  onClick={handleEdit}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-primary hover:bg-primary/10"
                  aria-label="Edit personal details"
                >
                  <Edit3 className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4 text-[15px]">
                {profile.user.location && (
                  <div className="flex items-center gap-3">
                    <MapPin className="h-6 w-6 shrink-0" />
                    <span className="font-semibold">{profile.user.location}</span>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <Home className="h-6 w-6 shrink-0" />
                  <span className="font-semibold">{profile.rooms.length} room listings</span>
                </div>
                <div className="flex items-center gap-3">
                  <BriefcaseBusiness className="h-6 w-6 shrink-0" />
                  <span className="font-semibold">{profile.jobs.length} job posts</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-0 shadow-sm">
            <CardContent className="p-4 sm:p-5">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-xl font-black">All posts</h2>
                <button
                  type="button"
                  onClick={() => router.push("/feed")}
                  className="text-sm font-bold text-primary"
                >
                  View feed
                </button>
              </div>

              <button
                type="button"
                onClick={() => router.push("/feed")}
                className="flex w-full items-center gap-3 rounded-2xl border border-border bg-background p-3 text-left transition hover:bg-muted"
              >
                <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full bg-primary">
                  {profilePhoto && !profilePhotoFailed ? (
                    <img src={profilePhoto} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm font-black text-primary-foreground">
                      {initials}
                    </div>
                  )}
                </div>
                <span className="flex-1 text-[15px] font-semibold text-muted-foreground">
                  What's on your mind?
                </span>
                <Camera className="h-5 w-5 text-primary" />
              </button>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <Button variant="secondary" className="rounded-xl font-bold" onClick={() => router.push("/feed")}>
                  <Camera className="mr-2 h-4 w-4" />
                  Photo
                </Button>
                <Button variant="secondary" className="rounded-xl font-bold" onClick={() => router.push("/feed")}>
                  <Share2 className="mr-2 h-4 w-4" />
                  Post
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="h-fit rounded-2xl border-0 shadow-sm">
          <CardContent className="p-4 sm:p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-black">Friends</h2>
              <button
                type="button"
                onClick={() => setTab("friends")}
                className="text-sm font-bold text-primary"
              >
                See all
              </button>
            </div>

            {friends.length === 0 ? (
              <p className="text-sm text-muted-foreground">No friends yet.</p>
            ) : (
              <div className="grid grid-cols-4 gap-3 lg:grid-cols-3">
                {friends.slice(0, 6).map((friend: any) => {
                  const photo = profileMediaUrl(friend.profilePhotoUrl);
                  return (
                    <button
                      key={friend.id}
                      type="button"
                      onClick={() => router.push(`/profile/${friend.id}`)}
                      className="min-w-0 text-left"
                    >
                      <div className="aspect-square overflow-hidden rounded-full bg-muted">
                        {photo ? (
                          <img src={photo} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <Users className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <p className="mt-1 truncate text-center text-xs font-bold">{friend.name}</p>
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <Card className="overflow-hidden rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-yellow-50 shadow-sm">
        <CardContent className="p-5 sm:p-6">
          <div className="mb-5">
            <div className="flex items-center gap-2"><Crown className="h-5 w-5 text-amber-700" /><span className="text-xs font-black uppercase tracking-[0.18em] text-amber-700">Earn with RoomKhoj</span></div>
            <h2 className="mt-1 text-xl font-black">Account Monetize</h2>
            <p className="mt-1 text-sm text-muted-foreground">पहिला plan हेर्नुहोस्। Free बाट सुरु गर्न सकिन्छ; paid Account Monetize गर्न identity verification आवश्यक हुन्छ।</p>
          </div>

          {!monetization?.isMonetized && !kycLoading && (
            <div className="mb-5 rounded-2xl border border-border bg-background p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-bold">Identity Verification</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Full name, phone, address र government identity document verification आवश्यक छ।
                  </p>
                  <p className="mt-2 text-xs font-semibold">
                    Status: {String(kyc?.status || "NOT_SUBMITTED").replaceAll("_", " ")}
                  </p>
                  {kyc?.adminRemarks && (
                    <p className="mt-1 text-xs text-red-600">{kyc.adminRemarks}</p>
                  )}
                </div>
                {kyc?.status !== "APPROVED" && (
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-full"
                    onClick={() => setShowKycForm((v) => !v)}
                  >
                    {kyc?.status === "PENDING" ? "Update details" : "Verify identity"}
                  </Button>
                )}
              </div>

              {showKycForm && (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <Input
                    placeholder="Full legal name"
                    value={kycForm.fullName}
                    onChange={(e) => setKycForm((p) => ({ ...p, fullName: e.target.value }))}
                  />
                  <Input
                    placeholder="Phone number"
                    value={kycForm.phoneNumber}
                    onChange={(e) => setKycForm((p) => ({ ...p, phoneNumber: e.target.value }))}
                  />
                  <Input
                    placeholder="Permanent/current address"
                    value={kycForm.address}
                    onChange={(e) => setKycForm((p) => ({ ...p, address: e.target.value }))}
                  />
                  <select
                    value={kycForm.documentType}
                    onChange={(e) => setKycForm((p) => ({ ...p, documentType: e.target.value }))}
                    className="h-10 rounded-md border bg-background px-3 text-sm"
                  >
                    <option value="CITIZENSHIP">Citizenship</option>
                    <option value="PASSPORT">Passport</option>
                    <option value="DRIVING_LICENSE">Driving License</option>
                    <option value="NATIONAL_ID">National ID</option>
                  </select>
                  <Input
                    placeholder="Document number"
                    value={kycForm.documentNumber}
                    onChange={(e) => setKycForm((p) => ({ ...p, documentNumber: e.target.value }))}
                  />
                  <Input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    onChange={(e) => setKycDocument(e.target.files?.[0] || null)}
                  />
                  <div className="sm:col-span-2">
                    <Button
                      type="button"
                      onClick={() => void submitMonetizationKyc()}
                      disabled={kycSubmitting}
                      className="rounded-full"
                    >
                      {kycSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Submit identity for review
                    </Button>
                    <p className="mt-2 text-[11px] text-muted-foreground">
                      JPG, PNG, WEBP वा PDF · maximum 5 MB. Identity documents public profile मा देखाइँदैनन्।
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

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
                    "12 वटा active room listings",
                    "30 days plan validity",
                    "Rs. 6,000 सम्म earning",
                    "Chat बाट payment request & escrow",
                    "Escrow release request",
                    "0% RoomKhoj platform fee",
                    "Monetized profile badge",
                    "Wallet withdrawal eligibility",
                    "Customer support: 10 AM–5 PM",
                    "Basic marketing guide",
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
                    <div className="mt-3 rounded-full border px-3 py-2 text-center text-xs font-semibold text-muted-foreground">
                      Admin controlled
                    </div>
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

      {showMonetizationConfirm && selectedMonetizationPlan && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md">
            <CardContent className="p-6">
              <h3 className="text-xl font-black">Confirm Account Monetize</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {selectedMonetizationPlan.name} · Rs. {Number(selectedMonetizationPlan.price).toLocaleString()} · 30 days
              </p>
              <div className="mt-4 rounded-xl bg-muted p-3 text-sm">
                Wallet balance: <b>Rs. {walletBalance.toLocaleString()}</b>
              </div>
              <div className="mt-5 flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setShowMonetizationConfirm(false)}>Cancel</Button>
                <Button className="flex-1" disabled={monetizationActivating} onClick={() => void activateMonetization()}>
                  {walletBalance >= Number(selectedMonetizationPlan.price) ? "Confirm & Pay" : "Load Balance"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <TopUpRequestDialog
        open={showMonetizationTopup}
        onOpenChange={setShowMonetizationTopup}
        settings={topupSettings}
        onSuccess={async () => {
          const balance = await walletService.getBalance();
          setWalletBalance(Number(balance?.balance || 0));
          setShowMonetizationTopup(false);
          setShowMonetizationConfirm(true);
        }}
      />
      {showProfileViewers && (
        <div
          className="fixed inset-0 z-[120] flex items-end justify-center bg-black/35 p-3 backdrop-blur-[2px] sm:items-center"
          onClick={() => setShowProfileViewers(false)}
        >
          <div
            className="max-h-[78dvh] w-full max-w-md overflow-hidden rounded-[28px] bg-background shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div>
                <h2 className="text-xl font-black">Profile views</h2>
                <p className="text-xs text-muted-foreground">
                  {profileViews.totalViews} views · {profileViews.uniqueViewers} people
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowProfileViewers(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-muted"
                aria-label="Close profile viewers"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[62dvh] overflow-y-auto p-2">
              {profileViews.viewers.length === 0 ? (
                <div className="px-5 py-12 text-center text-sm text-muted-foreground">
                  अहिलेसम्म logged-in user बाट profile view आएको छैन।
                </div>
              ) : (
                profileViews.viewers.map((viewer) => {
                  const viewerPhoto = profileMediaUrl(viewer.profilePhotoUrl);
                  return (
                    <button
                      key={viewer.id}
                      type="button"
                      onClick={() => {
                        setShowProfileViewers(false);
                        router.push(`/profile/${viewer.id}`);
                      }}
                      className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition hover:bg-muted"
                    >
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted">
                        {viewerPhoto ? (
                          <img
                            src={viewerPhoto}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <UserRound className="h-6 w-6 text-muted-foreground" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-black">{viewer.name}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          Viewed {profileViewAgo(viewer.lastViewedAt)}
                          {Number(viewer.viewCount || 0) > 1
                            ? ` · ${viewer.viewCount} times`
                            : ""}
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}