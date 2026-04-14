"use client";

import { UseFormReturn } from "react-hook-form";
import { Home, X } from "lucide-react";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RoomCategory } from "@/types/room.types";
import { CreateRoomFormValues } from "@/schema/room";
import { SectionHeader } from "@/components/Formprimitives";

interface BasicTabProps {
  form: UseFormReturn<CreateRoomFormValues>;
}

export function BasicTab({ form }: BasicTabProps) {
  return (
    <div className="space-y-5">
      <SectionHeader
        icon={Home}
        title="Basic Information"
        subtitle="आधारभूत जानकारी — Update the core details"
      />

      <FormField
        control={form.control}
        name="title"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-slate-700 font-semibold">
              Room Title / कोठाको शीर्षक{" "}
              <span className="text-red-500" aria-hidden>
                *
              </span>
            </FormLabel>
            <FormControl>
              <Input
                placeholder="e.g. Modern Room with AC & WiFi"
                {...field}
                className="h-12 rounded-xl border-slate-200 focus:border-primary transition-colors"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-slate-700 font-semibold">
              Description / विवरण{" "}
              <span className="text-red-500" aria-hidden>
                *
              </span>
            </FormLabel>
            <FormControl>
              <Textarea
                placeholder="कोठाको बारेमा लेख्नुहोस्..."
                className="min-h-[120px] rounded-xl border-slate-200 resize-none focus:border-primary transition-colors"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-slate-700 font-semibold">
                Room Type / प्रकार{" "}
                <span className="text-red-500" aria-hidden>
                  *
                </span>
              </FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="h-12 rounded-xl border-slate-200 cursor-pointer">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="rounded-xl max-h-[400px]">
                  {Object.values(RoomCategory).map((cat) => {
                    let icon = "";
                    switch (cat) {
                      case RoomCategory.FLAT:
                        icon = "🏢";
                        break;
                      case RoomCategory.SINGLE:
                        icon = "🚪";
                        break;
                      case RoomCategory.APARTMENT:
                        icon = "🏙️";
                        break;
                      case RoomCategory.SHARED:
                        icon = "👥";
                        break;
                      case RoomCategory.DOUBLE:
                        icon = "👥👥";
                        break;
                      case RoomCategory.HOUSE:
                        icon = "🏠";
                        break;
                      case RoomCategory.ATTACHED_BATHROOM:
                        icon = "🚽";
                        break;
                      case RoomCategory.SHUTTER:
                        icon = "🚪🏪";
                        break;
                      case RoomCategory.HOTEL:
                        icon = "🏨";
                        break;
                      case RoomCategory.OFFICE_SPACE:
                        icon = "💼";
                        break;
                      case RoomCategory.HOSTEL:
                        icon = "🏛️";
                        break;
                      default:
                        icon = "🏠";
                    }
                    return (
                      <SelectItem
                        key={cat}
                        value={cat}
                        className="capitalize cursor-pointer py-3 text-base px-3 hover:bg-primary/5 focus:bg-primary/80 transition-all"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xl min-w-[32px]">{icon}</span>
                          <span className="font-medium">{cat}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/*
          ── PRICE FIELD ──────────────────────────────────────────────────────
          Root cause of NaN bug:
            type="number" + field.onChange(undefined) → Zod sees NaN → "Expected number, received nan"

          Fix:
            1. type="text" inputMode="numeric"  → full control, no browser number quirks
            2. Store number | ""                → "" triggers Zod "required" with friendly message
            3. Clear button is always reliable  → sets field to ""
            4. Schema uses z.coerce.number()    → "" coerces to NaN, caught with custom message
          ────────────────────────────────────────────────────────────────────
        */}
        <FormField
          control={form.control}
          name="price"
          render={({ field }) => {
            const raw = field.value;
            const displayVal =
              !raw || raw === 0 || isNaN(Number(raw)) ? "" : String(raw);

            return (
              <FormItem>
                <FormLabel className="text-slate-700 font-semibold">
                  Monthly Rent / मासिक भाडा{" "}
                  <span className="text-red-500" aria-hidden>
                    *
                  </span>
                </FormLabel>
                <FormControl>
                  <div className="relative group">
                    <span
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm pointer-events-none select-none"
                      aria-hidden
                    >
                      रु.
                    </span>
                    <Input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder="8000"
                      value={displayVal}
                      name={field.name}
                      ref={field.ref}
                      onBlur={field.onBlur}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, "");
                        if (val === "") {
                          field.onChange("");
                        } else {
                          const num = parseInt(val, 10);
                          field.onChange(isNaN(num) ? "" : num);
                        }
                      }}
                      className="h-12 pl-10 pr-9 rounded-xl border-slate-200 focus:border-primary transition-colors"
                    />
                    {displayVal !== "" && (
                      <button
                        type="button"
                        tabIndex={-1}
                        onClick={() => field.onChange("")}
                        aria-label="Clear monthly rent"
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-slate-200 hover:bg-red-100 text-slate-400 hover:text-red-500 flex items-center justify-center transition-all cursor-pointer opacity-0 group-hover:opacity-100"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </FormControl>
                <FormDescription className="text-xs text-slate-500">
                  मासिक भाडा रकम — Monthly rent in NPR
                </FormDescription>
                <FormMessage />
              </FormItem>
            );
          }}
        />
      </div>
    </div>
  );
}
