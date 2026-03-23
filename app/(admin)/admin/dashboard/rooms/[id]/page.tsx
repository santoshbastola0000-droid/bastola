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
  Mail,
  MessageCircle,
  Calendar,
  Clock,
  Shield,
  Edit,
  AlertCircle,
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
import { formatDate } from "@/lib/utils";
import { Room, RoomStatus } from "@/types/room.types";
import { roomService } from "@/http/services/room.service";
import Link from "next/link";
import Image from "next/image";

const MapComponent = dynamic(() => import("@/components/ui/map"), {
  ssr: false,
  loading: () => (
    <div className="h-[300px] w-full bg-gray-100 animate-pulse rounded-lg flex items-center justify-center">
      <Globe className="h-8 w-8 text-gray-400" />
    </div>
  ),
});

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "";

const getImageUrl = (imagePath: string) => {
  if (imagePath.startsWith("http")) return imagePath;
  return `${API_BASE_URL.replace(/\/$/, "")}/${imagePath.replace(/^\//, "")}`;
};

// ─── Water supply parser ──────────────────────────────────────────────
/**
 * API shape: { morning: string, evening: string, notes: "TYPE:xxx optionalUserNote" }
 *
 * TYPE values stored in the notes field:
 *   24-hour | morning-only | evening-only | morning-evening |
 *   alternate-days | tanker | custom
 *
 * Rules:
 *  TYPE:24-hour  OR  morning === "00:00-24:00"
 *    → show 24-hour badge only — ignore slot fields entirely
 *  TYPE:morning-only
 *    → show morning slot ONLY — ignore evening even if non-empty
 *  TYPE:evening-only
 *    → show evening slot ONLY — ignore morning
 *  TYPE:morning-evening  (or no TYPE tag)
 *    → show whichever slots are non-empty strings
 *  TYPE:tanker | TYPE:alternate-days
 *    → show a note-only card, no slot cards at all
 *  The "TYPE:xxx" substring is always stripped before showing the user-facing note.
 */

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
  morning: string | null; // formatted label or null
  evening: string | null; // formatted label or null
  note: string | null; // clean note (TYPE tag stripped), or null
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

  // Extract and remove the TYPE tag
  const typeMatch = rawNotes.match(/TYPE:([a-z0-9-]+)/i);
  const type = typeMatch?.[1]?.toLowerCase() ?? "";
  const cleanNote = rawNotes.replace(/TYPE:[a-z0-9-]+/i, "").trim() || null;

  // Format a raw slot string to a label (falls back to raw value)
  const fmt = (slot: string | undefined): string | null => {
    if (!slot) return null;
    return ENGLISH_TIME_LABELS[slot] ?? slot;
  };

  // ── 24-hour ──
  if (type === "24-hour" || timings.morning === "00:00-24:00") {
    return { is24Hour: true, morning: null, evening: null, note: null };
  }

  // ── tanker ──
  if (type === "tanker") {
    return { ...empty, note: cleanNote || "Tanker water available" };
  }

  // ── alternate-days ──
  if (type === "alternate-days") {
    return {
      ...empty,
      note: cleanNote || "Water available on alternate days",
    };
  }

  // ── morning-only: show morning, ignore evening entirely ──
  if (type === "morning-only") {
    return { ...empty, morning: fmt(timings.morning), note: cleanNote };
  }

  // ── evening-only: show evening, ignore morning entirely ──
  if (type === "evening-only") {
    return { ...empty, evening: fmt(timings.evening), note: cleanNote };
  }

  // ── morning-evening / custom / no TYPE tag ──
  // Only show a slot if its raw value is a non-empty string
  return {
    ...empty,
    morning: fmt(timings.morning),
    evening: fmt(timings.evening),
    note: cleanNote,
  };
}

