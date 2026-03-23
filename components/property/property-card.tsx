"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Bed,
  Bath,
  Square,
  Heart,
  Star,
  Zap,
  Wifi,
  Car,
  Coffee,
  ArrowUpRight,
} from "lucide-react";
import type { Property } from "@/types/property.types";
import { formatPriceNPR } from "@/lib/utils";

interface PropertyCardProps {
  property: Property;
  index?: number;
  variant?: "grid" | "list" | "compact";
}

const amenityIcons: Record<string, any> = {
  wifi: Wifi,
  parking: Car,
  kitchen: Coffee,
  "air conditioning": Zap,
};

// Nepali-flavored mandala/pattern SVG for image placeholder
const NepaliPattern = () => (
  <svg
    viewBox="0 0 200 200"
    className="w-full h-full opacity-10"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle
      cx="100"
      cy="100"
      r="90"
      fill="none"
      stroke="#c0392b"
      strokeWidth="1"
    />
    <circle
      cx="100"
      cy="100"
      r="70"
      fill="none"
      stroke="#c0392b"
      strokeWidth="1"
    />
    <circle
      cx="100"
      cy="100"
      r="50"
      fill="none"
      stroke="#c0392b"
      strokeWidth="1"
    />
    {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
      <line
        key={i}
        x1="100"
        y1="100"
        x2={100 + 90 * Math.cos((angle * Math.PI) / 180)}
        y2={100 + 90 * Math.sin((angle * Math.PI) / 180)}
        stroke="#c0392b"
        strokeWidth="0.5"
      />
    ))}
    <circle cx="100" cy="100" r="8" fill="#c0392b" opacity="0.4" />
  </svg>
);

const typeConfig: Record<string, { label: string; color: string; bg: string }> =
  {
    apartment: { label: "अपार्टमेन्ट", color: "#1e40af", bg: "#eff6ff" },
    house: { label: "घर", color: "#065f46", bg: "#ecfdf5" },
    flat: { label: "फ्ल्याट", color: "#6b21a8", bg: "#faf5ff" },
    studio: { label: "स्टुडियो", color: "#92400e", bg: "#fffbeb" },
    room: { label: "कोठा", color: "#9f1239", bg: "#fff1f2" },
    villa: { label: "भिला", color: "#9a3412", bg: "#fff7ed" },
    condo: { label: "कन्डो", color: "#1e3a5f", bg: "#eef2ff" },
  };

