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
  Bookmark,
  Share2,
  ShieldCheck,
} from "lucide-react";

import type { Room } from "@/types/room.types";
import { formatPriceNPR, resolveImageUrl } from "@/lib/utils";
import { amenityIcons, categoryConfig } from "@/lib/room-utils";
import { toast } from "sonner";

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
  const [imageIndex, setImageIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const catCfg = categoryConfig[room.category] ?? {
    label: room.category,
    labelNp: room.category,
    color: "#dc2626",
    bg: "#fff1f2",
  };

  const images = room.images ?? [];
  const imageUrl =
    !imgError && images.length
      ? resolveImageUrl(images[imageIndex] ?? images[0])
      : null;

  const topAmenities = (room.amenities ?? []).slice(0, 2);
  const city = room.location?.city ?? "";
  const formattedAddress =
    room.location?.formattedAddress ??
    room.address ??
    "";
  const shortAddress =
    city || formattedAddress.split(",")[0];

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
          text: `${room.title} - ${formatPriceNPR(Number(room.price))}`,
          url,
        });
        return;
      }

      await navigator.clipboard.writeText(url);
      toast.success("Room link copied");
    } catch {
      // Share sheet cancelled.
    }
  };

  const showNextImage = () => {
    if (images.length <= 1) return;
    setImgLoaded(false);
    setImgError(false);
    setImageIndex((current) => (current + 1) % images.length);
  };

  const showPreviousImage = () => {
    if (images.length <= 1) return;
    setImgLoaded(false);
    setImgError(false);
    setImageIndex((current) => (current - 1 + images.length) % images.length);
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.32,
        delay: Math.min(index, 8) * 0.03,
      }}
      onClick={openRoom}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          openRoom();
        }
      }}
      role="link"
      tabIndex={0}
      className="group relative cursor-pointer overflow-hidden rounded-[24px] border border-slate-200/80 bg-white shadow-[0_8px_26px_rgba(15,23,42,0.07)] transition-all duration-300 hover:-translate-y-1 hover:border-red-200 hover:shadow-[0_18px_45px_rgba(15,23,42,0.12)] focus:outline-none focus:ring-2 focus:ring-red-500/30"
    >
      <div
        className="relative aspect-[4/3] overflow-hidden bg-slate-100"
        onClick={(event) => event.stopPropagation()}
        onTouchStart={(event) => {
          setTouchStartX(event.touches[0]?.clientX ?? null);
        }}
        onTouchEnd={(event) => {
          if (touchStartX === null) return;
          const endX = event.changedTouches[0]?.clientX ?? touchStartX;
          const delta = endX - touchStartX;
          setTouchStartX(null);

          if (Math.abs(delta) < 35) return;
          if (delta < 0) showNextImage();
          else showPreviousImage();
        }}
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
            className={`h-full w-full object-cover transition duration-500 ease-out group-hover:scale-[1.025] ${
              imgLoaded ? "opacity-100" : "opacity-0"
            }`}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-rose-50 via-white to-slate-100">
            <Home className="h-14 w-14 text-red-200" />
          </div>
        )}

        <div className="absolute left-3 top-3 z-20 flex flex-wrap gap-2">
          <span
            className="rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-extrabold shadow-sm backdrop-blur-md"
            style={{ color: catCfg.color }}
          >
            {catCfg.label}
          </span>
          {room.user?.isVerified && (
            <span className="flex items-center gap-1 rounded-full bg-slate-950/65 px-2.5 py-1 text-[9px] font-semibold text-white backdrop-blur-md">
              <ShieldCheck className="h-3 w-3 text-sky-300" />
              Verified
            </span>
          )}
        </div>

        {room.allowsWomen && (
          <span className="absolute right-3 top-3 z-20 rounded-full bg-pink-500 px-2.5 py-1 text-[9px] font-bold text-white shadow">
            Women OK
          </span>
        )}

        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                showPreviousImage();
              }}
              aria-label="Previous room photo"
              className="absolute left-2 top-1/2 z-20 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-800 shadow md:flex"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                showNextImage();
              }}
              aria-label="Next room photo"
              className="absolute right-2 top-1/2 z-20 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-800 shadow md:flex"
            >
              ›
            </button>
            <div className="absolute bottom-2 left-1/2 z-20 flex -translate-x-1/2 gap-1.5">
              {images.slice(0, 5).map((_, dotIndex) => (
                <span
                  key={dotIndex}
                  className={`h-1.5 w-1.5 rounded-full ${
                    dotIndex === imageIndex ? "bg-white" : "bg-white/50"
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <div className="p-2.5 sm:p-3">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="line-clamp-1 text-[15px] font-extrabold leading-tight text-slate-950">
              {room.title}
            </h3>
            <div className="mt-1 flex min-w-0 items-center gap-1 text-[10px] text-slate-500">
              <MapPin className="h-3 w-3 shrink-0 text-red-500" />
              <span className="truncate">{shortAddress}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setLiked((value) => !value);
            }}
            aria-label="Favorite"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white transition hover:border-red-200 hover:bg-red-50"
          >
            <Heart
              className={`h-4 w-4 ${
                liked ? "fill-red-500 text-red-500" : "text-slate-500"
              }`}
            />
          </button>
        </div>

        <div className="mt-2 flex items-center justify-between gap-2">
          <div className="flex items-baseline gap-1">
            <span className="text-[18px] font-black tracking-[-0.03em] text-red-600">
              {formatPriceNPR(Number(room.price))}
            </span>
            <span className="text-[9px] font-medium text-slate-400">/month</span>
          </div>

          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setSaved((value) => !value);
            }}
            aria-label="Save"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-slate-50 transition hover:border-red-200 hover:bg-red-50"
          >
            <Bookmark
              className={`h-3.5 w-3.5 ${
                saved ? "fill-red-500 text-red-500" : "text-slate-500"
              }`}
            />
          </button>
        </div>

        <div className="mt-2 grid grid-cols-3 divide-x divide-slate-200 rounded-xl border border-slate-200 bg-slate-50/80">
          <div className="flex items-center justify-center gap-1.5 px-1.5 py-2">
            <Users className="h-3.5 w-3.5 text-red-500" />
            <span className="text-[10px] font-bold text-slate-700">{room.roomCapacity}</span>
          </div>
          <div className="flex items-center justify-center gap-1.5 px-1.5 py-2">
            <Bath className="h-3.5 w-3.5 text-red-500" />
            <span className="text-[10px] font-bold text-slate-700">{room.bathroomCapacity}</span>
          </div>
          <div className="flex items-center justify-center gap-1.5 px-1.5 py-2">
            <Square className="h-3.5 w-3.5 text-red-500" />
            <span className="text-[10px] font-bold text-slate-700">
              {Number(room.roomArea || 0).toFixed(0)}m²
            </span>
          </div>
        </div>

        {topAmenities.length > 0 && (
          <div className="mt-2 flex gap-1.5 overflow-hidden">
            {topAmenities.map((amenity) => {
              const Icon = amenityIcons[amenity.toLowerCase()] ?? CheckCircle;
              return (
                <span
                  key={amenity}
                  className="inline-flex shrink-0 items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-1 text-[9px] font-semibold text-slate-600"
                >
                  <Icon className="h-2.5 w-2.5 text-red-500" />
                  {amenity}
                </span>
              );
            })}
          </div>
        )}

        <div className="mt-2.5 flex gap-2">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              void handleShare();
            }}
            className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white text-[10px] font-bold text-slate-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
          >
            <Share2 className="h-3.5 w-3.5" />
            Share
          </button>

          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              openRoom();
            }}
            className="flex h-9 flex-1 items-center justify-center rounded-xl bg-red-600 px-3 text-[10px] font-bold text-white transition hover:bg-red-700"
          >
            View room
          </button>
        </div>
      </div>
    </motion.article>
  );
}
