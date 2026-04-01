"use client";

import { UseFormReturn } from "react-hook-form";
import { MapPin, CheckCircle2, Pencil } from "lucide-react";
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
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CreateRoomFormValues } from "@/schema/room";
import MapPicker from "@/components/admin/rooms/MapPicker";
import { extractLocationName, formatDistance } from "@/lib/room-utils";
import { DEFAULT_LAT, DEFAULT_LNG } from "@/lib/constants/app.constants";
import { SectionHeader } from "@/components/Formprimitives";

interface LocationTabProps {
  form: UseFormReturn<CreateRoomFormValues>;
}

export function LocationTab({ form }: LocationTabProps) {
  const currentLat = form.watch("location.latitude");
  const currentLng = form.watch("location.longitude");
  const isValidLocation =
    currentLat !== DEFAULT_LAT || currentLng !== DEFAULT_LNG;
  const distanceVal = form.watch("distanceHighwayM");

  const handleLocationSelect = (location: {
    lat: number;
    lng: number;
    name?: string;
    formattedAddress?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
  }) => {
    const extractedName = location.formattedAddress
      ? extractLocationName(location.formattedAddress)
      : location.name || "Selected Location";
    form.setValue("location.latitude", location.lat);
    form.setValue("location.longitude", location.lng);
    form.setValue("location.name", extractedName);
    form.setValue("location.formattedAddress", location.formattedAddress || "");
    form.setValue("location.city", location.city || "");
    form.setValue("location.state", location.state || "");
    form.setValue("location.country", location.country || "");
    form.setValue("location.postalCode", location.postalCode || "");
    if (location.formattedAddress)
      form.setValue("address", location.formattedAddress);
    form.trigger("location");
    toast.success("📍 Location updated!");
  };

  return (
    <div className="space-y-4">
      <SectionHeader
        icon={MapPin}
        title="Location & Map"
        subtitle="स्थान र नक्सा — Click the map to set or update location"
      />

      {/* Location status pill */}
      {isValidLocation && (
        <div className="flex items-center gap-2 p-3 bg-green-50 rounded-xl border border-green-200">
          <CheckCircle2
            className="w-4 h-4 text-green-600 flex-shrink-0"
            aria-hidden
          />
          <p className="text-sm font-semibold text-green-700 truncate flex-1">
            {form.getValues("location.formattedAddress") ||
              `${currentLat.toFixed(5)}, ${currentLng.toFixed(5)}`}
          </p>
          <Badge
            variant="outline"
            className="text-xs border-green-300 text-green-700 flex-shrink-0"
          >
            ✓ Set
          </Badge>
        </div>
      )}

      {/* Map */}
      <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
        <MapPicker
          onLocationSelect={handleLocationSelect}
          initialLocation={
            isValidLocation ? { lat: currentLat, lng: currentLng } : null
          }
        />
      </div>

      {/* Full address (manual edit) */}
      <FormField
        control={form.control}
        name="location.formattedAddress"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-sm text-slate-700 font-semibold flex items-center gap-1.5">
              <Pencil className="w-3.5 h-3.5" aria-hidden />
              Full Address / पूरा ठेगाना
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0 border-amber-300 text-amber-600"
              >
                Editable
              </Badge>
            </FormLabel>
            <FormControl>
              <Textarea
                placeholder="Auto-filled from map — or edit manually / नक्साबाट स्वत: भरिन्छ"
                className="rounded-xl border-slate-200 resize-y min-h-[80px] focus:border-primary transition-colors"
                {...field}
              />
            </FormControl>
            <FormDescription className="text-xs">
              तपाईं यो ठेगाना सीधै सम्पादन गर्न सक्नुहुन्छ
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Location sub-fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <FormField
          control={form.control}
          name="location.name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm text-slate-600">
                Location Name / स्थानको नाम
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g. Lakeside, Srijana Chowk"
                  {...field}
                  className="h-11 rounded-xl border-slate-200 focus:border-primary transition-colors"
                />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="location.city"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm text-slate-600">
                City / शहर
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g. Pokhara"
                  {...field}
                  className="h-11 rounded-xl border-slate-200 focus:border-primary transition-colors"
                />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="location.state"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm text-slate-600">
                Province / प्रदेश
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g. Gandaki"
                  {...field}
                  className="h-11 rounded-xl border-slate-200 focus:border-primary transition-colors"
                />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="location.postalCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm text-slate-600">
                Postal Code / हुलाक
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g. 33700"
                  {...field}
                  className="h-11 rounded-xl border-slate-200 focus:border-primary transition-colors"
                />
              </FormControl>
            </FormItem>
          )}
        />
      </div>

      {/* Coordinates display */}
      {isValidLocation && (
        <div className="flex gap-4 p-3 bg-primary/5 rounded-xl border border-primary/20 text-xs font-mono text-slate-600">
          <span>Lat: {currentLat.toFixed(6)}</span>
          <span>Lng: {currentLng.toFixed(6)}</span>
        </div>
      )}

      <Separator />

      {/* Distance from highway */}
      <div className="space-y-3">
        <div>
          <p className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
            🛣️ Distance from Highway / राजमार्गबाट दूरी
            <Badge
              variant="outline"
              className="text-[10px] px-1.5 py-0 border-slate-300 text-slate-400"
            >
              Optional
            </Badge>
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
                    className="h-11 pr-20 rounded-xl border-slate-200 focus:border-primary transition-colors"
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
              <FormDescription className="text-xs">
                राजमार्गबाट कति मिटर टाढा छ? — How many metres from the highway?
              </FormDescription>
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
      </div>
    </div>
  );
}
