"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Percent, RefreshCw, Save } from "lucide-react";
import { privateApi } from "@/http/api/privateApi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

type Settings = {
  enabled: boolean;
  minimumFollowers: number;
  creatorSharePercent: number;
  platformSharePercent: number;
  updatedAt?: string;
};

const defaults: Settings = {
  enabled: false,
  minimumFollowers: 100,
  creatorSharePercent: 70,
  platformSharePercent: 30,
};

export default function CreatorMonetizationAdminPage() {
  const [settings, setSettings] = useState<Settings>(defaults);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const response = await privateApi.get("/social/admin/creator-monetization/settings");
      setSettings({ ...defaults, ...(response.data?.data ?? response.data) });
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Creator monetization settings load भएन");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const save = async () => {
    const creator = Number(settings.creatorSharePercent);
    const platform = Number(settings.platformSharePercent);
    const followers = Number(settings.minimumFollowers);
    if (!Number.isInteger(followers) || followers < 0) {
      toast.error("Minimum followers सही number हुनुपर्छ");
      return;
    }
    if (!Number.isFinite(creator) || !Number.isFinite(platform) || creator < 0 || platform < 0 || creator > 100 || platform > 100 || Math.abs(creator + platform - 100) > 0.001) {
      toast.error("Creator र RoomKhoj share जोड्दा 100% हुनुपर्छ");
      return;
    }
    setSaving(true);
    try {
      const response = await privateApi.patch("/social/admin/creator-monetization/settings", {
        enabled: settings.enabled,
        minimumFollowers: followers,
        creatorSharePercent: creator,
        platformSharePercent: platform,
      });
      setSettings({ ...defaults, ...(response.data?.data ?? response.data) });
      toast.success("Creator ad revenue settings save भयो");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Settings save भएन");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold"><Percent className="h-6 w-6" /> Creator Ad Revenue</h1>
        <p className="text-sm text-muted-foreground">Creator र RoomKhoj बीचको revenue share Admin ले व्यवस्थापन गर्ने ठाउँ</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Monetization policy</CardTitle>
          <CardDescription>यी setting ले eligibility र revenue split को policy नियन्त्रण गर्छन्। सुरुमा सुविधा बन्द नै राखिएको छ।</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
            <div>
              <Label htmlFor="creator-enabled" className="font-semibold">Creator monetization enable</Label>
              <p className="text-xs text-muted-foreground">Policy तयार भएपछि मात्र enable गर्नुहोस्</p>
            </div>
            <Switch id="creator-enabled" checked={settings.enabled} onCheckedChange={(enabled) => setSettings((s) => ({ ...s, enabled }))} disabled={loading} />
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="min-followers">Minimum followers</Label>
              <Input id="min-followers" type="number" min="0" value={settings.minimumFollowers} onChange={(e) => setSettings((s) => ({ ...s, minimumFollowers: Number(e.target.value) }))} disabled={loading} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="creator-share">Creator share (%)</Label>
              <Input id="creator-share" type="number" min="0" max="100" step="0.01" value={settings.creatorSharePercent} onChange={(e) => setSettings((s) => ({ ...s, creatorSharePercent: Number(e.target.value), platformSharePercent: 100 - Number(e.target.value) }))} disabled={loading} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="platform-share">RoomKhoj share (%)</Label>
              <Input id="platform-share" type="number" min="0" max="100" step="0.01" value={settings.platformSharePercent} onChange={(e) => setSettings((s) => ({ ...s, platformSharePercent: Number(e.target.value), creatorSharePercent: 100 - Number(e.target.value) }))} disabled={loading} />
            </div>
          </div>
          <div className="rounded-lg bg-muted p-4 text-sm">
            अहिलेको प्रस्ताव: Creator <strong>{settings.creatorSharePercent}%</strong> / RoomKhoj <strong>{settings.platformSharePercent}%</strong>. दुवै प्रतिशतको योग 100% हुनुपर्छ।
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={save} disabled={loading || saving}><Save className="mr-2 h-4 w-4" />{saving ? "Saving..." : "Save settings"}</Button>
            <Button variant="outline" onClick={() => void load()} disabled={loading || saving}><RefreshCw className="mr-2 h-4 w-4" />Refresh</Button>
          </div>
          {settings.updatedAt && <p className="text-xs text-muted-foreground">Last updated: {new Date(settings.updatedAt).toLocaleString()}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>महत्त्वपूर्ण</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>• 100 followers पुग्नु eligibility threshold मात्र हो; कमाइको guarantee होइन।</p>
          <p>• AdSense ले publisher account लाई भुक्तानी गर्छ। यहाँको split RoomKhoj भित्रको accounting policy हो, Google बाट creator-wise automatic payout होइन।</p>
          <p>• वास्तविक eligible ad revenue मात्र बाँड्नुपर्छ। Ad click गर्न आग्रह गर्ने, click को बदलामा पैसा दिने वा invalid traffic बाट आएको रकम बाँड्न मिल्दैन।</p>
          <p>• यो चरणमा settings मात्र तयार गरिएको छ। Creator-wise ad impression attribution, revenue calculation, wallet credit र payout workflow छुट्टै जोडिएपछि मात्र वास्तविक रकम वितरण गर्न सकिन्छ।</p>
        </CardContent>
      </Card>
    </div>
  );
}
