"use client";

import { UseFormReturn } from "react-hook-form";
import { User, Phone, Instagram } from "lucide-react";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { CreateRoomFormValues } from "@/schema/room";
import { SectionHeader } from "@/components/Formprimitives";

interface ContactTabProps {
  form: UseFormReturn<CreateRoomFormValues>;
  isAdmin: boolean;
}

export function ContactTab({ form, isAdmin }: ContactTabProps) {
  return (
    <div className="space-y-5">
      <SectionHeader
        icon={User}
        title="Contact Information / सम्पर्क जानकारी"
        subtitle="How can tenants reach the owner?"
      />

      <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-xl border border-amber-200">
        <span className="text-amber-500 text-lg flex-shrink-0">🔒</span>
        <div>
          <p className="text-sm font-semibold text-amber-800">
            Shown only after room unlock
          </p>
          <p className="text-xs text-amber-600 mt-0.5">
            अनलक पछि मात्र भाडाटारुलाई देखिन्छ
          </p>
        </div>
      </div>

      {/* Owner name */}
      <FormField
        control={form.control}
        name="contactPerson"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-slate-700 font-semibold flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" aria-hidden />
              Owner Name / घरधनीको नाम{" "}
              <span className="text-red-500" aria-hidden>
                *
              </span>
            </FormLabel>
            <FormControl>
              <Input
                placeholder="e.g. Ram Prasad Sharma"
                {...field}
                className="h-12 rounded-xl border-slate-200 focus:border-primary transition-colors"
              />
            </FormControl>
            <FormDescription className="text-xs">
              Full name / पुरा नाम
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Owner phone */}
      <FormField
        control={form.control}
        name="contactPhone"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-slate-700 font-semibold flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5" aria-hidden />
              Owner Phone / घरधनीको फोन{" "}
              <span className="text-red-500" aria-hidden>
                *
              </span>
            </FormLabel>
            <FormControl>
              <div className="relative">
                <Phone
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none"
                  aria-hidden
                />
                <Input
                  type="tel"
                  inputMode="tel"
                  placeholder="+977 98XXXXXXXX"
                  className="h-12 pl-10 rounded-xl border-slate-200 focus:border-primary transition-colors"
                  {...field}
                />
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <Separator />

      {/* TikTok URL */}
      <FormField
        control={form.control}
        name="tiktokUrl"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-slate-700 font-semibold flex items-center gap-2">
              <Instagram className="w-4 h-4" aria-hidden />
              TikTok URL
              {isAdmin && (
                <Badge
                  variant="outline"
                  className="text-xs border-red-200 text-red-600"
                >
                  Admin
                </Badge>
              )}
              <Badge
                variant="outline"
                className="text-xs border-slate-200 text-slate-400"
              >
                Optional
              </Badge>
            </FormLabel>
            <FormControl>
              <Input
                type="url"
                placeholder="https://tiktok.com/@username"
                {...field}
                className="h-12 rounded-xl border-slate-200 focus:border-primary transition-colors"
              />
            </FormControl>
            <FormDescription className="text-xs">
              TikTok मा घरको भिडियो शेयर गर्नुहोस् — Share a room video on
              TikTok
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
