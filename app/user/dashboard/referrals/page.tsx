"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Check,
  Copy,
  Gift,
  MessageCircle,
  Share2,
  Send,
  Trophy,
  Users,
  CircleDollarSign,
  BadgeDollarSign,
} from "lucide-react";

import { privateApi } from "@/http/api/privateApi";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

type ReferralStats = {
  referralCode: string;
  referralLink: string;
  qualifiedReferrals: number;
  pendingReferrals: number;
  totalReferralEarnings: number;
  rewardPerVerifiedReferral: number;
};

export default function ReferralPage() {
  const [copied, setCopied] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [selectedReferralType, setSelectedReferralType] = useState<"SIGNUP" | "MONETIZATION">("MONETIZATION");

  const { data, isLoading, error } = useQuery({
    queryKey: ["my-referral-stats"],
    queryFn: async () => {
      const response = await privateApi.get("/referral/me");
      return response.data.data as ReferralStats;
    },
    staleTime: 30_000,
  });

  const getShareText = () =>
    selectedReferralType === "MONETIZATION"
      ? "💰 RoomKhoj Account Monetize Referral! मेरो link बाट account बनाउनुहोस् र Starter monetization activate गर्नुहोस्। Monetization payment सफल भएपछि मलाई fee को 50% commission आउँछ र तपाईंलाई Rs. 100 cashback आफ्नै wallet मा आउँछ।"
      : "🎁 RoomKhoj Invite & Win! मेरो link बाट verified account बनाउनुहोस्। हरेक verified signup मा Rs. 5 wallet reward आउँछ।";

  const copyLink = async () => {
    if (!data?.referralLink) return;

    try {
      await navigator.clipboard.writeText(data.referralLink);
      setCopied(true);
      toast.success("Referral link copied");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy link. Please copy it manually.");
    }
  };

  const shareReferral = async () => {
    if (!data?.referralLink) return;

    const shareData = {
      title: "Join RoomKhoj",
      text: getShareText(),
      url: data.referralLink,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // User cancelled the share menu; no action needed.
      }
      return;
    }

    await copyLink();
    toast.success("Your browser does not support direct sharing. Link copied.");
  };

  const shareWhatsApp = () => {
    if (!data?.referralLink) return;

    const message = getShareText() + " " + data.referralLink;

    window.open(
      `https://wa.me/?text=${encodeURIComponent(message)}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  const shareFacebook = () => {
    if (!data?.referralLink) return;

    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
        data.referralLink,
      )}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  const shareTelegram = () => {
    if (!data?.referralLink) return;

    const message = getShareText();

    window.open(
      `https://t.me/share/url?url=${encodeURIComponent(
        data.referralLink,
      )}&text=${encodeURIComponent(message)}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  const shareViber = () => {
    if (!data?.referralLink) return;

    const message = getShareText() + " " + data.referralLink;

    window.location.href =
      `viber://forward?text=${encodeURIComponent(message)}`;
  };

  if (isLoading) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <Skeleton className="h-10 w-56" />
        <Skeleton className="h-48 w-full" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-4 md:p-6">
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Referral details load हुन सकेन। कृपया फेरि प्रयास गर्नुहोस्।
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="flex items-center gap-3 text-2xl font-bold md:text-3xl">
          <Gift className="h-7 w-7 text-primary" />
          Invite & Earn
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          आफ्नो link share गर्नुहोस्। हरेक verified नयाँ account मा Rs. 5 wallet reward पाउनुहोस्।
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card
          className={`cursor-pointer transition-all ${selectedReferralType === "MONETIZATION" ? "border-primary ring-2 ring-primary/20" : ""}`}
          onClick={() => setSelectedReferralType("MONETIZATION")}
        >
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <div className="rounded-xl bg-emerald-100 p-3 text-emerald-700">
                <BadgeDollarSign className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="font-black">Account Monetize Referral</h2>
                  {selectedReferralType === "MONETIZATION" && (
                    <span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-bold text-primary">SELECTED</span>
                  )}
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Referral user ले paid Account Monetize activate गरेपछि तपाईंलाई monetization fee को 50% commission आउँछ।
                </p>
                <div className="mt-3 space-y-1 text-sm font-semibold">
                  <p>• Rs. 499 Starter भए तपाईंलाई Rs. 249.50</p>
                  <p>• Referred user लाई Rs. 100 cashback</p>
                  <p>• Successful monetization payment भएपछि मात्र reward</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-all ${selectedReferralType === "SIGNUP" ? "border-primary ring-2 ring-primary/20" : ""}`}
          onClick={() => setSelectedReferralType("SIGNUP")}
        >
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <div className="rounded-xl bg-blue-100 p-3 text-blue-700">
                <CircleDollarSign className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="font-black">Verified Signup Referral</h2>
                  {selectedReferralType === "SIGNUP" && (
                    <span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-bold text-primary">SELECTED</span>
                  )}
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  साथीले referral link बाट नयाँ account बनाएर OTP verify गरेपछि normal referral reward आउँछ।
                </p>
                <div className="mt-3 space-y-1 text-sm font-semibold">
                  <p>• Rs. {data.rewardPerVerifiedReferral} per verified signup</p>
                  <p>• Monthly referral competition मा count</p>
                  <p>• Duplicate/self referral मानिँदैन</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-primary/20 bg-gradient-to-br from-primary/10 via-background to-background">
        <CardHeader>
          <CardTitle>तपाईंको Referral Link</CardTitle>
          <CardDescription>
            {selectedReferralType === "MONETIZATION"
              ? "Account Monetize referral का लागि यो link share गर्नुहोस्।"
              : "Verified signup referral का लागि यो link share गर्नुहोस्।"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="break-all rounded-xl border bg-background p-3 font-mono text-sm">
            {data.referralLink}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button onClick={copyLink} className="cursor-pointer">
              {copied ? (
                <Check className="mr-2 h-4 w-4" />
              ) : (
                <Copy className="mr-2 h-4 w-4" />
              )}
              {copied ? "Copied" : "Copy Link"}
            </Button>

            <Button
              variant="outline"
              onClick={() => setShareOpen(true)}
              className="cursor-pointer border-primary/30 text-primary hover:bg-primary/5"
            >
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-xl bg-primary/10 p-3 text-primary">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{data.qualifiedReferrals}</p>
              <p className="text-sm text-muted-foreground">
                Qualified referrals
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-xl bg-amber-100 p-3 text-amber-700">
              <Gift className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{data.pendingReferrals}</p>
              <p className="text-sm text-muted-foreground">
                Pending verification
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-xl bg-blue-100 p-3 text-blue-700">
              <Gift className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                Rs. {Number(data.totalReferralEarnings || 0).toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground">
                Total referral earnings
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-xl bg-emerald-100 p-3 text-emerald-700">
              <Trophy className="h-5 w-5" />
            </div>
            <div>
              <p className="text-base font-bold">Monthly Prize</p>
              <p className="text-sm text-muted-foreground">
                Top referrer wins Rs. 10,000*
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">How it works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>1. आफ्नो referral link share गर्नुहोस्।</p>
          <p>2. हरेक नयाँ user ले OTP verify गरेपछि तपाईंको wallet मा Rs. {data.rewardPerVerifiedReferral} credit हुन्छ।</p>
          <p>3. Verified signup मात्र count हुन्छ; duplicate वा self-referral मानिँदैन।</p>
          <p>4. सबैभन्दा धेरै qualified referral ल्याउनेले monthly Rs. 10,000 जित्ने मौका पाउँछ।</p>
        </CardContent>
      </Card>

      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogContent className="w-[94vw] max-w-xl overflow-hidden rounded-3xl p-0">
          <DialogHeader className="border-b px-6 py-5 text-left">
            <DialogTitle className="text-center text-xl">
              Share & Earn
            </DialogTitle>
            <DialogDescription className="text-center">
              {selectedReferralType === "MONETIZATION"
                ? "Account Monetize referral share गर्नुहोस् — 50% commission + referred user लाई Rs. 100 cashback."
                : "साथीलाई invite गर्नुहोस्। हरेक verified signup मा Rs. 5 पाउनुहोस्।"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-3 gap-x-3 gap-y-6 px-5 py-7 sm:grid-cols-6">
            <button
              type="button"
              onClick={copyLink}
              className="group flex flex-col items-center gap-2"
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white transition-transform group-hover:scale-105">
                {copied ? (
                  <Check className="h-6 w-6" />
                ) : (
                  <Copy className="h-6 w-6" />
                )}
              </span>
              <span className="text-xs font-medium">
                {copied ? "Copied" : "Copy"}
              </span>
            </button>

            <button
              type="button"
              onClick={shareWhatsApp}
              className="group flex flex-col items-center gap-2"
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white transition-transform group-hover:scale-105">
                <MessageCircle className="h-7 w-7" />
              </span>
              <span className="text-xs font-medium">WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={shareFacebook}
              className="group flex flex-col items-center gap-2"
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#1877F2] text-2xl font-black text-white transition-transform group-hover:scale-105">
                f
              </span>
              <span className="text-xs font-medium">Facebook</span>
            </button>

            <button
              type="button"
              onClick={shareReferral}
              className="group flex flex-col items-center gap-2"
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#00B2FF] to-[#6A5CFF] text-white transition-transform group-hover:scale-105">
                <MessageCircle className="h-7 w-7" />
              </span>
              <span className="text-xs font-medium">Messenger</span>
            </button>

            <button
              type="button"
              onClick={shareTelegram}
              className="group flex flex-col items-center gap-2"
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#229ED9] text-white transition-transform group-hover:scale-105">
                <Send className="h-6 w-6" />
              </span>
              <span className="text-xs font-medium">Telegram</span>
            </button>

            <button
              type="button"
              onClick={shareViber}
              className="group flex flex-col items-center gap-2"
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#7360F2] text-xl font-bold text-white transition-transform group-hover:scale-105">
                V
              </span>
              <span className="text-xs font-medium">Viber</span>
            </button>
          </div>

          <div className="border-t bg-muted/40 px-5 py-4">
            <Button
              type="button"
              variant="outline"
              onClick={shareReferral}
              className="w-full cursor-pointer rounded-xl"
            >
              <Share2 className="mr-2 h-4 w-4" />
              More Apps
            </Button>

            <p className="mt-3 text-center text-xs text-muted-foreground">
              {selectedReferralType === "MONETIZATION"
                ? "Monetization referral reward successful paid activation पछि मात्र credit हुन्छ।"
                : "Reward unique OTP-verified account बनेपछि मात्र wallet मा credit हुन्छ।"}
            </p>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
