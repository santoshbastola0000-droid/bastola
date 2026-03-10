"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
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
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Property } from "@/types/property.types";

interface PropertyCardProps {
  property: Property;
  index?: number;
  variant?: "grid" | "list" | "compact";
}

// Amenity icons mapping
const amenityIcons: Record<string, any> = {
  wifi: Wifi,
  parking: Car,
  kitchen: Coffee,
  "air conditioning": Zap,
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

  // Format price
  const formattedPrice = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);

  // Get top 3 amenities
  const topAmenities = amenities.slice(0, 3);

  // Type badge colors
  const typeColors: Record<string, string> = {
    apartment: "bg-blue-50 text-blue-700 border-blue-200",
    house: "bg-emerald-50 text-emerald-700 border-emerald-200",
    flat: "bg-purple-50 text-purple-700 border-purple-200",
    studio: "bg-amber-50 text-amber-700 border-amber-200",
    room: "bg-rose-50 text-rose-700 border-rose-200",
    villa: "bg-orange-50 text-orange-700 border-orange-200",
    condo: "bg-indigo-50 text-indigo-700 border-indigo-200",
  };

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsLiked(!isLiked);
  };

  const handleImageError = () => {
    setImageError(true);
  };

  // Default image based on property type
  const getDefaultImage = () => {
    const images: Record<string, string> = {
      apartment:
        "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80",
      house:
        "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&q=80",
      studio:
        "https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=800&q=80",
      room: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&q=80",
    };
    return (
      images[property_type] ||
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80"
    );
  };

  // Animation variants
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        delay: index * 0.1,
      },
    },
    hover: {
      y: -8,
      transition: { duration: 0.3 },
    },
  };

  if (variant === "list") {
    return (
      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        whileHover="hover"
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        className="group relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100"
      >
        <Link href={`/property/${id}`} className="block">
          <div className="flex flex-col md:flex-row">
            {/* Image Section */}
            <div className="relative md:w-72 h-64 md:h-auto overflow-hidden bg-slate-100">
              <Image
                src={
                  imageError
                    ? getDefaultImage()
                    : images?.[0] || getDefaultImage()
                }
                alt={title}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-110"
                onError={handleImageError}
                sizes="(max-width: 768px) 100vw, 300px"
              />

              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              {/* Featured Badge */}
              {featured && (
                <div className="absolute top-3 left-3 z-10">
                  <Badge className="bg-gradient-to-r from-red-500 to-red-600 text-white border-0 px-3 py-1">
                    <Zap className="w-3 h-3 mr-1 fill-white" />
                    Featured
                  </Badge>
                </div>
              )}

              {/* Like Button */}
              <button
                onClick={handleLike}
                className="absolute top-3 right-3 z-10 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-lg hover:shadow-xl transition-all hover:scale-110"
              >
                <Heart
                  className={`w-5 h-5 transition-all duration-300 ${
                    isLiked
                      ? "fill-red-500 text-red-500 scale-110"
                      : "text-slate-600"
                  }`}
                />
              </button>

              {/* Price Tag */}
              <div className="absolute bottom-3 left-3 z-10">
                <div className="bg-white/95 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg">
                  <span className="font-bold text-red-600 text-lg">
                    {formattedPrice}
                  </span>
                  <span className="text-xs text-slate-500 ml-1">/{period}</span>
                </div>
              </div>
            </div>

            {/* Content Section */}
            <div className="flex-1 p-6">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <Badge
                    className={`${typeColors[property_type] || "bg-slate-50 text-slate-700"} border capitalize mb-2`}
                  >
                    {property_type}
                  </Badge>
                  <h3 className="text-xl font-semibold text-slate-900 group-hover:text-red-600 transition-colors line-clamp-1">
                    {title}
                  </h3>
                </div>

                {/* Rating */}
                <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-full">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-semibold text-slate-700">
                    {rating.toFixed(1)}
                  </span>
                  {reviews_count > 0 && (
                    <span className="text-xs text-slate-500">
                      ({reviews_count})
                    </span>
                  )}
                </div>
              </div>

              {/* Location */}
              <div className="flex items-center gap-1.5 text-slate-500 mb-4">
                <MapPin className="w-4 h-4 text-red-400 shrink-0" />
                <span className="text-sm">
                  {city}, {state}
                </span>
              </div>

              {/* Features */}
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-1.5 text-slate-600">
                  <Bed className="w-4 h-4 text-red-400" />
                  <span className="text-sm font-medium">
                    {bedrooms} {bedrooms === 1 ? "bed" : "beds"}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-600">
                  <Bath className="w-4 h-4 text-red-400" />
                  <span className="text-sm font-medium">
                    {bathrooms} {bathrooms === 1 ? "bath" : "baths"}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-600">
                  <Square className="w-4 h-4 text-red-400" />
                  <span className="text-sm font-medium">{area_sqft} ft²</span>
                </div>
              </div>

              {/* Amenities */}
              {topAmenities.length > 0 && (
                <div className="flex items-center gap-3 mb-4">
                  {topAmenities.map((amenity) => {
                    const Icon = amenityIcons[amenity.toLowerCase()] || Zap;
                    return (
                      <div
                        key={amenity}
                        className="flex items-center gap-1 text-xs text-slate-500"
                      >
                        <Icon className="w-3 h-3 text-red-400" />
                        <span>{amenity}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                <Button
                  className="flex-1 rounded-full bg-red-500 hover:bg-red-600 text-white text-sm"
                  onClick={(e) => {
                    e.preventDefault();
                    // Handle book now
                  }}
                >
                  Book Now
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 rounded-full border-slate-200 text-slate-600 hover:bg-slate-50 text-sm"
                  onClick={(e) => {
                    e.preventDefault();
                    // Handle contact
                  }}
                >
                  Contact
                </Button>
              </div>
            </div>
          </div>
        </Link>
      </motion.div>
    );
  }

  // Grid/Compact variant
  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="group relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100"
    >
      <Link href={`/property/${id}`} className="block">
        {/* Image Container */}
        <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
          <Image
            src={
              imageError ? getDefaultImage() : images?.[0] || getDefaultImage()
            }
            alt={title}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-110"
            onError={handleImageError}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />

          {/* Gradient Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: isHovered ? 1 : 0 }}
            className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"
          />

          {/* Featured Badge */}
          {featured && (
            <div className="absolute top-3 left-3 z-10">
              <Badge className="bg-gradient-to-r from-red-500 to-red-600 text-white border-0 px-3 py-1 animate-pulse">
                <Zap className="w-3 h-3 mr-1 fill-white" />
                Featured
              </Badge>
            </div>
          )}

          {/* Type Badge */}
          <Badge
            className={`absolute top-3 right-3 z-10 ${typeColors[property_type] || "bg-slate-50 text-slate-700"} border capitalize`}
          >
            {property_type}
          </Badge>

          {/* Like Button */}
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: isHovered ? 1 : 0 }}
            onClick={handleLike}
            className="absolute top-3 right-3 z-20 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-lg"
          >
            <Heart
              className={`w-5 h-5 transition-all duration-300 ${
                isLiked
                  ? "fill-red-500 text-red-500 scale-110"
                  : "text-slate-600"
              }`}
            />
          </motion.button>

          {/* Price Tag */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: isHovered ? 0 : 20, opacity: isHovered ? 1 : 0 }}
            className="absolute bottom-3 left-3 z-10"
          >
            <div className="bg-white/95 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg">
              <span className="font-bold text-red-600 text-lg">
                {formattedPrice}
              </span>
              <span className="text-xs text-slate-500 ml-1">/{period}</span>
            </div>
          </motion.div>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Title and Rating */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="text-lg font-semibold text-slate-900 group-hover:text-red-600 transition-colors line-clamp-1 flex-1">
              {title}
            </h3>
            <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-full shrink-0">
              <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
              <span className="text-xs font-semibold text-slate-700">
                {rating.toFixed(1)}
              </span>
            </div>
          </div>

          {/* Location */}
          <div className="flex items-center gap-1.5 text-slate-500 mb-3">
            <MapPin className="w-3.5 h-3.5 text-red-400 shrink-0" />
            <span className="text-sm truncate">
              {city}, {state}
            </span>
          </div>

          {/* Features */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 text-slate-600">
                <Bed className="w-4 h-4 text-red-400" />
                <span className="text-xs font-medium">{bedrooms}</span>
              </div>
              <div className="flex items-center gap-1 text-slate-600">
                <Bath className="w-4 h-4 text-red-400" />
                <span className="text-xs font-medium">{bathrooms}</span>
              </div>
              <div className="flex items-center gap-1 text-slate-600">
                <Square className="w-4 h-4 text-red-400" />
                <span className="text-xs font-medium">{area_sqft}</span>
              </div>
            </div>

            {/* Reviews */}
            {reviews_count > 0 && (
              <span className="text-xs text-slate-400">
                {reviews_count} reviews
              </span>
            )}
          </div>

          {/* Quick Amenities */}
          {topAmenities.length > 0 && (
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100">
              {topAmenities.map((amenity) => {
                const Icon = amenityIcons[amenity.toLowerCase()] || Zap;
                return (
                  <div
                    key={amenity}
                    className="flex items-center gap-1 text-xs text-slate-500"
                  >
                    <Icon className="w-3 h-3 text-red-400" />
                    <span className="truncate max-w-[60px]">{amenity}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Hover Border Effect */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: isHovered ? 1 : 0 }}
          className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 to-red-600 origin-left"
        />
      </Link>
    </motion.div>
  );
}
