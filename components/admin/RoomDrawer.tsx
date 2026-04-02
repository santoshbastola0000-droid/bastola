"use client";

import { useState } from "react";
import {
  Building2,
  MapPin,
  Users,
  Bath,
  Bed,
  Phone,
  Mail,
  Calendar,
  Clock,
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
  Instagram,
  Globe,
  Maximize2,
  Heart,
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
  Check,
  X,
  Shield,
} from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  formatDate,
  formatGateClosingTime,
  formatNepaliCurrency,
} from "@/lib/utils";
import { Room, RoomStatus, TenantType } from "@/types/room.types";
import Link from "next/link";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogHeader,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const MapComponent = dynamic(() => import("@/components/ui/map"), {
  ssr: false,
  loading: () => (
    <div className="h-[200px] w-full bg-gray-100 animate-pulse rounded-lg flex items-center justify-center">
      <Globe className="h-8 w-8 text-gray-400" />
    </div>
  ),
});

import dynamic from "next/dynamic";

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "";

interface RoomDrawerProps {
  room: Room;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

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

// ─── Tenant Preferences Display ───────────────────────────────────────────────

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
      <CardContent className="p-4 space-y-5">
        <h3 className="font-semibold text-gray-900 text-lg flex items-center gap-2">
          <Heart className="h-4 w-4 text-primary" aria-hidden /> Tenant
          Preferences / भाडाटारु प्राथमिकता
        </h3>

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
            <div className="grid grid-cols-2 gap-2">
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

const getStatusBadge = (status: RoomStatus) => {
  switch (status) {
    case RoomStatus.APPROVED:
      return (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200 gap-1 cursor-default">
          <CheckCircle className="h-3 w-3" />
          Approved
        </Badge>
      );
    case RoomStatus.PENDING:
      return (
        <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-200 gap-1 cursor-default">
          <Clock className="h-3 w-3" />
          Pending Approval
        </Badge>
      );
    case RoomStatus.ARCHIVED:
      return (
        <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200 gap-1 cursor-default">
          <Users className="h-3 w-3" />
          Archived
        </Badge>
      );
    case RoomStatus.REJECTED:
      return (
        <Badge className="bg-red-100 text-red-800 hover:bg-red-100 border-red-200 gap-1 cursor-default">
          <XCircle className="h-3 w-3" />
          Rejected
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
          <CheckCircle className="h-3 w-3" />
          Available
        </Badge>
      );
    case RoomStatus.RENTED:
      return (
        <Badge className="bg-blue-100 text-blue-800 border-blue-200 gap-1 cursor-default">
          <Users className="h-3 w-3" />
          Rented
        </Badge>
      );
    case RoomStatus.ARCHIVED:
      return (
        <Badge className="bg-gray-100 text-gray-800 border-gray-200 gap-1 cursor-default">
          <AlertTriangle className="h-3 w-3" />
          Archived
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

// ─── Image Carousel Component ─────────────────────────────────────────────────

interface ImageCarouselProps {
  images: string[];
  title: string;
}

const ImageCarousel = ({ images, title }: ImageCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showFullscreen, setShowFullscreen] = useState(false);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  if (!images || images.length === 0) {
    return (
      <div className="h-[300px] w-full bg-gray-100 rounded-lg flex flex-col items-center justify-center">
        <Building2 className="h-16 w-16 text-gray-400" />
        <p className="text-gray-500 mt-2">No images available</p>
      </div>
    );
  }

  return (
    <>
      <div className="relative h-[300px] w-full group">
        {/* Main Image */}
        <div className="relative h-full w-full rounded-lg overflow-hidden">
          <img
            src={getImageUrl(images[currentIndex])}
            alt={`${title} - Image ${currentIndex + 1}`}
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = "/placeholder-image.jpg";
            }}
          />
        </div>

        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              onClick={goToPrevious}
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              onClick={goToNext}
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          </>
        )}

