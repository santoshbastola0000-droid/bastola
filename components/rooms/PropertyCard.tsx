"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/stores/user-store";
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
  ArrowUpRight,
} from "lucide-react";

import type { Room } from "@/types/room.types";
import { formatPriceNPR, resolveImageUrl } from "@/lib/utils";
import { amenityIcons, categoryConfig } from "@/lib/room-utils";

interface PropertyCardProps {
  room: Room;
  index?: number;
}

export function PropertyCard({
  room,
  index = 0,
}: PropertyCardProps) {
  const router = useRouter();
  const user = useUserStore((state) => state.user);
  const isLoaded = useUserStore((state) => state.isLoaded);
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

  const openRoom = () => {
    const propertyPath = `/property/${room.id}`;

    if (!isLoaded || !user) {
      sessionStorage.setItem(
        "roomkhoj_post_auth_redirect",
        propertyPath,
      );
      router.push("/auth/login");
      return;
    }

    router.push(propertyPath);
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/property/${room.id}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: room.title,
          text: `${room.title} - ${formatPriceNPR(
            Number(room.price)
          )}`,
          url,
        });

        return;
      }

      await navigator.clipboard.writeText(url);
    } catch {
      // User cancelled
    }
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.35,
        delay: Math.min(index, 8) * 0.035,
      }}
      onClick={openRoom}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          openRoom();
        }
      }}
      role="link"
      tabIndex={0}
      className="
        group
        relative
        cursor-pointer
        overflow-hidden
        rounded-[24px]
        border
        border-slate-200/80
        bg-white
        shadow-[0_6px_24px_rgba(15,23,42,0.06)]
        transition-all
        duration-300

        hover:-translate-y-1
        hover:border-slate-300
        hover:shadow-[0_20px_50px_rgba(15,23,42,0.14)]

        focus:outline-none
        focus:ring-2
        focus:ring-red-500/30
      "
    >
      {/* IMAGE */}
      <div
        className="
          relative
          overflow-hidden
          bg-slate-100

          aspect-[4/5]
          sm:aspect-[4/3]
          lg:aspect-[16/11]
        "
      >
        {!imgLoaded && (
          <div className="absolute inset-0 animate-pulse bg-slate-200" />
        )}

        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={room.title}
            onLoad={() => setImgLoaded(true)}
            onError={() => {
              setImgError(true);
              setImgLoaded(true);
            }}
            className={`
              h-full
              w-full
              object-cover
              transition-all
              duration-700
              group-hover:scale-[1.04]
              ${
                imgLoaded
                  ? "opacity-100"
                  : "opacity-0"
              }
            `}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-rose-100">
            <Home className="h-20 w-20 text-red-200" />
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/5 to-black/20" />

        {/* BADGES */}
        <div className="absolute left-3 top-3 z-20 flex gap-2">
          <span
            className="
              rounded-full
              bg-white/95
              px-3
              py-1.5
              text-[11px]
              font-bold
              shadow
              backdrop-blur-lg
            "
            style={{
              color: catCfg.color,
            }}
          >
            {catCfg.label}
          </span>

          {room.user?.isVerified && (
            <span className="flex items-center gap-1 rounded-full bg-black/55 px-2.5 py-1.5 text-[10px] font-semibold text-white backdrop-blur-lg">
              <ShieldCheck className="h-3.5 w-3.5" />
              Verified
            </span>
          )}
        </div>

        {room.allowsWomen && (
          <span className="absolute right-3 top-3 z-20 rounded-full bg-pink-500 px-2.5 py-1.5 text-[10px] font-bold text-white shadow">
            Women OK
          </span>
        )}

        {/* MOBILE SOCIAL ACTIONS */}
        <div
          className="
            absolute
            bottom-[96px]
            right-3
            z-30
            flex
            flex-col
            items-center
            gap-3
            sm:hidden
          "
          onClick={(e) => e.stopPropagation()}
        >
          <div className="relative">
            <div className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-white bg-red-600 text-sm font-bold text-white shadow-lg">
              {ownerInitial}
            </div>

            {room.user?.isVerified && (
              <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-blue-500">
                <CheckCircle className="h-3 w-3 text-white" />
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setLiked((value) => !value);
            }}
            className="flex flex-col items-center gap-1 text-white"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-black/35 backdrop-blur-md">
              <Heart
                className={`h-6 w-6 ${
                  liked
                    ? "fill-red-500 text-red-500"
                    : "text-white"
                }`}
              />
            </span>

            <span className="text-[10px] font-medium">
              Like
            </span>
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/property/${room.id}#comments`);
            }}
            className="flex flex-col items-center gap-1 text-white"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-black/35 backdrop-blur-md">
              <MessageCircle className="h-6 w-6" />
            </span>

            <span className="text-[10px] font-medium">
              Comment
            </span>
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setSaved((value) => !value);
            }}
            className="flex flex-col items-center gap-1 text-white"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-black/35 backdrop-blur-md">
              <Bookmark
                className={`h-6 w-6 ${
                  saved
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-white"
                }`}
              />
            </span>

            <span className="text-[10px] font-medium">
              Save
            </span>
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              void handleShare();
            }}
            className="flex flex-col items-center gap-1 text-white"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-black/35 backdrop-blur-md">
              <Share2 className="h-6 w-6" />
            </span>

            <span className="text-[10px] font-medium">
              Share
            </span>
          </button>
        </div>

        {/* DESKTOP ACTIONS */}
        <div
          className="
            absolute
            bottom-3
            right-3
            z-30
            hidden
            items-center
            gap-2
            sm:flex
          "
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setLiked((value) => !value);
            }}
            aria-label="Like"
            className="
              flex
              h-9
              w-9
              items-center
              justify-center
              rounded-full
              bg-white/95
              text-slate-700
              shadow-lg
              backdrop-blur-md
              transition
              hover:scale-105
            "
          >
            <Heart
              className={`h-4.5 w-4.5 ${
                liked
                  ? "fill-red-500 text-red-500"
                  : ""
              }`}
            />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setSaved((value) => !value);
            }}
            aria-label="Save"
            className="
              flex
              h-9
              w-9
              items-center
              justify-center
              rounded-full
              bg-white/95
              text-slate-700
              shadow-lg
              backdrop-blur-md
              transition
              hover:scale-105
            "
          >
            <Bookmark
              className={`h-4.5 w-4.5 ${
                saved
                  ? "fill-yellow-400 text-yellow-500"
                  : ""
              }`}
            />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              void handleShare();
            }}
            aria-label="Share"
            className="
              flex
              h-9
              w-9
              items-center
              justify-center
              rounded-full
              bg-white/95
              text-slate-700
              shadow-lg
              backdrop-blur-md
              transition
              hover:scale-105
            "
          >
            <Share2 className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* IMAGE BOTTOM TEXT */}
        <div
          className="
            absolute
            bottom-0
            left-0
            z-20
            p-4
            pr-16
            text-white

            sm:right-[130px]
          "
        >
          <div className="mb-1.5 flex items-center gap-1.5">
            <span className="text-xs font-semibold">
              {ownerName}
            </span>

            {room.user?.isVerified && (
              <CheckCircle className="h-3.5 w-3.5 fill-blue-500 text-white" />
            )}
          </div>

          <h3 className="line-clamp-2 text-[17px] font-bold leading-snug sm:text-lg">
            {room.title}
          </h3>

          <div className="mt-1.5 flex items-center gap-1 text-white/85">
            <MapPin className="h-3.5 w-3.5 shrink-0" />

            <span className="truncate text-xs">
              {shortAddress}
            </span>
          </div>

          <div className="mt-2 flex items-end gap-1">
            <span className="text-xl font-extrabold sm:text-2xl">
              {formatPriceNPR(Number(room.price))}
            </span>

            <span className="pb-1 text-[10px] text-white/70">
              / month
            </span>
          </div>
        </div>
      </div>

      {/* DETAILS */}
      <div className="p-4 sm:p-5">
        <div className="grid grid-cols-3 overflow-hidden rounded-2xl border border-slate-100 bg-slate-50/80">
          <div className="flex flex-col items-center gap-1 py-3">
            <Users className="h-4 w-4 text-red-500" />
            <span className="text-sm font-bold text-slate-900">
              {room.roomCapacity}
            </span>
            <span className="text-[10px] text-slate-500">
              People
            </span>
          </div>

          <div className="flex flex-col items-center gap-1 border-x border-slate-200 py-3">
            <Bath className="h-4 w-4 text-red-500" />
            <span className="text-sm font-bold text-slate-900">
              {room.bathroomCapacity}
            </span>
            <span className="text-[10px] text-slate-500">
              Bath
            </span>
          </div>

          <div className="flex flex-col items-center gap-1 py-3">
            <Square className="h-4 w-4 text-red-500" />
            <span className="text-sm font-bold text-slate-900">
              {Number(room.roomArea || 0).toFixed(0)}
            </span>
            <span className="text-[10px] text-slate-500">
              m²
            </span>
          </div>
        </div>

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

        <div className="mt-4 flex items-center justify-between">
          <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500">
            {room.category}
          </span>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700">
              <CheckCircle className="h-3 w-3" />
              {room.listingStatus}
            </span>

            <span className="hidden items-center gap-1 text-xs font-semibold text-red-600 sm:flex">
              View
              <ArrowUpRight className="h-3.5 w-3.5" />
            </span>
          </div>
        </div>
      </div>
    </motion.article>
  );
}
