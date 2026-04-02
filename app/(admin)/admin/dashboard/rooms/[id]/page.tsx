"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import {
  Building2,
  MapPin,
  Users,
  Bath,
  Bed,
  CheckCircle,
  XCircle,
  Wifi,
  Car,
  Snowflake,
  Tv,
  Utensils,
  Home,
  Droplets,
  Square,
  User,
  ChevronLeft,
  ChevronRight,
  Globe,
  Maximize2,
  Phone,
  Calendar,
  Clock,
  Shield,
  Edit,
  AlertCircle,
  Cigarette,
  Wine,
  Baby,
  Moon,
  UtensilsCrossed,
  Shirt,
  Sun,
  Clock3,
  AlertTriangle,
  MessageSquare,
  Heart,
  Check,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogHeader,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, formatGateClosingTime } from "@/lib/utils";
import { Room, RoomStatus, TenantType } from "@/types/room.types";
import { roomService } from "@/http/services/room.service";
import Link from "next/link";
import { cn } from "@/lib/utils";

const MapComponent = dynamic(() => import("@/components/ui/map"), {
  ssr: false,
  loading: () => (
    <div className="h-[300px] w-full bg-gray-100 animate-pulse rounded-lg flex items-center justify-center">
      <Globe className="h-8 w-8 text-gray-400" aria-hidden />
    </div>
  ),
});

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "";

const getImageUrl = (imagePath: string) => {
  if (!imagePath) return "/placeholder-image.jpg";
  if (imagePath.startsWith("http")) return imagePath;
  return `${API_BASE_URL.replace(/\/$/, "")}/${imagePath.replace(/^\//, "")}`;
};

// ─── Water supply parser ───────────────────────────────────────────────────────

const ENGLISH_TIME_LABELS: Record<string, string> = {
  "05:00-07:00": "05:00 – 07:00",
  "06:00-08:00": "06:00 – 08:00",
  "07:00-09:00": "07:00 – 09:00",
  "08:00-10:00": "08:00 – 10:00",
  "00:00-24:00": "24 Hours",
  "16:00-18:00": "16:00 – 18:00",
  "17:00-19:00": "17:00 – 19:00",
  "18:00-20:00": "18:00 – 20:00",
  "19:00-21:00": "19:00 – 21:00",
};

interface WaterInfo {
  is24Hour: boolean;
  morning: string | null;
  evening: string | null;
  note: string | null;
}

function parseWaterTimings(
  timings:
    | { morning?: string; evening?: string; notes?: string }
    | null
    | undefined,
): WaterInfo {
  const empty: WaterInfo = {
    is24Hour: false,
    morning: null,
    evening: null,
    note: null,
  };
  if (!timings) return empty;
  const rawNotes = timings.notes ?? "";
  const typeMatch = rawNotes.match(/TYPE:([a-z0-9-]+)/i);
  const type = typeMatch?.[1]?.toLowerCase() ?? "";
  const cleanNote = rawNotes.replace(/TYPE:[a-z0-9-]+/i, "").trim() || null;
  const fmt = (slot: string | undefined): string | null => {
    if (!slot) return null;
    return ENGLISH_TIME_LABELS[slot] ?? slot;
  };
  if (type === "24-hour" || timings.morning === "00:00-24:00")
    return { is24Hour: true, morning: null, evening: null, note: null };
  if (type === "tanker")
    return { ...empty, note: cleanNote || "Tanker water available" };
  if (type === "alternate-days")
    return { ...empty, note: cleanNote || "Water available on alternate days" };
  if (type === "morning-only")
    return { ...empty, morning: fmt(timings.morning), note: cleanNote };
  if (type === "evening-only")
    return { ...empty, evening: fmt(timings.evening), note: cleanNote };
  return {
    ...empty,
    morning: fmt(timings.morning),
    evening: fmt(timings.evening),
    note: cleanNote,
  };
}

// ─── TriState badge ───────────────────────────────────────────────────────────

