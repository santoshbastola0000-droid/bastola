"use client";

import { useEffect, useState } from "react";
import { BadgeCheck, FileText, Loader2, ShieldCheck, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { walletService } from "@/http/services/wallet.service";

export default function MonetizationKycAdminPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      setItems(await walletService.getAdminMonetizationKyc());
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "KYC list load failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const review = async (id: string, status: "APPROVED" | "REJECTED") => {
    const remarks =
      status === "REJECTED"
        ? window.prompt("Rejection reason") || ""
        : window.prompt("Admin remarks (optional)") || "";
    try {
      setBusyId(id);
      await walletService.reviewMonetizationKyc(id, {
        status,
        adminRemarks: remarks,
      });
      toast.success(status === "APPROVED" ? "KYC approved" : "KYC rejected");
      await load();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "KYC review failed");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-5 p-4 sm:p-6">
      <div>
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-black">Account Monetize Verification</h1>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Review identity details before enabling paid earning plans.
        </p>
      </div>

      {loading ? (
        <div className="flex min-h-48 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <Card><CardContent className="p-6 text-sm text-muted-foreground">No KYC submissions yet.</CardContent></Card>
      ) : (
        <div className="grid gap-4">
          {items.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-black">{item.fullName}</h2>
                      <span className="rounded-full bg-muted px-2 py-1 text-[11px] font-bold">{item.status}</span>
                    </div>
                    <p className="text-sm">{item.email}</p>
                    <p className="text-sm">{item.phoneNumber}</p>
                    <p className="text-sm text-muted-foreground">{item.address}</p>
                    <p className="text-xs font-semibold">Document: {item.documentType}</p>
                    {item.adminRemarks && (
                      <p className="text-xs text-red-600">{item.adminRemarks}</p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        window.open(
                          walletService.getMonetizationKycDocumentUrl(item.id),
                          "_blank",
                          "noopener,noreferrer",
                        )
                      }
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      View document
                    </Button>
                    <Button
                      type="button"
                      onClick={() => void review(item.id, "APPROVED")}
                      disabled={busyId === item.id}
                    >
                      <BadgeCheck className="mr-2 h-4 w-4" />
                      Approve
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => void review(item.id, "REJECTED")}
                      disabled={busyId === item.id}
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Reject
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
