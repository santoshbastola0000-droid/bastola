"use client";

import { useEffect, useState } from "react";
import { Loader2, Users } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { featureSettingsService } from "@/http/services/feature-settings.service";

export default function FeatureSettingsPage() {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    featureSettingsService
      .getPeople()
      .then((setting) => setEnabled(setting.enabled))
      .catch(() => toast.error("Feature setting load गर्न सकिएन।"))
      .finally(() => setLoading(false));
  }, []);

  const togglePeople = async (next: boolean) => {
    const previous = enabled;
    setEnabled(next);
    setSaving(true);
    try {
      const setting = await featureSettingsService.updatePeople(next);
      setEnabled(setting.enabled);
      toast.success(setting.enabled ? "People feature ON भयो।" : "People feature OFF भयो।");
    } catch (error: any) {
      setEnabled(previous);
      toast.error(error?.response?.data?.message || "Setting update गर्न सकिएन।");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-bold">Feature Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">User-facing सुविधाहरू यहाँबाट ON/OFF गर्नुहोस्।</p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Users className="h-5 w-5 text-red-600" />
            <div>
              <CardTitle>People / Find People</CardTitle>
              <CardDescription>User directory, search र People page नियन्त्रण गर्छ।</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex items-center justify-between gap-4">
          <div>
            <p className="font-medium">{enabled ? "Enabled" : "Disabled"}</p>
            <p className="text-sm text-muted-foreground">OFF हुँदा menu लुक्छ र direct page access रोकिन्छ।</p>
          </div>
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Switch checked={enabled} onCheckedChange={togglePeople} disabled={saving} aria-label="Toggle People feature" />
          )}
        </CardContent>
      </Card>
    </main>
  );
}
