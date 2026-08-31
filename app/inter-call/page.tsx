"use client";

import { useState } from "react";
import Link from "next/link";
import { PhoneCall, ShieldCheck } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { InterCallButton } from "@/components/messages/InterCallButton";
import { interCallService } from "@/http/services/inter-call.service";
import { useUserStore } from "@/stores/user-store";

export default function InterCallPage() {
  const [phoneNumber, setPhoneNumber] = useState("+977");
  const { user } = useUserStore();

  const { data: status, isLoading } = useQuery({
    queryKey: ["inter-call-page-status"],
    queryFn: () => interCallService.getStatus(),
    enabled: Boolean(user),
    staleTime: 15_000,
    refetchOnWindowFocus: true,
  });

  if (!user) {
    return (
      <main className="mx-auto min-h-[70vh] max-w-xl px-4 py-24">
        <Card>
          <CardContent className="p-8 text-center">
            <PhoneCall className="mx-auto h-10 w-10 text-primary" />
            <h1 className="mt-4 text-2xl font-bold">Inter Call</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Call गर्न पहिले login गर्नुहोस्।
            </p>
            <Link
              href="/auth/login?redirect=%2Finter-call"
              className="mt-5 inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
            >
              Login
            </Link>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-[70vh] max-w-xl px-4 py-24">
      <Card className="overflow-hidden">
        <CardHeader className="border-b bg-muted/40">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10">
              <PhoneCall className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Inter Call</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                RoomKhoj बाट direct phone number मा call गर्नुहोस्।
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-5 p-6">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading Inter Call…</p>
          ) : !status?.enabled ? (
            <div className="rounded-xl border border-dashed p-5 text-center">
              <p className="font-semibold">Inter Call अहिले OFF छ</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Admin ले ON गरेपछि यहाँबाट call गर्न मिल्छ।
              </p>
            </div>
          ) : (
            <>
              <div>
                <label htmlFor="inter-call-number" className="mb-2 block text-sm font-semibold">
                  Phone number
                </label>
                <Input
                  id="inter-call-number"
                  type="tel"
                  inputMode="tel"
                  value={phoneNumber}
                  onChange={(event) => setPhoneNumber(event.target.value)}
                  placeholder="+97798XXXXXXXX"
                  autoComplete="tel"
                  className="h-12 text-base"
                />
                <p className="mt-2 text-xs text-muted-foreground">
                  Country code सहित number राख्नुहोस्, जस्तै +97798XXXXXXXX.
                </p>
              </div>

              <div className="flex items-center justify-between rounded-xl border p-4">
                <div>
                  <p className="font-semibold">Call now</p>
                  <p className="text-xs text-muted-foreground">
                    Browser microphone permission allow गर्नुहोस्।
                  </p>
                </div>
                <InterCallButton phoneNumber={phoneNumber} />
              </div>

              <div className="flex items-start gap-2 rounded-xl bg-muted/50 p-3 text-xs text-muted-foreground">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
                <p>
                  Call Twilio मार्फत जान्छ। Recipient लाई server मा configured RoomKhoj Twilio caller ID देखिन्छ।
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
