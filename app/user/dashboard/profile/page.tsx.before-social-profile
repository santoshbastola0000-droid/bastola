"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useUserStore } from "@/stores/user-store";
import { privateApi } from "@/http/api/privateApi";
import { toast } from "sonner";
import {
  User,
  Mail,
  Phone,
  Shield,
  Edit3,
  Save,
  X,
  Building2,
  BadgeCheck,
  Calendar,
  Bot,
  BriefcaseBusiness,
  Home,
  Trash2,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useRouter } from "next/navigation";
import { aiProfileService } from "@/http/services/ai-profile.service";

export default function ProfilePage() {
  const { user, updateUser } = useUserStore();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
  });


  const [aiProfile, setAiProfile] = useState<any>(null);
  const [aiForm, setAiForm] = useState<any>({
    roomSearch: {},
    jobSearch: {},
  });
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
      setAiForm({
        roomSearch: { ...(data?.roomSearch || {}) },
        jobSearch: { ...(data?.jobSearch || {}) },
      });
    } catch (err: any) {
      console.error("Failed to load AI profile:", err);
    } finally {
      setAiLoading(false);
    }
  };

  useEffect(() => {
    loadAiProfile();
  }, []);

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
      toast.success("AI details updated");
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || "AI details update failed",
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

      toast.success("Saved detail deleted");
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || "Could not delete detail",
      );
    } finally {
      setDeletingField(null);
    }
  };

  const clearAiProfile = async () => {
    const ok = window.confirm(
      "Delete all information saved by RoomKhoj AI? This cannot be undone.",
    );

    if (!ok) return;

    try {
      setClearingAi(true);
      await aiProfileService.clearMine();

      setAiProfile(null);
      setAiForm({
        roomSearch: {},
        jobSearch: {},
      });

      toast.success("AI saved details cleared");
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || "Could not clear AI details",
      );
    } finally {
      setClearingAi(false);
    }
  };

  const renderAiField = (
    section: "roomSearch" | "jobSearch",
    field: string,
    label: string,
  ) => {
    const current =
      aiForm?.[section]?.[field] ??
      aiProfile?.[section]?.[field] ??
      "";

    if (
      !aiEditing &&
      (current === "" || current === null || current === undefined)
    ) {
      return null;
    }

    return (
      <div className="rounded-2xl border bg-muted/20 p-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="mb-1 text-xs text-muted-foreground">
              {label}
            </p>

            {aiEditing ? (
              <Input
                value={String(current ?? "")}
                onChange={(e) =>
                  updateAiField(section, field, e.target.value)
                }
                className="h-9 rounded-xl"
                placeholder={`Enter ${label.toLowerCase()}`}
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

          {!aiEditing && (
            <button
              type="button"
              onClick={() => deleteAiField(field)}
              disabled={deletingField === field}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"
              title={`Delete ${label}`}
            >
              {deletingField === field ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
            </button>
          )}
        </div>
      </div>
    );
  };

  const initials = user?.name
    ? user.name
        .split(" ")
        .filter((n) => n.length > 0)
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : (user?.email?.slice(0, 2).toUpperCase() ?? "U");

  const handleEdit = () => {
    setForm({ name: user?.name || "", phone: user?.phone || "" });
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("Name cannot be empty");
      return;
    }
    setIsSaving(true);
    try {
      const response = await privateApi.patch("/user/profile", {
        name: form.name.trim(),
        phone: form.phone.trim(),
      });
      const updated = response.data?.data;
      updateUser({
        name: updated?.name ?? form.name.trim(),
        phone: updated?.phone ?? form.phone.trim(),
      });
      toast.success("Profile updated!", {
        description: "Your changes have been saved.",
      });
      setIsEditing(false);
    } catch (err: any) {
      toast.error("Failed to update profile", {
        description: err?.response?.data?.message || "Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const joinedDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
      })
    : null;

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Cover + Avatar */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative rounded-3xl overflow-hidden"
      >
        {/* Cover gradient */}
        <div className="h-40 bg-gradient-to-br from-red-500 via-rose-500 to-pink-600" />

        {/* Avatar overlapping cover */}
        <div className="px-6 pb-6 bg-white dark:bg-gray-900">
          <div className="flex items-end justify-between -mt-12 mb-4">
            <div className="relative">
              <div className="w-24 h-24 rounded-full ring-4 ring-white dark:ring-gray-900 bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-xl">
                <span className="text-3xl font-bold text-white">{initials}</span>
              </div>
              {user?.isVerified && (
                <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center ring-2 ring-white dark:ring-gray-900">
                  <BadgeCheck className="w-4 h-4 text-white" />
                </div>
              )}
            </div>

            {/* Edit / Save / Cancel buttons */}
            <div className="flex gap-2 mt-14">
              {isEditing ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancel}
                    className="rounded-full gap-1"
                  >
                    <X className="w-3.5 h-3.5" />
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={isSaving}
                    className="rounded-full gap-1 bg-red-600 hover:bg-red-700 text-white"
                  >
                    <Save className="w-3.5 h-3.5" />
                    {isSaving ? "Saving…" : "Save"}
                  </Button>
                </>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEdit}
                  className="rounded-full gap-1 border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Edit Profile
                </Button>
              )}
            </div>
          </div>

          {/* Name / role */}
          {isEditing ? (
            <div className="space-y-2 mb-3">
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Your name"
                className="text-xl font-bold h-10 rounded-xl"
              />
            </div>
          ) : (
            <div className="mb-1">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {user?.name || "Unknown User"}
              </h2>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Mail className="w-3.5 h-3.5" />
              {user?.email}
            </span>
            <Badge
              variant="outline"
              className="text-[11px] px-2 py-0 h-5 rounded-full"
            >
              {user?.role}
            </Badge>
            {user?.isVerified && (
              <Badge className="text-[11px] px-2 py-0 h-5 rounded-full bg-blue-100 text-blue-700 border-blue-200">
                Verified
              </Badge>
            )}
          </div>
        </div>
      </motion.div>

      {/* Info cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="rounded-3xl border-0 shadow-sm">
          <CardContent className="p-6 space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm uppercase tracking-wide text-muted-foreground">
              Contact Info
            </h3>

            <div className="space-y-3">
              {/* Email */}
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="text-sm font-medium truncate">{user?.email}</p>
                </div>
              </div>

              <Separator />

              {/* Phone */}
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-green-50 dark:bg-green-950 flex items-center justify-center flex-shrink-0">
                  <Phone className="w-4 h-4 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">Phone</p>
                  {isEditing ? (
                    <Input
                      value={form.phone}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, phone: e.target.value }))
                      }
                      placeholder="Phone number"
                      className="h-8 text-sm rounded-lg mt-0.5"
                    />
                  ) : (
                    <p className="text-sm font-medium">
                      {user?.phone || (
                        <span className="text-muted-foreground italic">
                          Not set
                        </span>
                      )}
                    </p>
                  )}
                </div>
              </div>

              <Separator />

              {/* Role */}
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950 flex items-center justify-center flex-shrink-0">
                  <Shield className="w-4 h-4 text-purple-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">Role</p>
                  <p className="text-sm font-medium">{user?.role}</p>
                </div>
              </div>

              {joinedDate && (
                <>
                  <Separator />
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-orange-50 dark:bg-orange-950 flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-4 h-4 text-orange-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground">
                        Member Since
                      </p>
                      <p className="text-sm font-medium">{joinedDate}</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick action */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="rounded-3xl border-0 shadow-sm bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/30">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-600 flex items-center justify-center shadow-md">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                  List a Room
                </p>
                <p className="text-xs text-muted-foreground">
                  Start earning by adding your property
                </p>
              </div>
            </div>
            <Button
              size="sm"
              className="rounded-full bg-red-600 hover:bg-red-700 text-white shadow"
              onClick={() => router.push("/user/dashboard/rooms/create")}
            >
              + Add Room
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* AI Saved Details */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="overflow-hidden rounded-3xl border-0 shadow-sm">
          <CardContent className="p-0">
            <div className="border-b bg-gradient-to-r from-violet-50 via-fuchsia-50 to-rose-50 p-5 dark:from-violet-950/30 dark:via-fuchsia-950/20 dark:to-rose-950/30">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 shadow-md">
                    <Bot className="h-5 w-5 text-white" />
                  </div>

                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-gray-100">
                      AI Saved Details
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Information RoomKhoj AI remembers to help you faster
                    </p>
                  </div>
                </div>

                {!aiLoading && (
                  <div className="flex gap-2">
                    {aiEditing ? (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-full"
                          onClick={() => {
                            setAiForm({
                              roomSearch: {
                                ...(aiProfile?.roomSearch || {}),
                              },
                              jobSearch: {
                                ...(aiProfile?.jobSearch || {}),
                              },
                            });
                            setAiEditing(false);
                          }}
                        >
                          Cancel
                        </Button>

                        <Button
                          size="sm"
                          className="rounded-full"
                          onClick={saveAiProfile}
                          disabled={aiSaving}
                        >
                          {aiSaving ? (
                            <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                          ) : (
                            <Save className="mr-1 h-4 w-4" />
                          )}
                          Save
                        </Button>
                      </>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-full"
                        onClick={() => setAiEditing(true)}
                      >
                        <Edit3 className="mr-1 h-4 w-4" />
                        Edit
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="p-5">
              {aiLoading ? (
                <div className="flex min-h-[120px] items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="space-y-6">
                  <section>
                    <div className="mb-3 flex items-center gap-2">
                      <Home className="h-4 w-4 text-red-600" />
                      <h4 className="text-sm font-semibold">
                        Room Preferences
                      </h4>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      {renderAiField("roomSearch", "city", "City")}
                      {renderAiField(
                        "roomSearch",
                        "exactLocation",
                        "Location",
                      )}
                      {renderAiField("roomSearch", "budget", "Budget")}
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
                        "Number of People",
                      )}
                      {renderAiField(
                        "roomSearch",
                        "moveInDate",
                        "Move-in Date",
                      )}
                      {renderAiField(
                        "roomSearch",
                        "vehicleType",
                        "Vehicle",
                      )}
                    </div>
                  </section>

                  <Separator />

                  <section>
                    <div className="mb-3 flex items-center gap-2">
                      <BriefcaseBusiness className="h-4 w-4 text-violet-600" />
                      <h4 className="text-sm font-semibold">
                        Job Preferences
                      </h4>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      {renderAiField(
                        "jobSearch",
                        "userName",
                        "Name",
                      )}
                      {renderAiField(
                        "jobSearch",
                        "phone",
                        "Phone",
                      )}
                      {renderAiField(
                        "jobSearch",
                        "location",
                        "Preferred Location",
                      )}
                      {renderAiField(
                        "jobSearch",
                        "jobLocation",
                        "Job Location",
                      )}
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
                        "Joining Availability",
                      )}
                    </div>
                  </section>

                  <div className="flex justify-end border-t pt-4">
                    <Button
                      variant="destructive"
                      size="sm"
                      className="rounded-full"
                      disabled={clearingAi}
                      onClick={clearAiProfile}
                    >
                      {clearingAi ? (
                        <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="mr-1 h-4 w-4" />
                      )}
                      Clear AI Details
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
