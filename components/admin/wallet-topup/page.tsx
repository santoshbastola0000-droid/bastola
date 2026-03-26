"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Settings,
  Save,
  Loader2,
  QrCode,
  Upload,
  X,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { unlockService } from "@/http/services/unlock.service";
import { SUCCESSTOAST, FAILURETOAST } from "@/lib/constants/app.constants";

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "";

function resolveUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export function SettingsTab() {
  const queryClient = useQueryClient();

  const [adminLabel, setAdminLabel] = useState("");
  const [qrFile, setQrFile] = useState<File | null>(null);
  const [qrPreview, setQrPreview] = useState<string | null>(null);
  const [settingsId, setSettingsId] = useState<string | null>(null);

  // Fetch current settings
  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ["commission-settings"],
    queryFn: () => unlockService.getSettings(),
  });

  // Populate form when settings arrive
  useEffect(() => {
    if (!settings) return;
    setSettingsId(settings.id);
    setAdminLabel(settings.adminPaymentLabel ?? "");
    setQrPreview(resolveUrl(settings.adminQrCodeUrl));
  }, [settings]);

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
      file,
    }: {
      id: string;
      data: { adminPaymentLabel?: string };
      file?: File;
    }) => unlockService.updateSettingsQR(id, data, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commission-settings"] });
      setQrFile(null);
      toast.success("Settings updated successfully", {
        style: { background: SUCCESSTOAST, color: "#fff" },
      });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to update settings", {
        style: { background: FAILURETOAST, color: "#fff" },
      });
    },
  });

  const handleQrFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file (JPG, PNG, etc.)");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be under 10 MB");
      return;
    }

    setQrFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setQrPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleRemoveQr = () => {
    setQrFile(null);
    setQrPreview(null);
  };

  const handleSave = () => {
    if (!settingsId) {
      toast.error("Settings not found. Please create settings first.");
      return;
    }

    updateMutation.mutate({
      id: settingsId,
      data: { adminPaymentLabel: adminLabel.trim() || undefined },
      file: qrFile || undefined,
    });
  };

  if (settingsLoading) {
    return (
      <Card>
        <CardContent className="p-8 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Payment QR Settings
        </CardTitle>
        <CardDescription>
          Configure the QR code and payment label for wallet top-ups
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* QR Code Upload Section */}
        <div className="space-y-4">
          <div>
            <Label className="font-semibold flex items-center gap-2">
              <QrCode className="h-4 w-4" />
              Admin Payment QR Code
            </Label>
            <p className="text-xs text-muted-foreground mt-1">
              Upload your eSewa / Khalti / bank QR code image
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-6 items-start">
            {/* QR Preview */}
            <div className="shrink-0">
              {qrPreview ? (
                <div className="relative group">
                  <div className="w-44 h-44 rounded-2xl border-2 border-primary/20 bg-white shadow-md overflow-hidden flex items-center justify-center p-2">
                    <img
                      src={qrPreview}
                      alt="Admin QR Code"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveQr}
                    className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-md transition-colors"
                    title="Remove QR code"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                  {qrFile && (
                    <div className="absolute bottom-0 left-0 right-0 bg-amber-500/90 text-white text-[10px] font-semibold text-center py-1 rounded-b-xl">
                      Unsaved — click Save
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-44 h-44 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center gap-2 text-slate-400">
                  <QrCode className="w-12 h-12 opacity-40" />
                  <span className="text-xs font-medium">No QR Code</span>
                </div>
              )}
            </div>

            {/* Upload Controls */}
            <div className="space-y-3 flex-1">
              <label
                htmlFor="qr-upload"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-slate-300 hover:border-primary hover:bg-primary/5 cursor-pointer transition-all text-sm font-medium text-slate-600 hover:text-primary"
              >
                <Upload className="w-4 h-4" />
                {qrFile ? "Change QR Image" : "Upload QR Image"}
                <input
                  id="qr-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleQrFileChange}
                />
              </label>

              {qrFile && (
                <p className="text-xs text-amber-600 flex items-center gap-1.5 font-medium">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-slate-600">{qrFile.name}</span> — will
                  upload on Save
                </p>
              )}

              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs text-slate-500 space-y-1">
                <p className="font-semibold text-slate-700">
                  📍 Where this appears:
                </p>
                <ul className="list-disc list-inside space-y-0.5 ml-1">
                  <li>Wallet top-up dialog shown to users</li>
                  <li>Users scan this QR to pay</li>
                  <li>One QR applies globally</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Account Label */}
        <div className="space-y-2">
          <Label htmlFor="adminLabel" className="font-semibold">
            Payment Account Label
          </Label>
          <Input
            id="adminLabel"
            value={adminLabel}
            onChange={(e) => setAdminLabel(e.target.value)}
            placeholder="e.g., eSewa: 9876543210 | Khalti: RentalService"
            className="max-w-md"
          />
          <p className="text-xs text-muted-foreground">
            Displayed to users alongside the QR code
          </p>
        </div>

        {/* Info Alert */}
        <Alert className="bg-blue-50 border-blue-200">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-700 text-sm">
            Changes take effect immediately for all users
          </AlertDescription>
        </Alert>

        {/* Save Button */}
        <div className="pt-2 border-t border-slate-100">
          <Button
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="gap-2 cursor-pointer min-w-[140px]"
          >
            {updateMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Settings
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
