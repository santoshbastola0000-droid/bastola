"use client";

import { useRef, useState } from "react";
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
  Bookmark,
  Share2,
  ShieldCheck,
} from "lucide-react";

import type { Room } from "@/types/room.types";
import { UserRole } from "@/types/user.types";
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
  const [saved, setSaved] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const touchGestureRef = useRef<"horizontal" | "vertical" | null>(null);

  const catCfg = categoryConfig[room.category] ?? {
    label: room.category,
    labelNp: room.category,
    color: "#dc2626",
    bg: "#fff1f2",
  };

  const images = room.images ?? [];
  const currentMedia = images[imageIndex] ?? images[0] ?? "";
  const isVideo =
    /\.(mp4|webm|mov|m4v)(\?.*)?$/i.test(currentMedia);
  const imageUrl =
    !imgError && currentMedia
      ? resolveImageUrl(currentMedia)
      : null;

  const topAmenities = (room.amenities ?? []).slice(0, 2);
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
    "RoomKhoj Owner";

  const ownerInitial =
    ownerName.trim().charAt(0).toUpperCase() || "R";

  const ownerPhotoUrl =
    room.user?.profilePhotoUrl
      ? resolveImageUrl(room.user.profilePhotoUrl)
      : null;

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

  const handleMediaTouchStart = (
    event: React.TouchEvent<HTMLDivElement>,
  ) => {
    const touch = event.touches[0];
    if (!touch) return;

    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
    };
    touchGestureRef.current = null;
  };

  const handleMediaTouchMove = (
    event: React.TouchEvent<HTMLDivElement>,
  ) => {
    const start = touchStartRef.current;
    const touch = event.touches[0];
    if (!start || !touch) return;

    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;

    if (
      !touchGestureRef.current &&
      (Math.abs(dx) > 8 || Math.abs(dy) > 8)
    ) {
      touchGestureRef.current =
        Math.abs(dx) > Math.abs(dy)
          ? "horizontal"
          : "vertical";
    }

    if (touchGestureRef.current === "horizontal") {
      event.preventDefault();
      event.stopPropagation();
    }
  };

  const handleMediaTouchEnd = (
    event: React.TouchEvent<HTMLDivElement>,
  ) => {
    const start = touchStartRef.current;
    const touch = event.changedTouches[0];

    touchStartRef.current = null;
    const gesture = touchGestureRef.current;
    touchGestureRef.current = null;

    if (!start || !touch || gesture !== "horizontal") {
      return;
    }

    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;

    if (
      Math.abs(dx) < 42 ||
      Math.abs(dx) <= Math.abs(dy)
    ) {
      return;
    }

    if (dx < 0) showNextImage();
    else showPreviousImage();
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
      className="group relative isolate cursor-pointer overflow-hidden rounded-[24px] border border-slate-200/80 bg-white shadow-[0_8px_26px_rgba(15,23,42,0.07)] transition-all duration-300 md:hover:-translate-y-1 hover:border-red-200 hover:shadow-[0_18px_45px_rgba(15,23,42,0.12)] focus:outline-none focus:ring-2 focus:ring-red-500/30 [contain:paint]"
    >
      <div
        className="relative z-0 aspect-[4/3] w-full overflow-hidden bg-slate-100"
        style={{
          touchAction: "pan-y",
          overscrollBehaviorX: "contain",
        }}
        onClick={(event) => event.stopPropagation()}
        onTouchStart={handleMediaTouchStart}
        onTouchMove={handleMediaTouchMove}
        onTouchEnd={handleMediaTouchEnd}
        onTouchCancel={() => {
          touchStartRef.current = null;
          touchGestureRef.current = null;
        }}
      >
        {!imgLoaded && (
          <div className="absolute inset-0 animate-pulse bg-slate-200" />
        )}

        {imageUrl ? (
          isVideo ? (
            <video
              src={imageUrl}
              controls
              muted
              playsInline
              preload="metadata"
              onLoadedData={() => setImgLoaded(true)}
              className="h-full w-full object-cover"
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt={room.title}
              onLoad={() => setImgLoaded(true)}
              onError={() => {
                setImgError(true);
                setImgLoaded(true);
              }}
              className={`h-full w-full object-cover transition duration-500 ease-out md:group-hover:scale-[1.025] ${
                imgLoaded ? "opacity-100" : "opacity-0"
              }`}
            />
          )
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-rose-50 via-white to-slate-100">
            <Home className="h-14 w-14 text-red-200" />
          </div>
        )}

        <div className="pointer-events-none absolute left-1/2 top-5 z-20 -translate-x-1/2 rounded-full bg-black/45 px-3 py-1 text-[10px] font-extrabold tracking-wide text-white shadow-sm backdrop-blur-sm">
          www.roomkhoj.com
        </div>

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

      <div className="relative z-10 bg-white p-2.5 sm:p-3">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              if (room.user?.id) {
                router.push(`/profile/${room.user.id}`);
              }
            }}
            className="flex min-w-0 items-center gap-2 text-left"
          >
            <span className="flex h-8 w-8 shrink-0 overflow-hidden rounded-full border border-slate-200 bg-slate-100">
              {ownerPhotoUrl ? (
                <img
                  src={ownerPhotoUrl}
                  alt={ownerName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-[11px] font-black text-red-600">
                  {ownerInitial}
                </span>
              )}
            </span>

            <span className="min-w-0">
              <span className="flex items-center gap-1">
                <span className="truncate text-[11px] font-extrabold text-slate-800">
                  {ownerName}
                </span>
                {room.user?.role === UserRole.ADMIN && (
                  <CheckCircle
                    className="h-3 w-3 shrink-0 fill-sky-500 text-white"
                    aria-label="RoomKhoj"
                  />
                )}
              </span>
            </span>
          </button>

          <div
            className="flex shrink-0 items-center gap-1.5"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSaved((value) => !value)}
              aria-label="Favorite room"
              title="Favorite"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm transition hover:border-red-200 hover:bg-red-50"
            >
              <Bookmark
                className={`h-3.5 w-3.5 ${
                  saved
                    ? "fill-red-500 text-red-500"
                    : "text-slate-600"
                }`}
              />
            </button>

            <button
              type="button"
              onClick={() => void handleShare()}
              aria-label="Share room"
              title="Share"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
            >
              <Share2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div className="mt-2 flex flex-wrap gap-1">
          <span
            className="rounded-full bg-red-50 px-2 py-0.5 text-[8px] font-extrabold"
            style={{ color: catCfg.color }}
          >
            {catCfg.label}
          </span>

          {room.user?.isVerified && (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[8px] font-bold text-slate-600">
              Verified
            </span>
          )}

          {room.allowsWomen && (
            <span className="rounded-full bg-pink-50 px-2 py-0.5 text-[8px] font-bold text-pink-600">
              Women OK
            </span>
          )}
        </div>

        <h3 className="mt-2 line-clamp-1 text-[15px] font-extrabold leading-tight text-slate-950">
          {room.title}
        </h3>

        <div className="mt-1 flex min-w-0 items-center gap-1 text-[10px] text-slate-500">
          <MapPin className="h-3 w-3 shrink-0 text-red-500" />
          <span className="truncate">{shortAddress}</span>
        </div>

        <div className="mt-1.5 flex items-baseline gap-1">
          <span className="text-[18px] font-black tracking-[-0.03em] text-red-600">
            {formatPriceNPR(Number(room.price))}
          </span>
          <span className="text-[9px] font-medium text-slate-400">/month</span>
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

        <div className="mt-2.5">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              openRoom();
            }}
            className="flex h-9 w-full items-center justify-center rounded-xl bg-red-600 px-3 text-[10px] font-bold text-white transition hover:bg-red-700"
          >
            View room
          </button>
        </div>
      </div>
    </motion.article>
  );
}