const TriBadge = ({
  value,
  labelYes,
  labelNo,
}: {
  value: boolean | null | undefined;
  labelYes: string;
  labelNo: string;
}) => {
  if (value === null || value === undefined)
    return (
      <Badge
        variant="outline"
        className="text-[10px] text-slate-400 cursor-default"
      >
        Not set
      </Badge>
    );
  return value ? (
    <Badge className="bg-green-100 text-green-800 border-green-200 gap-1 cursor-default">
      <Check className="w-3 h-3" /> {labelYes}
    </Badge>
  ) : (
    <Badge className="bg-red-100 text-red-800 border-red-200 gap-1 cursor-default">
      <X className="w-3 h-3" /> {labelNo}
    </Badge>
  );
};

// ─── Water Supply Display ──────────────────────────────────────────────────────

function WaterSupplyDisplay({
  timings,
}: {
  timings:
    | { morning?: string; evening?: string; notes?: string }
    | null
    | undefined;
}) {
  const info = parseWaterTimings(timings);
  if (!info.is24Hour && !info.morning && !info.evening && !info.note)
    return null;
  return (
    <>
      <Separator className="my-4" />
      <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
        <Droplets className="h-4 w-4 text-primary" aria-hidden /> Water Supply
        Timings
      </h3>
      <div className="space-y-3">
        {info.is24Hour && (
          <div className="p-3 bg-green-50 rounded-lg border border-green-200">
            <p className="text-sm font-semibold text-green-800 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" aria-hidden /> 24-hour water (२४
              घण्टा पानी उपलब्ध)
            </p>
          </div>
        )}
        {!info.is24Hour && info.note && !info.morning && !info.evening && (
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm font-semibold text-blue-800 flex items-center gap-2">
              <Droplets className="h-4 w-4" aria-hidden /> {info.note}
            </p>
          </div>
        )}
        {(info.morning || info.evening) && (
          <div
            className={`grid gap-3 ${info.morning && info.evening ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"}`}
          >
            {info.morning && (
              <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <p className="text-xs text-yellow-600 font-medium mb-1">
                  ☀️ Morning / बिहान
                </p>
                <p className="font-semibold text-gray-800">{info.morning}</p>
              </div>
            )}
            {info.evening && (
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-xs text-blue-600 font-medium mb-1">
                  🌙 Evening / साँझ
                </p>
                <p className="font-semibold text-gray-800">{info.evening}</p>
              </div>
            )}
          </div>
        )}
        {info.note && (info.morning || info.evening) && (
          <p className="text-sm text-gray-500 p-2 bg-gray-50 rounded-lg">
            <span className="font-medium">Note:</span> {info.note}
          </p>
        )}
      </div>
    </>
  );
}

// ─── Tenant Preferences Display (admin) ───────────────────────────────────────

