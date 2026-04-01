"use client";

import { UseFormReturn } from "react-hook-form";
import {
  Bed,
  Users,
  Droplets,
  Building2,
  Home,
  Ruler,
  Sun,
  Moon,
  CheckCircle2,
  X,
} from "lucide-react";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { CreateRoomFormValues } from "@/schema/room";
import { CounterField, SectionHeader } from "@/components/Formprimitives";
import {
  EVENING_SLOT_VALUES,
  EVENING_SLOTS,
  MORNING_SLOT_VALUES,
  MORNING_SLOTS,
  WATER_SUPPLY_OPTIONS,
} from "@/lib/constants/app.constants";

interface DetailsTabProps {
  form: UseFormReturn<CreateRoomFormValues>;
  waterSupplyType: string;
  setWaterSupplyType: (type: string) => void;
}

export function DetailsTab({
  form,
  waterSupplyType,
  setWaterSupplyType,
}: DetailsTabProps) {
  const ownerLivesInHouse = form.watch("ownerLivesInHouse");

  return (
    <div className="space-y-6">
      <SectionHeader
        icon={Bed}
        title="Room Details"
        subtitle="क्षमता र नियमहरू — Capacity, floor, and house rules"
      />

      {/* ── Capacity & Size ── */}
      <section className="space-y-3">
        <p className="text-sm font-bold text-slate-700">
          Capacity & Size / क्षमता र आकार
        </p>

        <FormField
          control={form.control}
          name="roomCapacity"
          render={({ field }) => (
            <CounterField
              label="Room Capacity"
              labelNp="कोठामा बस्ने संख्या"
              icon={Users}
              value={field.value || 1}
              onChange={field.onChange}
              min={1}
              max={20}
            />
          )}
        />

        <FormField
          control={form.control}
          name="bathroomCapacity"
          render={({ field }) => (
            <CounterField
              label="Bathroom Capacity"
              labelNp="बाथरुम क्षमता"
              icon={Droplets}
              value={field.value || 1}
              onChange={field.onChange}
              min={1}
              max={20}
            />
          )}
        />

        <FormField
          control={form.control}
          name="floorNumber"
          render={({ field }) => (
            <CounterField
              label="Floor Number"
              labelNp="तला नम्बर"
              description="0 = Ground Floor"
              icon={Building2}
              value={field.value ?? 0}
              onChange={field.onChange}
              min={0}
              max={30}
            />
          )}
        />

        <FormField
          control={form.control}
          name="totalHouseCapacity"
          render={({ field }) => (
            <CounterField
              label="Total House Capacity"
              labelNp="घरको जम्मा क्षमता"
              icon={Home}
              value={field.value || 1}
              onChange={field.onChange}
              min={1}
              max={100}
            />
          )}
        />

        <FormField
          control={form.control}
          name="currentOccupants"
          render={({ field }) => (
            <CounterField
              label="Current Occupants"
              labelNp="हाल बस्ने व्यक्तिहरू"
              icon={Users}
              value={field.value || 0}
              onChange={field.onChange}
              min={0}
              max={100}
            />
          )}
        />

        <FormField
          control={form.control}
          name="roomArea"
          render={({ field }) => {
            const raw = field.value;
            const displayVal =
              !raw || raw === 0 || isNaN(Number(raw)) ? "" : String(raw);
            return (
              <FormItem>
                <FormLabel className="text-slate-700 font-semibold">
                  Room Area / क्षेत्रफल{" "}
                  <span className="text-red-500" aria-hidden>
                    *
                  </span>
                </FormLabel>
                <FormControl>
                  <div className="relative group">
                    <Ruler
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none"
                      aria-hidden
                    />
                    <Input
                      type="text"
                      inputMode="decimal"
                      placeholder="e.g. 30"
                      value={displayVal}
                      name={field.name}
                      ref={field.ref}
                      onBlur={field.onBlur}
                      onChange={(e) => {
                        const val = e.target.value
                          .replace(/[^0-9.]/g, "")
                          .replace(/(\..*)\./g, "$1");
                        if (val === "" || val === ".") {
                          field.onChange("");
                        } else {
                          const num = parseFloat(val);
                          field.onChange(isNaN(num) ? "" : num);
                        }
                      }}
                      className="h-12 pl-10 pr-14 rounded-xl border-slate-200 focus:border-primary transition-colors"
                    />
                    {displayVal !== "" && (
                      <button
                        type="button"
                        tabIndex={-1}
                        onClick={() => field.onChange("")}
                        aria-label="Clear room area"
                        className="absolute right-8 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-slate-200 hover:bg-red-100 text-slate-400 hover:text-red-500 flex items-center justify-center transition-all cursor-pointer opacity-0 group-hover:opacity-100"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                    <span
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none select-none"
                      aria-hidden
                    >
                      m²
                    </span>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            );
          }}
        />
      </section>

      <Separator />

      {/* ── Water Supply ── */}
      <section className="space-y-3">
        <p className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
          <Droplets className="w-4 h-4 text-blue-500" aria-hidden />
          पानी आपूर्ति / Water Supply
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {WATER_SUPPLY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setWaterSupplyType(opt.value)}
              aria-pressed={waterSupplyType === opt.value}
              className={cn(
                "flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 text-xs font-semibold transition-all cursor-pointer",
                waterSupplyType === opt.value
                  ? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm"
                  : "border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50/30",
              )}
            >
              <span className="text-xl" aria-hidden>
                {opt.emoji}
              </span>
              {opt.label}
            </button>
          ))}
        </div>

        {waterSupplyType === "24-hour" && (
          <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
            <CheckCircle2
              className="w-5 h-5 text-emerald-600 flex-shrink-0"
              aria-hidden
            />
            <p className="text-sm font-semibold text-emerald-800">
              २४ घण्टा पानी उपलब्ध
            </p>
          </div>
        )}

        {(waterSupplyType === "morning-only" ||
          waterSupplyType === "morning-evening") && (
          <FormField
            control={form.control}
            name="waterSupplyTimings.morning"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm text-slate-700 flex items-center gap-1">
                  <Sun className="w-3.5 h-3.5 text-amber-500" aria-hidden />
                  Morning / बिहान
                </FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-11 rounded-xl border-slate-200 cursor-pointer">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="rounded-xl">
                    {MORNING_SLOTS.map((slot, i) => (
                      <SelectItem
                        key={MORNING_SLOT_VALUES[i]}
                        value={MORNING_SLOT_VALUES[i]}
                        className="cursor-pointer py-3"
                      >
                        {slot}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
        )}

        {(waterSupplyType === "evening-only" ||
          waterSupplyType === "morning-evening") && (
          <FormField
            control={form.control}
            name="waterSupplyTimings.evening"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm text-slate-700 flex items-center gap-1">
                  <Moon className="w-3.5 h-3.5 text-indigo-500" aria-hidden />
                  Evening / साँझ
                </FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-11 rounded-xl border-slate-200 cursor-pointer">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="rounded-xl">
                    {EVENING_SLOTS.map((slot, i) => (
                      <SelectItem
                        key={EVENING_SLOT_VALUES[i]}
                        value={EVENING_SLOT_VALUES[i]}
                        className="cursor-pointer py-3"
                      >
                        {slot}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="waterSupplyTimings.notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm text-slate-600">
                Additional Notes / थप टिप्पणी
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g. No water on Saturdays..."
                  {...field}
                  disabled={waterSupplyType === "24-hour"}
                  className="h-11 rounded-xl border-slate-200 transition-colors disabled:opacity-50"
                />
              </FormControl>
            </FormItem>
          )}
        />
      </section>

      <Separator />

      {/* ── House Rules ── */}
      <section className="space-y-3">
        <p className="text-sm font-bold text-slate-700">
          House Rules / घरका नियमहरू
        </p>

        <FormField
          control={form.control}
          name="allowsWomen"
          render={({ field }) => (
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  Women tenants allowed?
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  महिला भाडाटारु अनुमति छ?
                </p>
              </div>
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
                aria-label="Women tenants allowed"
              />
            </div>
          )}
        />

        <FormField
          control={form.control}
          name="ownerLivesInHouse"
          render={({ field }) => (
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  Owner lives in building?
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  घरधनी घरमा बस्छन्?
                </p>
              </div>
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
                aria-label="Owner lives in house"
              />
            </div>
          )}
        />

        {ownerLivesInHouse && (
          <FormField
            control={form.control}
            name="ownerFloorNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm text-slate-700 font-semibold">
                  Owner's Floor / घरधनी कुन तलामा?
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    inputMode="numeric"
                    min="0"
                    placeholder="e.g. 2"
                    className="h-11 rounded-xl border-slate-200 focus:border-primary transition-colors"
                    value={field.value ?? ""}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value === "" ? null : Number(e.target.value),
                      )
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
      </section>
    </div>
  );
}