        {/* Image Counter */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
          {currentIndex + 1} / {images.length}
        </div>

        {/* Fullscreen Button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
          onClick={() => setShowFullscreen(true)}
        >
          <Maximize2 className="h-4 w-4" />
        </Button>

        {/* Thumbnail Strip */}
        {images.length > 1 && (
          <div className="absolute -bottom-16 left-0 right-0 flex justify-center gap-2 p-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg">
            {images.map((image, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`relative w-12 h-12 rounded-md overflow-hidden transition-all cursor-pointer ${
                  index === currentIndex
                    ? "ring-2 ring-primary scale-110"
                    : "opacity-70 hover:opacity-100"
                }`}
              >
                <img
                  src={getImageUrl(image)}
                  alt={`Thumbnail ${index + 1}`}
                  className="object-cover"
                  sizes="48px"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Fullscreen Dialog */}
      <Dialog open={showFullscreen} onOpenChange={setShowFullscreen}>
        <DialogContent className="max-w-5xl w-[95vw] h-[90vh] p-2">
          <DialogHeader>
            <DialogTitle className="sr-only">Room Images</DialogTitle>
          </DialogHeader>
          <div className="relative h-full w-full flex items-center justify-center">
            <img
              src={getImageUrl(images[currentIndex])}
              alt={`${title} - Fullscreen ${currentIndex + 1}`}
              className="max-h-full max-w-full object-contain"
            />
            {images.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full cursor-pointer"
                  onClick={goToPrevious}
                >
                  <ChevronLeft className="h-8 w-8" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full cursor-pointer"
                  onClick={goToNext}
                >
                  <ChevronRight className="h-8 w-8" />
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
};

// ─── Main RoomDrawer Component ────────────────────────────────────────────────

export function RoomDrawer({ room, open, onOpenChange }: RoomDrawerProps) {
  // Ensure latitude and longitude are numbers
  const latitude = room.location?.latitude
    ? Number(room.location.latitude)
    : null;
  const longitude = room.location?.longitude
    ? Number(room.location.longitude)
    : null;
  const hasValidCoordinates =
    latitude && longitude && !isNaN(latitude) && !isNaN(longitude);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <div className="overflow-y-auto">
          <DrawerHeader className="border-b sticky top-0 bg-white z-10">
            <div className="flex items-start justify-between">
              <div>
                <DrawerTitle className="text-xl flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  {room.title}
                </DrawerTitle>
                <DrawerDescription className="mt-1">
                  {room.category.replace("_", " ")} • {room.address}
                </DrawerDescription>
              </div>
              <div className="flex gap-2">
                {getStatusBadge(room.approvalStatus)}
                {getListingBadge(room.listingStatus)}
              </div>
            </div>
          </DrawerHeader>

          <div className="p-6 space-y-6">
            {/* Image Carousel */}
            {room.images && room.images.length > 0 && (
              <div className="mb-8 pb-4">
                <ImageCarousel images={room.images} title={room.title} />
              </div>
            )}

            {/* Price & Quick Info */}
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-gray-900">
                        {formatNepaliCurrency(room.price)}
                      </span>
                      <span className="text-gray-500">/month</span>
                    </div>
                    <p className="text-sm text-gray-500">
                      Listed by {room.user?.name || "Unknown"}
                    </p>
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
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/admin/dashboard/rooms/${room.id}/edit`}>
                        Edit Room
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* TikTok Link */}
            {room.tiktokUrl && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-black rounded-lg">
                        <Instagram className="h-5 w-5 text-white" />
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
                          <Globe className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Details */}
              <div className="lg:col-span-2 space-y-6">
                {/* Description */}
                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-3">
                      Description
                    </h3>
                    <p className="text-gray-600 whitespace-pre-wrap">
                      {room.description}
                    </p>
                  </CardContent>
                </Card>

                {/* Room Specifications */}
                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-4">
                      Room Specifications
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-50 rounded-lg">
                            <Square className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Room Area</p>
                            <p className="font-semibold">{room.roomArea} m²</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-purple-50 rounded-lg">
                            <Users className="h-5 w-5 text-purple-600" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">
                              Room Capacity
                            </p>
                            <p className="font-semibold">
                              {room.roomCapacity} persons
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-green-50 rounded-lg">
                            <Bed className="h-5 w-5 text-green-600" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">
                              Floor Number
                            </p>
                            <p className="font-semibold">{room.floorNumber}</p>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-red-50 rounded-lg">
                            <Bath className="h-5 w-5 text-red-600" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">
                              Bathroom Capacity
                            </p>
                            <p className="font-semibold">
                              {room.bathroomCapacity} shared
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-yellow-50 rounded-lg">
                            <Home className="h-5 w-5 text-yellow-600" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">
                              House Capacity
                            </p>
                            <p className="font-semibold">
                              {room.totalHouseCapacity} persons
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-pink-50 rounded-lg">
                            <User className="h-5 w-5 text-pink-600" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">
                              Owner Lives Here
                            </p>
                            <p className="font-semibold">
                              {room.ownerLivesInHouse ? "Yes" : "No"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Owner Floor Number */}
                    {room.ownerLivesInHouse &&
                      room.ownerFloorNumber !== null &&
                      room.ownerFloorNumber !== undefined && (
                        <div className="mt-4 pt-3 border-t">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-teal-50 rounded-lg">
                              <Building2 className="h-5 w-5 text-teal-600" />
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">
                                Owner's Floor
                              </p>
                              <p className="font-semibold">
                                Floor {room.ownerFloorNumber}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                    <WaterSupplyDisplay timings={room.waterSupplyTimings} />
                  </CardContent>
                </Card>

                {/* Amenities */}
                {room.amenities && room.amenities.length > 0 && (
                  <Card>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-gray-900 mb-4">
                        Amenities
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {room.amenities.map((amenity) => (
                          <div
                            key={amenity}
                            className="flex items-center gap-2 p-3 border rounded-lg hover:border-primary transition-colors"
                          >
                            {getAmenityIcon(amenity)}
                            <span className="text-sm">
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

                {/* Location Map */}
                {hasValidCoordinates && (
                  <Card>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Location on Map
                      </h3>
                      <div className="h-[300px] w-full rounded-lg overflow-hidden">
                        <MapComponent
                          latitude={latitude}
                          longitude={longitude}
                          popupText={room.title}
                        />
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Right Column - Contact & Info */}
              <div className="space-y-6">
                {/* Contact Information */}
                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Owner Information
                    </h3>
                    <div className="space-y-4">
                      {room.contactPerson && (
                        <div>
                          <p className="text-sm text-gray-500">
                            Contact Person
                          </p>
                          <p className="font-medium">{room.contactPerson}</p>
                        </div>
                      )}
                      {room.contactPhone && (
                        <div>
                          <p className="text-sm text-gray-500">Phone Number</p>
                          <a
                            href={`tel:${room.contactPhone}`}
                            className="font-medium text-blue-600 hover:underline flex items-center gap-2 cursor-pointer"
                          >
                            <Phone className="h-4 w-4" />
                            {room.contactPhone}
                          </a>
                        </div>
                      )}
                      {room.user?.email && (
                        <div>
                          <p className="text-sm text-gray-500">Email Address</p>
                          <a
                            href={`mailto:${room.user.email}`}
                            className="font-medium text-blue-600 hover:underline flex items-center gap-2 cursor-pointer"
                          >
                            <Mail className="h-4 w-4" />
                            {room.user.email}
                          </a>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Rules & Restrictions */}
                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-4">Rules</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">
                          Women Allowed
                        </span>
                        <TriBadge
                          value={room.allowsWomen}
                          labelYes="Allowed"
                          labelNo="Not allowed"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">
                          Current Occupants
                        </span>
                        <span className="font-medium">
                          {room.currentOccupants} / {room.roomCapacity}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">
                          Rented Rooms
                        </span>
                        <span className="font-medium">
                          {room.rentedRoomsCount}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Location Info */}
                {room.location && (
                  <Card>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Location Details
                      </h3>
                      <div className="space-y-3">
                        {room.location.formattedAddress && (
                          <div>
                            <p className="text-sm text-gray-500">Address</p>
                            <p className="font-medium text-sm">
                              {room.location.formattedAddress}
                            </p>
                          </div>
                        )}
                        {room.location.city && (
                          <div>
                            <p className="text-sm text-gray-500">City</p>
                            <p className="font-medium">{room.location.city}</p>
                          </div>
                        )}
                        {room.location.state && (
                          <div>
                            <p className="text-sm text-gray-500">State</p>
                            <p className="font-medium">{room.location.state}</p>
                          </div>
                        )}
                        {room.location.country && (
                          <div>
                            <p className="text-sm text-gray-500">Country</p>
                            <p className="font-medium">
                              {room.location.country}
                            </p>
                          </div>
                        )}
                        {room.location.postalCode && (
                          <div>
                            <p className="text-sm text-gray-500">Postal Code</p>
                            <p className="font-medium">
                              {room.location.postalCode}
                            </p>
                          </div>
                        )}
                        {hasValidCoordinates && (
                          <div>
                            <p className="text-sm text-gray-500">Coordinates</p>
                            <p className="font-mono text-xs">
                              {latitude!.toFixed(6)}, {longitude!.toFixed(6)}
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Additional Info */}
                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Additional Information
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Created</span>
                        <span>{formatDate(room.createdAt)}</span>
                      </div>
                      {room.approvedAt && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Approved on</span>
                          <span>{formatDate(room.approvedAt)}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-500">Category</span>
                        <Badge variant="outline" className="capitalize">
                          {room.category.replace("_", " ")}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Listing ID</span>
                        <span className="font-mono">
                          {room.id.slice(0, 8)}...
                        </span>
                      </div>
                      {room.serviceCharge && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Service Charge</span>
                          <span className="font-medium">
                            रु.{" "}
                            {Number(room.serviceCharge).toLocaleString("ne-NP")}
                          </span>
                        </div>
                      )}
                      {room.commissionAmount && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Commission</span>
                          <span className="font-medium">
                            रु.{" "}
                            {Number(room.commissionAmount).toLocaleString(
                              "ne-NP",
                            )}
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
                      <h3 className="font-semibold text-orange-800 mb-2 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        Admin Remarks
                      </h3>
                      <p className="text-sm text-orange-700">
                        {room.adminRemarks}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
