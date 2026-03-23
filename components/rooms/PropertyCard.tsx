"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  MapPin,
  Users,
  Bath,
  Square,
  Heart,
  Wifi,
  Car,
  Utensils,
  Wind,
  Tv,
  ArrowUpRight,
  CheckCircle,
  Home,
} from "lucide-react";
import type { Room } from "@/types/room.types";
import { formatPriceNPR } from "@/lib/utils";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") ||
  "http://localhost:3001";

/** Converts a relative `/uploads/...` path to a full URL */
function resolveImageUrl(path: string): string {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}

const amenityIcons: Record<string, React.ElementType> = {
  wifi: Wifi,
  parking: Car,
  kitchen: Utensils,
  "air conditioning": Wind,
  ac: Wind,
  tv: Tv,
};

const categoryConfig: Record<
  string,
  { label: string; labelNp: string; color: string; bg: string }
> = {
  Flat: { label: "Flat", labelNp: "फ्ल्याट", color: "#1e40af", bg: "#eff6ff" },
  Single: { label: "Single", labelNp: "एकल", color: "#065f46", bg: "#ecfdf5" },
  Apartment: {
    label: "Apartment",
    labelNp: "अपार्टमेन्ट",
    color: "#6b21a8",
    bg: "#faf5ff",
  },
  Shared: {
    label: "Shared",
    labelNp: "साझा",
    color: "#92400e",
    bg: "#fffbeb",
  },
  Double: {
    label: "Double",
    labelNp: "डबल",
    color: "#9f1239",
    bg: "#fff1f2",
  },
  House: { label: "House", labelNp: "घर", color: "#065f46", bg: "#f0fdf4" },
  "Attached Bathroom": {
    label: "Attached Bath",
    labelNp: "अट्याच्ड बाथ",
    color: "#0369a1",
    bg: "#f0f9ff",
  },
  Hostel: {
    label: "Hostel",
    labelNp: "होस्टेल",
    color: "#7c3aed",
    bg: "#f5f3ff",
  },
  Hotel: {
    label: "Hotel",
    labelNp: "होटेल",
    color: "#b45309",
    bg: "#fffbeb",
  },
  "Office Space": {
    label: "Office",
    labelNp: "अफिस",
    color: "#0f766e",
    bg: "#f0fdfa",
  },
  Shutter: {
    label: "Shutter",
    labelNp: "शटर",
    color: "#475569",
    bg: "#f8fafc",
  },
};

interface PropertyCardProps {
  room: Room;
  index?: number;
}