// ─── Water Supply Display (admin) ─────────────────────────────────────
function WaterSupplyDisplay({
  timings,
}: {
  timings:
    | { morning?: string; evening?: string; notes?: string }
    | null
    | undefined;
}) {
  const info = parseWaterTimings(timings);
  const hasContent = info.is24Hour || info.morning || info.evening || info.note;
  if (!hasContent) return null;

  return (
    <>
      <Separator className="my-4" />
      <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
        <Droplets className="h-4 w-4 text-primary" />
        Water Supply Timings
      </h3>

      <div className="space-y-3">
        {/* 24-hour */}
        {info.is24Hour && (
          <div className="p-3 bg-green-50 rounded-lg border border-green-200">
            <p className="text-sm font-semibold text-green-800 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              24-hour water available (२४ घण्टा पानी उपलब्ध)
            </p>
          </div>
        )}

        {/* Note-only (tanker, alternate-days) — no slot cards */}
        {!info.is24Hour && info.note && !info.morning && !info.evening && (
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm font-semibold text-blue-800 flex items-center gap-2">
              <Droplets className="h-4 w-4" />
              {info.note}
            </p>
          </div>
        )}

        {/* Morning / Evening time slot cards */}
        {(info.morning || info.evening) && (
          <div
            className={`grid gap-3 ${
              info.morning && info.evening
                ? "grid-cols-1 sm:grid-cols-2"
                : "grid-cols-1"
            }`}
          >
            {info.morning && (
              <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <p className="text-xs text-yellow-600 font-medium flex items-center gap-1 mb-1">
                  ☀️ Morning
                </p>
                <p className="font-semibold text-gray-800">{info.morning}</p>
              </div>
            )}
            {info.evening && (
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-xs text-blue-600 font-medium flex items-center gap-1 mb-1">
                  🌙 Evening
                </p>
                <p className="font-semibold text-gray-800">{info.evening}</p>
              </div>
            )}
          </div>
        )}

        {/* Extra note when time slots are also shown */}
        {info.note && (info.morning || info.evening) && (
          <p className="text-sm text-gray-500 p-2 bg-gray-50 rounded-lg">
            <span className="font-medium">Note:</span> {info.note}
          </p>
        )}
      </div>
    </>
  );
}

