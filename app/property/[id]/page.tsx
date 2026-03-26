"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
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
import { formatPriceNPR, formatDate } from "@/lib/utils";
import { Room, RoomStatus } from "@/types/room.types";
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
import { formatDistanceToNow } from "date-fns";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") ||
  "http://localhost:3001";

function resolveImageUrl(path: string): string {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}

/** Returns just the first meaningful segment of a formatted address */
function getShortAddress(formattedAddress: string): string {
  if (!formattedAddress) return "";
  // First word before the first comma
  const firstPart = formattedAddress.split(",")[0].trim();
  return firstPart;
}

function timeAgo(dateStr: string): string {
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
  } catch {
    return formatDate(dateStr);
  }
}

// ─── Amenity icons ────────────────────────────────────────────────────────────

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

// ─── Water supply parser ──────────────────────────────────────────────────────

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
  const fmt = (slot: string | undefined): string | null =>
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

const getStatusBadge = (status: RoomStatus) => {
  switch (status) {
    case "Approved":
      return (
        <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-emerald-200 gap-1 cursor-default">
          <Check className="h-3 w-3" /> Available
        </Badge>
      );
    case "Pending":
      return (
        <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 border-amber-200 gap-1 cursor-default">
          <Clock className="h-3 w-3" /> Pending Approval
        </Badge>
      );
    case "Rejected":
      return (
        <Badge className="bg-red-100 text-red-800 hover:bg-red-100 border-red-200 gap-1 cursor-default">
          <AlertCircle className="h-3 w-3" /> Not Available
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

const ImageCarousel = ({
  images,
  title,
}: {
  images: string[];
  title: string;
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showFullscreen, setShowFullscreen] = useState(false);

  const goToPrevious = () =>
    setCurrentIndex((p) => (p === 0 ? images.length - 1 : p - 1));
  const goToNext = () =>
    setCurrentIndex((p) => (p === images.length - 1 ? 0 : p + 1));

  if (!images || images.length === 0) {
    return (
      <div className="h-[420px] w-full bg-slate-100 rounded-2xl flex items-center justify-center">
        <div className="text-center">
          <Building2 className="h-16 w-16 text-slate-400 mx-auto mb-2" />
          <p className="text-slate-500">No images available</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="relative h-[420px] w-full group rounded-2xl overflow-hidden shadow-xl">
        <img
          src={resolveImageUrl(images[currentIndex])}
          alt={`${title} - Image ${currentIndex + 1}`}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "/placeholder-image.jpg";
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

        {images.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={goToPrevious}
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={goToNext}
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          </>
        )}

        <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-sm">
          {currentIndex + 1} / {images.length}
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
          onClick={() => setShowFullscreen(true)}
        >
          <Maximize2 className="h-4 w-4" />
        </Button>

        {images.length > 1 && (
          <div className="absolute -bottom-16 left-0 right-0 flex justify-center gap-2 p-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg">
            {images.slice(0, 5).map((image, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`relative w-12 h-12 rounded-md overflow-hidden transition-all ${index === currentIndex ? "ring-2 ring-red-500 scale-110" : "opacity-70 hover:opacity-100"}`}
              >
                <img
                  src={resolveImageUrl(image)}
                  alt={`Thumbnail ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      <Dialog open={showFullscreen} onOpenChange={setShowFullscreen}>
        <DialogContent className="max-w-5xl w-[95vw] h-[90vh] p-0">
          <DialogTitle className="sr-only">Room Images</DialogTitle>
          <div className="relative h-full w-full bg-black">
            <img
              src={resolveImageUrl(images[currentIndex])}
              alt={`${title} - Fullscreen`}
              className="w-full h-full object-contain"
            />
            {images.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full"
                  onClick={goToPrevious}
                >
                  <ChevronLeft className="h-8 w-8" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full"
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

// ─── TikTok Card ──────────────────────────────────────────────────────────────

const TikTokCard = ({ url }: { url: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-5 border border-slate-700 overflow-hidden relative"
  >
    <div className="absolute -top-10 -right-10 w-40 h-40 bg-pink-500/20 rounded-full blur-3xl pointer-events-none" />
    <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />
    <div className="relative flex items-center gap-4">
      <div className="w-12 h-12 rounded-xl bg-black flex items-center justify-center shadow-lg flex-shrink-0">
        <svg viewBox="0 0 24 24" className="w-7 h-7" fill="white">
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.32 6.32 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34l-.01-8.83a8.18 8.18 0 0 0 4.78 1.52V4.56a4.85 4.85 0 0 1-1-.13z" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white font-semibold text-sm">TikTok मा हेर्नुहोस्</p>
        <p className="text-slate-400 text-xs mt-0.5">
          यस घरको भिडियो TikTok मा उपलब्ध छ
        </p>
      </div>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex-shrink-0"
      >
        <Button
          size="sm"
          className="rounded-full bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 hover:opacity-90 text-white border-0 gap-1.5 font-semibold shadow-lg"
        >
          <PlayCircle className="w-3.5 h-3.5" />
          हेर्नुहोस्
          <ExternalLink className="w-3 h-3" />
        </Button>
      </a>
    </div>
  </motion.div>
);

// ─── Water Supply Section ─────────────────────────────────────────────────────

const WaterSupplySection = ({
  timings,
}: {
  timings:
    | { morning?: string; evening?: string; notes?: string }
    | null
    | undefined;
}) => {
  const info = parseWaterTimings(timings);
  const hasContent = info.is24Hour || info.morning || info.evening || info.note;
  if (!hasContent) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
      className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6"
    >
      <h3 className="text-xl font-semibold text-slate-900 mb-4 flex items-center gap-2">
        <Droplets className="w-5 h-5 text-blue-500" />
        पानी आपूर्ति (Water Supply)
      </h3>
      {info.is24Hour && (
        <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-xl border border-emerald-200">
          <CheckCircle className="w-6 h-6 text-emerald-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-bold text-emerald-800">
              २४ घण्टा पानी उपलब्ध
            </p>
            <p className="text-xs text-emerald-600 mt-0.5">
              24/7 Water Supply Available
            </p>
          </div>
        </div>
      )}
      {!info.is24Hour && info.note && !info.morning && !info.evening && (
        <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl border border-blue-100">
          <Droplets className="w-6 h-6 text-blue-500 flex-shrink-0" />
          <p className="text-sm font-semibold text-blue-800">{info.note}</p>
        </div>
      )}
      {(info.morning || info.evening) && (
        <div
          className={`grid gap-3 ${info.morning && info.evening ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1 max-w-xs"}`}
        >
          {info.morning && (
            <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-xl border border-amber-100">
              <span className="text-2xl flex-shrink-0">🌅</span>
              <div>
                <p className="text-xs text-amber-600 font-semibold uppercase tracking-wide">
                  बिहान · Morning
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
                <p className="text-xs text-indigo-600 font-semibold uppercase tracking-wide">
                  साँझ · Evening
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
    </motion.div>
  );
};

// ─── Unlocked Location Section ────────────────────────────────────────────────

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
  const hostPhone = unlockedData.room.user?.phoneNumber;
  const contactPerson = room.contactPerson;

  const openDirections = () => {
    if (hasCoords)
      window.open(
        `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
        "_blank",
      );
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(fullAddress);
    toast.success("Address copied!", { icon: "📋", duration: 2000 });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Unlocked success banner */}
      <div className="flex items-center gap-2 p-3 bg-emerald-50 rounded-xl border border-emerald-200">
        <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
        <p className="text-sm font-semibold text-emerald-700">
          Room unlocked — full details revealed
        </p>
      </div>

      {/* Contact info cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {contactPhone && (
          <a
            href={`tel:${contactPhone}`}
            className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-100 rounded-xl hover:bg-blue-100 transition-colors group"
          >
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 shadow">
              <Phone className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">
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
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Owner Name
              </p>
              <p className="text-sm font-bold text-slate-800 truncate">
                {contactPerson}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Map */}
      {hasCoords && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-red-500" /> Exact Location
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={openDirections}
              className="rounded-full gap-1.5 border-red-200 hover:bg-red-50 hover:text-red-600 text-xs"
            >
              <Navigation className="w-3.5 h-3.5" />
              Directions
            </Button>
          </div>
          <div className="h-[260px] w-full rounded-xl overflow-hidden border border-slate-200 shadow-md">
            <MapComponent
              latitude={lat!}
              longitude={lng!}
              popupText={room.title}
            />
          </div>
        </div>
      )}

      {/* Full address */}
      <button
        onClick={copyAddress}
        className="w-full flex items-center gap-2 text-sm text-slate-600 bg-slate-50 p-3 rounded-lg hover:bg-slate-100 transition-colors text-left group border border-slate-100"
      >
        <MapPin className="w-4 h-4 text-red-400 shrink-0" />
        <span className="flex-1">{fullAddress}</span>
        <Copy className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 shrink-0" />
      </button>

      {/* WhatsApp */}
      {hostPhone && (
        <a
          href={`https://wa.me/${hostPhone.replace(/\D/g, "")}?text=${encodeURIComponent(`Hello! I found your room listing and I'm interested. Room: ${room.title}`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold text-sm transition-colors shadow-lg"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.077 4.928C17.191 3.041 14.683 2 12.006 2 6.798 2 2.528 6.17 2.527 11.26c0 1.695.444 3.355 1.291 4.815L2 22l5.995-1.788c1.44.79 3.064 1.206 4.722 1.207h.005c5.195 0 9.476-4.17 9.477-9.26 0-2.476-.966-4.804-2.842-6.69z" />
          </svg>
          WhatsApp मा सम्पर्क गर्नुस्
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      )}
    </motion.div>
  );
};

// ─── Locked Location Placeholder ──────────────────────────────────────────────

const LockedLocationPlaceholder = ({
  isAuthenticated,
  unlockStatus,
  address,
  onUnlockClick,
  onTopUpClick,
  isLoaded,
}: {
  isAuthenticated: boolean;
  unlockStatus: UnlockStatus | null;
  address: string;
  onUnlockClick: () => void;
  onTopUpClick: () => void;
  isLoaded: boolean;
}) => {
  const serviceCharge = unlockStatus?.serviceCharge ?? 0;
  const walletBalance = unlockStatus?.walletBalance ?? 0;
  const hasSufficient = walletBalance >= serviceCharge;
  const shortAddress = getShortAddress(address);

  return (
    <div className="space-y-4">
      {/* Blurred map area */}
      <div className="h-[260px] w-full rounded-xl overflow-hidden border border-slate-200 shadow-md relative bg-gradient-to-br from-slate-100 to-slate-200">
        {/* Fake blurred background */}
        <div className="absolute inset-0 flex items-center justify-center opacity-30 select-none pointer-events-none">
          <MapPin className="w-20 h-20 text-slate-400" />
        </div>
        <div className="absolute inset-0 backdrop-blur-sm bg-white/20" />

        {/* Lock overlay */}
        <div className="absolute inset-0 flex items-center justify-center z-10 p-4">
          <div className="bg-white/96 backdrop-blur-sm rounded-2xl px-6 py-5 shadow-2xl border border-slate-200 text-center max-w-xs w-full">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center mx-auto mb-3 shadow-lg">
              <Lock className="w-5 h-5 text-white" />
            </div>
            <p className="font-bold text-slate-900 text-sm mb-1">
              Location & Contact Locked
            </p>
            <p className="text-slate-500 text-xs leading-relaxed mb-4">
              Unlock to see the exact map, host phone number, and owner details.
            </p>

            {!isLoaded ? (
              <div className="flex justify-center">
                <div className="w-5 h-5 rounded-full border-2 border-slate-200 border-t-red-500 animate-spin" />
              </div>
            ) : !isAuthenticated ? (
              <Button
                size="sm"
                className="w-full rounded-xl bg-red-500 hover:bg-red-600 text-white gap-1.5"
                onClick={onUnlockClick}
              >
                <Lock className="w-3.5 h-3.5" />
                Sign In to Unlock
              </Button>
            ) : unlockStatus === null ? (
              <div className="flex justify-center">
                <div className="w-5 h-5 rounded-full border-2 border-slate-200 border-t-red-500 animate-spin" />
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs px-1 mb-2">
                  <span className="text-slate-500">Your balance</span>
                  <span
                    className={`font-bold ${hasSufficient ? "text-emerald-600" : "text-red-500"}`}
                  >
                    {formatPriceNPR(walletBalance)}
                  </span>
                </div>
                <Button
                  size="sm"
                  className="w-full rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold gap-1.5 shadow-md shadow-red-100 cursor-pointer"
                  onClick={onUnlockClick}
                >
                  <Lock className="w-3.5 h-3.5" />
                  Unlock · {formatPriceNPR(serviceCharge)}
                </Button>
                {!hasSufficient && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full rounded-xl gap-1.5 border-emerald-200 text-emerald-700 hover:bg-emerald-600 text-xs cursor-pointer"
                    onClick={onTopUpClick}
                  >
                    Add Money to Wallet
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Short address — only first word */}
      <div className="flex items-center gap-2 text-sm text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-100">
        <MapPin className="w-4 h-4 text-red-400 shrink-0" />
        <span className="italic">Area: {shortAddress}</span>
        <Badge
          variant="outline"
          className="ml-auto text-[10px] flex-shrink-0 gap-1"
        >
          <Lock className="w-2.5 h-2.5" />
          Exact hidden
        </Badge>
      </div>

      {/* Locked info cards */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { icon: MapPin, label: "Exact Map", color: "text-red-400" },
          { icon: Phone, label: "Host Phone", color: "text-blue-400" },
          { icon: User, label: "Owner Name", color: "text-purple-400" },
        ].map(({ icon: Icon, label, color }) => (
          <div
            key={label}
            className="flex flex-col items-center gap-1.5 p-3 bg-slate-50 rounded-xl border border-slate-100"
          >
            <div className="relative">
              <Icon className={`w-5 h-5 ${color} opacity-40`} />
              <Lock className="w-3 h-3 text-slate-400 absolute -bottom-1 -right-1" />
            </div>
            <p className="text-[10px] font-semibold text-slate-400">{label}</p>
          </div>
        ))}
      </div>

      <p className="text-[11px] text-slate-400 text-center">
        🔒 One-time unlock · Unlimited access afterwards
      </p>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PropertyDetailsPage() {
  const { id } = useParams();
  const user = useUserStore((state) => state.user);
  const isLoaded = useUserStore((state) => state.isLoaded);
  const isAuthenticated = isLoaded && !!user;

  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [showAllAmenities, setShowAllAmenities] = useState(false);
  const [unlockStatus, setUnlockStatus] = useState<UnlockStatus | null>(null);
  const [unlockedData, setUnlockedData] = useState<UnlockResult | null>(null);
  const [commissionSettings, setCommissionSettings] =
    useState<CommissionSettings | null>(null);
  const [showUnlockDialog, setShowUnlockDialog] = useState(false);
  const [showTopUpDialog, setShowTopUpDialog] = useState(false);

  // ── Fetch room ──
  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const res = await fetch(`${api.defaults.baseURL}/rooms/${id}`);
        const data = await res.json();
        setRoom(data.data || data);
      } catch {
        toast.error("Failed to load property details");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  // ── Fetch unlock status (authenticated users only) ──
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
        console.error("Failed to fetch unlock status:", err);
      }
    })();
  }, [id, isLoaded, isAuthenticated]);

  // ── Fetch settings for unauthenticated users (for TopUp QR display) ──
  useEffect(() => {
    if (!isLoaded || isAuthenticated) return;
    unlockService
      .getSettings()
      .then(setCommissionSettings)
      .catch(() => {});
  }, [isLoaded, isAuthenticated]);

  // ── Copy link — NO navigator.share (that was causing the popup) ──
  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied!", { icon: "🔗", duration: 2500 });
  };

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

  if (loading) {
    return (
      <>
        <NavBar />
        <div className="min-h-screen bg-slate-50 pt-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="animate-pulse space-y-8">
              <div className="h-8 bg-slate-200 rounded w-1/4" />
              <div className="h-[420px] bg-slate-200 rounded-2xl" />
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-4">
                  <div className="h-6 bg-slate-200 rounded w-3/4" />
                  <div className="h-4 bg-slate-200 rounded w-1/2" />
                  <div className="h-32 bg-slate-200 rounded" />
                </div>
                <div className="h-64 bg-slate-200 rounded" />
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (!room) {
    return (
      <>
        <NavBar />
        <div className="min-h-screen bg-slate-50 pt-24 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-4">
            <div className="w-24 h-24 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-6">
              <Home className="w-12 h-12 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              Property Not Found
            </h2>
            <p className="text-slate-500 mb-8">
              The property you're looking for doesn't exist or may have been
              removed.
            </p>
            <Link href="/rooms">
              <Button className="rounded-full px-8 bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Listings
              </Button>
            </Link>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  const mainAmenities = room.amenities?.slice(0, 6) || [];
  const additionalAmenities = room.amenities?.slice(6) || [];
  const formattedPrice = formatPriceNPR(Number(room.price));
  const isAdminHost = room.user?.role === UserRole.ADMIN;

  // Short address for display before unlock
  const shortAddress =
    room.location?.city ??
    getShortAddress(room.location?.formattedAddress ?? room.address);

  return (
    <>
      <NavBar />
      <div className="min-h-screen bg-slate-50 pt-24 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* ── Top nav ── */}
          <div className="flex items-center justify-between mb-6">
            <Link
              href="/rooms"
              className="inline-flex items-center gap-2 text-slate-500 hover:text-red-500 text-sm font-medium transition-colors group"
            >
              <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center group-hover:bg-red-50 transition-colors">
                <ArrowLeft className="w-4 h-4" />
              </div>
              <span>Back to listings</span>
            </Link>
            <div className="flex items-center gap-2">
              {getStatusBadge(room.approvalStatus)}
              {/* Copy link button — no navigator.share to avoid the permission popup */}
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopyLink}
                className="rounded-full w-10 h-10 border-slate-200 hover:bg-red-50 hover:border-red-200 transition-all"
                title="Copy link"
              >
                <Copy className="w-4 h-4 text-slate-600" />
              </Button>
            </div>
          </div>

          {/* ── Carousel ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10"
          >
            <ImageCarousel images={room.images || []} title={room.title} />
          </motion.div>

          {/* ── Main grid ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
            {/* LEFT COLUMN */}
            <div className="lg:col-span-2 space-y-8">
              {/* Title & address */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Badge className="mb-3 bg-red-50 text-red-600 border-0 font-semibold px-3 py-1 capitalize">
                  {room.category}
                </Badge>
                <h1 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
                  {room.title}
                </h1>
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  <div className="flex items-center gap-1 text-slate-500">
                    <MapPin className="w-4 h-4 text-red-400 flex-shrink-0" />
                    {/* Show only short address (city/first word) until unlocked */}
                    <span className="text-sm">{shortAddress}</span>
                    {!unlockedData && (
                      <Badge
                        variant="outline"
                        className="ml-1 text-[10px] gap-1 py-0"
                      >
                        <Lock className="w-2.5 h-2.5" /> Exact hidden
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs md:text-md  text-slate-800 font-bold flex items-center gap-1 ml-auto">
                    <Clock className="w-3.5 h-3.5" />
                    Added {timeAgo(room.createdAt)}
                  </span>
                </div>
              </motion.div>

              {/* Host Info — name/phone hidden until unlocked */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="flex items-center gap-4 p-5 bg-white rounded-2xl border border-slate-100 shadow-sm"
              >
                <Avatar className="h-14 w-14 ring-2 ring-red-100 flex-shrink-0">
                  <AvatarFallback className="bg-red-50 text-red-600 text-lg font-bold">
                    {isAdminHost
                      ? "R"
                      : unlockedData
                        ? room.user?.name?.charAt(0)
                        : "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-400 mb-0.5">Hosted by</p>
                  {unlockedData ? (
                    <>
                      {isAdminHost ? (
                        <>
                          <p className="font-bold text-slate-900 leading-tight">
                            Rental Service
                          </p>
                          <p className="text-xs text-slate-500">
                            The Administrator
                          </p>
                        </>
                      ) : (
                        <p className="font-semibold text-slate-900">
                          {room.user?.name ||
                            room.contactPerson ||
                            "Property Owner"}
                        </p>
                      )}
                    </>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-28 bg-slate-200 rounded animate-pulse" />
                      <Lock className="w-3 h-3 text-slate-400" />
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 mt-1">
                    <Shield className="w-3 h-3 text-emerald-500" />
                    <span className="text-xs text-emerald-600 font-medium">
                      {room.user?.isVerified ? "Verified host" : "New host"}
                    </span>
                  </div>
                </div>
                {/* Phone only after unlock */}
                {unlockedData?.room.user?.phoneNumber && (
                  <a
                    href={`tel:${unlockedData.room.contactPhone}`}
                    className="flex-shrink-0 flex flex-col items-center gap-1 group"
                  >
                    <div className="w-11 h-11 rounded-full bg-red-50 group-hover:bg-red-100 border border-red-200 flex items-center justify-center transition-colors">
                      <Phone className="w-4 h-4 text-red-500" />
                    </div>
                    <span className="text-xs text-red-500 font-medium">
                      {unlockedData.room.user.phoneNumber}
                    </span>
                  </a>
                )}
              </motion.div>

              {/* Quick Stats */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="grid grid-cols-3 gap-4 p-6 bg-white rounded-2xl border border-slate-100 shadow-sm"
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
                    value: `${Number(room.roomArea).toFixed(0)} m²`,
                    label: "Area",
                  },
                ].map(({ icon: Icon, value, label }) => (
                  <div key={label} className="text-center">
                    <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-2">
                      <Icon className="w-5 h-5 text-red-500" />
                    </div>
                    <p className="text-lg font-bold text-slate-900">{value}</p>
                    <p className="text-xs text-slate-500">{label}</p>
                  </div>
                ))}
              </motion.div>

              {/* Description */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
              >
                <h3 className="text-xl font-semibold text-slate-900 mb-3">
                  About this property
                </h3>
                <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">
                  {room.description}
                </p>
              </motion.div>

              {/* TikTok */}
              {room.tiktokUrl && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.28 }}
                >
                  <h3 className="text-xl font-semibold text-slate-900 mb-3">
                    भिडियो हेर्नुहोस्
                  </h3>
                  <TikTokCard url={room.tiktokUrl} />
                </motion.div>
              )}

              {/* Amenities */}
              {room.amenities && room.amenities.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <h3 className="text-xl font-semibold text-slate-900 mb-4">
                    Amenities
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {mainAmenities.map((amenity: string) => {
                      const Icon = amenityIcons[amenity.toLowerCase()] || Check;
                      return (
                        <div
                          key={amenity}
                          className="flex items-center gap-2.5 p-3 rounded-xl bg-white border border-slate-100 hover:border-red-200 transition-colors group"
                        >
                          <Icon className="w-4 h-4 text-red-500 group-hover:scale-110 transition-transform" />
                          <span className="text-sm text-slate-700 capitalize">
                            {amenity}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  {additionalAmenities.length > 0 && (
                    <button
                      onClick={() => setShowAllAmenities(true)}
                      className="mt-4 text-sm text-red-500 hover:text-red-600 font-medium inline-flex items-center gap-1"
                    >
                      View all {room.amenities.length} amenities
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                </motion.div>
              )}

              {/* Water Supply */}
              <WaterSupplySection timings={room.waterSupplyTimings} />

              {/* ── Location & Contact section ── */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6"
              >
                <h3 className="text-xl font-semibold text-slate-900 mb-5 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-red-500" />
                  Location & Contact
                </h3>

                {unlockedData ? (
                  <UnlockedLocationSection
                    unlockedData={unlockedData}
                    room={room}
                  />
                ) : (
                  <LockedLocationPlaceholder
                    isAuthenticated={isAuthenticated}
                    unlockStatus={unlockStatus}
                    address={room.location?.formattedAddress ?? room.address}
                    onUnlockClick={() => setShowUnlockDialog(true)}
                    onTopUpClick={() => setShowTopUpDialog(true)}
                    isLoaded={isLoaded}
                  />
                )}
              </motion.div>
            </div>

            {/* RIGHT COLUMN */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="lg:col-span-1"
            >
              <div className="sticky top-28 space-y-5">
                {/* Price Card */}
                <Card className="rounded-2xl border-slate-100 shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-baseline justify-between mb-5">
                      <div>
                        <span className="text-3xl font-bold text-slate-900 flex items-center gap-1">
                          <Landmark className="w-5 h-5 text-red-500" />
                          {formattedPrice}
                        </span>
                        <span className="text-slate-500 text-sm">/month</span>
                      </div>
                      <Badge className="bg-emerald-50 text-emerald-600 border-0">
                        Available
                      </Badge>
                    </div>

                    <div className="space-y-2.5 mb-5">
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-600">
                          Room capacity: {room.roomCapacity} persons
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Home className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-600">
                          House capacity: {room.totalHouseCapacity} persons
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-600">
                          Added {timeAgo(room.createdAt)}
                        </span>
                      </div>
                    </div>

                    {unlockedData?.room?.contactPhone ? (
                      <a
                        href={`https://wa.me/${unlockedData?.room?.user?.phoneNumber?.replace(/\D/g, "")}?text=${encodeURIComponent(`Hello! I'm interested in: ${room.title}`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full py-4 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold text-sm transition-colors shadow-lg"
                      >
                        <svg
                          className="w-5 h-5"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M19.077 4.928C17.191 3.041 14.683 2 12.006 2 6.798 2 2.528 6.17 2.527 11.26c0 1.695.444 3.355 1.291 4.815L2 22l5.995-1.788c1.44.79 3.064 1.206 4.722 1.207h.005c5.195 0 9.476-4.17 9.477-9.26 0-2.476-.966-4.804-2.842-6.69z" />
                        </svg>
                        Contact on WhatsApp
                      </a>
                    ) : (
                      <Button
                        className="w-full rounded-xl py-6 bg-slate-900 hover:bg-slate-800 text-white font-semibold shadow-lg transition-all group cursor-pointer"
                        onClick={() => setShowUnlockDialog(true)}
                      >
                        <Lock className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                        Unlock to Contact Host
                      </Button>
                    )}

                    <p className="text-xs text-slate-400 text-center mt-2">
                      {unlockedData
                        ? "Chat directly with the host"
                        : "Unlock to see host contact details"}
                    </p>
                  </CardContent>
                </Card>

                {/* Property Details */}
                <Card className="rounded-2xl border-slate-100 shadow-sm">
                  <CardContent className="p-6">
                    <h4 className="text-sm font-semibold text-slate-900 mb-4">
                      Property Details
                    </h4>
                    <div className="space-y-3">
                      {[
                        {
                          label: "Property Type",
                          value: room.category,
                          cls: "capitalize",
                        },
                        {
                          label: "Floor Number",
                          value: room.floorNumber,
                          cls: "",
                        },
                        {
                          label: "Owner Lives Here",
                          value: room.ownerLivesInHouse ? "Yes" : "No",
                          cls: room.ownerLivesInHouse
                            ? "text-emerald-600"
                            : "text-slate-900",
                        },
                        {
                          label: "Women Allowed",
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
                            className={`font-medium ${cls || "text-slate-900"}`}
                          >
                            {value}
                          </span>
                        </div>
                      ))}
                    </div>

                    {room.tiktokUrl && (
                      <>
                        <Separator className="my-4" />
                        <a
                          href={room.tiktokUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 group"
                        >
                          <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center flex-shrink-0">
                            <svg
                              viewBox="0 0 24 24"
                              className="w-5 h-5"
                              fill="white"
                            >
                              <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.32 6.32 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34l-.01-8.83a8.18 8.18 0 0 0 4.78 1.52V4.56a4.85 4.85 0 0 1-1-.13z" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-slate-500">
                              TikTok Profile
                            </p>
                            <p className="text-sm font-semibold text-slate-900 group-hover:text-pink-600 transition-colors flex items-center gap-1">
                              View Profile <ExternalLink className="w-3 h-3" />
                            </p>
                          </div>
                        </a>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* ── All Amenities Modal ── */}
      <AnimatePresence>
        {showAllAmenities && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowAllAmenities(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white border-b border-slate-100 p-6 flex items-center justify-between">
                <h3 className="text-xl font-semibold text-slate-900">
                  All Amenities
                </h3>
                <button
                  onClick={() => setShowAllAmenities(false)}
                  className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  {room.amenities?.map((amenity: string) => {
                    const Icon = amenityIcons[amenity.toLowerCase()] || Check;
                    return (
                      <div key={amenity} className="flex items-center gap-3">
                        <Icon className="w-5 h-5 text-red-500" />
                        <span className="text-sm text-slate-700 capitalize">
                          {amenity}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Dialogs ── */}
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
