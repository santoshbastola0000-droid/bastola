"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Check,
  Copy,
  Gift,
  MessageCircle,
  Share2,
  Trophy,
  Users,
} from "lucide-react";

import { privateApi } from "@/http/api/privateApi";
import { Button } from "@/components/ui/button";
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
};

export default function ReferralPage() {
  const [copied, setCopied] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["my-referral-stats"],
    queryFn: async () => {
      const response = await privateApi.get("/referral/me");
      return response.data.data as ReferralStats;
    },
    staleTime: 30_000,
  });

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
      text: "RoomKhoj मा कोठा, जागिर र vacancy सजिलै खोज्नुहोस्।",
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

    const message =
      "RoomKhoj मा कोठा, जागिर र vacancy सजिलै खोज्नुहोस्। मेरो link बाट account बनाउनुहोस्: " +
      data.referralLink;

    window.open(
      `https://wa.me/?text=${encodeURIComponent(message)}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <Skeleton className="h-10 w-56" />
        <Skeleton className="h-48 w-full" />
        <div className="grid gap-4 md:grid-cols-3">
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
          आफ्नो link share गर्नुहोस्। तपाईंको link बाट verified account बनेमा referral count बढ्छ।
        </p>
      </div>

      <Card className="border-primary/20 bg-gradient-to-br from-primary/10 via-background to-background">
        <CardHeader>
          <CardTitle>तपाईंको Referral Link</CardTitle>
          <CardDescription>
            यो link साथीहरूलाई पठाउनुहोस्।
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
              onClick={shareReferral}
              className="cursor-pointer border-primary/30 text-primary hover:bg-primary/5"
            >
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </Button>

            <Button
              variant="outline"
              onClick={shareWhatsApp}
              className="cursor-pointer border-emerald-300 text-emerald-700 hover:bg-emerald-50"
            >
              <MessageCircle className="mr-2 h-4 w-4" />
              Share on WhatsApp
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
          <p>2. नयाँ user ले link बाट account बनाएर OTP verify गर्छ।</p>
          <p>3. Verified signup मात्र count हुन्छ; duplicate वा self-referral मानिँदैन।</p>
          <p>* Monthly winner verification र admin review पछि घोषणा हुन्छ।</p>
        </CardContent>
      </Card>
    </div>
  );
}