// ─── Badges ───────────────────────────────────────────────────────────
const getApprovalBadge = (status: RoomStatus) => {
  switch (status) {
    case RoomStatus.APPROVED:
      return (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200 gap-1 cursor-default">
          <CheckCircle className="h-3 w-3" /> Approved
        </Badge>
      );
    case RoomStatus.PENDING:
      return (
        <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-200 gap-1 cursor-default">
          <Clock className="h-3 w-3" /> Pending
        </Badge>
      );
    case RoomStatus.REJECTED:
      return (
        <Badge className="bg-red-100 text-red-800 hover:bg-red-100 border-red-200 gap-1 cursor-default">
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
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200 gap-1 cursor-default">
          <CheckCircle className="h-3 w-3" /> Available
        </Badge>
      );
    case RoomStatus.RENTED:
      return (
        <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200 gap-1 cursor-default">
          <Users className="h-3 w-3" /> Rented
        </Badge>
      );
    case RoomStatus.ARCHIVED:
      return (
        <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100 border-gray-200 gap-1 cursor-default">
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

// ─── Image Carousel ───────────────────────────────────────────────────
interface ImageCarouselProps {
  images: string[];
  title: string;
}

function ImageCarousel({ images, title }: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showFullscreen, setShowFullscreen] = useState(false);

  const goToPrevious = () =>
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  const goToNext = () =>
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));

  if (!images || images.length === 0) {
    return (
      <div className="h-[350px] w-full bg-gray-100 rounded-xl flex flex-col items-center justify-center gap-2">
        <Building2 className="h-16 w-16 text-gray-400" />
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
            alt={`${title} - ${currentIndex + 1}`}
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
                className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer h-10 w-10"
                onClick={goToPrevious}
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer h-10 w-10"
                onClick={goToNext}
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            </>
          )}

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white px-3 py-1 rounded-full text-sm backdrop-blur-sm">
            {currentIndex + 1} / {images.length}
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="absolute top-3 right-3 bg-black/50 hover:bg-black/70 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            onClick={() => setShowFullscreen(true)}
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>

        {images.length > 1 && (
          <div className="flex gap-2 p-3 bg-gray-50 border-t overflow-x-auto">
            {images.map((image, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden transition-all cursor-pointer ${
                  index === currentIndex
                    ? "ring-2 ring-primary scale-105"
                    : "opacity-60 hover:opacity-100"
                }`}
              >
                <Image
                  src={getImageUrl(image)}
                  alt={`Thumbnail ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="64px"
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
              alt={`${title} - Fullscreen ${currentIndex + 1}`}
              className="max-h-full max-w-full object-contain rounded-lg"
            />
            {images.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full cursor-pointer"
                  onClick={goToPrevious}
                >
                  <ChevronLeft className="h-8 w-8" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full cursor-pointer"
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
}

// ─── Loading skeleton ─────────────────────────────────────────────────
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

// ─── Main Page ────────────────────────────────────────────────────────
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
          <ChevronLeft className="h-4 w-4 mr-2" />
          फिर्ता जानुहोस्
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
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
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
              </div>
              <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary flex-shrink-0" />
                <span className="truncate">{room.title}</span>
              </h1>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                variant="outline"
                onClick={() => router.back()}
                className="cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                फिर्ता
              </Button>
              <Button
                asChild
                className="bg-primary hover:bg-primary/90 cursor-pointer"
              >
                <Link href={`/admin/dashboard/rooms/${room.id}/edit`}>
                  <Edit className="h-4 w-4 mr-2" />
                  सम्पादन गर्नुहोस्
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 md:px-6 lg:px-8 space-y-6 max-w-7xl mx-auto">
        {/* Image Carousel */}
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
                <p className="text-sm text-gray-500">
                  Listed by:{" "}
                  <span className="font-medium text-gray-700">
                    {room.user?.name || "Unknown"}
                  </span>
                </p>
                <p className="text-xs text-gray-400">
                  {room.category.replace("_", " ")} • {room.address}
                </p>
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
                  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="white">
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
                    <Globe className="h-3 w-3" />
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left — main details */}
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
                      label: "Bathroom Capacity",
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
                      value: `${room.rentedRoomsCount}`,
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
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">{item.label}</p>
                          <p className="font-semibold text-sm">{item.value}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* ── Water Supply (uses parseWaterTimings — no more raw inline checks) ── */}
                <WaterSupplyDisplay timings={room.waterSupplyTimings} />
              </CardContent>
            </Card>

            {/* Amenities */}
            {room.amenities && room.amenities.length > 0 && (
              <Card>
                <CardContent className="p-4 md:p-6">
                  <h2 className="font-semibold text-gray-900 mb-4 text-lg">
                    Amenities
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

            {/* Map — full visibility for admin */}
            {hasValidCoordinates && (
              <Card>
                <CardContent className="p-4 md:p-6">
                  <h2 className="font-semibold text-gray-900 mb-4 text-lg flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
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

          {/* Right column */}
          <div className="space-y-6">
            {/* Contact */}
            <Card>
              <CardContent className="p-4 md:p-6">
                <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" />
                  सम्पर्क जानकारी
                </h2>
                <div className="space-y-4">
                  {room.contactPerson && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">
                        Contact Person
                      </p>
                      <p className="font-medium">{room.contactPerson}</p>
                    </div>
                  )}
                  {room.contactPhone && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Phone</p>
                      <a
                        href={`tel:${room.contactPhone}`}
                        className="font-medium text-blue-600 hover:underline flex items-center gap-2 cursor-pointer"
                      >
                        <Phone className="h-4 w-4" />
                        {room.contactPhone}
                      </a>
                    </div>
                  )}
                  {room.contactWhatsapp && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">WhatsApp</p>
                      <a
                        href={`https://wa.me/${room.contactWhatsapp.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-green-600 hover:underline flex items-center gap-2 cursor-pointer"
                      >
                        <MessageCircle className="h-4 w-4" />
                        {room.contactWhatsapp}
                      </a>
                    </div>
                  )}
                  {room.contactEmail && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Email</p>
                      <a
                        href={`mailto:${room.contactEmail}`}
                        className="font-medium text-blue-600 hover:underline flex items-center gap-2 cursor-pointer"
                      >
                        <Mail className="h-4 w-4" />
                        {room.contactEmail}
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
                  Rules & Restrictions
                </h2>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">महिला अनुमति</span>
                    <Badge
                      variant={room.allowsWomen ? "default" : "outline"}
                      className={
                        room.allowsWomen
                          ? "bg-green-100 text-green-800 cursor-default"
                          : "cursor-default"
                      }
                    >
                      {room.allowsWomen ? "Yes" : "No"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      Current Occupants
                    </span>
                    <span className="font-medium text-sm">
                      {room.currentOccupants} / {room.roomCapacity} persons
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      भाडामा दिइएका कोठाहरू
                    </span>
                    <span className="font-medium text-sm">
                      {room.rentedRoomsCount}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Location details */}
            {room.location && (
              <Card>
                <CardContent className="p-4 md:p-6">
                  <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
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
                    {room.location.city && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">City</span>
                        <span className="font-medium">
                          {room.location.city}
                        </span>
                      </div>
                    )}
                    {room.location.state && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">State</span>
                        <span className="font-medium">
                          {room.location.state}
                        </span>
                      </div>
                    )}
                    {room.location.country && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Country</span>
                        <span className="font-medium">
                          {room.location.country}
                        </span>
                      </div>
                    )}
                    {room.location.postalCode && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Postal Code</span>
                        <span className="font-medium">
                          {room.location.postalCode}
                        </span>
                      </div>
                    )}
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
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Additional Info */}
            <Card>
              <CardContent className="p-4 md:p-6">
                <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  थप जानकारी
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
                        रु. {room.serviceCharge.toLocaleString("ne-NP")}
                      </span>
                    </div>
                  )}
                  {room.commissionAmount && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Commission</span>
                      <span className="font-medium">
                        रु. {room.commissionAmount.toLocaleString("ne-NP")}
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
                    <AlertCircle className="h-4 w-4" />
                    Admin Remarks
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
