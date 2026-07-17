"use client";

import { useState } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const { user, updateUser } = useUserStore();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
  });

  const initials = user?.name
    ? user.name
        .split(" ")
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
      await privateApi.patch("/user/profile", {
        name: form.name.trim(),
        phone: form.phone.trim(),
      });
      updateUser({ name: form.name.trim(), phone: form.phone.trim() });
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
    </div>
  );
}
