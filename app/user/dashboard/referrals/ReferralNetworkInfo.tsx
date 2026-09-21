"use client";

import { BadgeDollarSign, GitBranch, Link2, Users } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export type ReferralContent = {
  title: string;
  introText: string;
  earningRulesText: string;
  promoText: string;
  disclaimerText: string;
  updatedAt?: string | null;
};

type Props = {
  referralLink: string;
  directNetworkCount: number;
  qualifiedReferrals: number;
  pendingReferrals: number;
  content?: ReferralContent | null;
};

export default function ReferralNetworkInfo({
  referralLink,
  directNetworkCount,
  qualifiedReferrals,
  pendingReferrals,
  content,
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
            <CardDescription className="mt-1 whitespace-pre-wrap leading-6">
              {content?.earningRulesText ||
                "Completed room service-charge बाट RoomKhoj 5%, direct referrer 5% र second-level referrer 2.5% पाउँछन्।"}
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
              <p className="font-black text-emerald-950">एउटै network कसरी बनिन्छ?</p>
              <p className="mt-2 text-sm leading-6 text-emerald-900">
                तपाईंले यही referral link वा आफ्नो 5-character promo code share गर्नुहुन्छ।
                तपाईंले ल्याएको user Level 1 हुन्छ। उसले अर्को user ल्याएमा त्यो तपाईंको
                Level 2 हुन्छ।
              </p>
              <div className="mt-3 break-all rounded-xl border border-emerald-200 bg-white p-3 font-mono text-xs text-emerald-950">
                {referralLink}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-violet-200 bg-violet-50/70 p-4">
          <p className="font-black text-violet-950">A → B → C को सजिलो उदाहरण</p>
          <div className="mt-3 space-y-3 text-sm leading-6 text-violet-950">
            <p>
              <b>A ले B लाई refer गर्‍यो:</b> B को Rs. 1,000 room service-charge
              escrow release हुँदा RoomKhoj लाई Rs. 50 (5%), A लाई Rs. 50 (5%)
              र B लाई Rs. 900 जान्छ।
            </p>
            <p>
              <b>B ले C लाई refer गर्‍यो:</b> C को Rs. 1,000 service-charge
              release हुँदा RoomKhoj लाई Rs. 50 (5%), B लाई Rs. 50 (5%), A लाई
              Rs. 25 (2.5%) र C लाई Rs. 875 जान्छ।
            </p>
            <p>
              <b>महत्त्वपूर्ण:</b> कुनै referral level नभए त्यो level को percentage
              agent मै रहन्छ। RoomKhoj को 5% चाहिँ प्रत्येक completed service-charge
              मा लाग्छ।
            </p>
          </div>
        </div>

        <div className="rounded-2xl border bg-background p-4">
          <div className="flex items-start gap-3">
            <BadgeDollarSign className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div className="min-w-0">
              <p className="font-black">Passive network income कसरी आउँछ?</p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                तपाईं आफैं room service-charge नकमाए पनि तपाईंले refer गरेको agent ले
                वास्तविक service-charge कमाएर payer ले escrow release गरेपछि तपाईंको
                5% direct referral income आउन सक्छ। तपाईंको Level 2 agent ले कमाउँदा
                2.5% second-level income आउन सक्छ।
              </p>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                {content?.promoText || ""}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-xl border bg-background p-4 text-sm text-muted-foreground">
          <Users className="mt-0.5 h-4 w-4 shrink-0" />
          <p className="whitespace-pre-wrap">
            {content?.disclaimerText ||
              "मान्छे add गरेको भरमा service-charge income आउँदैन। Downline ले वास्तविक room service-charge कमाएर escrow release भएपछि मात्र network payout हुन्छ।"}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
