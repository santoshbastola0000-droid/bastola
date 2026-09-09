"use client";

import { BadgeDollarSign, GitBranch, Link2, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type Props = {
  referralLink: string;
  directNetworkCount: number;
  qualifiedReferrals: number;
  pendingReferrals: number;
};

export default function ReferralNetworkInfo({
  referralLink,
  directNetworkCount,
  qualifiedReferrals,
  pendingReferrals,
}: Props) {
  return (
    <Card className="overflow-hidden border-violet-200 bg-gradient-to-br from-violet-50 via-background to-background">
      <CardHeader className="border-b bg-violet-50/70">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-violet-100 p-3 text-violet-700">
            <GitBranch className="h-6 w-6" />
          </div>
          <div>
            <CardTitle className="text-lg">Referral Network / नेटवर्क</CardTitle>
            <CardDescription className="mt-1 leading-6">
              एउटै RoomKhoj referral link बाट user जोडिन्छ। तपाईंले direct जोडेका user Level 1 मा बस्छन्, उनीहरूले जोडेका user Level 2 मा र त्यसैगरी network tree तलतिर बढ्दै जान्छ।
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5 p-5">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border bg-background p-4">
            <p className="text-xs font-medium text-muted-foreground">Direct Network</p>
            <p className="mt-1 text-2xl font-black">{directNetworkCount}</p>
          </div>
          <div className="rounded-xl border bg-background p-4">
            <p className="text-xs font-medium text-muted-foreground">Verified</p>
            <p className="mt-1 text-2xl font-black">{qualifiedReferrals}</p>
          </div>
          <div className="rounded-xl border bg-background p-4">
            <p className="text-xs font-medium text-muted-foreground">Pending</p>
            <p className="mt-1 text-2xl font-black">{pendingReferrals}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex items-start gap-3">
            <Link2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
            <div className="min-w-0">
              <p className="font-black text-emerald-950">कुन link share गर्दा पैसा आउँछ?</p>
              <p className="mt-2 text-sm leading-6 text-emerald-900">
                तल देखिएको <b>तपाईंको यही Referral Link</b> share गर्नुहोस्। अर्को user ले यही link बाट account बनाएपछि system ले त्यो user तपाईंको referral भनेर track गर्छ।
              </p>
              <div className="mt-3 break-all rounded-xl border border-emerald-200 bg-white p-3 font-mono text-xs text-emerald-950">
                {referralLink}
              </div>
              <div className="mt-3 space-y-2 text-sm text-emerald-950">
                <p><b>Verified Signup:</b> यही link बाट account बनाएर OTP verify गरेपछि तपाईंलाई Rs. 5 wallet reward आउँछ।</p>
                <p><b>Account Monetize:</b> यही link बाट आएको user ले Rs. 499 Starter monetization activate गरेपछि तपाईंलाई 50% = Rs. 249.50 commission आउँछ, र referred user लाई Rs. 100 cashback आउँछ।</p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-violet-200 bg-violet-50/70 p-4">
          <p className="font-black text-violet-950">सजिलो उदाहरण</p>
          <div className="mt-3 space-y-3 text-sm leading-6 text-violet-950">
            <p><b>तपाईं → B:</b> B ले तपाईंको referral link बाट account बनायो र verify गर्‍यो भने B तपाईंको Level 1 direct referral हुन्छ। Signup reward Rs. 5 आउँछ। B ले Starter monetize गरेमा थप Rs. 249.50 commission आउँछ।</p>
            <p><b>B → C:</b> पछि B ले आफ्नो referral link C लाई पठायो भने C, B को direct referral हुन्छ र तपाईंको network tree मा Level 2 मा देखिन्छ।</p>
            <p><b>C → D:</b> C ले D लाई जोड्यो भने D Level 3 मा देखिन्छ। यसरी relation backend मा 10 level सम्म track हुन्छ।</p>
          </div>
        </div>

        <div className="rounded-2xl border bg-background p-4">
          <div className="flex items-start gap-3">
            <BadgeDollarSign className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div>
              <p className="font-black">कमाइ कति हुन सक्छ? — direct referral उदाहरण</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <div className="rounded-xl bg-muted/50 p-3 text-sm"><b>5 जना</b> Starter monetize → 5 × Rs. 249.50 = <b>Rs. 1,247.50</b></div>
                <div className="rounded-xl bg-muted/50 p-3 text-sm"><b>10 जना</b> Starter monetize → 10 × Rs. 249.50 = <b>Rs. 2,495</b></div>
                <div className="rounded-xl bg-muted/50 p-3 text-sm"><b>25 जना</b> Starter monetize → 25 × Rs. 249.50 = <b>Rs. 6,237.50</b></div>
                <div className="rounded-xl bg-muted/50 p-3 text-sm"><b>100 जना</b> Starter monetize → 100 × Rs. 249.50 = <b>Rs. 24,950</b></div>
              </div>
              <p className="mt-3 text-xs leading-5 text-muted-foreground">
                यी उदाहरणहरू direct paid referrals का हुन्। Network tree मा Level 2–10 relation track हुन्छ, तर indirect level बाट payout छुट्टै rule enable नभएसम्म automatic commission देखाइएको छैन।
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-xl border bg-background p-4 text-sm text-muted-foreground">
          <Users className="mt-0.5 h-4 w-4 shrink-0" />
          <p>Self-referral, duplicate account वा invalid verification reward का लागि count हुँदैन। Paid commission successful monetization payment भएपछि मात्र credit हुन्छ।</p>
        </div>
      </CardContent>
    </Card>
  );
}
