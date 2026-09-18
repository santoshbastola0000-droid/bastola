"use client";

import { useEffect, useState } from "react";
import { BadgeCheck, Loader2, ShieldOff } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { profileService } from "@/http/services/profile.service";

export default function ProfileUiAdminPage() {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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

  const save = async (next: boolean) => {
    try {
      setSaving(true);
      const updated =
        await profileService.updateProfileUiSettings(next);
      setEnabled(Boolean(updated.verifiedBadgeEnabled));
      toast.success(
        updated.verifiedBadgeEnabled
          ? "Verified badge सबै profile मा ON भयो."
          : "Verified badge सबै profile बाट OFF भयो.",
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

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight">
          Profile UI
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          User profile मा देखिने global profile controls यहाँबाट manage गर्नुहोस्।
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
            Verified badge
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
                  OFF हुँदा verified user भए पनि profile मा check badge देखिँदैन।
                  ON गर्दा verified user हरूमा मात्र badge देखिन्छ।
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
    </div>
  );
}