function TenantPreferencesDisplay({ room }: { room: Room }) {
  const TENANT_EMOJIS: Record<string, string> = {
    [TenantType.STUDENT]: "🎓",
    [TenantType.WORKING_PROFESSIONAL]: "💼",
    [TenantType.FAMILY]: "👨‍👩‍👧",
    [TenantType.SINGLE_PERSON]: "🧑",
    [TenantType.COUPLE]: "💑",
    [TenantType.ANY]: "🤝",
  };

  const lifestyleFields = [
    {
      icon: Cigarette,
      label: "Smoking Allowed",
      labelNp: "धुम्रपान",
      value: room.smokingAllowed,
    },
    {
      icon: Wine,
      label: "Alcohol Allowed",
      labelNp: "मदिरा",
      value: room.alcoholAllowed,
    },
    {
      icon: UtensilsCrossed,
      label: "Non-Veg Allowed",
      labelNp: "माछामासु",
      value: room.nonVegAllowed,
    },
    {
      icon: UtensilsCrossed,
      label: "Buffalo Meat",
      labelNp: "राँगाको मासु",
      value: room.buffaloMeatAllowed,
    },
    {
      icon: UtensilsCrossed,
      label: "Pork Allowed",
      labelNp: "सुँगुरको मासु",
      value: room.porkAllowed,
    },
    {
      icon: Moon,
      label: "Late Night Entry",
      labelNp: "राति ढिलो",
      value: room.lateNightAllowed,
    },
    {
      icon: Baby,
      label: "Children Allowed",
      labelNp: "बच्चा",
      value: room.babyAllowed,
    },
  ].filter((f) => f.value !== null && f.value !== undefined);

  const hasTenantData = !!(
    (room.tenantTypes && room.tenantTypes.length > 0) ||
    room.genderPreference ||
    lifestyleFields.length > 0 ||
    room.gateClosingTime ||
    room.hasSunlight !== null ||
    room.hasClothDryingArea !== null ||
    room.existingProblems ||
    room.otherRules ||
    room.ownerCommunity ||
    room.communityPreference
  );

  if (!hasTenantData) return null;

  return (
    <Card>
      <CardContent className="p-4 md:p-6 space-y-5">
        <h2 className="font-semibold text-gray-900 text-lg flex items-center gap-2">
          <Heart className="h-4 w-4 text-primary" aria-hidden /> Tenant
          Preferences / भाडाटारु प्राथमिकता
        </h2>

        {/* Ideal tenant */}
        {room.tenantTypes && room.tenantTypes.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Ideal Tenant / आदर्श भाडाटारु
            </p>
            <div className="flex flex-wrap gap-2">
              {room.tenantTypes.map((t) => (
                <Badge
                  key={t}
                  className="bg-primary/10 text-primary border-primary/20 gap-1 cursor-default"
                >
                  <span aria-hidden>{TENANT_EMOJIS[t] ?? "👤"}</span> {t}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Gender preference */}
        {room.genderPreference && (
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Gender Preference / लिङ्ग
            </p>
            <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200 cursor-default">
              {room.genderPreference === "Male Only"
                ? "👨 "
                : room.genderPreference === "Female Only"
                  ? "👩 "
                  : "🤝 "}
              {room.genderPreference}
            </Badge>
          </div>
        )}

        {/* Lifestyle rules */}
        {lifestyleFields.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Lifestyle Rules / जीवनशैली नियम
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {lifestyleFields.map(({ icon: Icon, label, labelNp, value }) => (
                <div
                  key={label}
                  className={cn(
                    "flex items-center gap-2 p-2.5 rounded-lg border text-xs font-semibold",
                    value
                      ? "bg-green-50 border-green-200 text-green-700"
                      : "bg-red-50 border-red-200 text-red-700",
                  )}
                >
                  <Icon className="w-3.5 h-3.5 flex-shrink-0" aria-hidden />
                  <div className="min-w-0">
                    <p className="truncate text-[11px]">{label}</p>
                    <p className="text-[9px] opacity-70 truncate">{labelNp}</p>
                  </div>
                  <span className="ml-auto">{value ? "✓" : "✗"}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Gate closing */}
        {room.gateClosingTime && (
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
            <Clock3
              className="w-4 h-4 text-slate-500 flex-shrink-0"
              aria-hidden
            />
            <div>
              <p className="text-xs text-slate-500 font-semibold">
                Gate Closes / गेट बन्द हुने समय
              </p>
              <p className="font-bold text-slate-800">
                {formatGateClosingTime(room.gateClosingTime)}
              </p>
            </div>
          </div>
        )}
        {/* Sunlight & Drying */}
        {(room.hasSunlight !== null && room.hasSunlight !== undefined) ||
        (room.hasClothDryingArea !== null &&
          room.hasClothDryingArea !== undefined) ? (
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Facilities / सुविधाहरू
            </p>
            <div className="grid grid-cols-2 gap-3">
              {room.hasSunlight !== null && room.hasSunlight !== undefined && (
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1 text-gray-600">
                    <Sun className="w-3.5 h-3.5" aria-hidden /> Sunlight / घाम
                  </span>
                  <TriBadge
                    value={room.hasSunlight}
                    labelYes="Yes"
                    labelNo="No"
                  />
                </div>
              )}
              {room.hasClothDryingArea !== null &&
                room.hasClothDryingArea !== undefined && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1 text-gray-600">
                      <Shirt className="w-3.5 h-3.5" aria-hidden /> Drying Area
                    </span>
                    <TriBadge
                      value={room.hasClothDryingArea}
                      labelYes="Yes"
                      labelNo="No"
                    />
                  </div>
                )}
            </div>
          </div>
        ) : null}

        {/* Community */}
        {(room.ownerCommunity || room.communityPreference) && (
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Community / समुदाय
            </p>
            <div className="space-y-2">
              {room.ownerCommunity && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">
                    Owner Community / घरधनीको समुदाय
                  </span>
                  <span className="font-semibold">{room.ownerCommunity}</span>
                </div>
              )}
              {room.communityPreference && (
                <div className="text-sm">
                  <span className="text-gray-500">
                    Tenant Community Preference
                  </span>
                  <p
                    className={cn(
                      "mt-1 px-3 py-2 rounded-lg border text-xs font-medium",
                      room.communityPreference === "All community are welcome"
                        ? "bg-green-50 border-green-200 text-green-700"
                        : "bg-slate-50 border-slate-200 text-slate-600",
                    )}
                  >
                    {room.communityPreference}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Existing problems */}
        {room.existingProblems && (
          <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
            <AlertTriangle
              className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5"
              aria-hidden
            />
            <div>
              <p className="text-xs font-bold text-amber-700 uppercase tracking-wide mb-1">
                Existing Problems / समस्याहरू
              </p>
              <p className="text-sm text-amber-700 leading-relaxed">
                {room.existingProblems}
              </p>
            </div>
          </div>
        )}

        {/* Other rules */}
        {room.otherRules && (
          <div className="flex items-start gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
            <MessageSquare
              className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5"
              aria-hidden
            />
            <div>
              <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">
                Other Rules / अन्य नियम
              </p>
              <p className="text-sm text-slate-600 leading-relaxed">
                {room.otherRules}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Status badges ────────────────────────────────────────────────────────────

const getApprovalBadge = (status: RoomStatus) => {
  switch (status) {
    case RoomStatus.APPROVED:
      return (
        <Badge className="bg-green-100 text-green-800 border-green-200 gap-1 cursor-default">
          <CheckCircle className="h-3 w-3" /> Approved
        </Badge>
      );
    case RoomStatus.PENDING:
      return (
        <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 gap-1 cursor-default">
          <Clock className="h-3 w-3" /> Pending
        </Badge>
      );
    case RoomStatus.REJECTED:
      return (
        <Badge className="bg-red-100 text-red-800 border-red-200 gap-1 cursor-default">
          <XCircle className="h-3 w-3" /> Rejected
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

const getListingBadge = (status: RoomStatus) => {
  switch (status) {
    case RoomStatus.AVAILABLE:
      return (
        <Badge className="bg-green-100 text-green-800 border-green-200 gap-1 cursor-default">
          <CheckCircle className="h-3 w-3" /> Available
        </Badge>
      );
    case RoomStatus.RENTED:
      return (
        <Badge className="bg-blue-100 text-blue-800 border-blue-200 gap-1 cursor-default">
          <Users className="h-3 w-3" /> Rented
        </Badge>
      );
    case RoomStatus.ARCHIVED:
      return (
        <Badge className="bg-gray-100 text-gray-800 border-gray-200 gap-1 cursor-default">
          <AlertCircle className="h-3 w-3" /> Archived
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

const getAmenityIcon = (amenity: string) => {
  switch (amenity.toLowerCase()) {
    case "wifi":
      return <Wifi className="h-4 w-4" />;
    case "ac":
      return <Snowflake className="h-4 w-4" />;
    case "parking":
      return <Car className="h-4 w-4" />;
    case "tv":
      return <Tv className="h-4 w-4" />;
    case "kitchen":
    case "modular-kitchen":
      return <Utensils className="h-4 w-4" />;
    case "security":
      return <Shield className="h-4 w-4" />;
    case "water":
      return <Droplets className="h-4 w-4" />;
    default:
      return <Home className="h-4 w-4" />;
  }
};

const amenityLabelMap: Record<string, string> = {
  wifi: "WiFi",
  ac: "AC",
  parking: "Parking",
  tv: "TV",
  "modular-kitchen": "Modular Kitchen",
  kitchen: "Kitchen",
  security: "Security",
  water: "पानी",
  furnished: "Furnished",
};

// ─── Image Carousel ───────────────────────────────────────────────────────────

function ImageCarousel({ images, title }: { images: string[]; title: string }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showFullscreen, setShowFullscreen] = useState(false);

  const goToPrevious = () =>
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  const goToNext = () =>
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));

  if (!images || images.length === 0) {
    return (
      <div className="h-[350px] w-full bg-gray-100 rounded-xl flex flex-col items-center justify-center gap-2">
        <Building2 className="h-16 w-16 text-gray-400" aria-hidden />
        <p className="text-gray-500 text-sm">No photos available</p>
      </div>
    );
  }

  return (
    <>
      <div className="relative rounded-xl overflow-hidden">
        <div className="relative h-[350px] sm:h-[450px] w-full group">
          <img
            src={getImageUrl(images[currentIndex])}
            alt={`${title} — photo ${currentIndex + 1} of ${images.length}`}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "/placeholder-image.jpg";
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

          {images.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Previous photo"
                className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer h-10 w-10"
                onClick={goToPrevious}
              >
                <ChevronLeft className="h-6 w-6" aria-hidden />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Next photo"
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer h-10 w-10"
                onClick={goToNext}
              >
                <ChevronRight className="h-6 w-6" aria-hidden />
              </Button>
            </>
          )}

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white px-3 py-1 rounded-full text-sm backdrop-blur-sm">
            {currentIndex + 1} / {images.length}
          </div>

          <Button
            variant="ghost"
            size="icon"
            aria-label="View fullscreen"
            className="absolute top-3 right-3 bg-black/50 hover:bg-black/70 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            onClick={() => setShowFullscreen(true)}
          >
            <Maximize2 className="h-4 w-4" aria-hidden />
          </Button>
        </div>

        {images.length > 1 && (
          <div className="flex gap-2 p-3 bg-gray-50 border-t overflow-x-auto">
            {images.map((image, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                aria-label={`Go to photo ${index + 1}`}
                className={`relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden transition-all cursor-pointer ${index === currentIndex ? "ring-2 ring-primary scale-105" : "opacity-60 hover:opacity-100"}`}
              >
                <img
                  src={getImageUrl(images[index])}
                  alt={`${title} — photo ${currentIndex + 1} of ${images.length}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      "/placeholder-image.jpg";
                  }}
                />
              </button>
            ))}
          </div>
        )}
      </div>

      <Dialog open={showFullscreen} onOpenChange={setShowFullscreen}>
        <DialogContent className="max-w-5xl w-[95vw] h-[90vh] p-2">
          <DialogHeader>
            <DialogTitle className="sr-only">Room Photos</DialogTitle>
          </DialogHeader>
          <div className="relative h-full w-full flex items-center justify-center">
            <img
              src={getImageUrl(images[currentIndex])}
              alt={`${title} — fullscreen`}
              className="max-h-full max-w-full object-contain rounded-lg"
            />
            {images.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Previous"
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full cursor-pointer"
                  onClick={goToPrevious}
                >
                  <ChevronLeft className="h-8 w-8" aria-hidden />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Next"
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full cursor-pointer"
                  onClick={goToNext}
                >
                  <ChevronRight className="h-8 w-8" aria-hidden />
                </Button>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-4 py-2 rounded-full text-sm">
                  {currentIndex + 1} / {images.length}
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Loading Skeleton ──────────────────────────────────────────────────────────

function RoomDetailSkeleton() {
  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-[450px] w-full rounded-xl" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function RoomDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const { data, isLoading, error } = useQuery({
    queryKey: ["room", id],
    queryFn: () => roomService.getRoomById(id),
    enabled: !!id,
  });

  if (isLoading) return <RoomDetailSkeleton />;

  if (error || !data?.data) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load room details. Please try again.
          </AlertDescription>
        </Alert>
        <Button
          className="mt-4 cursor-pointer"
          variant="outline"
          onClick={() => router.back()}
        >
          <ChevronLeft className="h-4 w-4 mr-2" /> फिर्ता जानुहोस्
        </Button>
      </div>
    );
  }

  const room: Room = data.data;
  const latitude = room.location?.latitude
    ? Number(room.location.latitude)
    : null;
  const longitude = room.location?.longitude
    ? Number(room.location.longitude)
    : null;
  const hasValidCoordinates =
    latitude && longitude && !isNaN(latitude) && !isNaN(longitude);

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Sticky Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="px-4 py-3 md:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <nav
                className="flex items-center gap-2 text-sm text-muted-foreground mb-1"
                aria-label="Breadcrumb"
              >
                <Link
                  href="/admin/dashboard"
                  className="hover:text-primary transition-colors cursor-pointer"
                >
                  Dashboard
                </Link>
                <span>/</span>
                <Link
                  href="/admin/dashboard/rooms"
                  className="hover:text-primary transition-colors cursor-pointer"
                >
                  Rooms
                </Link>
                <span>/</span>
                <span className="text-foreground font-medium truncate max-w-[200px]">
                  {room.title}
                </span>
              </nav>
              <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
                <Building2
                  className="h-5 w-5 text-primary flex-shrink-0"
                  aria-hidden
                />
                <span className="truncate">{room.title}</span>
              </h1>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                variant="outline"
                onClick={() => router.back()}
                className="cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4 mr-2" aria-hidden /> फिर्ता
              </Button>
              <Button
                asChild
                className="bg-primary hover:bg-primary/90 cursor-pointer"
              >
                <Link href={`/admin/dashboard/rooms/${room.id}/edit`}>
                  <Edit className="h-4 w-4 mr-2" aria-hidden /> सम्पादन
                  गर्नुहोस्
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 md:px-6 lg:px-8 space-y-6 max-w-7xl mx-auto">
        {/* Images */}
        {room.images && room.images.length > 0 && (
          <ImageCarousel images={room.images} title={room.title} />
        )}

        {/* Price & Status banner */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4 md:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold text-muted-foreground">
                    रु.
                  </span>
                  <span className="text-3xl font-bold text-primary">
                    {room.price.toLocaleString("ne-NP")}
                  </span>
                  <span className="text-gray-500">/month</span>
                </div>
                <div className="text-sm text-gray-500">
                  Listed by:{" "}
                  <span className="font-medium text-gray-700">
                    {room.user?.name || "Unknown"}
                  </span>
                  {room.user?.phoneNumber && (
                    <span className="ml-2 text-gray-600">
                      · {room.user.phoneNumber}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400">
                  {room.category.replace("_", " ")} · {room.address}
                </p>
                {/* Highway distance — prominent for admin */}
                {room.distanceHighwayM !== null &&
                  room.distanceHighwayM !== undefined && (
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      🛣️ Highway:{" "}
                      <span className="font-semibold">
                        {room.distanceHighwayM >= 1000
                          ? `${(room.distanceHighwayM / 1000).toFixed(2)} km`
                          : `${room.distanceHighwayM} m`}
                      </span>{" "}
                      away
                    </p>
                  )}
              </div>
              <div className="flex flex-wrap gap-2">
                {getApprovalBadge(room.approvalStatus)}
                {getListingBadge(room.listingStatus)}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* TikTok */}
        {room.tiktokUrl && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center flex-shrink-0">
                  <svg
                    viewBox="0 0 24 24"
                    className="w-6 h-6"
                    fill="white"
                    aria-hidden
                  >
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.32 6.32 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34l-.01-8.83a8.18 8.18 0 0 0 4.78 1.52V4.56a4.85 4.85 0 0 1-1-.13z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-500">TikTok Profile</p>
                  <a
                    href={room.tiktokUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    {room.tiktokUrl.replace(
                      /^https?:\/\/(www\.)?tiktok\.com\/@?/,
                      "@",
                    )}
                    <Globe className="h-3 w-3" aria-hidden />
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <Card>
              <CardContent className="p-4 md:p-6">
                <h2 className="font-semibold text-gray-900 mb-3 text-lg">
                  Description
                </h2>
                <p className="text-gray-600 whitespace-pre-wrap leading-relaxed">
                  {room.description}
                </p>
              </CardContent>
            </Card>

            {/* Specifications */}
            <Card>
              <CardContent className="p-4 md:p-6">
                <h2 className="font-semibold text-gray-900 mb-4 text-lg">
                  कोठाको विशिष्टता
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {[
                    {
                      icon: Square,
                      color: "blue",
                      label: "Area",
                      value: `${room.roomArea} m²`,
                    },
                    {
                      icon: Users,
                      color: "purple",
                      label: "Room Capacity",
                      value: `${room.roomCapacity} persons`,
                    },
                    {
                      icon: Bed,
                      color: "green",
                      label: "Floor",
                      value: `${room.floorNumber}${room.floorNumber === 0 ? " (Ground)" : ""}`,
                    },
                    {
                      icon: Bath,
                      color: "red",
                      label: "Bathroom",
                      value: `${room.bathroomCapacity} persons`,
                    },
                    {
                      icon: Home,
                      color: "yellow",
                      label: "House Capacity",
                      value: `${room.totalHouseCapacity} persons`,
                    },
                    {
                      icon: User,
                      color: "pink",
                      label: "Owner in House",
                      value: room.ownerLivesInHouse ? "Yes" : "No",
                    },
                    {
                      icon: Users,
                      color: "indigo",
                      label: "Current Occupants",
                      value: `${room.currentOccupants} persons`,
                    },
                    {
                      icon: Building2,
                      color: "orange",
                      label: "Rented Rooms",
                      value: String(room.rentedRoomsCount),
                    },
                  ].map((item) => {
                    const Icon = item.icon;
                    const colorMap: Record<string, string> = {
                      blue: "bg-blue-50 text-blue-600",
                      purple: "bg-purple-50 text-purple-600",
                      green: "bg-green-50 text-green-600",
                      red: "bg-red-50 text-red-600",
                      yellow: "bg-yellow-50 text-yellow-600",
                      pink: "bg-pink-50 text-pink-600",
                      indigo: "bg-indigo-50 text-indigo-600",
                      orange: "bg-orange-50 text-orange-600",
                    };
                    return (
                      <div key={item.label} className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-lg flex-shrink-0 ${colorMap[item.color]}`}
                        >
                          <Icon className="h-4 w-4" aria-hidden />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">{item.label}</p>
                          <p className="font-semibold text-sm">{item.value}</p>
                        </div>
                      </div>
                    );
                  })}
                  {/* Owner floor (if applicable) */}
                  {room.ownerLivesInHouse &&
                    room.ownerFloorNumber !== null &&
                    room.ownerFloorNumber !== undefined && (
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-teal-50 text-teal-600 flex-shrink-0">
                          <Building2 className="h-4 w-4" aria-hidden />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Owner's Floor</p>
                          <p className="font-semibold text-sm">
                            Floor {room.ownerFloorNumber}
                          </p>
                        </div>
                      </div>
                    )}
                </div>

                <WaterSupplyDisplay timings={room.waterSupplyTimings} />
              </CardContent>
            </Card>

            {/* Amenities */}
            {room.amenities && room.amenities.length > 0 && (
              <Card>
                <CardContent className="p-4 md:p-6">
                  <h2 className="font-semibold text-gray-900 mb-4 text-lg">
                    Amenities / सुविधाहरू
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {room.amenities.map((amenity) => (
                      <div
                        key={amenity}
                        className="flex items-center gap-2 p-3 border rounded-lg hover:border-primary transition-colors bg-white"
                      >
                        <span className="text-primary">
                          {getAmenityIcon(amenity)}
                        </span>
                        <span className="text-sm font-medium">
                          {amenityLabelMap[amenity] || amenity}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tenant Preferences (NEW) */}
            <TenantPreferencesDisplay room={room} />

            {/* Map */}
            {hasValidCoordinates && (
              <Card>
                <CardContent className="p-4 md:p-6">
                  <h2 className="font-semibold text-gray-900 mb-4 text-lg flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" aria-hidden />{" "}
                    नक्शामा स्थान
                  </h2>
                  <div className="h-[300px] w-full rounded-lg overflow-hidden">
                    <MapComponent
                      latitude={latitude!}
                      longitude={longitude!}
                      popupText={room.title}
                    />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* RIGHT */}
          <div className="space-y-6">
            {/* Contact */}
            <Card>
              <CardContent className="p-4 md:p-6">
                <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" aria-hidden /> सम्पर्क
                  जानकारी
                </h2>
                <div className="space-y-4">
                  {room.contactPerson && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">
                        Owner Name / घरधनीको नाम
                      </p>
                      <p className="font-medium">{room.contactPerson}</p>
                    </div>
                  )}
                  {room.contactPhone && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Phone / फोन</p>
                      <a
                        href={`tel:${room.contactPhone}`}
                        className="font-medium text-blue-600 hover:underline flex items-center gap-2 cursor-pointer"
                      >
                        <Phone className="h-4 w-4" aria-hidden />{" "}
                        {room.contactPhone}
                      </a>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Rules */}
            <Card>
              <CardContent className="p-4 md:p-6">
                <h2 className="font-semibold text-gray-900 mb-4">
                  Rules / नियमहरू
                </h2>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">महिला अनुमति</span>
                    <TriBadge
                      value={room.allowsWomen}
                      labelYes="Allowed"
                      labelNo="Not allowed"
                    />
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Current Occupants</span>
                    <span className="font-medium">
                      {room.currentOccupants} / {room.roomCapacity}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Rented Rooms</span>
                    <span className="font-medium">{room.rentedRoomsCount}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Location details */}
            {room.location && (
              <Card>
                <CardContent className="p-4 md:p-6">
                  <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" aria-hidden />{" "}
                    स्थानको विवरण
                  </h2>
                  <div className="space-y-3 text-sm">
                    {room.location.formattedAddress && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">
                          Full Address
                        </p>
                        <p className="font-medium">
                          {room.location.formattedAddress}
                        </p>
                      </div>
                    )}
                    {[
                      { label: "City", value: room.location.city },
                      { label: "State", value: room.location.state },
                      { label: "Country", value: room.location.country },
                      { label: "Postal Code", value: room.location.postalCode },
                    ]
                      .filter((r) => !!r.value)
                      .map(({ label, value }) => (
                        <div key={label} className="flex justify-between">
                          <span className="text-gray-500">{label}</span>
                          <span className="font-medium">{value}</span>
                        </div>
                      ))}
                    {hasValidCoordinates && (
                      <div className="pt-2 border-t">
                        <p className="text-xs text-gray-500 mb-1">
                          Coordinates
                        </p>
                        <p className="font-mono text-xs text-gray-600">
                          {latitude!.toFixed(6)}, {longitude!.toFixed(6)}
                        </p>
                      </div>
                    )}
                    {room.distanceHighwayM !== null &&
                      room.distanceHighwayM !== undefined && (
                        <div className="flex justify-between pt-2 border-t">
                          <span className="text-gray-500">
                            🛣️ Highway distance
                          </span>
                          <span className="font-medium">
                            {room.distanceHighwayM >= 1000
                              ? `${(room.distanceHighwayM / 1000).toFixed(2)} km`
                              : `${room.distanceHighwayM} m`}
                          </span>
                        </div>
                      )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Additional Info */}
            <Card>
              <CardContent className="p-4 md:p-6">
                <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" aria-hidden /> थप
                  जानकारी
                </h2>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Created</span>
                    <span className="font-medium">
                      {formatDate(room.createdAt)}
                    </span>
                  </div>
                  {room.approvedAt && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Approved on</span>
                      <span className="font-medium">
                        {formatDate(room.approvedAt)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-500">Category</span>
                    <Badge
                      variant="outline"
                      className="capitalize cursor-default"
                    >
                      {room.category.replace("_", " ")}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">ID</span>
                    <span className="font-mono text-xs">
                      {room.id.slice(0, 8)}...
                    </span>
                  </div>
                  {room.serviceCharge && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Service Charge</span>
                      <span className="font-medium">
                        रु. {Number(room.serviceCharge).toLocaleString("ne-NP")}
                      </span>
                    </div>
                  )}
                  {room.commissionAmount && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Commission</span>
                      <span className="font-medium">
                        रु.{" "}
                        {Number(room.commissionAmount).toLocaleString("ne-NP")}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Admin Remarks */}
            {room.adminRemarks && (
              <Card className="border-orange-200 bg-orange-50">
                <CardContent className="p-4">
                  <h2 className="font-semibold text-orange-800 mb-2 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" aria-hidden /> Admin
                    Remarks
                  </h2>
                  <p className="text-sm text-orange-700">{room.adminRemarks}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