export function PropertyCard({
  property,
  index = 0,
  variant = "grid",
}: PropertyCardProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const {
    id,
    title,
    price,
    period = "month",
    property_type,
    bedrooms,
    bathrooms,
    area_sqft,
    city,
    state,
    images,
    rating = 4.5,
    reviews_count = 0,
    featured = false,
    amenities = [],
  } = property;

  const formattedPrice = formatPriceNPR(price);
  const topAmenities = amenities.slice(0, 3);

  // ✅ FIXED: Use actual image first, fall back to default only on error or missing
  const fallbackImages: Record<string, string> = {
    apartment:
      "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80",
    house:
      "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&q=80",
    studio:
      "https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=800&q=80",
    room: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&q=80",
  };

  const getImageSrc = () => {
    if (imageError || !images || images.length === 0) {
      return (
        fallbackImages[property_type] ||
        "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80"
      );
    }

    return images[0]; // ✅ Use real image from array
  };

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsLiked(!isLiked);
  };

  const typeInfo = typeConfig[property_type] || {
    label: property_type,
    color: "#374151",
    bg: "#f9fafb",
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 24 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        delay: index * 0.08,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  };

  if (variant === "list") {
    return (
      <motion.div
        initial="hidden"
        animate="visible"
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        className="group relative bg-white rounded-2xl overflow-hidden border border-stone-100 shadow-sm hover:shadow-2xl transition-all duration-500"
        style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
      >
        {/* Nepali red top accent */}
        <motion.div
          className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-red-700 via-red-500 to-amber-500 z-20"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: isHovered ? 1 : 0 }}
          style={{ transformOrigin: "left" }}
          transition={{ duration: 0.4 }}
        />

        <Link href={`/property/${id}`} className="flex flex-col md:flex-row">
          {/* Image */}
          <div className="relative md:w-80 h-64 md:h-auto shrink-0 overflow-hidden bg-stone-100">
            <Image
              src={getImageSrc()}
              alt={title}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              onError={() => setImageError(true)}
              sizes="(max-width: 768px) 100vw, 320px"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

            {featured && (
              <div className="absolute top-3 left-3 z-10">
                <span className="inline-flex items-center gap-1 bg-red-600 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-lg">
                  <Zap className="w-3 h-3 fill-white" /> Featured
                </span>
              </div>
            )}

            {/* Dhaka-pattern inspired price tag */}
            <div className="absolute bottom-4 left-4 z-10">
              <div
                className="rounded-xl px-4 py-2 shadow-xl"
                style={{
                  background: "rgba(255,255,255,0.96)",
                  backdropFilter: "blur(8px)",
                  borderLeft: "3px solid #c0392b",
                }}
              >
                <span
                  className="font-bold text-red-700 text-xl"
                  style={{ fontFamily: "'Instrument Serif', serif" }}
                >
                  {formattedPrice}
                </span>
                <span className="text-xs text-stone-500 ml-1">/{period}</span>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex-1">
                  <span
                    className="inline-block text-xs font-medium px-2.5 py-0.5 rounded-md mb-2 capitalize"
                    style={{ color: typeInfo.color, background: typeInfo.bg }}
                  >
                    {typeInfo.label}
                  </span>
                  <h3
                    className="text-xl font-semibold text-stone-900 group-hover:text-red-700 transition-colors line-clamp-1"
                    style={{
                      fontFamily: "'Instrument Serif', serif",
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {title}
                  </h3>
                </div>
                <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full shrink-0">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span className="text-sm font-semibold text-stone-700">
                    {rating.toFixed(1)}
                  </span>
                  {reviews_count > 0 && (
                    <span className="text-xs text-stone-400">
                      ({reviews_count})
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-stone-500 mb-4">
                <MapPin className="w-4 h-4 text-red-500 shrink-0" />
                <span className="text-sm">
                  {city}, {state}
                </span>
              </div>

              <div className="flex items-center gap-5 mb-4">
                {[
                  {
                    icon: Bed,
                    label: `${bedrooms} ${bedrooms === 1 ? "bed" : "beds"}`,
                  },
                  {
                    icon: Bath,
                    label: `${bathrooms} ${bathrooms === 1 ? "bath" : "baths"}`,
                  },
                  { icon: Square, label: `${area_sqft} ft²` },
                ].map(({ icon: Icon, label }) => (
                  <div
                    key={label}
                    className="flex items-center gap-1.5 text-stone-600"
                  >
                    <Icon className="w-4 h-4 text-red-400" />
                    <span className="text-sm font-medium">{label}</span>
                  </div>
                ))}
              </div>

              {topAmenities.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {topAmenities.map((amenity) => {
                    const Icon = amenityIcons[amenity.toLowerCase()] || Zap;
                    return (
                      <span
                        key={amenity}
                        className="inline-flex items-center gap-1 text-xs text-stone-500 bg-stone-50 border border-stone-100 px-2 py-0.5 rounded-full"
                      >
                        <Icon className="w-3 h-3 text-red-400" />
                        {amenity}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 pt-4 border-t border-stone-100">
              <button
                className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 active:scale-95"
                style={{
                  background: "linear-gradient(135deg, #c0392b, #e74c3c)",
                }}
                onClick={(e) => e.preventDefault()}
              >
                Book Now
              </button>
              <button
                className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-stone-700 bg-stone-50 hover:bg-stone-100 border border-stone-200 transition-all duration-200 active:scale-95"
                onClick={(e) => e.preventDefault()}
              >
                Contact
              </button>
            </div>
          </div>
        </Link>
      </motion.div>
    );
  }

  // Grid / Compact variant
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="group relative bg-white rounded-2xl overflow-hidden border border-stone-100 shadow-sm hover:shadow-2xl transition-all duration-500"
    >
      <Link href={`/property/${id}`} className="block">
        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden bg-stone-100">
          {/* Placeholder pattern shown while loading */}
          <div className="absolute inset-0 flex items-center justify-center bg-stone-50">
            <NepaliPattern />
          </div>

          <Image
            src={getImageSrc()}
            alt={title}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105 relative z-10"
            onError={() => setImageError(true)}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />

          {/* Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/5 to-transparent z-20 opacity-60 group-hover:opacity-80 transition-opacity duration-300" />

          {/* Featured */}
          {featured && (
            <div className="absolute top-3 left-3 z-30">
              <span className="inline-flex items-center gap-1 bg-red-600 text-white text-xs font-semibold px-2.5 py-1 rounded-full shadow-lg animate-pulse">
                <Zap className="w-3 h-3 fill-white" /> Featured
              </span>
            </div>
          )}

          {/* Type badge — top right, hidden when hovered (like button takes over) */}
          <AnimatePresence>
            {!isHovered && (
              <motion.span
                key="type-badge"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute top-3 right-3 z-30 text-xs font-medium px-2.5 py-0.5 rounded-md capitalize"
                style={{
                  color: typeInfo.color,
                  background: "rgba(255,255,255,0.92)",
                }}
              >
                {typeInfo.label}
              </motion.span>
            )}
          </AnimatePresence>

          {/* Like button */}
          <AnimatePresence>
            {isHovered && (
              <motion.button
                key="like-btn"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                onClick={handleLike}
                className="absolute top-3 right-3 z-30 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-lg"
              >
                <Heart
                  className={`w-4.5 h-4.5 transition-all duration-200 ${
                    isLiked ? "fill-red-500 text-red-500" : "text-stone-500"
                  }`}
                />
              </motion.button>
            )}
          </AnimatePresence>

          {/* Price — always visible at bottom */}
          <div className="absolute bottom-0 left-0 right-0 z-30 p-4">
            <div className="flex items-end justify-between">
              <div>
                <p
                  className="text-white/70 text-xs mb-0.5"
                  style={{ fontFamily: "system-ui", letterSpacing: "0.05em" }}
                >
                  STARTING FROM
                </p>
                <div className="flex items-baseline gap-1">
                  <span
                    className="text-white font-bold text-2xl"
                    style={{
                      fontFamily: "'Instrument Serif', Georgia, serif",
                      textShadow: "0 2px 8px rgba(0,0,0,0.4)",
                    }}
                  >
                    {formattedPrice}
                  </span>
                  <span className="text-white/70 text-xs">/{period}</span>
                </div>
              </div>

              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: isHovered ? 1 : 0, x: isHovered ? 0 : 10 }}
                className="w-9 h-9 rounded-full bg-white flex items-center justify-center shadow-lg"
              >
                <ArrowUpRight className="w-4 h-4 text-red-600" />
              </motion.div>
            </div>
          </div>
        </div>

        {/* Card Body */}
        <div
          className="p-4"
          style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
        >
          {/* Title + Rating */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3
              className="text-lg font-semibold text-stone-900 group-hover:text-red-700 transition-colors line-clamp-1 flex-1"
              style={{ letterSpacing: "-0.01em" }}
            >
              {title}
            </h3>
            <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full shrink-0">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span className="text-xs font-bold text-stone-700">
                {rating.toFixed(1)}
              </span>
            </div>
          </div>

          {/* Location */}
          <div className="flex items-center gap-1.5 text-stone-500 mb-3">
            <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
            <span className="text-sm truncate">
              {city}, {state}
            </span>
          </div>

          {/* Stats row */}
          <div
            className="flex items-center gap-1 py-3 border-y border-stone-100 mb-3"
            style={{ fontFamily: "system-ui" }}
          >
            {[
              { icon: Bed, value: bedrooms, unit: "Beds" },
              { icon: Bath, value: bathrooms, unit: "Baths" },
              { icon: Square, value: area_sqft, unit: "ft²" },
            ].map(({ icon: Icon, value, unit }, i) => (
              <div
                key={unit}
                className={`flex-1 flex items-center justify-center gap-1.5 text-stone-600 ${i > 0 ? "border-l border-stone-100" : ""}`}
              >
                <Icon className="w-3.5 h-3.5 text-red-400" />
                <span className="text-xs font-semibold text-stone-700">
                  {value}
                </span>
                <span className="text-xs text-stone-400">{unit}</span>
              </div>
            ))}
          </div>

          {/* Amenities */}
          {topAmenities.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {topAmenities.map((amenity) => {
                const Icon = amenityIcons[amenity.toLowerCase()] || Zap;
                return (
                  <span
                    key={amenity}
                    className="inline-flex items-center gap-1 text-xs text-stone-500 bg-stone-50 border border-stone-100 px-2 py-0.5 rounded-full"
                    style={{ fontFamily: "system-ui" }}
                  >
                    <Icon className="w-3 h-3 text-red-400" />
                    {amenity}
                  </span>
                );
              })}
              {reviews_count > 0 && (
                <span
                  className="ml-auto text-xs text-stone-400 self-center"
                  style={{ fontFamily: "system-ui" }}
                >
                  {reviews_count} reviews
                </span>
              )}
            </div>
          )}
        </div>

        {/* Bottom red accent bar */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-red-700 via-red-500 to-amber-500"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: isHovered ? 1 : 0 }}
          style={{ transformOrigin: "left" }}
          transition={{ duration: 0.35 }}
        />
      </Link>
    </motion.div>
  );
}
