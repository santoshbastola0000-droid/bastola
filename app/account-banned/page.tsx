"use client";

import { useEffect, useState } from "react";
import { Ban, FileCheck2, Loader2, LogOut, ShieldAlert } from "lucide-react";
import { privateApi } from "@/http/api/privateApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useLogout } from "@/hooks/useLogout";

type BanStatus = {
  isBanned: boolean;
  bannedAt?: string | null;
  banReason?: string | null;
  appealStatus?: string | null;
  appealSubmittedAt?: string | null;
  appealAdminRemarks?: string | null;
};

export default function AccountBannedPage() {
  const [status, setStatus] = useState<BanStatus | null>(null);
  const [documentType, setDocumentType] = useState("CITIZENSHIP");
  const [message, setMessage] = useState("");
  const [document, setDocument] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const { logout } = useLogout();

  const load = async () => {
    try {
      const response = await privateApi.get("/user/me/ban-status");
      const data = response.data?.data ?? response.data;
      setStatus(data);
      if (!data?.isBanned) window.location.assign("/feed");
    } catch {}
  };

  useEffect(() => { void load(); }, []);

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await privateApi.post("/user/logout").catch(() => undefined);
      await logout();
    } finally {
      setLoggingOut(false);
    }
  };

  const submit = async () => {
    if (!document) return toast.error("Government identity document छान्नुहोस्।");
    const form = new FormData();
    form.append("documentType", documentType);
    form.append("message", message);
    form.append("document", document);
    try {
      setSubmitting(true);
      await privateApi.post("/user/me/ban-appeal", form);
      toast.success("Appeal admin review का लागि पठाइयो।");
      await load();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Appeal पठाउन सकिएन।");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-muted/30 px-4 py-10">
      <div className="mx-auto max-w-xl overflow-hidden rounded-3xl border bg-background shadow-xl">
        <div className="bg-red-600 px-6 py-8 text-center text-white">
          <ShieldAlert className="mx-auto h-12 w-12" />
          <h1 className="mt-3 text-2xl font-black">Your account has been banned</h1>
          <p className="mt-2 text-sm text-red-50">तपाईं RoomKhoj account खोल्न सक्नुहुन्छ, तर ban हटेसम्म अन्य features प्रयोग गर्न मिल्दैन।</p>
        </div>
        <div className="space-y-5 p-6">
          {status?.banReason && <div className="rounded-2xl bg-red-50 p-4 text-sm"><b>Reason:</b> {status.banReason}</div>}
          {status?.appealStatus === "PENDING" ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <div className="flex items-center gap-2 font-bold"><FileCheck2 className="h-5 w-5" /> Appeal under review</div>
              <p className="mt-2 text-sm text-muted-foreground">तपाईंको document र appeal admin ले manually review गर्दैछ। निर्णय भएपछि status update हुन्छ।</p>
            </div>
          ) : (
            <div className="space-y-3">
              <h2 className="text-lg font-black">Appeal</h2>
              <p className="text-sm text-muted-foreground">Account review गर्न government identity document पठाउनुहोस्। Document public हुँदैन।</p>
              <select value={documentType} onChange={(e) => setDocumentType(e.target.value)} className="h-11 w-full rounded-xl border bg-background px-3 text-sm">
                <option value="CITIZENSHIP">Citizenship</option>
                <option value="PASSPORT">Passport</option>
                <option value="DRIVING_LICENSE">Driving License</option>
                <option value="NATIONAL_ID">National ID</option>
              </select>
              <Input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={(e) => setDocument(e.target.files?.[0] || null)} />
              <textarea value={message} onChange={(e) => setMessage(e.target.value)} maxLength={1000} placeholder="Appeal message (optional)" className="min-h-28 w-full rounded-xl border bg-background p-3 text-sm" />
              <Button onClick={submit} disabled={submitting} className="w-full rounded-xl">
                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Ban className="mr-2 h-4 w-4" />}
                Submit Appeal
              </Button>
              <p className="text-xs text-muted-foreground">JPG, PNG, WEBP वा PDF · maximum 5 MB</p>
            </div>
          )}

          <div className="border-t pt-5">
            <Button
              type="button"
              variant="outline"
              onClick={() => void handleLogout()}
              disabled={loggingOut}
              className="w-full rounded-xl border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              {loggingOut ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <LogOut className="mr-2 h-4 w-4" />
              )}
              Logout
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
