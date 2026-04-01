"use client";

import { UseFormReturn } from "react-hook-form";
import {
  Heart,
  Cigarette,
  Wine,
  UtensilsCrossed,
  Moon,
  Baby,
  Clock,
  Shirt,
  Sun,
} from "lucide-react";
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { TenantType } from "@/types/room.types";
import { CreateRoomFormValues } from "@/schema/room";
import { SectionHeader, TriToggle } from "@/components/Formprimitives";
import {
  COMMUNITY_OPTIONS,
  GENDER_PREFERENCE_OPTIONS,
  TENANT_TYPE_OPTIONS,
} from "@/lib/constants/app.constants";
import { formatDistance } from "@/lib/room-utils";

interface PreferencesTabProps {
  form: UseFormReturn<CreateRoomFormValues>;
  selectedTenantTypes: TenantType[];
  onToggleTenantType: (type: TenantType) => void;
  ownerCommunityCustom: string;
  setOwnerCommunityCustom: (v: string) => void;
  showOwnerCommunityInput: boolean;
  setShowOwnerCommunityInput: (v: boolean) => void;
}

export function PreferencesTab({
  form,
  selectedTenantTypes,
  onToggleTenantType,
  ownerCommunityCustom,
  setOwnerCommunityCustom,
  showOwnerCommunityInput,
  setShowOwnerCommunityInput,
}: PreferencesTabProps) {
  const communityIsMuted = (communityValue: string) => {
    const ownerVal = form.watch("ownerCommunity");
    if (
      !ownerVal ||
      ownerVal === "Any" ||
      ownerVal === "Other" ||
      ownerVal === ""
    )
      return false;
    if (
      ownerVal === "Hindu" &&
      (communityValue === "Muslim" || communityValue === "Christian")
    )
      return true;
    return false;
  };

  const distanceVal = form.watch("distanceHighwayM");

  return (
    <div className="space-y-6">
      <SectionHeader
        icon={Heart}
        title="Tenant Preferences"
        subtitle="Optional — सबै खाली छोड्न मिल्छ"
      />

      {/* ── Tenant Type ── */}
      <section className="space-y-3">
        <div>
          <p className="text-sm font-bold text-slate-800">
            Who is your ideal tenant? / आदर्श भाडाटारु
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            Multiple choice — Optional
          </p>
        </div>
        <div
          className="grid grid-cols-2 sm:grid-cols-3 gap-2"
          role="group"
          aria-label="Tenant type"
        >
          {TENANT_TYPE_OPTIONS.map((opt) => {
            const isSelected = selectedTenantTypes.includes(opt.value);
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onToggleTenantType(opt.value)}
                aria-pressed={isSelected}
                className={cn(
                  "flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 text-xs font-semibold transition-all cursor-pointer",
                  isSelected
                    ? "border-primary bg-primary/5 text-primary shadow-sm"
                    : "border-slate-200 bg-white text-slate-600 hover:border-primary/30",
                )}
              >
                <span className="text-xl" aria-hidden>
                  {opt.emoji}
                </span>
                <span>{opt.labelEn}</span>
                <span className="text-[10px] opacity-70">{opt.labelNp}</span>
              </button>
            );
          })}
        </div>
      </section>

      <Separator />

      {/* ── Gender Preference ── */}
      <section className="space-y-3">
        <p className="text-sm font-bold text-slate-800">
          Gender Preference / लिङ्ग प्राथमिकता
        </p>
        <FormField
          control={form.control}
          name="genderPreference"
          render={({ field }) => (
            <div
              className="grid grid-cols-3 gap-2"
              role="radiogroup"
              aria-label="Gender preference"
            >
              {GENDER_PREFERENCE_OPTIONS.map((opt) => (
                <button
                  key={opt.v}
                  type="button"
                  role="radio"
                  aria-checked={field.value === opt.v}
                  onClick={() => field.onChange(opt.v)}
                  className={cn(
                    "flex flex-col items-center gap-1 p-3 rounded-xl border-2 text-xs font-semibold transition-all cursor-pointer",
                    field.value === opt.v
                      ? "border-indigo-500 bg-indigo-50 text-indigo-700 shadow-sm"
                      : "border-slate-200 bg-white text-slate-600 hover:border-indigo-200",
                  )}
                >
                  <span className="text-xl" aria-hidden>
                    {opt.emoji}
                  </span>
                  <span>{opt.en}</span>
                  <span className="text-[10px] opacity-70">{opt.np}</span>
                </button>
              ))}
            </div>
          )}
        />
      </section>

      <Separator />

      {/* ── Lifestyle Rules ── */}
      <section className="space-y-3">
        <p className="text-sm font-bold text-slate-800">
          Lifestyle Rules / जीवनशैली नियमहरू
        </p>
        <FormField
          control={form.control}
          name="smokingAllowed"
          render={({ field }) => (
            <TriToggle
              label="Smoking Allowed?"
              labelNp="धुम्रपान अनुमति छ?"
              icon={Cigarette}
              value={field.value ?? null}
              onChange={field.onChange}
            />
          )}
        />
        <FormField
          control={form.control}
          name="alcoholAllowed"
          render={({ field }) => (
            <TriToggle
              label="Alcohol Allowed?"
              labelNp="मदिरा अनुमति छ?"
              icon={Wine}
              value={field.value ?? null}
              onChange={field.onChange}
            />
          )}
        />
        <FormField
          control={form.control}
          name="nonVegAllowed"
          render={({ field }) => (
            <TriToggle
              label="Non-Vegetarian Allowed?"
              labelNp="माछामासु अनुमति छ?"
              icon={UtensilsCrossed}
              value={field.value ?? null}
              onChange={field.onChange}
            />
          )}
        />
        <FormField
          control={form.control}
          name="buffaloMeatAllowed"
          render={({ field }) => (
            <TriToggle
              label="Buffalo Meat Allowed?"
              labelNp="राँगाको मासु?"
              icon={UtensilsCrossed}
              value={field.value ?? null}
              onChange={field.onChange}
            />
          )}
        />
        <FormField
          control={form.control}
          name="porkAllowed"
          render={({ field }) => (
            <TriToggle
              label="Pork Allowed?"
              labelNp="सुँगुरको मासु?"
              icon={UtensilsCrossed}
              value={field.value ?? null}
              onChange={field.onChange}
            />
          )}
        />
        <FormField
          control={form.control}
          name="lateNightAllowed"
          render={({ field }) => (
            <TriToggle
              label="Late Night Entry?"
              labelNp="राति ढिलो आउन मिल्छ?"
              icon={Moon}
              value={field.value ?? null}
              onChange={field.onChange}
            />
          )}
        />
        <FormField
          control={form.control}
          name="babyAllowed"
          render={({ field }) => (
            <TriToggle
              label="Baby / Children Allowed?"
              labelNp="बच्चा राख्न मिल्छ?"
              icon={Baby}
              value={field.value ?? null}
              onChange={field.onChange}
            />
          )}
        />
      </section>

      <Separator />

      {/* ── Gate Closing Time ── */}
      <section className="space-y-3">
        <p className="text-sm font-bold text-slate-800">
          Gate Closing Time / गेट बन्द हुने समय{" "}
          <span className="text-slate-400 font-normal text-xs">(Optional)</span>
        </p>
        <FormField
          control={form.control}
          name="gateClosingTime"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <div className="relative">
                  <Clock
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none"
                    aria-hidden
                  />
                  <Input
                    type="time"
                    className="h-11 pl-10 rounded-xl border-slate-200 focus:border-primary transition-colors"
                    {...field}
                  />
                </div>
              </FormControl>
            </FormItem>
          )}
        />
      </section>

      <Separator />

      {/* ── Sunlight & Facilities ── */}
      <section className="space-y-3">
        <p className="text-sm font-bold text-slate-800">
          Sunlight & Facilities / घाम र सुविधाहरू
        </p>
        <FormField
          control={form.control}
          name="hasSunlight"
          render={({ field }) => (
            <TriToggle
              label="Sunlight enters room?"
              labelNp="कोठामा घाम लाग्छ?"
              icon={Sun}
              value={field.value ?? null}
              onChange={field.onChange}
            />
          )}
        />
        <FormField
          control={form.control}
          name="hasClothDryingArea"
          render={({ field }) => (
            <TriToggle
              label="Clothes drying area?"
              labelNp="लुगा सुकाउने ठाउँ?"
              icon={Shirt}
              value={field.value ?? null}
              onChange={field.onChange}
            />
          )}
        />
      </section>

      <Separator />

      {/* ── Existing Problems ── */}
      <section className="space-y-3">
        <p className="text-sm font-bold text-slate-800">
          Existing Problems / कुनै समस्या?{" "}
          <span className="text-slate-400 font-normal text-xs">(Optional)</span>
        </p>
        <FormField
          control={form.control}
          name="existingProblems"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Textarea
                  placeholder="e.g. Dampness, narrow stairs... / छैन"
                  className="rounded-xl border-slate-200 resize-none min-h-[80px] focus:border-primary transition-colors"
                  {...field}
                />
              </FormControl>
            </FormItem>
          )}
        />
      </section>

      <Separator />

      {/* ── Other Rules ── */}
      <section className="space-y-3">
        <p className="text-sm font-bold text-slate-800">
          Other Rules / अन्य नियमहरू{" "}
          <span className="text-slate-400 font-normal text-xs">(Optional)</span>
        </p>
        <FormField
          control={form.control}
          name="otherRules"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Textarea
                  placeholder="e.g. No loud music after 9PM..."
                  className="rounded-xl border-slate-200 resize-none min-h-[80px] focus:border-primary transition-colors"
                  {...field}
                />
              </FormControl>
            </FormItem>
          )}
        />
      </section>

      <Separator />

      {/* ── Owner Community ── */}
      <section className="space-y-3">
        <p className="text-sm font-bold text-slate-800">
          Owner's Community / घरधनीको समुदाय
        </p>
        <FormField
          control={form.control}
          name="ownerCommunity"
          render={({ field }) => (
            <FormItem>
              <div
                className="grid grid-cols-2 sm:grid-cols-3 gap-2"
                role="radiogroup"
              >
                {COMMUNITY_OPTIONS.map((opt) => {
                  const isMuted = communityIsMuted(opt.value);
                  const isSelected =
                    field.value === opt.value ||
                    (opt.value === "Other" && showOwnerCommunityInput);
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      disabled={isMuted}
                      onClick={() => {
                        field.onChange(opt.value);
                        setShowOwnerCommunityInput(opt.value === "Other");
                      }}
                      className={cn(
                        "flex flex-col items-center gap-1 p-3 rounded-xl border-2 text-xs font-semibold transition-all cursor-pointer",
                        isSelected
                          ? "border-amber-500 bg-amber-50 text-amber-800 shadow-sm"
                          : isMuted
                            ? "border-slate-100 bg-slate-50 text-slate-300 opacity-40 cursor-not-allowed"
                            : "border-slate-200 bg-white text-slate-600 hover:border-amber-200",
                      )}
                    >
                      <span>{opt.labelEn}</span>
                      <span className="text-[10px] opacity-70">
                        {opt.labelNp}
                      </span>
                    </button>
                  );
                })}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        {showOwnerCommunityInput && (
          <Input
            placeholder="Please specify / आफ्नो समुदाय लेख्नुहोस्"
            value={ownerCommunityCustom}
            onChange={(e) => setOwnerCommunityCustom(e.target.value)}
            className="h-11 rounded-xl border-slate-200 focus:border-primary transition-colors"
          />
        )}
      </section>

      <Separator />

      {/* ── Community Preference ── */}
      <section className="space-y-3">
        <p className="text-sm font-bold text-slate-800">
          Community Preference for Tenants{" "}
          <span className="text-slate-400 font-normal text-xs">(Optional)</span>
        </p>
        <FormField
          control={form.control}
          name="communityPreference"
          render={({ field }) => (
            <FormItem>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  {
                    v: "All community are welcome",
                    en: "All community are welcome ✅",
                    np: "सबैलाई स्वागत",
                  },
                  { v: "", en: "Specific preference", np: "विशेष प्राथमिकता" },
                ].map((opt) => (
                  <button
                    key={opt.v}
                    type="button"
                    onClick={() => field.onChange(opt.v)}
                    className={cn(
                      "flex flex-col items-start gap-0.5 p-3 rounded-xl border-2 text-xs font-semibold transition-all cursor-pointer text-left",
                      field.value === opt.v
                        ? "border-green-500 bg-green-50 text-green-800 shadow-sm"
                        : "border-slate-200 bg-white text-slate-600 hover:border-green-200",
                    )}
                  >
                    <span>{opt.en}</span>
                    <span className="text-[10px] opacity-70">{opt.np}</span>
                  </button>
                ))}
              </div>
              {field.value !== "All community are welcome" && (
                <Textarea
                  placeholder="e.g. Hindu family preferred / हिन्दू परिवार मात्र"
                  className="mt-2 rounded-xl border-slate-200 resize-none min-h-[70px] focus:border-primary transition-colors"
                  value={field.value || ""}
                  onChange={(e) => field.onChange(e.target.value)}
                />
              )}
              <FormMessage />
            </FormItem>
          )}
        />
      </section>

      <Separator />

      {/* ── Highway Distance ── */}
      <section className="space-y-3">
        <div>
          <p className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
            🛣️ Distance from Highway / राजमार्गबाट दूरी
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            मिटरमा लेख्नुहोस् — Enter in metres (Optional)
          </p>
        </div>
        <FormField
          control={form.control}
          name="distanceHighwayM"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <div className="relative">
                  <Input
                    type="number"
                    inputMode="numeric"
                    min="0"
                    step="10"
                    placeholder="e.g. 200"
                    className="h-12 pr-20 rounded-xl border-slate-200 focus:border-primary transition-colors text-base"
                    value={field.value ?? ""}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value === "" ? null : Number(e.target.value),
                      )
                    }
                  />
                  <span
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 pointer-events-none select-none"
                    aria-hidden
                  >
                    metres
                  </span>
                </div>
              </FormControl>
              {distanceVal !== null &&
                distanceVal !== undefined &&
                Number(distanceVal) > 0 && (
                  <p className="text-xs text-slate-500 mt-1">
                    ≈ {formatDistance(Number(distanceVal))} — राजमार्गबाट
                  </p>
                )}
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
          <p className="text-xs text-slate-500">
            💡 <strong>Tip:</strong> 1 km = 1000 m &nbsp;·&nbsp; नजिक भए सानो
            नम्बर, टाढा भए ठूलो
          </p>
        </div>
      </section>
    </div>
  );
}
