"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Heart,
  MapPin,
  Bed,
  Bath,
  Square,
  Home,
  ChevronLeft,
  ChevronRight,
  Wifi,
  Car,
  Coffee,
  Shield,
  Users,
  IndianRupee,
  Building,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Room } from "@/types/room.types";
import { formatNepaliCurrency } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PropertyCardProps {
  room: Room; // use Room directly — no adapter needed, fixes TS2740
  index?: number;
  className?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CATEGORY_LABEL: Record<string, string> = {
  FLAT: "Flat",
  SINGLE: "Single Room",
  APARTMENT: "Apartment",
  SHARED: "Shared",
  DOUBLE: "Double Room",
  HOUSE: "House",
  ATTACHED_BATHROOM: "With Bathroom",
  SHUTTER: "Shutter",
  HOTEL: "Hotel",
  OFFICE_SPACE: "Office",
  HOSTEL: "Hostel",
};

const AMENITY_ICONS: Record<string, React.ReactNode> = {
  WiFi: <Wifi className="h-3 w-3" aria-hidden="true" />,
  Parking: <Car className="h-3 w-3" aria-hidden="true" />,
  "Hot Water": <Coffee className="h-3 w-3" aria-hidden="true" />,
  Security: <Shield className="h-3 w-3" aria-hidden="true" />,
};

function getImageUrl(imagePath: string): string {
  if (!imagePath) return "";
  if (imagePath.startsWith("http")) return imagePath;
  const base = (process.env.NEXT_PUBLIC_BACKEND_URL ?? "").replace(/\/$/, "");
  return `${base}/${imagePath.replace(/^\//, "")}`;
}

function CategoryIcon({ category }: { category: string }) {
  switch (category) {
    case "APARTMENT":
    case "FLAT":
      return <Building className="h-3 w-3" aria-hidden="true" />;
    default:
      return <Home className="h-3 w-3" aria-hidden="true" />;
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PropertyCard({
  room,
  index = 0,
  className,
}: PropertyCardProps) {
  const [imgIdx, setImgIdx] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [imgError, setImgError] = useState(false);

  const images = (room.images ?? []).filter(Boolean);
  const hasMany = images.length > 1;

  const handlePrev = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setImgIdx((i) => (i === 0 ? images.length - 1 : i - 1));
    },
    [images.length],
  );

  const handleNext = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setImgIdx((i) => (i === images.length - 1 ? 0 : i + 1));
    },
    [images.length],
  );

  const handleLike = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsLiked((v) => !v);
  }, []);

  const displayedAmenities = (room.amenities ?? []).slice(0, 3);
  const extraAmenities = (room.amenities?.length ?? 0) - 3;
  const categoryLabel = CATEGORY_LABEL[room.category] ?? room.category;

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.07, 0.5) }}
      whileHover={{ y: -6, transition: { duration: 0.2 } }}
      className={cn("group", className)}
    >
      <Link
        href={`/property/${room.id}`}
        className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-2xl"
        aria-label={`View ${room.title}, ${categoryLabel}, ₹${formatNepaliCurrency(room.price)} per month`}
      >
        <div
          className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-300 border border-gray-100"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* ── Image Section ── */}
          <div className="relative h-52 sm:h-56 overflow-hidden bg-gray-100">
            {/* Image */}
            {images.length > 0 && !imgError ? (
              <img
                src={getImageUrl(images[imgIdx])}
                alt={`${room.title} — photo ${imgIdx + 1} of ${images.length}`}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                onError={() => setImgError(true)}
                loading="lazy"
              />
            ) : (
              <div
                className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10 gap-2"
                aria-label="No image available"
              >
                <Home
                  className="h-12 w-12 text-primary/25"
                  aria-hidden="true"
                />
                <span className="text-xs text-gray-400">No image</span>
              </div>
            )}

            {/* Gradient overlay for readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />

            {/* ── Image Navigation ── */}
            {hasMany && isHovered && (
              <>
                <button
                  type="button"
                  onClick={handlePrev}
                  aria-label="Previous photo"
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-white/90 backdrop-blur-sm rounded-full shadow-md flex items-center justify-center hover:bg-white hover:scale-110 transition-all"
                >
                  <ChevronLeft
                    className="h-3.5 w-3.5 text-gray-700"
                    aria-hidden="true"
                  />
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  aria-label="Next photo"
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-white/90 backdrop-blur-sm rounded-full shadow-md flex items-center justify-center hover:bg-white hover:scale-110 transition-all"
                >
                  <ChevronRight
                    className="h-3.5 w-3.5 text-gray-700"
                    aria-hidden="true"
                  />
                </button>
              </>
            )}

            {/* Image dots */}
            {hasMany && (
              <div
                className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-1"
                aria-hidden="true"
              >
                {images.slice(0, 5).map((_, i) => (
                  <span
                    key={i}
                    className={cn(
                      "rounded-full transition-all duration-200",
                      i === imgIdx
                        ? "w-4 h-1.5 bg-white"
                        : "w-1.5 h-1.5 bg-white/50",
                    )}
                  />
                ))}
              </div>
            )}

            {/* ── Top Badges ── */}
            <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2">
              {/* Category */}
              <Badge className="bg-white/92 backdrop-blur-sm text-gray-700 border-0 shadow text-xs px-2 py-1 flex items-center gap-1.5 font-medium">
                <CategoryIcon category={room.category} />
                {categoryLabel}
              </Badge>

              {/* Like */}
              <button
                type="button"
                onClick={handleLike}
                aria-label={
                  isLiked ? "Remove from wishlist" : "Add to wishlist"
                }
                aria-pressed={isLiked}
                className="w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full shadow flex items-center justify-center hover:bg-white hover:scale-110 transition-all flex-shrink-0"
              >
                <Heart
                  className={cn(
                    "h-4 w-4 transition-colors",
                    isLiked ? "fill-red-500 text-red-500" : "text-gray-500",
                  )}
                  aria-hidden="true"
                />
              </button>
            </div>

            {/* ── Price Tag ── */}
            <div className="absolute bottom-3 left-3">
              <div className="bg-primary/95 backdrop-blur-sm rounded-full px-3 py-1.5 flex items-center gap-0.5">
                <IndianRupee
                  className="h-3 w-3 text-white/80"
                  aria-hidden="true"
                />
                <span className="text-sm font-bold text-white leading-none">
                  {formatNepaliCurrency(room.price)}
                </span>
                <span className="text-xs text-white/70 ml-0.5">/mo</span>
              </div>
            </div>
          </div>

          {/* ── Content Section ── */}
          <div className="p-4 space-y-3">
            {/* Title + Location */}
            <div className="space-y-1">
              <h3 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-1 group-hover:text-primary transition-colors duration-200">
                {room.title}
              </h3>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <MapPin
                  className="h-3 w-3 flex-shrink-0 text-gray-400"
                  aria-hidden="true"
                />
                <span className="line-clamp-1">{room.address}</span>
              </div>
            </div>

            {/* Specs */}
            <dl className="grid grid-cols-3 gap-x-2 gap-y-1">
              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                <Bed
                  className="h-3.5 w-3.5 text-gray-400 flex-shrink-0"
                  aria-hidden="true"
                />
                <dt className="sr-only">Bedrooms</dt>
                <dd>
                  {room.roomCapacity} bed{room.roomCapacity !== 1 ? "s" : ""}
                </dd>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                <Bath
                  className="h-3.5 w-3.5 text-gray-400 flex-shrink-0"
                  aria-hidden="true"
                />
                <dt className="sr-only">Bathrooms</dt>
                <dd>{room.bathroomCapacity} bath</dd>
              </div>
              {room.roomArea != null && (
                <div className="flex items-center gap-1.5 text-xs text-gray-600">
                  <Square
                    className="h-3.5 w-3.5 text-gray-400 flex-shrink-0"
                    aria-hidden="true"
                  />
                  <dt className="sr-only">Area</dt>
                  <dd>{room.roomArea} m²</dd>
                </div>
              )}
            </dl>

            {/* Amenities */}
            {displayedAmenities.length > 0 && (
              <ul className="flex flex-wrap gap-1.5" aria-label="Amenities">
                {displayedAmenities.map((amenity) => (
                  <li
                    key={amenity}
                    className="flex items-center gap-1 px-2 py-0.5 bg-gray-50 rounded-full text-xs text-gray-600 border border-gray-100"
                  >
                    {AMENITY_ICONS[amenity] ?? null}
                    {amenity}
                  </li>
                ))}
                {extraAmenities > 0 && (
                  <li className="px-2 py-0.5 bg-gray-50 rounded-full text-xs text-gray-400 border border-gray-100">
                    +{extraAmenities}
                  </li>
                )}
              </ul>
            )}

            {/* Owner + Occupancy */}
            {room.user && (
              <footer className="flex items-center justify-between pt-2.5 border-t border-gray-100">
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className="w-6 h-6 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center flex-shrink-0"
                    aria-hidden="true"
                  >
                    <span className="text-xs font-semibold text-primary">
                      {room.user.name?.charAt(0).toUpperCase() ?? "?"}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500 truncate">
                    {room.user.name?.split(" ")[0]}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-400 flex-shrink-0">
                  <Users className="h-3 w-3" aria-hidden="true" />
                  <span>
                    <span className="font-medium text-gray-600">
                      {room.currentOccupants}
                    </span>
                    /{room.roomCapacity} occupied
                  </span>
                </div>
              </footer>
            )}
          </div>
        </div>
      </Link>
    </motion.article>
  );
}
