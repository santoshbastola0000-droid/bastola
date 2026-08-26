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

import { privateApi } from "@/http/api/privateApi";
import { jobPostingService } from "@/http/services/job-posting.service";
import { aiProfileService } from "@/http/services/ai-profile.service";
import {
  profileService,
  type PublicProfile,
} from "@/http/services/profile.service";
import { profileMediaUrl } from "@/lib/profile-media";
import { useUserStore } from "@/stores/user-store";

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

  const loadAiProfile =
    async () => {
      try {
        setAiLoading(true);

        const data =
          await aiProfileService
            .getMine();

        setAiProfile(data);

        setAiForm({
          roomSearch: {
            ...(
              data?.roomSearch ||
              {}
            ),
          },

          jobSearch: {
            ...(
              data?.jobSearch ||
              {}
            ),
          },
        });
      } catch (error) {
        console.error(
          "AI profile load failed:",
          error,
        );
      } finally {
        setAiLoading(false);
      }
    };

  const updateAiField = (
    section:
      | "roomSearch"
      | "jobSearch",
    field: string,
    value: string,
  ) => {
    setAiForm(
      (prev: any) => ({
        ...prev,

        [section]: {
          ...(
            prev?.[section] ||
            {}
          ),

          [field]:
            value,
        },
      }),
    );
  };

  const saveAiProfile =
    async () => {
      try {
        setAiSaving(true);

        const updated =
          await aiProfileService
            .updateMine({
              roomSearch:
                aiForm.roomSearch,

              jobSearch:
                aiForm.jobSearch,
            });

        setAiProfile(updated);

        setAiForm({
          roomSearch: {
            ...(
              updated
                ?.roomSearch ||
              {}
            ),
          },

          jobSearch: {
            ...(
              updated
                ?.jobSearch ||
              {}
            ),
          },
        });

        setAiEditing(false);

        toast.success(
          "AI information saved",
        );
      } catch (error: any) {
        toast.error(
          error?.response?.data
            ?.message ||
            "AI information save failed",
        );
      } finally {
        setAiSaving(false);
      }
    };

  const deleteAiField =
    async (
      field: string,
    ) => {
      try {
        setDeletingField(
          field,
        );

        const updated =
          await aiProfileService
            .deleteField(
              field,
            );

        setAiProfile(updated);

        setAiForm({
          roomSearch: {
            ...(
              updated
                ?.roomSearch ||
              {}
            ),
          },

          jobSearch: {
            ...(
              updated
                ?.jobSearch ||
              {}
            ),
          },
        });

        toast.success(
          "Saved AI detail deleted",
        );
      } catch (error: any) {
        toast.error(
          error?.response?.data
            ?.message ||
            "Could not delete detail",
        );
      } finally {
        setDeletingField(
          null,
        );
      }
    };

  const clearAiProfile =
    async () => {
      const ok =
        window.confirm(
          "Delete all information saved by RoomKhoj AI?",
        );

      if (!ok) return;

      try {
        setClearingAi(true);

        await aiProfileService
          .clearMine();

        setAiProfile(null);

        setAiForm({
          roomSearch: {},
          jobSearch: {},
        });

        toast.success(
          "AI information cleared",
        );
      } catch (error: any) {
        toast.error(
          error?.response?.data
            ?.message ||
            "Could not clear AI information",
        );
      } finally {
        setClearingAi(false);
      }
    };

  /*
   * ==========================
   * MAIN PROFILE
   * ==========================
   */

  const resolveUserId =
    async () => {
      const storeId =
        String(
          (user as any)?.id ||
          "",
        );

      if (storeId) {
        return storeId;
      }

      const response =
        await privateApi.get(
          "/user/active",
        );

      return String(
        response.data?.data?.id ||
        "",
      );
    };

  const loadProfile =
    async () => {
      try {
        setProfileLoading(
          true,
        );

        const userId =
          currentUserId ||
          await resolveUserId();

        if (!userId) {
          throw new Error(
            "User ID unavailable",
          );
        }

        if (
          !currentUserId
        ) {
          setCurrentUserId(
            userId,
          );
        }

        const data =
          await profileService
            .getProfile(
              userId,
            );

        setProfile(data);

        setForm({
          name:
            data.user.name ||
            "",

          bio:
            data.user.bio ||
            "",

          location:
            data.user
              .location ||
            "",

          website:
            data.user
              .website ||
            "",
        });

        try {
          const list =
            await profileService
              .getFriends(
                userId,
              );

          setFriends(
            Array.isArray(list)
              ? list
              : [],
          );
        } catch {
          setFriends([]);
        }

        try {
          const shareResponse =
            await privateApi.get(
              "/job-posting/share-summary",
            );

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
          setShareSummary({
            totalUniqueOpens: 0,
            items: [],
          });
        }
      } catch (error: any) {
        console.error(
          "Profile load failed:",
          error,
        );

        toast.error(
          "Profile load हुन सकेन",
        );
      } finally {
        setProfileLoading(
          false,
        );
      }
    };

  useEffect(() => {
    loadProfile();
    loadAiProfile();
  }, []);

  const handleEdit =
    () => {
      if (!profile) {
        return;
      }

      setForm({
        name:
          profile.user.name ||
          "",

        bio:
          profile.user.bio ||
          "",

        location:
          profile.user
            .location ||
          "",

        website:
          profile.user
            .website ||
          "",
      });

      setIsEditing(true);
    };

  const handleCancel =
    () => {
      setIsEditing(false);

      if (profile) {
        setForm({
          name:
            profile.user.name ||
            "",

          bio:
            profile.user.bio ||
            "",

          location:
            profile.user
              .location ||
            "",

          website:
            profile.user
              .website ||
            "",
        });
      }
    };

  const handleSave =
    async () => {
      if (
        !form.name.trim()
      ) {
        toast.error(
          "Name खाली राख्न मिल्दैन",
        );

        return;
      }

      try {
        setIsSaving(true);

        const updated =
          await profileService
            .updateProfile({
              name:
                form.name.trim(),

              bio:
                form.bio.trim(),

              location:
                form.location
                  .trim(),

              website:
                form.website
                  .trim(),
            });

        if (
          updated?.user
        ) {
          setProfile(
            updated,
          );

          updateUser({
            name:
              updated.user
                .name,
          } as any);

          setForm({
            name:
              updated.user
                .name ||
              "",

            bio:
              updated.user
                .bio ||
              "",

            location:
              updated.user
                .location ||
              "",

            website:
              updated.user
                .website ||
              "",
          });
        } else {
          await loadProfile();
        }

        setIsEditing(false);

        toast.success(
          "Profile saved successfully",
        );
      } catch (error: any) {
        toast.error(
          error?.response?.data
            ?.message ||
            "Profile save हुन सकेन",
        );
      } finally {
        setIsSaving(false);
      }
    };

  const uploadProfilePhoto =
    async (
      event:
        ChangeEvent<HTMLInputElement>,
    ) => {
      const file =
        event.target
          .files?.[0];

      if (!file) return;

      if (
        !file.type
          .startsWith(
            "image/",
          )
      ) {
        toast.error(
          "Image मात्र select गर्नुहोस्",
        );

        return;
      }

      try {
        setUploadingProfile(
          true,
        );

        await profileService
          .uploadProfilePhoto(
            file,
          );

        await loadProfile();

        toast.success(
          "Profile photo updated",
        );
      } catch (error: any) {
        toast.error(
          error?.response?.data
            ?.message ||
            "Profile photo upload failed",
        );
      } finally {
        setUploadingProfile(
          false,
        );

        event.target.value =
          "";
      }
    };

  const uploadCoverPhoto =
    async (
      event:
        ChangeEvent<HTMLInputElement>,
    ) => {
      const file =
        event.target
          .files?.[0];

      if (!file) return;

      if (
        !file.type
          .startsWith(
            "image/",
          )
      ) {
        toast.error(
          "Image मात्र select गर्नुहोस्",
        );

        return;
      }

      try {
        setUploadingCover(
          true,
        );

        await profileService
          .uploadCoverPhoto(
            file,
          );

        await loadProfile();

        toast.success(
          "Cover photo updated",
        );
      } catch (error: any) {
        toast.error(
          error?.response?.data
            ?.message ||
            "Cover upload failed",
        );
      } finally {
        setUploadingCover(
          false,
        );

        event.target.value =
          "";
      }
    };

  const renderAiField = (
    section:
      | "roomSearch"
      | "jobSearch",
    field: string,
    label: string,
  ) => {
    const current =
      aiForm?.[section]
        ?.[field] ??
      aiProfile?.[section]
        ?.[field] ??
      "";

    if (
      !aiEditing &&
      (
        current === "" ||
        current === null ||
        current ===
          undefined
      )
    ) {
      return null;
    }

    return (
      <div className="rounded-xl border bg-muted/20 p-3">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <p className="mb-1 text-[11px] text-muted-foreground">
              {label}
            </p>

            {aiEditing ? (
              <Input
                value={String(
                  current ??
                  "",
                )}
                onChange={(e) =>
                  updateAiField(
                    section,
                    field,
                    e.target
                      .value,
                  )
                }
                className="h-8 rounded-lg text-xs"
              />
            ) : (
              <p className="break-words text-sm font-medium">
                {typeof current ===
                "boolean"
                  ? current
                    ? "Yes"
                    : "No"
                  : String(
                      current,
                    )}
              </p>
            )}
          </div>

          {!aiEditing &&
            current !== "" && (
              <button
                type="button"
                onClick={() =>
                  deleteAiField(
                    field,
                  )
                }
                disabled={
                  deletingField ===
                  field
                }
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-red-50 hover:text-red-600"
              >
                {deletingField ===
                field ? (
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
    return (
      <div className="p-10 text-center">
        Profile load हुन सकेन।
      </div>
    );
  }

  const profilePhoto =
    profileMediaUrl(
      profile.user
        .profilePhotoUrl,
    );

  const coverPhoto =
    profileMediaUrl(
      profile.user
        .coverPhotoUrl,
    );

  const initials =
    profile.user.name
      ?.split(" ")
      .filter(Boolean)
      .map(
        (part) =>
          part[0],
      )
      .join("")
      .slice(0, 2)
      .toUpperCase() ||
    "U";

  const websiteHref =
    profile.user.website
      ? /^https?:\/\//i.test(
          profile.user
            .website,
        )
        ? profile.user
            .website
        : `https://${
            profile.user
              .website
          }`
      : "";

  return (
    <main className="mx-auto max-w-7xl space-y-5 pb-24">
      {/* COVER + PROFILE */}
      <Card className="overflow-hidden rounded-3xl border-0 shadow-sm">
        <div className="relative h-44 bg-gradient-to-br from-red-500 via-rose-500 to-pink-600 sm:h-64">
          {coverPhoto && (
            <img
              src={
                coverPhoto
              }
              alt=""
              className="h-full w-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          )}

          <input
            ref={
              coverInputRef
            }
            type="file"
            accept="image/*"
            className="hidden"
            onChange={
              uploadCoverPhoto
            }
          />

          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="absolute bottom-3 right-3 gap-2 rounded-full shadow"
            disabled={
              uploadingCover
            }
            onClick={() =>
              coverInputRef
                .current
                ?.click()
            }
          >
            {uploadingCover ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Camera className="h-4 w-4" />
            )}

            Change Cover
          </Button>
        </div>

        <CardContent className="px-5 pb-6 sm:px-8">
          <div className="-mt-12 flex flex-col gap-4 sm:-mt-16 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-4">
              <div className="relative">
                <div className="h-28 w-28 overflow-hidden rounded-full border-4 border-background bg-gradient-to-br from-red-500 to-rose-600 shadow-xl sm:h-36 sm:w-36">
                  {profilePhoto ? (
                    <img
                      src={
                        profilePhoto
                      }
                      alt=""
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-white">
                      {initials}
                    </div>
                  )}
                </div>

                {profile.user
                  .isVerified && (
                  <div className="absolute bottom-1 right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-background bg-blue-500">
                    <BadgeCheck className="h-4 w-4 text-white" />
                  </div>
                )}

                <input
                  ref={
                    profileInputRef
                  }
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={
                    uploadProfilePhoto
                  }
                />

                <button
                  type="button"
                  disabled={
                    uploadingProfile
                  }
                  onClick={() =>
                    profileInputRef
                      .current
                      ?.click()
                  }
                  className="absolute bottom-1 left-1 flex h-9 w-9 items-center justify-center rounded-full border-2 border-background bg-background shadow"
                >
                  {uploadingProfile ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Camera className="h-4 w-4" />
                  )}
                </button>
              </div>

              <div className="mb-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="truncate text-2xl font-bold sm:text-3xl">
                    {
                      profile.user
                        .name
                    }
                  </h1>
                </div>

                <p className="text-sm text-muted-foreground">
                  {friends.length}{" "}
                  {friends.length ===
                  1
                    ? "friend"
                    : "friends"}
                  {" · "}
                  {
                    profile.rooms
                      .length
                  }{" "}
                  rooms
                  {" · "}
                  {
                    profile.jobs
                      .length
                  }{" "}
                  jobs
                </p>
              </div>
            </div>

            <div className="flex gap-2 sm:pb-1">
              {isEditing ? (
                <>
                  <Button
                    variant="outline"
                    className="gap-2 rounded-full"
                    onClick={
                      handleCancel
                    }
                  >
                    <X className="h-4 w-4" />
                    Cancel
                  </Button>

                  <Button
                    className="gap-2 rounded-full"
                    onClick={
                      handleSave
                    }
                    disabled={
                      isSaving
                    }
                  >
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Save
                  </Button>
                </>
              ) : (
                <Button
                  variant="outline"
                  className="gap-2 rounded-full"
                  onClick={
                    handleEdit
                  }
                >
                  <Edit3 className="h-4 w-4" />
                  Edit Profile
                </Button>
              )}
            </div>
          </div>

          {isEditing ? (
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium">
                  Name
                </label>
                <Input
                  value={
                    form.name
                  }
                  onChange={(e) =>
                    setForm(
                      (prev) => ({
                        ...prev,
                        name:
                          e.target
                            .value,
                      }),
                    )
                  }
                  placeholder="Your name"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium">
                  Location
                </label>
                <Input
                  value={
                    form.location
                  }
                  onChange={(e) =>
                    setForm(
                      (prev) => ({
                        ...prev,
                        location:
                          e.target
                            .value,
                      }),
                    )
                  }
                  placeholder="Pokhara, Nepal"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium">
                  Bio
                </label>
                <textarea
                  value={
                    form.bio
                  }
                  onChange={(e) =>
                    setForm(
                      (prev) => ({
                        ...prev,
                        bio:
                          e.target
                            .value,
                      }),
                    )
                  }
                  maxLength={300}
                  placeholder="Tell people about yourself..."
                  className="min-h-24 w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                />

                <p className="mt-1 text-right text-[11px] text-muted-foreground">
                  {
                    form.bio
                      .length
                  }
                  /300
                </p>
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium">
                  Website
                </label>
                <Input
                  value={
                    form.website
                  }
                  onChange={(e) =>
                    setForm(
                      (prev) => ({
                        ...prev,
                        website:
                          e.target
                            .value,
                      }),
                    )
                  }
                  placeholder="https://example.com"
                />
              </div>
            </div>
          ) : (
            <div className="mt-5">
              {profile.user.bio && (
                <p className="max-w-2xl whitespace-pre-wrap text-sm sm:text-base">
                  {
                    profile.user
                      .bio
                  }
                </p>
              )}

              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
                {profile.user
                  .location && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" />
                    {
                      profile.user
                        .location
                    }
                  </span>
                )}

                {profile.user
                  .website && (
                  <a
                    href={
                      websiteHref
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 font-medium text-primary hover:underline"
                  >
                    <Globe2 className="h-4 w-4" />
                    {
                      profile.user
                        .website
                    }
                  </a>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* TWO COLUMN PROFILE */}
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
        {/* LEFT */}
        <section className="space-y-5">
          <Card className="rounded-3xl border-0 shadow-sm">
            <CardContent className="p-5">
              <h2 className="mb-4 text-lg font-bold">
                About
              </h2>

              <div className="space-y-4 text-sm">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />

                  <div>
                    <p className="text-xs text-muted-foreground">
                      Email
                    </p>

                    <p className="font-medium">
                      {
                        (user as any)
                          ?.email ||
                        "Not available"
                      }
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />

                  <div>
                    <p className="text-xs text-muted-foreground">
                      Phone
                    </p>

                    <p className="font-medium">
                      {
                        (user as any)
                          ?.phone ||
                        (user as any)
                          ?.phoneNumber ||
                        "Not available"
                      }
                    </p>
                  </div>
                </div>

                {profile.user.location && (
                  <>
                    <Separator />

                    <div className="flex items-center gap-3">
                      <MapPin className="h-4 w-4 text-muted-foreground" />

                      <div>
                        <p className="text-xs text-muted-foreground">
                          Location
                        </p>

                        <p className="font-medium">
                          {
                            profile.user
                              .location
                          }
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* ACTIVITY TABS */}
          <Card className="overflow-hidden rounded-3xl border-0 shadow-sm">
            <div className="flex overflow-x-auto border-b px-2">
              {[
                [
                  "rooms",
                  "Rooms",
                ],
                [
                  "jobs",
                  "Jobs",
                ],
                [
                  "friends",
                  "Friends",
                ],
                [
                  "shares",
                  "Interested Vacancies",
                ],
                [
                  "about",
                  "About",
                ],
              ].map(
                ([
                  value,
                  label,
                ]) => (
                  <button
                    key={
                      value
                    }
                    type="button"
                    onClick={() =>
                      setTab(
                        value as ActivityTab,
                      )
                    }
                    className={`relative min-w-fit px-5 py-4 text-sm font-semibold ${
                      tab ===
                      value
                        ? "text-primary"
                        : "text-muted-foreground"
                    }`}
                  >
                    {label}

                    {tab ===
                      value && (
                      <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-primary" />
                    )}
                  </button>
                ),
              )}
            </div>

            <CardContent className="p-5">
              {tab ===
                "rooms" && (
                <div className="space-y-3">
                  {profile.rooms
                    .length ===
                  0 ? (
                    <div className="py-10 text-center text-sm text-muted-foreground">
                      No room listings yet.
                    </div>
                  ) : (
                    profile.rooms
                      .map(
                        (
                          room: any,
                        ) => (
                          <button
                            key={
                              room.id
                            }
                            type="button"
                            onClick={() =>
                              router.push(
                                `/property/${room.id}`,
                              )
                            }
                            className="w-full rounded-2xl border p-4 text-left transition hover:bg-muted/40"
                          >
                            <div className="flex items-start gap-3">
                              <Home className="mt-1 h-5 w-5 shrink-0 text-red-600" />

                              <div className="min-w-0">
                                <h3 className="font-semibold">
                                  {room.title ||
                                    room.roomType ||
                                    "Room"}
                                </h3>

                                <p className="mt-1 text-sm text-muted-foreground">
                                  {room.address ||
                                    room.location ||
                                    ""}
                                </p>

                                {room.price !=
                                  null && (
                                  <p className="mt-2 font-bold">
                                    Rs.{" "}
                                    {Number(
                                      room.price,
                                    ).toLocaleString()}
                                  </p>
                                )}
                              </div>
                            </div>
                          </button>
                        ),
                      )
                  )}

                  <Button
                    variant="outline"
                    className="w-full rounded-xl"
                    onClick={() =>
                      router.push(
                        "/user/dashboard/rooms/create",
                      )
                    }
                  >
                    + Add Room
                  </Button>
                </div>
              )}

              {tab ===
                "jobs" && (
                <div className="space-y-3">
                  {profile.jobs
                    .length ===
                  0 ? (
                    <div className="py-10 text-center text-sm text-muted-foreground">
                      No job posts yet.
                    </div>
                  ) : (
                    profile.jobs
                      .map(
                        (
                          job: any,
                        ) => (
                          <div
                            key={
                              job.id
                            }
                            className="rounded-2xl border p-4"
                          >
                            <div className="flex items-start gap-3">
                              <BriefcaseBusiness className="mt-1 h-5 w-5 shrink-0 text-violet-600" />

                              <div>
                                <h3 className="font-semibold">
                                  {
                                    job.jobTitle
                                  }
                                </h3>

                                <p className="mt-1 text-sm text-muted-foreground">
                                  {job.companyName ||
                                    "Company"}
                                  {" · "}
                                  {job.location ||
                                    ""}
                                </p>

                                {job.salary !=
                                  null && (
                                  <p className="mt-2 font-bold">
                                    Rs.{" "}
                                    {Number(
                                      job.salary,
                                    ).toLocaleString()}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ),
                      )
                  )}
                </div>
              )}

              {tab ===
                "friends" && (
                <div className="grid gap-3 sm:grid-cols-2">
                  {friends.length ===
                  0 ? (
                    <div className="col-span-full py-10 text-center text-sm text-muted-foreground">
                      No friends yet.
                    </div>
                  ) : (
                    friends.map(
                      (
                        friend,
                      ) => (
                        <button
                          key={
                            friend.id
                          }
                          onClick={() =>
                            router.push(
                              `/profile/${friend.id}`,
                            )
                          }
                          className="flex items-center gap-3 rounded-xl border p-3 text-left hover:bg-muted/40"
                        >
                          <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-muted">
                            {friend.profilePhotoUrl ? (
                              <img
                                src={
                                  profileMediaUrl(
                                    friend.profilePhotoUrl,
                                  ) ||
                                  ""
                                }
                                alt={
                                  friend.name
                                }
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <Users className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>

                          <span className="truncate font-semibold">
                            {
                              friend.name
                            }
                          </span>
                        </button>
                      ),
                    )
                  )}
                </div>
              )}

              {tab ===
                "shares" && (
                <div className="space-y-3">
                  <div className="rounded-2xl bg-emerald-50 p-4">
                    <p className="text-sm text-emerald-700">
                      Interested vacancy opens
                    </p>
                    <p className="mt-1 text-3xl font-bold text-emerald-900">
                      {shareSummary.totalUniqueOpens}
                    </p>
                  </div>

                  {shareSummary.items.length === 0 ? (
                    <div className="py-10 text-center text-sm text-muted-foreground">
                      तपाईंले अझै कुनै vacancy share गर्नुभएको छैन।
                    </div>
                  ) : (
                    shareSummary.items.map((item) => (
                      <div
                        key={item.jobPostingId}
                        className="rounded-2xl border p-4"
                      >
                        <div className="flex items-start gap-3">
                          <Share2 className="mt-1 h-5 w-5 shrink-0 text-emerald-600" />
                          <div className="min-w-0 flex-1">
                            <h3 className="font-semibold">
                              {item.jobTitle}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {item.companyName || "Company"}
                            </p>
                            <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                              <div
                                className="h-full bg-emerald-600"
                                style={{
                                  width: `${Math.min(
                                    (item.shareCount /
                                      item.requiredShares) *
                                      100,
                                    100,
                                  )}%`,
                                }}
                              />
                            </div>
                            <div className="mt-2 flex justify-between text-sm font-medium">
                              <span>
                                {item.shareCount}/{item.requiredShares} people opened
                              </span>
                              <span>
                                {item.isUnlocked
                                  ? "Unlocked"
                                  : `${item.requiredShares - item.shareCount} remaining`}
                              </span>
                            </div>
                            {item.isUnlocked && item.contactPhone && (
                              <a
                                href={`tel:${item.contactPhone}`}
                                className="mt-3 flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 font-semibold text-emerald-800"
                              >
                                <Phone className="h-4 w-4" />
                                Employer: {item.contactPhone}
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {tab ===
                "about" && (
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <UserRound className="mt-0.5 h-5 w-5 text-muted-foreground" />

                    <p className="whitespace-pre-wrap">
                      {profile.user
                        .bio ||
                        "No bio added yet."}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* RIGHT AI SIDE */}
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <Card className="overflow-hidden rounded-3xl border-0 shadow-sm">
            <div className="border-b bg-gradient-to-r from-violet-50 via-fuchsia-50 to-rose-50 p-4 dark:from-violet-950/30 dark:via-fuchsia-950/20 dark:to-rose-950/30">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600">
                    <Bot className="h-5 w-5 text-white" />
                  </div>

                  <div className="min-w-0">
                    <h2 className="font-bold">
                      RoomKhoj AI
                    </h2>

                    <p className="truncate text-xs text-muted-foreground">
                      Saved information
                    </p>
                  </div>
                </div>

                {!aiLoading &&
                  !aiEditing && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full"
                    onClick={() =>
                      setAiEditing(
                        true,
                      )
                    }
                  >
                    <Edit3 className="mr-1 h-3.5 w-3.5" />
                    Edit
                  </Button>
                )}
              </div>

              {aiEditing && (
                <div className="mt-3 flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full"
                    onClick={() => {
                      setAiForm({
                        roomSearch: {
                          ...(
                            aiProfile
                              ?.roomSearch ||
                            {}
                          ),
                        },

                        jobSearch: {
                          ...(
                            aiProfile
                              ?.jobSearch ||
                            {}
                          ),
                        },
                      });

                      setAiEditing(
                        false,
                      );
                    }}
                  >
                    Cancel
                  </Button>

                  <Button
                    size="sm"
                    className="rounded-full"
                    disabled={
                      aiSaving
                    }
                    onClick={
                      saveAiProfile
                    }
                  >
                    {aiSaving ? (
                      <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-1 h-4 w-4" />
                    )}
                    Save
                  </Button>
                </div>
              )}
            </div>

            <CardContent className="p-4">
              {aiLoading ? (
                <div className="flex min-h-48 items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="space-y-5">
                  <section>
                    <div className="mb-3 flex items-center gap-2">
                      <Home className="h-4 w-4 text-red-600" />
                      <h3 className="text-sm font-bold">
                        Room Preferences
                      </h3>
                    </div>

                    <div className="space-y-2">
                      {renderAiField(
                        "roomSearch",
                        "city",
                        "City",
                      )}

                      {renderAiField(
                        "roomSearch",
                        "exactLocation",
                        "Location",
                      )}

                      {renderAiField(
                        "roomSearch",
                        "budget",
                        "Budget",
                      )}

                      {renderAiField(
                        "roomSearch",
                        "roomType",
                        "Room Type",
                      )}

                      {renderAiField(
                        "roomSearch",
                        "tenantType",
                        "Tenant Type",
                      )}

                      {renderAiField(
                        "roomSearch",
                        "numberOfPeople",
                        "People",
                      )}

                      {renderAiField(
                        "roomSearch",
                        "moveInDate",
                        "Move-in Date",
                      )}
                    </div>
                  </section>

                  <Separator />

                  <section>
                    <div className="mb-3 flex items-center gap-2">
                      <BriefcaseBusiness className="h-4 w-4 text-violet-600" />
                      <h3 className="text-sm font-bold">
                        Job Preferences
                      </h3>
                    </div>

                    <div className="space-y-2">
                      {renderAiField(
                        "jobSearch",
                        "jobTitle",
                        "Job Title",
                      )}

                      {renderAiField(
                        "jobSearch",
                        "jobType",
                        "Job Type",
                      )}

                      {renderAiField(
                        "jobSearch",
                        "location",
                        "Location",
                      )}

                      {renderAiField(
                        "jobSearch",
                        "experience",
                        "Experience",
                      )}

                      {renderAiField(
                        "jobSearch",
                        "education",
                        "Education",
                      )}

                      {renderAiField(
                        "jobSearch",
                        "expectedSalary",
                        "Expected Salary",
                      )}

                      {renderAiField(
                        "jobSearch",
                        "joiningAvailability",
                        "Availability",
                      )}
                    </div>
                  </section>

                  <div className="border-t pt-4">
                    <Button
                      variant="destructive"
                      size="sm"
                      className="w-full rounded-xl"
                      disabled={
                        clearingAi
                      }
                      onClick={
                        clearAiProfile
                      }
                    >
                      {clearingAi ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="mr-2 h-4 w-4" />
                      )}

                      Clear AI Information
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </main>
  );
}