export function PropertyCard({ room, index = 0 }: PropertyCardProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  const catCfg = categoryConfig[room.category] ?? {
    label: room.category,
    labelNp: room.category,
    color: "#dc2626",
    bg: "#fff1f2",
  };

  // ── Image resolution ──
  const imageUrl =
    !imgError && room.images?.length ? resolveImageUrl(room.images[0]) : null;

  const topAmenities = (room.amenities ?? []).slice(0, 3);
  const city = room.location?.city ?? "";
  const formattedAddress =
    room.location?.formattedAddress ?? room.address ?? "";
  const shortAddress = city || formattedAddress.split(",")[0];

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.45,
        delay: index * 0.07,
        ease: [0.22, 1, 0.36, 1],
      }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="group relative bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300"
    >
      <Link
        href={`/property/${room.id}`}
        className="block"
        aria-label={room.title}
      >
        {/* ── Image ── */}
        <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
          {/* Skeleton shimmer */}
          {!imgLoaded && (
            <div className="absolute inset-0 bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100 animate-pulse" />
          )}

          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt={room.title}
              className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-105 ${imgLoaded ? "opacity-100" : "opacity-0"}`}
              onLoad={() => setImgLoaded(true)}
              onError={() => {
                setImgError(true);
                setImgLoaded(true);
              }}
            />
          ) : (
            /* Fallback gradient placeholder */
            <div className="absolute inset-0 bg-gradient-to-br from-red-50 via-rose-100 to-red-200 flex items-center justify-center">
              <Home className="w-16 h-16 text-red-300" />
            </div>
          )}

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />

          {/* Category badge — top left */}
          <div className="absolute top-3 left-3 z-10">
            <span
              className="text-[11px] font-bold px-2.5 py-1 rounded-full shadow-sm backdrop-blur-sm"
              style={{
                color: catCfg.color,
                background: "rgba(255,255,255,0.92)",
              }}
            >
              {catCfg.label}
            </span>
          </div>

          {/* Women allowed badge */}
          {room.allowsWomen && (
            <div className="absolute top-3 right-12 z-10">
              <span className="text-[10px] font-semibold bg-pink-100 text-pink-700 px-2 py-0.5 rounded-full">
                ♀ OK
              </span>
            </div>
          )}

          {/* Like button */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsLiked(!isLiked);
            }}
            aria-label={
              isLiked ? "Remove from favourites" : "Add to favourites"
            }
            className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/85 backdrop-blur-sm flex items-center justify-center shadow transition-transform hover:scale-110"
          >
            <Heart
              className={`w-4 h-4 transition-colors ${isLiked ? "fill-red-500 text-red-500" : "text-slate-400"}`}
            />
          </button>

          {/* Price at bottom */}
          <div className="absolute bottom-0 left-0 right-0 z-10 p-4">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-white/60 text-[10px] uppercase tracking-widest mb-0.5">
                  Monthly Rent
                </p>
                <p className="text-white font-bold text-xl leading-none">
                  रू {formatPriceNPR(Number(room.price))}
                </p>
              </div>
              <motion.div
                animate={{ opacity: isHovered ? 1 : 0, x: isHovered ? 0 : 8 }}
                className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center shadow-lg"
              >
                <ArrowUpRight className="w-4 h-4 text-white" />
              </motion.div>
            </div>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="p-4">
          {/* Title */}
          <h3 className="font-semibold text-slate-900 text-base leading-snug line-clamp-1 group-hover:text-red-600 transition-colors mb-1">
            {room.title}
          </h3>

          {/* Location */}
          <div className="flex items-center gap-1 text-slate-500 mb-3">
            <MapPin className="w-3.5 h-3.5 text-red-400 shrink-0" />
            <span className="text-xs truncate">{shortAddress}</span>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-0 py-2.5 border-y border-slate-100 mb-3">
            {[
              { icon: Users, value: room.roomCapacity, unit: "Person" },
              { icon: Bath, value: room.bathroomCapacity, unit: "Bath" },
              {
                icon: Square,
                value: `${Number(room.roomArea).toFixed(0)}`,
                unit: "m²",
              },
            ].map(({ icon: Icon, value, unit }, i) => (
              <div
                key={unit}
                className={`flex-1 flex flex-col items-center gap-0.5 text-slate-600 ${i > 0 ? "border-l border-slate-100" : ""}`}
              >
                <Icon className="w-3.5 h-3.5 text-red-400" />
                <span className="text-xs font-bold text-slate-800">
                  {value}
                </span>
                <span className="text-[10px] text-slate-400">{unit}</span>
              </div>
            ))}
          </div>

          {/* Amenities + verified */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              {topAmenities.map((a) => {
                const Icon = amenityIcons[a.toLowerCase()] ?? CheckCircle;
                return (
                  <span
                    key={a}
                    className="inline-flex items-center gap-1 text-[10px] text-slate-500 bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded-full capitalize"
                  >
                    <Icon className="w-2.5 h-2.5 text-red-400" />
                    {a}
                  </span>
                );
              })}
            </div>
            {room.user?.isVerified && (
              <span className="flex items-center gap-0.5 text-[10px] text-emerald-600 font-medium shrink-0">
                <CheckCircle className="w-3 h-3" />
                Verified
              </span>
            )}
          </div>
        </div>
      </Link>

      {/* Bottom red accent bar on hover */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-red-600 via-red-500 to-rose-500"
        animate={{ scaleX: isHovered ? 1 : 0 }}
        style={{ transformOrigin: "left" }}
        transition={{ duration: 0.3 }}
      />
    </motion.article>
  );
}
