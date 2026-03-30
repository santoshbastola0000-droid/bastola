"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  PanInfo,
} from "framer-motion";
import {
  MapPin,
  Bath,
  Square,
  ArrowLeft,
  Check,
  Users,
  Home,
  Wifi,
  Car,
  Coffee,
  Tv,
  Utensils,
  Wind,
  Dumbbell,
  ChevronLeft,
  ChevronRight,
  Clock,
  Shield,
  Phone,
  X,
  Maximize2,
  Droplets,
  Building2,
  AlertCircle,
  ExternalLink,
  Landmark,
  Lock,
  PlayCircle,
  CheckCircle,
  Copy,
  Navigation,
  User,
  Star,
  Share2,
  Heart,
  ChevronUp,
  ChevronDown,
  Users2,
  HeartHandshake,
  Baby,
  MoonStar,
  Sun,
  Beef,
  EggFried,
  Ban,
  Church,
  Gem,
  Shirt,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { NavBar } from "@/components/common/navbar";
import Footer from "@/components/common/footer";
import {
  formatPriceNPR,
  resolveImageUrl,
  getShortAddress,
  timeAgo,
} from "@/lib/utils";
import {
  Room,
  RoomStatus,
  IdealTenantType,
  GenderPreference,
  RestrictionType,
  ReligionType,
} from "@/types/room.types";
import { UserRole } from "@/types/user.types";
import { api } from "@/http/api/api";
import { RoomUnlockDialog } from "@/components/rooms/RoomUnlockDialog";
import { TopUpRequestDialog } from "@/components/wallet/TopUpRequestDialog";
import { unlockService } from "@/http/services/unlock.service";
import { useUserStore } from "@/stores/user-store";
import { MapComponent } from "@/components/common/MapComponent";
import type {
  CommissionSettings,
  UnlockResult,
  UnlockStatus,
} from "@/types/unlock.types";
import { cn } from "@/lib/utils";

// ── Amenity icons ──
const amenityIcons: Record<string, any> = {
  wifi: Wifi,
  parking: Car,
  kitchen: Coffee,
  "air conditioning": Wind,
  ac: Wind,
  tv: Tv,
  gym: Dumbbell,
  "dining area": Utensils,
};

// ── Nepali time labels ──
const NEPALI_TIME_LABELS: Record<string, string> = {
  "05:00-07:00": "५:०० – ७:०० बिहान",
  "06:00-08:00": "६:०० – ८:०० बिहान",
  "07:00-09:00": "७:०० – ९:०० बिहान",
  "08:00-10:00": "८:०० – १०:०० बिहान",
  "00:00-24:00": "२४ घण्टा",
  "16:00-18:00": "४:०० – ६:०० साँझ",
  "17:00-19:00": "५:०० – ७:०० साँझ",
  "18:00-20:00": "६:०० – ८:०० साँझ",
  "19:00-21:00": "७:०० – ९:०० साँझ",
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
  const fmt = (slot?: string) =>
    slot ? (NEPALI_TIME_LABELS[slot] ?? slot) : null;
  if (type === "24-hour" || timings.morning === "00:00-24:00")
    return { is24Hour: true, morning: null, evening: null, note: null };
  if (type === "tanker")
    return { ...empty, note: cleanNote || "ट्याङ्कर पानी उपलब्ध" };
  if (type === "alternate-days")
    return { ...empty, note: cleanNote || "एक दिन छाडी पानी आउँछ" };
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

// ── Image Carousel (same as before, unchanged) ──
const ImageCarousel = ({
  images,
  title,
}: {
  images: string[];
  title: string;
}) => {
  const [current, setCurrent] = useState(0);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const dragX = useMotionValue(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const goTo = useCallback(
    (idx: number) => setCurrent(Math.max(0, Math.min(images.length - 1, idx))),
    [images.length],
  );
  const prev = () => goTo(current - 1);
  const next = () => goTo(current + 1);

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.x < -60) next();
    else if (info.offset.x > 60) prev();
    dragX.set(0);
  };

  if (!images?.length)
    return (
      <div className="h-72 sm:h-96 w-full bg-slate-100 flex items-center justify-center rounded-b-3xl">
        <div className="text-center">
          <Building2 className="w-14 h-14 text-slate-300 mx-auto mb-2" />
          <p className="text-slate-400 text-sm">No photos yet</p>
        </div>
      </div>
    );

  return (
    <>
      <div
        ref={containerRef}
        className="relative h-72 sm:h-[420px] w-full overflow-hidden bg-slate-900"
      >
        <AnimatePresence initial={false} mode="wait">
          <motion.img
            key={current}
            src={resolveImageUrl(images[current])}
            alt={`${title} ${current + 1}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="absolute inset-0 w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "/placeholder-image.jpg";
            }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            style={{ x: dragX, cursor: "grab", userSelect: "none" }}
          />
        </AnimatePresence>

        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20 pointer-events-none" />

        <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5">
          <ImageIcon className="w-3 h-3" />
          {current + 1} / {images.length}
        </div>

        <button
          onClick={() => setShowFullscreen(true)}
          className="absolute top-4 right-4 w-9 h-9 bg-black/60 backdrop-blur-sm text-white rounded-full flex items-center justify-center hover:bg-black/80 transition-colors cursor-pointer"
        >
          <Maximize2 className="w-4 h-4" />
        </button>

        {images.length > 1 && (
          <>
            <button
              onClick={prev}
              disabled={current === 0}
              className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/60 backdrop-blur-sm text-white rounded-full items-center justify-center hover:bg-black/80 disabled:opacity-30 transition-all cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={next}
              disabled={current === images.length - 1}
              className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/60 backdrop-blur-sm text-white rounded-full items-center justify-center hover:bg-black/80 disabled:opacity-30 transition-all cursor-pointer"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.slice(0, 8).map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={cn(
                  "rounded-full transition-all cursor-pointer",
                  i === current
                    ? "w-5 h-2 bg-white"
                    : "w-2 h-2 bg-white/50 hover:bg-white/80",
                )}
              />
            ))}
            {images.length > 8 && (
              <span className="text-white/70 text-xs self-center">
                +{images.length - 8}
              </span>
            )}
          </div>
        )}
      </div>

      {images.length > 1 && (
        <div className="flex gap-2 px-4 py-3 overflow-x-auto scrollbar-none bg-white border-b border-slate-100">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={cn(
                "flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden border-2 transition-all cursor-pointer",
                i === current
                  ? "border-red-500 scale-105 shadow-md shadow-red-100"
                  : "border-transparent opacity-60 hover:opacity-90",
              )}
            >
              <img
                src={resolveImageUrl(img)}
                alt=""
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      <Dialog open={showFullscreen} onOpenChange={setShowFullscreen}>
        <DialogContent className="max-w-none w-screen h-screen p-0 bg-black border-0 rounded-none">
          <DialogTitle className="sr-only">Room Images</DialogTitle>
          <div className="relative w-full h-full flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.img
                key={`fs-${current}`}
                src={resolveImageUrl(images[current])}
                alt={`${title} fullscreen`}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="max-w-full max-h-full object-contain"
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.15}
                onDragEnd={(_: any, info: PanInfo) => {
                  if (info.offset.x < -60) next();
                  else if (info.offset.x > 60) prev();
                }}
                style={{ cursor: "grab", userSelect: "none" }}
              />
            </AnimatePresence>
            <button
              onClick={() => setShowFullscreen(false)}
              className="absolute top-4 right-4 w-10 h-10 bg-white/20 backdrop-blur-sm text-white rounded-full flex items-center justify-center hover:bg-white/30 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            {images.length > 1 && (
              <>
                <button
                  onClick={prev}
                  disabled={current === 0}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 bg-white/20 backdrop-blur-sm text-white rounded-full flex items-center justify-center hover:bg-white/30 disabled:opacity-30 cursor-pointer"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={next}
                  disabled={current === images.length - 1}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 bg-white/20 backdrop-blur-sm text-white rounded-full flex items-center justify-center hover:bg-white/30 disabled:opacity-30 cursor-pointer"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/60 text-white text-sm px-4 py-2 rounded-full font-medium">
                  {current + 1} / {images.length}
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

const ImageIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
  >
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <polyline points="21 15 16 10 5 21" />
  </svg>
);

// ── Status badge ──
const StatusBadge = ({ status }: { status: RoomStatus }) => {
  const map: Record<string, { cls: string; icon: any; label: string }> = {
    Approved: {
      cls: "bg-emerald-50 text-emerald-700 border-emerald-200",
      icon: Check,
      label: "Available",
    },
    Pending: {
      cls: "bg-amber-50 text-amber-700 border-amber-200",
      icon: Clock,
      label: "Pending",
    },
    Rejected: {
      cls: "bg-red-50 text-red-700 border-red-200",
      icon: AlertCircle,
      label: "Unavailable",
    },
  };
  const {
    cls,
    icon: Icon,
    label,
  } = map[status] ?? {
    cls: "bg-slate-50 text-slate-600 border-slate-200",
    icon: AlertCircle,
    label: status,
  };
  return (
    <Badge className={cn("border gap-1 cursor-default font-semibold", cls)}>
      <Icon className="w-3 h-3" />
      {label}
    </Badge>
  );
};

// ── TikTok Card ──
const TikTokCard = ({ url }: { url: string }) => (
  <a
    href={url}
    target="_blank"
    rel="noopener noreferrer"
    className="flex items-center gap-4 p-4 bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl border border-slate-700 hover:from-slate-800 hover:to-slate-700 transition-all group cursor-pointer"
  >
    <div className="w-12 h-12 rounded-xl bg-black flex items-center justify-center flex-shrink-0">
      <svg viewBox="0 0 24 24" className="w-7 h-7" fill="white">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.32 6.32 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34l-.01-8.83a8.18 8.18 0 0 0 4.78 1.52V4.56a4.85 4.85 0 0 1-1-.13z" />
      </svg>
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-white font-bold text-sm">TikTok मा हेर्नुहोस्</p>
      <p className="text-slate-400 text-xs mt-0.5">यस घरको भिडियो उपलब्ध छ</p>
    </div>
    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-pink-500 to-orange-400 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform shadow-lg">
      <PlayCircle className="w-4 h-4 text-white" />
    </div>
  </a>
);

// ── Water Supply Section ──
const WaterSupplySection = ({
  timings,
}: {
  timings:
    | { morning?: string; evening?: string; notes?: string }
    | null
    | undefined;
}) => {
  const info = parseWaterTimings(timings);
  if (!info.is24Hour && !info.morning && !info.evening && !info.note)
    return null;
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
      <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
        <Droplets className="w-4 h-4 text-blue-500" /> पानी आपूर्ति (Water
        Supply)
      </h3>
      {info.is24Hour && (
        <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-xl border border-emerald-200">
          <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-bold text-emerald-800">
              २४ घण्टा पानी उपलब्ध
            </p>
            <p className="text-xs text-emerald-600">24/7 Water Supply</p>
          </div>
        </div>
      )}
      {!info.is24Hour && info.note && !info.morning && !info.evening && (
        <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl border border-blue-100">
          <Droplets className="w-5 h-5 text-blue-500 flex-shrink-0" />
          <p className="text-sm font-semibold text-blue-800">{info.note}</p>
        </div>
      )}
      {(info.morning || info.evening) && (
        <div
          className={cn(
            "grid gap-3",
            info.morning && info.evening
              ? "grid-cols-2"
              : "grid-cols-1 max-w-xs",
          )}
        >
          {info.morning && (
            <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-xl border border-amber-100">
              <span className="text-2xl flex-shrink-0">🌅</span>
              <div>
                <p className="text-[10px] text-amber-600 font-bold uppercase tracking-wide">
                  बिहान
                </p>
                <p className="text-sm font-bold text-amber-900 mt-0.5">
                  {info.morning}
                </p>
              </div>
            </div>
          )}
          {info.evening && (
            <div className="flex items-center gap-3 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
              <span className="text-2xl flex-shrink-0">🌙</span>
              <div>
                <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-wide">
                  साँझ
                </p>
                <p className="text-sm font-bold text-indigo-900 mt-0.5">
                  {info.evening}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
      {info.note && (info.morning || info.evening) && (
        <p className="text-xs text-slate-500 mt-3 pt-3 border-t border-slate-100">
          📝 {info.note}
        </p>
      )}
    </div>
  );
};

// ── Tenant Preferences Section ──
const TenantPreferencesSection = ({ room }: { room: Room }) => {
  const hasPreferences =
    room.idealTenants?.length ||
    room.genderPreference ||
    room.religionPreference;
  if (!hasPreferences) return null;

  const religion = room.religionPreference;
  const showFaded = religion === ReligionType.HINDU;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
      <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
        <Users2 className="w-4 h-4 text-purple-500" /> Tenant Preferences /
        भाडाटारु प्राथमिकताहरू
      </h3>
      <div className="space-y-4">
        {room.idealTenants && room.idealTenants.length > 0 && (
          <div>
            <p className="text-xs text-slate-500 mb-2 font-semibold uppercase tracking-wide">
              Ideal Tenant / आदर्श भाडाटारु
            </p>
            <div className="flex flex-wrap gap-2">
              {room.idealTenants.map((tenant) => (
                <Badge
                  key={tenant}
                  variant="secondary"
                  className="bg-purple-50 text-purple-700 border-purple-200"
                >
                  {tenant}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {room.genderPreference && (
          <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
            <span className="text-sm text-slate-600">
              Gender Preference / लिङ्ग प्राथमिकता
            </span>
            <Badge className="bg-blue-50 text-blue-700 border-blue-200">
              {room.genderPreference}
            </Badge>
          </div>
        )}

        {room.religionPreference && (
          <div
            className={cn(
              "flex justify-between items-center p-3 rounded-xl",
              showFaded ? "bg-amber-50/50" : "bg-slate-50",
            )}
          >
            <span className="text-sm text-slate-600">
              Religion Preference / धर्म प्राथमिकता
            </span>
            <Badge
              className={cn(
                "gap-1",
                showFaded ? "bg-amber-100 text-amber-700" : "bg-slate-100",
              )}
            >
              {room.religionPreference === ReligionType.HINDU && (
                <Church className="w-3 h-3" />
              )}
              {room.religionPreference === ReligionType.MUSLIM && (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="m19,2c-1.65,0-3,1.35-3,3v3.59c0-1.67-.84-3.26-2.32-4.28l-3.12-2.14c-.34-.23-.79-.23-1.13,0l-3.12,2.14c-1.6,1.1-2.43,2.88-2.29,4.68h-1.03c-.55,0-1,.45-1,1v11c0,.55.45,1,1,1h18c.55,0,1-.45,1-1V5c0-1.65-1.35-3-3-3Zm-3,7h-.03c0-.1.03-.21.03-.31v.31Zm-8.55-3.04l2.55-1.75,2.55,1.75c1.04.72,1.56,1.88,1.42,3.04h-7.94c-.14-1.16.38-2.32,1.42-3.04Zm8.55,5.04v1H4v-1h12Zm-3.5,4s-1.5,1-1.5,3v2h-2v-2c0-2-1.5-3-1.5-3,0,0-1.5,1-1.5,3v2h-2v-6h12v6h-2v-2c0-2-1.5-3-1.5-3Zm7.5,5h-2v-12h2v12Zm-2-14v-1c0-.55.45-1,1-1s1,.45,1,1v1h-2Z" />
                </svg>
              )}
              {room.religionPreference === ReligionType.CHRISTIAN && (
                <Gem className="w-3 h-3" />
              )}
              {room.religionPreference}
            </Badge>
          </div>
        )}

        {showFaded && (
          <p className="text-xs text-amber-600 bg-amber-50 p-3 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
            <span>
              Note: Since the owner prefers Hindu, Muslim and Christian
              preferences will be shown faded but are still welcome to inquire.
            </span>
          </p>
        )}
      </div>
    </div>
  );
};

// ── Lifestyle Rules Section ──
const LifestyleRulesSection = ({ room }: { room: Room }) => {
  const rules = room.lifestyleRules;
  if (!rules) return null;

  const hasAnyRule =
    rules.smokingAllowed ||
    rules.alcoholAllowed ||
    rules.nonVegetarianAllowed ||
    rules.buffaloMeatAllowed ||
    rules.porkAllowed ||
    rules.lateNightAllowed ||
    rules.babyAllowed;

  if (!hasAnyRule && !rules.otherRules) return null;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
      <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
        <Shield className="w-4 h-4 text-amber-500" /> Lifestyle Rules / जीवनशैली
        नियमहरू
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {rules.smokingAllowed !== undefined && (
          <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
            <CheckCircle
              className={cn(
                "w-4 h-4",
                rules.smokingAllowed ? "text-green-500" : "text-red-400",
              )}
            />
            <span className="text-xs text-slate-600">
              Smoking {rules.smokingAllowed ? "Allowed" : "Not Allowed"}
            </span>
          </div>
        )}
        {rules.alcoholAllowed !== undefined && (
          <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
            <CheckCircle
              className={cn(
                "w-4 h-4",
                rules.alcoholAllowed ? "text-green-500" : "text-red-400",
              )}
            />
            <span className="text-xs text-slate-600">
              Alcohol {rules.alcoholAllowed ? "Allowed" : "Not Allowed"}
            </span>
          </div>
        )}
        {rules.nonVegetarianAllowed !== undefined && (
          <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
            <Beef className="w-4 h-4 text-slate-500" />
            <span className="text-xs text-slate-600">
              Non-Veg {rules.nonVegetarianAllowed ? "✓" : "✗"}
            </span>
          </div>
        )}
        {rules.buffaloMeatAllowed !== undefined && (
          <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
            <EggFried className="w-4 h-4 text-slate-500" />
            <span className="text-xs text-slate-600">
              Buffalo Meat {rules.buffaloMeatAllowed ? "✓" : "✗"}
            </span>
          </div>
        )}
        {rules.porkAllowed !== undefined && (
          <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
            <Ban className="w-4 h-4 text-slate-500" />
            <span className="text-xs text-slate-600">
              Pork {rules.porkAllowed ? "✓" : "✗"}
            </span>
          </div>
        )}
        {rules.lateNightAllowed !== undefined && (
          <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
            <MoonStar className="w-4 h-4 text-slate-500" />
            <span className="text-xs text-slate-600">
              Late Night {rules.lateNightAllowed ? "Allowed" : "Not Allowed"}
            </span>
          </div>
        )}
        {rules.babyAllowed !== undefined && (
          <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
            <Baby className="w-4 h-4 text-slate-500" />
            <span className="text-xs text-slate-600">
              Baby {rules.babyAllowed ? "Allowed" : "Not Allowed"}
            </span>
          </div>
        )}
      </div>
      {rules.otherRules && (
        <div className="mt-3 p-3 bg-amber-50 rounded-lg border border-amber-100">
          <p className="text-xs text-amber-700 font-medium">Other Rules:</p>
          <p className="text-xs text-amber-600 mt-1">{rules.otherRules}</p>
        </div>
      )}
    </div>
  );
};

// ── Food Preferences Section ──
const FoodPreferencesSection = ({ room }: { room: Room }) => {
  const food = room.foodPreferences;
  if (!food) return null;

  const hasAny =
    food.vegetarianAllowed ||
    food.nonVegetarianAllowed ||
    food.buffaloMeatAllowed ||
    food.porkAllowed ||
    food.allAllowed;
  if (!hasAny) return null;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
      <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
        <Utensils className="w-4 h-4 text-orange-500" /> Food Preferences / खाना
        प्राथमिकताहरू
      </h3>
      <div className="flex flex-wrap gap-2">
        {food.vegetarianAllowed && (
          <Badge className="bg-green-50 text-green-700 border-green-200">
            Vegetarian Only
          </Badge>
        )}
        {food.nonVegetarianAllowed && (
          <Badge className="bg-orange-50 text-orange-700 border-orange-200">
            Non-Veg Allowed
          </Badge>
        )}
        {food.buffaloMeatAllowed && (
          <Badge className="bg-red-50 text-red-700 border-red-200">
            Buffalo Meat
          </Badge>
        )}
        {food.porkAllowed && (
          <Badge className="bg-pink-50 text-pink-700 border-pink-200">
            Pork Allowed
          </Badge>
        )}
        {food.allAllowed && (
          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">
            All Food Allowed
          </Badge>
        )}
      </div>
    </div>
  );
};

// ── Restrictions Section ──
const RestrictionsSection = ({ room }: { room: Room }) => {
  if (!room.restrictions || room.restrictions.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
      <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
        <Ban className="w-4 h-4 text-red-500" /> Restrictions / निषेधहरू
      </h3>
      <div className="flex flex-wrap gap-2">
        {room.restrictions.map((restriction) => (
          <Badge
            key={restriction}
            variant="outline"
            className="border-red-200 text-red-600 bg-red-50"
          >
            {restriction}
          </Badge>
        ))}
      </div>
    </div>
  );
};

// ── Owner Details Section ──
const OwnerDetailsSection = ({ room }: { room: Room }) => {
  const hasOwnerDetails =
    room.ownerCommunity ||
    room.ownerFloor !== undefined ||
    room.allMixCommunity ||
    room.communityWelcomeNote;
  if (!hasOwnerDetails) return null;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
      <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
        <HeartHandshake className="w-4 h-4 text-red-500" /> Owner Information /
        घरधनीको जानकारी
      </h3>
      <div className="space-y-3">
        {room.ownerCommunity && (
          <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
            <span className="text-sm text-slate-600">
              Owner's Community / घरधनीको समुदाय
            </span>
            <span className="font-semibold text-slate-800">
              {room.ownerCommunity}
            </span>
          </div>
        )}
        {room.ownerFloor !== undefined && (
          <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
            <span className="text-sm text-slate-600">
              Owner Floor / घरधनीको तला
            </span>
            <span className="font-semibold text-slate-800">
              {room.ownerFloor}
            </span>
          </div>
        )}
        <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
          <span className="text-sm text-slate-600">
            All Mix Community / सबै समुदाय मिल्ने?
          </span>
          <Badge
            className={
              room.allMixCommunity
                ? "bg-green-100 text-green-700"
                : "bg-slate-100"
            }
          >
            {room.allMixCommunity ? "Yes / हुन्छ" : "No / हुँदैन"}
          </Badge>
        </div>
        {room.communityWelcomeNote && (
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
            <p className="text-xs text-emerald-700">
              {room.communityWelcomeNote}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Additional Features Section ──
const AdditionalFeaturesSection = ({ room }: { room: Room }) => {
  const hasFeatures =
    room.hasClothesDryingArea !== undefined ||
    room.getsSunlight !== undefined ||
    room.roomIssues;
  if (!hasFeatures) return null;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
      <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
        <Sun className="w-4 h-4 text-yellow-500" /> Additional Features / थप
        सुविधाहरू
      </h3>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl">
          <Shirt className="w-4 h-4 text-blue-500" />
          <span className="text-sm text-slate-600">Clothes Drying Area</span>
          <Badge
            className={
              room.hasClothesDryingArea
                ? "bg-green-100 text-green-700 ml-auto"
                : "bg-red-100 text-red-700 ml-auto"
            }
          >
            {room.hasClothesDryingArea ? "Available" : "Not Available"}
          </Badge>
        </div>
        <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl">
          <Sun className="w-4 h-4 text-amber-500" />
          <span className="text-sm text-slate-600">Gets Sunlight</span>
          <Badge
            className={
              room.getsSunlight
                ? "bg-green-100 text-green-700 ml-auto"
                : "bg-red-100 text-red-700 ml-auto"
            }
          >
            {room.getsSunlight ? "Yes" : "No"}
          </Badge>
        </div>
      </div>
      {room.roomIssues && (
        <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
          <p className="text-xs text-amber-700 font-medium">
            Room Issues / कोठाको समस्या:
          </p>
          <p className="text-xs text-amber-600 mt-1">{room.roomIssues}</p>
        </div>
      )}
    </div>
  );
};

// ── Gate Closing Time Section ──
const GateClosingTimeSection = ({ time }: { time?: string }) => {
  if (!time) return null;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
      <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
        <Clock className="w-4 h-4 text-slate-500" /> Gate Closing Time / गेट
        बन्द हुने समय
      </h3>
      <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
        <Clock className="w-5 h-5 text-slate-400" />
        <div>
          <p className="text-sm font-bold text-slate-800">{time}</p>
          <p className="text-xs text-slate-500">गेट कति बजे बन्द हुन्छ?</p>
        </div>
      </div>
    </div>
  );
};

// ── Unlocked Location Section (unchanged) ──
const UnlockedLocationSection = ({
  unlockedData,
  room,
}: {
  unlockedData: UnlockResult;
  room: Room;
}) => {
  const lat = unlockedData.room?.location?.latitude
    ? Number(unlockedData.room.location.latitude)
    : null;
  const lng = unlockedData.room?.location?.longitude
    ? Number(unlockedData.room.location.longitude)
    : null;
  const hasCoords = !!(lat && lng);
  const fullAddress =
    unlockedData.room?.location?.formattedAddress ?? room.address;
  const contactPhone = unlockedData.room?.contactPhone;
  const contactPerson = room.contactPerson;

  const copyAddress = () => {
    navigator.clipboard.writeText(fullAddress);
    toast.success("Address copied!", { icon: "📋", duration: 2000 });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div className="flex items-center gap-2 p-3 bg-emerald-50 rounded-xl border border-emerald-200">
        <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
        <p className="text-sm font-semibold text-emerald-700">
          Room unlocked — full details revealed!
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {contactPhone && (
          <a
            href={`tel:${contactPhone}`}
            className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-100 rounded-xl hover:bg-blue-100 transition-colors cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 shadow group-hover:scale-110 transition-transform">
              <Phone className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wide">
                Owner Phone
              </p>
              <p className="text-sm font-bold text-blue-900 truncate">
                {contactPhone}
              </p>
            </div>
          </a>
        )}
        {contactPerson && (
          <div className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-100 rounded-xl">
            <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
              <User className="w-4 h-4 text-slate-600" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                Owner Name
              </p>
              <p className="text-sm font-bold text-slate-800 truncate">
                {contactPerson}
              </p>
            </div>
          </div>
        )}
      </div>

      {hasCoords && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-red-500" /> Exact Location
            </p>
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:text-red-700 cursor-pointer"
            >
              <Navigation className="w-3.5 h-3.5" /> Directions
            </a>
          </div>
          <div className="h-56 sm:h-64 w-full rounded-2xl overflow-hidden border border-slate-200 shadow-md">
            <MapComponent
              latitude={lat!}
              longitude={lng!}
              popupText={room.title}
            />
          </div>
        </div>
      )}

      <button
        onClick={copyAddress}
        className="w-full flex items-center gap-2 text-sm text-slate-600 bg-slate-50 p-3.5 rounded-xl hover:bg-slate-100 transition-colors text-left group border border-slate-200 cursor-pointer"
      >
        <MapPin className="w-4 h-4 text-red-400 shrink-0" />
        <span className="flex-1 text-xs leading-relaxed">{fullAddress}</span>
        <Copy className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 shrink-0" />
      </button>
    </motion.div>
  );
};

// ── Locked Placeholder (unchanged) ──
const LockedPlaceholder = ({
  isAuthenticated,
  unlockStatus,
  address,
  onUnlock,
  onTopUp,
  isLoaded,
}: {
  isAuthenticated: boolean;
  unlockStatus: UnlockStatus | null;
  address: string;
  onUnlock: () => void;
  onTopUp: () => void;
  isLoaded: boolean;
}) => {
  const serviceCharge = unlockStatus?.serviceCharge ?? 0;
  const walletBalance = unlockStatus?.walletBalance ?? 0;
  const hasSufficient = walletBalance >= serviceCharge;
  const shortAddress = getShortAddress(address);

  return (
    <div className="space-y-4">
      <div className="h-56 sm:h-64 w-full rounded-2xl overflow-hidden border border-slate-200 shadow-md relative bg-gradient-to-br from-slate-100 to-slate-200">
        <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none select-none">
          <MapPin className="w-24 h-24 text-slate-400" />
        </div>
        <div className="absolute inset-0 backdrop-blur-sm bg-white/10" />
        <div className="absolute inset-0 flex items-center justify-center z-10 p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="bg-white/98 backdrop-blur-md rounded-2xl px-5 py-6 shadow-2xl border border-slate-200 text-center max-w-[260px] w-full"
          >
            <div className="w-14 h-14 rounded-2xl bg-slate-900 flex items-center justify-center mx-auto mb-3 shadow-lg">
              <Lock className="w-6 h-6 text-white" />
            </div>
            <p className="font-bold text-slate-900 text-sm mb-1">
              Location & Contact Locked
            </p>
            <p className="text-slate-500 text-xs leading-relaxed mb-4">
              Unlock to see exact map, phone number, and owner name.
            </p>
            {!isLoaded ? (
              <div className="flex justify-center">
                <LoadingSpinner />
              </div>
            ) : !isAuthenticated ? (
              <Button
                size="sm"
                className="w-full rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold cursor-pointer"
                onClick={onUnlock}
              >
                <Lock className="w-3.5 h-3.5 mr-1.5" /> Sign In to Unlock
              </Button>
            ) : unlockStatus === null ? (
              <div className="flex justify-center">
                <LoadingSpinner />
              </div>
            ) : (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs bg-slate-50 rounded-lg px-3 py-2">
                  <span className="text-slate-500">Your balance</span>
                  <span
                    className={cn(
                      "font-bold",
                      hasSufficient ? "text-emerald-600" : "text-red-500",
                    )}
                  >
                    {formatPriceNPR(walletBalance)}
                  </span>
                </div>
                <Button
                  size="sm"
                  className="w-full rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold gap-1.5 shadow-md shadow-red-100 cursor-pointer"
                  onClick={onUnlock}
                >
                  <Lock className="w-3.5 h-3.5" /> Unlock ·{" "}
                  {formatPriceNPR(serviceCharge)}
                </Button>
                {!hasSufficient && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full rounded-xl gap-1.5 border-emerald-300 text-emerald-700 hover:bg-emerald-50 text-xs cursor-pointer"
                    onClick={onTopUp}
                  >
                    Add Money to Wallet
                  </Button>
                )}
              </div>
            )}
          </motion.div>
        </div>
      </div>
      <div className="flex items-center gap-2 text-sm text-slate-500 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
        <MapPin className="w-4 h-4 text-red-400 shrink-0" />
        <span className="text-xs italic flex-1">Area: {shortAddress}</span>
        <Badge
          variant="outline"
          className="text-[10px] gap-1 py-0.5 flex-shrink-0"
        >
          <Lock className="w-2.5 h-2.5" /> Hidden
        </Badge>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[
          { icon: MapPin, label: "Exact Map", color: "text-red-400" },
          { icon: Phone, label: "Phone", color: "text-blue-400" },
          { icon: User, label: "Owner", color: "text-purple-400" },
        ].map(({ icon: Icon, label, color }) => (
          <div
            key={label}
            className="flex flex-col items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100"
          >
            <div className="relative">
              <Icon className={cn("w-5 h-5 opacity-30", color)} />
              <Lock className="w-2.5 h-2.5 text-slate-400 absolute -bottom-0.5 -right-0.5" />
            </div>
            <p className="text-[9px] font-semibold text-slate-400 text-center">
              {label}
            </p>
          </div>
        ))}
      </div>
      <p className="text-[10px] text-slate-400 text-center">
        🔒 One-time unlock · Access forever afterwards
      </p>
    </div>
  );
};

const WhatsAppIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.077 4.928C17.191 3.041 14.683 2 12.006 2 6.798 2 2.528 6.17 2.527 11.26c0 1.695.444 3.355 1.291 4.815L2 22l5.995-1.788c1.44.79 3.064 1.206 4.722 1.207h.005c5.195 0 9.476-4.17 9.477-9.26 0-2.476-.966-4.804-2.842-6.69z" />
  </svg>
);

const LoadingSpinner = () => (
  <div className="w-5 h-5 rounded-full border-2 border-slate-200 border-t-red-500 animate-spin" />
);

// ── Main Component ──
export default function PropertyDetailsPage() {
  const { id } = useParams();
  const user = useUserStore((state) => state.user);
  const isLoaded = useUserStore((state) => state.isLoaded);
  const isAuthenticated = isLoaded && !!user;

  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAllAmenities, setShowAllAmenities] = useState(false);
  const [unlockStatus, setUnlockStatus] = useState<UnlockStatus | null>(null);
  const [unlockedData, setUnlockedData] = useState<UnlockResult | null>(null);
  const [commissionSettings, setCommissionSettings] =
    useState<CommissionSettings | null>(null);
  const [showUnlockDialog, setShowUnlockDialog] = useState(false);
  const [showTopUpDialog, setShowTopUpDialog] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const res = await fetch(`${api.defaults.baseURL}/rooms/${id}`);
        const data = await res.json();
        setRoom(data.data || data);
      } catch {
        toast.error("Failed to load property");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  useEffect(() => {
    if (!isLoaded || !isAuthenticated || !id) return;
    (async () => {
      try {
        const [status, settings] = await Promise.all([
          unlockService.getRoomUnlockStatus(String(id)),
          unlockService.getSettings(),
        ]);
        setUnlockStatus(status);
        setCommissionSettings(settings);
        if (status.isUnlocked) {
          const result = await unlockService.unlockRoom(String(id));
          setUnlockedData(result);
        }
      } catch (err) {
        console.error("Unlock status error:", err);
      }
    })();
  }, [id, isLoaded, isAuthenticated]);

  useEffect(() => {
    if (!isLoaded || isAuthenticated) return;
    unlockService
      .getSettings()
      .then(setCommissionSettings)
      .catch(() => {});
  }, [isLoaded, isAuthenticated]);

  const handleUnlocked = (result: UnlockResult) => {
    setUnlockedData(result);
    setUnlockStatus((prev) =>
      prev
        ? {
            ...prev,
            isUnlocked: true,
            walletBalance: prev.walletBalance - prev.serviceCharge,
          }
        : prev,
    );
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied!", { icon: "🔗", duration: 2500 });
  };

  if (loading) return <LoadingSkeleton />;
  if (!room) return <NotFoundPage />;

  const isAdminHost = room.user?.role === UserRole.ADMIN;
  const shortAddress =
    room.location?.city ??
    getShortAddress(room.location?.formattedAddress ?? room.address);
  const serviceCharge =
    unlockStatus?.serviceCharge ?? commissionSettings?.serviceCharge ?? 0;

  return (
    <>
      <NavBar />
      <div className="min-h-screen bg-slate-50 pt-16">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <ImageCarousel images={room.images || []} title={room.title} />
        </motion.div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-32">
          {/* Top nav row */}
          <div className="flex items-center justify-between mb-5">
            <Link
              href="/rooms"
              className="flex items-center gap-2 text-slate-500 hover:text-red-500 text-sm font-medium transition-colors group cursor-pointer"
            >
              <div className="w-9 h-9 rounded-full bg-white shadow-sm border border-slate-200 flex items-center justify-center group-hover:bg-red-50 group-hover:border-red-200 transition-colors">
                <ArrowLeft className="w-4 h-4" />
              </div>
              <span className="hidden sm:inline">Back to listings</span>
            </Link>
            <div className="flex items-center gap-2">
              <StatusBadge status={room.approvalStatus} />
              <button
                onClick={copyLink}
                title="Copy link"
                className="w-9 h-9 rounded-full bg-white shadow-sm border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <Copy className="w-4 h-4 text-slate-500" />
              </button>
            </div>
          </div>

          {/* Title + address */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="mb-5"
          >
            <Badge className="mb-3 bg-red-50 text-red-600 border-0 font-semibold px-3 py-1 capitalize">
              {room.category}
            </Badge>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight leading-tight">
              {room.title}
            </h1>
            <div className="flex items-center flex-wrap gap-x-4 gap-y-1 mt-2">
              <div className="flex items-center gap-1 text-slate-500 text-sm">
                <MapPin className="w-4 h-4 text-red-400 flex-shrink-0" />
                <span>{shortAddress}</span>
                {!unlockedData && (
                  <Badge
                    variant="outline"
                    className="ml-1 text-[10px] gap-0.5 py-0"
                  >
                    <Lock className="w-2.5 h-2.5" /> Exact hidden
                  </Badge>
                )}
              </div>
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> Added{" "}
                {timeAgo(room.createdAt)}
              </span>
            </div>
          </motion.div>

          {/* Mobile price CTA */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 shadow-sm mb-5 lg:hidden"
          >
            <div>
              <p className="text-xs text-slate-400 font-medium">Monthly Rent</p>
              <p className="text-2xl font-bold text-slate-900 flex items-center gap-1">
                <Landmark className="w-5 h-5 text-red-500" />
                {formatPriceNPR(Number(room.price))}
              </p>
              <p className="text-xs text-slate-400">per month</p>
            </div>
            {unlockedData?.room?.contactPhone ? (
              <a
                href={`https://wa.me/${unlockedData.room.user?.phoneNumber?.replace(/\D/g, "")}?text=${encodeURIComponent(`Hi! Interested in: ${room.title}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white font-bold text-sm rounded-xl transition-colors cursor-pointer shadow-lg shadow-green-100"
              >
                <WhatsAppIcon />
                <span>Chat</span>
              </a>
            ) : (
              <Button
                onClick={() => setShowUnlockDialog(true)}
                className="bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold px-4 cursor-pointer shadow-lg shadow-red-100"
              >
                <Lock className="w-4 h-4 mr-1.5" /> Unlock
              </Button>
            )}
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* LEFT COLUMN */}
            <div className="lg:col-span-2 space-y-5">
              {/* Host info */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12 }}
                className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm"
              >
                <Avatar className="h-12 w-12 ring-2 ring-red-100 flex-shrink-0">
                  <AvatarFallback className="bg-red-50 text-red-600 text-lg font-bold">
                    {isAdminHost
                      ? "R"
                      : unlockedData
                        ? room.user?.name?.charAt(0) || "?"
                        : "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-400">Hosted by</p>
                  {unlockedData ? (
                    <p className="font-bold text-slate-900">
                      {isAdminHost
                        ? "Rental Service"
                        : room.user?.name ||
                          room.contactPerson ||
                          "Property Owner"}
                    </p>
                  ) : (
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <div className="h-4 w-24 bg-slate-200 rounded-lg animate-pulse" />
                      <Lock className="w-3 h-3 text-slate-400" />
                    </div>
                  )}
                  <div className="flex items-center gap-1 mt-1">
                    <Shield className="w-3 h-3 text-emerald-500" />
                    <span className="text-xs text-emerald-600 font-medium">
                      {room.user?.isVerified ? "Verified host" : "New host"}
                    </span>
                  </div>
                </div>
                {unlockedData?.room.user?.phoneNumber && (
                  <a
                    href={`tel:${unlockedData.room.contactPhone}`}
                    className="flex flex-col items-center gap-0.5 group cursor-pointer flex-shrink-0"
                  >
                    <div className="w-10 h-10 rounded-full bg-red-50 group-hover:bg-red-100 border border-red-200 flex items-center justify-center transition-colors">
                      <Phone className="w-4 h-4 text-red-500" />
                    </div>
                    <span className="text-[10px] text-red-500 font-semibold">
                      {unlockedData.room.user.phoneNumber}
                    </span>
                  </a>
                )}
              </motion.div>

              {/* Quick stats */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="grid grid-cols-3 gap-3 p-5 bg-white rounded-2xl border border-slate-100 shadow-sm"
              >
                {[
                  { icon: Users, value: room.roomCapacity, label: "Guests" },
                  {
                    icon: Bath,
                    value: room.bathroomCapacity,
                    label: "Bathrooms",
                  },
                  {
                    icon: Square,
                    value: `${Number(room.roomArea).toFixed(0)}m²`,
                    label: "Area",
                  },
                ].map(({ icon: Icon, value, label }) => (
                  <div key={label} className="text-center">
                    <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center mx-auto mb-2">
                      <Icon className="w-4 h-4 text-red-500" />
                    </div>
                    <p className="text-lg font-bold text-slate-900">{value}</p>
                    <p className="text-xs text-slate-500">{label}</p>
                  </div>
                ))}
              </motion.div>

              {/* Description */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.18 }}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5"
              >
                <h3 className="text-base font-bold text-slate-900 mb-3">
                  About this property
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">
                  {room.description}
                </p>
              </motion.div>

              {/* TikTok */}
              {room.tiktokUrl && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <TikTokCard url={room.tiktokUrl} />
                </motion.div>
              )}

              {/* Amenities */}
              {room.amenities?.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.22 }}
                  className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5"
                >
                  <h3 className="text-base font-bold text-slate-900 mb-4">
                    Amenities
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {(showAllAmenities
                      ? room.amenities
                      : room.amenities.slice(0, 6)
                    ).map((amenity: string) => {
                      const Icon = amenityIcons[amenity.toLowerCase()] || Check;
                      return (
                        <div
                          key={amenity}
                          className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-red-200 transition-colors"
                        >
                          <Icon className="w-4 h-4 text-red-500 flex-shrink-0" />
                          <span className="text-xs text-slate-700 capitalize font-medium">
                            {amenity}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  {room.amenities.length > 6 && (
                    <button
                      onClick={() => setShowAllAmenities(!showAllAmenities)}
                      className="mt-3 text-sm text-red-500 hover:text-red-600 font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      {showAllAmenities ? (
                        <>
                          <ChevronUp className="w-4 h-4" /> Show less
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-4 h-4" /> View all{" "}
                          {room.amenities.length} amenities
                        </>
                      )}
                    </button>
                  )}
                </motion.div>
              )}

              {/* Water Supply */}
              <WaterSupplySection timings={room.waterSupplyTimings} />

              {/* NEW SECTIONS */}
              <TenantPreferencesSection room={room} />
              <LifestyleRulesSection room={room} />
              <FoodPreferencesSection room={room} />
              <RestrictionsSection room={room} />
              <OwnerDetailsSection room={room} />
              <AdditionalFeaturesSection room={room} />
              <GateClosingTimeSection time={room.gateClosingTime} />

              {/* Location & Contact */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.28 }}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5"
              >
                <h3 className="text-base font-bold text-slate-900 mb-5 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-red-500" /> Location & Contact
                </h3>
                {unlockedData ? (
                  <UnlockedLocationSection
                    unlockedData={unlockedData}
                    room={room}
                  />
                ) : (
                  <LockedPlaceholder
                    isAuthenticated={isAuthenticated}
                    unlockStatus={unlockStatus}
                    address={room.location?.formattedAddress ?? room.address}
                    onUnlock={() => setShowUnlockDialog(true)}
                    onTopUp={() => setShowTopUpDialog(true)}
                    isLoaded={isLoaded}
                  />
                )}
              </motion.div>
            </div>

            {/* RIGHT COLUMN */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="lg:col-span-1 hidden lg:block"
            >
              <div className="sticky top-24 space-y-4">
                <Card className="rounded-2xl border-slate-100 shadow-lg overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex items-baseline justify-between mb-5">
                      <div>
                        <span className="text-3xl font-bold text-slate-900 flex items-baseline gap-1">
                          <Landmark className="w-5 h-5 text-red-500 mb-1" />
                          {formatPriceNPR(Number(room.price))}
                        </span>
                        <span className="text-slate-400 text-sm">/month</span>
                      </div>
                      <Badge className="bg-emerald-50 text-emerald-600 border-0 font-semibold">
                        Available
                      </Badge>
                    </div>
                    <div className="space-y-2 mb-5">
                      {[
                        {
                          icon: Users,
                          text: `Room: ${room.roomCapacity} persons`,
                        },
                        {
                          icon: Home,
                          text: `House: ${room.totalHouseCapacity} persons`,
                        },
                        { icon: Building2, text: `Floor ${room.floorNumber}` },
                        {
                          icon: Clock,
                          text: `Added ${timeAgo(room.createdAt)}`,
                        },
                      ].map(({ icon: Icon, text }) => (
                        <div
                          key={text}
                          className="flex items-center gap-2 text-sm text-slate-600"
                        >
                          <Icon className="w-4 h-4 text-slate-400 flex-shrink-0" />
                          <span>{text}</span>
                        </div>
                      ))}
                    </div>
                    {unlockedData?.room?.contactPhone ? (
                      <a
                        href={`https://wa.me/${unlockedData.room.user?.phoneNumber?.replace(/\D/g, "")}?text=${encodeURIComponent(`Hi! I'm interested in: ${room.title}`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full py-4 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold text-sm transition-colors shadow-lg cursor-pointer"
                      >
                        <WhatsAppIcon /> Contact on WhatsApp
                      </a>
                    ) : (
                      <Button
                        onClick={() => setShowUnlockDialog(true)}
                        className="w-full rounded-xl py-6 bg-slate-900 hover:bg-slate-800 text-white font-bold shadow-lg cursor-pointer group"
                      >
                        <Lock className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />{" "}
                        Unlock to Contact Host
                      </Button>
                    )}
                    <p className="text-xs text-slate-400 text-center mt-2">
                      {unlockedData
                        ? "Chat directly with the owner"
                        : `Service charge: ${formatPriceNPR(serviceCharge)}`}
                    </p>
                  </CardContent>
                </Card>

                <Card className="rounded-2xl border-slate-100 shadow-sm">
                  <CardContent className="p-5">
                    <h4 className="text-sm font-bold text-slate-900 mb-4">
                      Property Details
                    </h4>
                    <div className="space-y-3">
                      {[
                        {
                          label: "Type",
                          value: room.category,
                          cls: "capitalize",
                        },
                        { label: "Floor", value: room.floorNumber },
                        {
                          label: "Room Capacity",
                          value: `${room.roomCapacity} persons`,
                        },
                        {
                          label: "House Capacity",
                          value: `${room.totalHouseCapacity} persons`,
                        },
                        {
                          label: "Owner lives here",
                          value: room.ownerLivesInHouse ? "Yes" : "No",
                          cls: room.ownerLivesInHouse ? "text-emerald-600" : "",
                        },
                        {
                          label: "Women allowed",
                          value: room.allowsWomen ? "Yes" : "No",
                          cls: room.allowsWomen
                            ? "text-emerald-600"
                            : "text-red-500",
                        },
                      ].map(({ label, value, cls }) => (
                        <div
                          key={label}
                          className="flex justify-between text-sm"
                        >
                          <span className="text-slate-500">{label}</span>
                          <span
                            className={cn("font-semibold text-slate-900", cls)}
                          >
                            {value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          </div>

          {/* Mobile Property Details */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-5 lg:hidden bg-white rounded-2xl border border-slate-100 shadow-sm p-5"
          >
            <h4 className="text-sm font-bold text-slate-900 mb-4">
              Property Details
            </h4>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Type", value: room.category, cls: "capitalize" },
                { label: "Floor", value: room.floorNumber },
                {
                  label: "Room Capacity",
                  value: `${room.roomCapacity} persons`,
                },
                {
                  label: "House Capacity",
                  value: `${room.totalHouseCapacity} persons`,
                },
                {
                  label: "Owner lives here",
                  value: room.ownerLivesInHouse ? "Yes ✓" : "No",
                  cls: room.ownerLivesInHouse ? "text-emerald-600" : "",
                },
                {
                  label: "Women allowed",
                  value: room.allowsWomen ? "Yes ✓" : "No ✗",
                  cls: room.allowsWomen ? "text-emerald-600" : "text-red-500",
                },
              ].map(({ label, value, cls }) => (
                <div key={label} className="p-3 bg-slate-50 rounded-xl">
                  <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">
                    {label}
                  </p>
                  <p
                    className={cn(
                      "text-sm font-bold text-slate-800 mt-0.5 capitalize",
                      cls,
                    )}
                  >
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Mobile sticky CTA */}
        <div className="fixed bottom-0 left-0 right-0 z-30 lg:hidden bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-xl px-4 py-3">
          <div className="max-w-4xl mx-auto flex items-center gap-3">
            <div className="flex-1">
              <p className="text-xs text-slate-400">Monthly Rent</p>
              <p className="text-xl font-bold text-slate-900">
                {formatPriceNPR(Number(room.price))}
              </p>
            </div>
            {unlockedData?.room?.contactPhone ? (
              <a
                href={`https://wa.me/${unlockedData.room.user?.phoneNumber?.replace(/\D/g, "")}?text=${encodeURIComponent(`Hi! Interested in: ${room.title}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-5 py-3.5 bg-green-600 hover:bg-green-700 text-white font-bold text-sm rounded-xl transition-colors cursor-pointer shadow-lg"
              >
                <WhatsAppIcon /> WhatsApp
              </a>
            ) : (
              <Button
                onClick={() => setShowUnlockDialog(true)}
                className="px-5 py-3.5 bg-red-500 hover:bg-red-600 text-white font-bold text-sm rounded-xl shadow-lg shadow-red-200 cursor-pointer"
              >
                <Lock className="w-4 h-4 mr-1.5" /> Unlock ·{" "}
                {formatPriceNPR(serviceCharge)}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <RoomUnlockDialog
        open={showUnlockDialog}
        onOpenChange={setShowUnlockDialog}
        roomId={String(id)}
        roomTitle={room.title}
        unlockStatus={unlockStatus}
        isAuthenticated={isAuthenticated}
        onUnlocked={handleUnlocked}
        onRequestTopUp={() => {
          setShowUnlockDialog(false);
          setShowTopUpDialog(true);
        }}
      />
      <TopUpRequestDialog
        open={showTopUpDialog}
        onOpenChange={setShowTopUpDialog}
        settings={commissionSettings}
        onSuccess={() => {}}
      />
      <Footer />
    </>
  );
}

// ── Loading Skeleton ──
function LoadingSkeleton() {
  return (
    <>
      <NavBar />
      <div className="min-h-screen bg-slate-50 pt-16">
        <div className="animate-pulse">
          <div className="h-72 sm:h-96 bg-slate-200 w-full" />
          <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
            <div className="h-7 bg-slate-200 rounded-xl w-3/4" />
            <div className="h-4 bg-slate-200 rounded-xl w-1/2" />
            <div className="h-48 bg-slate-200 rounded-2xl" />
          </div>
        </div>
      </div>
    </>
  );
}

// ── Not Found Page ──
function NotFoundPage() {
  const router = useRouter();
  return (
    <>
      <NavBar />
      <div className="min-h-screen bg-slate-50 pt-24 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <Home className="w-10 h-10 text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">
            Property Not Found
          </h2>
          <p className="text-slate-500 text-sm mb-6">
            This property doesn't exist or may have been removed.
          </p>
          <Button
            onClick={() => router.push("/rooms")}
            className="rounded-full px-8 bg-red-500 hover:bg-red-600 text-white cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Listings
          </Button>
        </div>
      </div>
      <Footer />
    </>
  );
}
