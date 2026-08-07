"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  MapPin,
  Users,
  Bath,
  Square,
  CheckCircle,
  Home,
  Heart,
  MessageCircle,
  Bookmark,
  Share2,
  ShieldCheck,
} from "lucide-react";
import type { Room } from "@/types/room.types";
import { formatPriceNPR, resolveImageUrl } from "@/lib/utils";
import { amenityIcons, categoryConfig } from "@/lib/room-utils";

interface PropertyCardProps {
  room: Room;
  index?: number;
}

export function PropertyCard({ room, index = 0 }: PropertyCardProps) {
  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);

  const catCfg = categoryConfig[room.category] ?? {
    label: room.category,
    labelNp: room.category,
    color: "#dc2626",
    bg: "#fff1f2",
  };

  const imageUrl =
    !imgError && room.images?.length
      ? resolveImageUrl(room.images[0])
      : null;

  const topAmenities = (room.amenities ?? []).slice(0, 3);

  const city = room.location?.city ?? "";

  const formattedAddress =
    room.location?.formattedAddress ??
    room.address ??
    "";

  const shortAddress =
    city || formattedAddress.split(",")[0];

  const ownerName =
    room.user?.name ||
    room.contactPerson ||
    "RoomKhoj";

  const ownerInitial =
    ownerName.trim().charAt(0).toUpperCase() || "R";

  const handleShare = async () => {
    const url = `${window.location.origin}/property/${room.id}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: room.title,
          text: `${room.title} - ${formatPriceNPR(Number(room.price))}`,
          url,
        });

        return;
      }

      await navigator.clipboard.writeText(url);
    } catch {
      // User cancelled share or clipboard unavailable
    }
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay: index * 0.04,
      }}
      className="
        group
        relative
        overflow-hidden
        bg-white
        border border-slate-200/80
        shadow-sm

        rounded-[24px]

        hover:shadow-xl
        transition-all
        duration-300
      "
    >
      {/* IMAGE / PREMIUM HERO */}
      <div
        className="
          relative
          overflow-hidden
          bg-slate-100

          aspect-[4/5]
          sm:aspect-[4/3]
        "
      >
        <Link
          href={`/property/${room.id}`}
          className="absolute inset-0 z-10"
          aria-label={room.title}
        />

        {/* Skeleton */}
        {!imgLoaded && (
          <div className="absolute inset-0 bg-slate-200 animate-pulse" />
        )}

        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={room.title}
            className={`
              w-full
              h-full
              object-cover
              transition-all
              duration-700
              group-hover:scale-[1.03]
              ${
                imgLoaded
                  ? "opacity-100"
                  : "opacity-0"
              }
            `}
            onLoad={() => setImgLoaded(true)}
            onError={() => {
              setImgError(true);
              setImgLoaded(true);
            }}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-rose-100">
            <Home className="w-20 h-20 text-red-200" />
          </div>
        )}

        {/* Premium overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/5 to-black/25" />

        {/* TOP LEFT BADGES */}
        <div className="absolute top-3 left-3 z-20 flex flex-wrap gap-2">
          <span
            className="
              rounded-full
              bg-white/95
              backdrop-blur-md
              px-3
              py-1.5
              text-[11px]
              font-bold
              shadow-sm
            "
            style={{
              color: catCfg.color,
            }}
          >
            {catCfg.label}
          </span>

          {room.user?.isVerified && (
            <span className="inline-flex items-center gap-1 rounded-full bg-black/60 backdrop-blur-md px-2.5 py-1.5 text-[10px] font-semibold text-white">
              <ShieldCheck className="w-3.5 h-3.5" />
              Verified
            </span>
          )}
        </div>

        {/* WOMEN BADGE */}
        {room.allowsWomen && (
          <div className="absolute top-3 right-3 z-20">
            <span className="rounded-full bg-pink-500/90 backdrop-blur-md px-2.5 py-1.5 text-[10px] font-bold text-white shadow-sm">
              Women OK
            </span>
          </div>
        )}

        {/* RIGHT SOCIAL ACTIONS */}
        <div
          className="
            absolute
            right-3
            bottom-[96px]
            z-30
            flex
            flex-col
            items-center
            gap-4
          "
        >
          {/* PROFILE */}
          <div className="relative">
            <div
              className="
                flex
                h-12
                w-12
                items-center
                justify-center
                rounded-full
                border-2
                border-white
                bg-red-600
                text-sm
                font-bold
                text-white
                shadow-lg
              "
            >
              {ownerInitial}
            </div>

            {room.user?.isVerified && (
              <div className="absolute -right-1 -bottom-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-blue-500">
                <CheckCircle className="h-3 w-3 text-white" />
              </div>
            )}
          </div>

          {/* LIKE */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setLiked((v) => !v);
            }}
            className="flex flex-col items-center gap-1 text-white"
            aria-label="Like room"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black/35 backdrop-blur-md">
              <Heart
                className={`h-6 w-6 ${
                  liked
                    ? "fill-red-500 text-red-500"
                    : "text-white"
                }`}
              />
            </div>

            <span className="text-[10px] font-medium drop-shadow">
              Like
            </span>
          </button>

          {/* COMMENT */}
          <Link
            href={`/property/${room.id}#comments`}
            onClick={(e) => e.stopPropagation()}
            className="flex flex-col items-center gap-1 text-white"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black/35 backdrop-blur-md">
              <MessageCircle className="h-6 w-6" />
            </div>

            <span className="text-[10px] font-medium drop-shadow">
              Comment
            </span>
          </Link>

          {/* SAVE */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setSaved((v) => !v);
            }}
            className="flex flex-col items-center gap-1 text-white"
            aria-label="Save room"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black/35 backdrop-blur-md">
              <Bookmark
                className={`h-6 w-6 ${
                  saved
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-white"
                }`}
              />
            </div>

            <span className="text-[10px] font-medium drop-shadow">
              Save
            </span>
          </button>

          {/* SHARE */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              void handleShare();
            }}
            className="flex flex-col items-center gap-1 text-white"
            aria-label="Share room"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black/35 backdrop-blur-md">
              <Share2 className="h-6 w-6" />
            </div>

            <span className="text-[10px] font-medium drop-shadow">
              Share
            </span>
          </button>
        </div>

        {/* BOTTOM INFORMATION */}
        <div
          className="
            absolute
            bottom-0
            left-0
            right-[64px]
            z-20
            p-4
            text-white
          "
        >
          {/* OWNER */}
          <div className="mb-2 flex items-center gap-1.5">
            <span className="text-xs font-semibold">
              {ownerName}
            </span>

            {room.user?.isVerified && (
              <CheckCircle className="h-3.5 w-3.5 fill-blue-500 text-white" />
            )}
          </div>

          {/* TITLE */}
          <Link
            href={`/property/${room.id}`}
            className="block"
          >
            <h3 className="mb-1 line-clamp-2 text-[17px] font-bold leading-snug">
              {room.title}
            </h3>
          </Link>

          {/* LOCATION */}
          <div className="mb-2 flex items-center gap-1 text-white/85">
            <MapPin className="h-3.5 w-3.5 shrink-0" />

            <span className="truncate text-xs">
              {shortAddress}
            </span>
          </div>

          {/* PRICE */}
          <div className="flex items-end gap-1">
            <span className="text-xl font-extrabold">
              {formatPriceNPR(Number(room.price))}
            </span>

            <span className="pb-0.5 text-[11px] text-white/70">
              / month
            </span>
          </div>
        </div>
      </div>

      {/* LOWER PREMIUM DETAILS */}
      <div className="p-4">
        {/* QUICK STATS */}
        <div className="grid grid-cols-3 overflow-hidden rounded-2xl border border-slate-100 bg-slate-50">
          <div className="flex flex-col items-center justify-center gap-1 px-2 py-3">
            <Users className="h-4 w-4 text-red-500" />

            <span className="text-sm font-bold text-slate-900">
              {room.roomCapacity}
            </span>

            <span className="text-[10px] text-slate-500">
              People
            </span>
          </div>

          <div className="flex flex-col items-center justify-center gap-1 border-x border-slate-200 px-2 py-3">
            <Bath className="h-4 w-4 text-red-500" />

            <span className="text-sm font-bold text-slate-900">
              {room.bathroomCapacity}
            </span>

            <span className="text-[10px] text-slate-500">
              Bath
            </span>
          </div>

          <div className="flex flex-col items-center justify-center gap-1 px-2 py-3">
            <Square className="h-4 w-4 text-red-500" />

            <span className="text-sm font-bold text-slate-900">
              {Number(room.roomArea || 0).toFixed(0)}
            </span>

            <span className="text-[10px] text-slate-500">
              m²
            </span>
          </div>
        </div>

        {/* AMENITIES */}
        {topAmenities.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {topAmenities.map((amenity) => {
              const Icon =
                amenityIcons[amenity.toLowerCase()] ??
                CheckCircle;

              return (
                <span
                  key={amenity}
                  className="
                    inline-flex
                    items-center
                    gap-1.5
                    rounded-full
                    border
                    border-slate-200
                    bg-white
                    px-2.5
                    py-1.5
                    text-[10px]
                    font-medium
                    text-slate-600
                  "
                >
                  <Icon className="h-3 w-3 text-red-500" />

                  {amenity}
                </span>
              );
            })}
          </div>
        )}

        {/* STATUS */}
        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            {room.category}
          </span>

          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700">
            <CheckCircle className="h-3 w-3" />
            {room.listingStatus}
          </span>
        </div>
      </div>
    </motion.article>
  );
}
