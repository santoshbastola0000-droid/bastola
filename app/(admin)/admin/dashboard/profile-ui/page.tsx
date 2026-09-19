"use client";

import { useEffect, useState } from "react";
import {
  BadgeCheck,
  Loader2,
  Search,
  ShieldOff,
  UserCheck,
  UserX,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { profileService } from "@/http/services/profile.service";
import { userService } from "@/http/services/user.service";

type ProfileBadgeUser = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  profileVerified?: boolean;
};

export default function ProfileUiAdminPage() {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [userSearch, setUserSearch] = useState("");
  const [users, setUsers] = useState<ProfileBadgeUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [actionUserId, setActionUserId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const settings = await profileService.getProfileUiSettings();
        if (!cancelled) {
          setEnabled(Boolean(settings.verifiedBadgeEnabled));
        }
      } catch (error: any) {
        if (!cancelled) {
          toast.error(
            error?.response?.data?.message ||
              "Profile UI settings load गर्न सकिएन.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const timer = window.setTimeout(async () => {
      try {
        setUsersLoading(true);
        const response = await userService.getUsers({
          page: 0,
          take: 20,
          search: userSearch.trim() || undefined,
        });

        if (!cancelled) {
          setUsers(
            ((response?.data || []) as any[]).map((user) => ({
              id: String(user.id),
              name: String(user.name || "RoomKhoj User"),
              email: user.email || null,
              phone: user.phone || null,
              profileVerified: Boolean(user.profileVerified),
            })),
          );
        }
      } catch (error: any) {
        if (!cancelled) {
          toast.error(
            error?.response?.data?.message ||
              "User list load गर्न सकिएन.",
          );
        }
      } finally {
        if (!cancelled) setUsersLoading(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [userSearch]);

  const save = async (next: boolean) => {
    try {
      setSaving(true);
      const updated =
        await profileService.updateProfileUiSettings(next);
      setEnabled(Boolean(updated.verifiedBadgeEnabled));
      toast.success(
        updated.verifiedBadgeEnabled
          ? "Verified badge display ON भयो."
          : "Verified badge display OFF भयो.",
      );
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          "Setting update गर्न सकिएन.",
      );
    } finally {
      setSaving(false);
    }
  };

  const setUserVerified = async (
    user: ProfileBadgeUser,
    next: boolean,
  ) => {
    try {
      setActionUserId(user.id);
      await userService.setProfileVerified(user.id, next);

      setUsers((current) =>
        current.map((item) =>
          item.id === user.id
            ? { ...item, profileVerified: next }
            : item,
        ),
      );

      toast.success(
        next
          ? `${user.name} लाई Verified badge दिइयो.`
          : `${user.name} बाट Verified badge हटाइयो.`,
      );
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          "Verified badge update गर्न सकिएन.",
      );
    } finally {
      setActionUserId(null);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight">
          Profile UI
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          User profile मा देखिने global profile controls र individual verified
          badge यहाँबाट manage गर्नुहोस्।
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {enabled ? (
              <BadgeCheck className="h-5 w-5 text-primary" />
            ) : (
              <ShieldOff className="h-5 w-5 text-muted-foreground" />
            )}
            Verified badge display
          </CardTitle>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="flex min-h-28 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="flex items-center justify-between gap-4 rounded-2xl border bg-muted/20 p-4">
              <div className="min-w-0">
                <p className="font-bold">
                  Show verified check beside user names
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  ON हुँदा तलबाट Verified दिइएका user हरूमा मात्र profile check
                  badge देखिन्छ। OFF हुँदा कसैको badge देखिँदैन।
                </p>
              </div>

              <Switch
                checked={enabled}
                disabled={saving}
                onCheckedChange={(checked) => void save(Boolean(checked))}
                aria-label="Toggle verified badge"
              />
            </div>
          )}

          <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                enabled ? "bg-emerald-500" : "bg-slate-400"
              }`}
            />
            Current status: {enabled ? "ON" : "OFF"}
          </div>

          {saving && (
            <Button disabled className="mt-4">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-primary" />
            Select user for Verified badge
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {!enabled && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              User लाई Verified दिन मिल्छ, तर profile मा देखाउन माथिको global
              switch ON हुनुपर्छ।
            </div>
          )}

          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={userSearch}
              onChange={(event) => setUserSearch(event.target.value)}
              placeholder="Name, email वा phone बाट user खोज्नुहोस्"
              className="pl-9"
            />
          </div>

          {usersLoading ? (
            <div className="flex min-h-32 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : users.length === 0 ? (
            <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
              User भेटिएन।
            </div>
          ) : (
            <div className="space-y-2">
              {users.map((user) => {
                const verified = Boolean(user.profileVerified);
                const busy = actionUserId === user.id;

                return (
                  <div
                    key={user.id}
                    className="flex flex-col gap-3 rounded-2xl border bg-background p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-bold">{user.name}</p>
                        {verified && (
                          <BadgeCheck
                            className="h-5 w-5 shrink-0 text-primary"
                            aria-label="Verified"
                          />
                        )}
                      </div>
                      <p className="truncate text-xs text-muted-foreground">
                        {user.email || "No email"}
                        {user.phone ? ` · ${user.phone}` : ""}
                      </p>
                    </div>

                    <Button
                      type="button"
                      size="sm"
                      variant={verified ? "outline" : "default"}
                      disabled={busy}
                      onClick={() => void setUserVerified(user, !verified)}
                      className="shrink-0"
                    >
                      {busy ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : verified ? (
                        <UserX className="mr-2 h-4 w-4" />
                      ) : (
                        <UserCheck className="mr-2 h-4 w-4" />
                      )}
                      {verified ? "Remove Verified" : "Give Verified"}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
