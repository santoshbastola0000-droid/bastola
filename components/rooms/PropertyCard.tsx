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
import { messageService } from "@/http/services/message.service";
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
            Number(room.price),
          )}`,
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

  const handleMessage = async (event: React.MouseEvent) => {
    event.stopPropagation();

    if (!isLoaded || !user) {
      sessionStorage.setItem(
        "roomkhoj_post_auth_redirect",
        `/property/${room.id}`,
      );
      router.push("/auth/login");
      return;
    }

    try {
      const result = await messageService.startForRoom(room.id);

      sessionStorage.setItem(
        "roomkhoj_room_message_draft",
        JSON.stringify({
          conversationId: result.conversation.id,
          text: "Hello, is this still available?",
          room: result.room,
        }),
      );

      router.push(
        `/messages?conversation=${encodeURIComponent(
          result.conversation.id,
        )}`,
      );
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          "Message सुरु गर्न सकिएन।",
      );
    }
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
      className="
        group relative cursor-pointer overflow-hidden rounded-[28px]
        border border-slate-200/80 bg-white
        shadow-[0_10px_35px_rgba(15,23,42,0.07)]
        transition-all duration-300
        hover:-translate-y-1.5 hover:border-red-200
        hover:shadow-[0_24px_60px_rgba(15,23,42,0.15)]
        focus:outline-none focus:ring-2 focus:ring-red-500/30
      "
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
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
              h-full w-full object-cover
              transition duration-700 ease-out
              group-hover:scale-[1.055]
              ${imgLoaded ? "opacity-100" : "opacity-0"}
            `}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-rose-50 via-white to-slate-100">
            <Home className="h-16 w-16 text-red-200" />
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/10 to-slate-950/20" />

        <div className="absolute left-3 top-3 z-20 flex flex-wrap gap-2">
          <span
            className="rounded-full bg-white/95 px-3 py-1.5 text-[11px] font-extrabold shadow-sm backdrop-blur-md"
            style={{ color: catCfg.color }}
          >
            {catCfg.label}
          </span>

          {room.user?.isVerified && (
            <span className="flex items-center gap-1 rounded-full bg-slate-950/65 px-2.5 py-1.5 text-[10px] font-semibold text-white backdrop-blur-md">
              <ShieldCheck className="h-3.5 w-3.5 text-sky-300" />
              Verified
            </span>
          )}
        </div>

        <div
          className="absolute right-3 top-3 z-30 flex gap-2"
          onClick={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setSaved((value) => !value);
            }}
            aria-label="Save"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/40 bg-white/90 text-slate-800 shadow-md backdrop-blur-md transition hover:scale-105"
          >
            <Bookmark
              className={`h-4 w-4 ${
                saved
                  ? "fill-red-500 text-red-500"
                  : ""
              }`}
            />
          </button>

          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              void handleShare();
            }}
            aria-label="Share"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/40 bg-white/90 text-slate-800 shadow-md backdrop-blur-md transition hover:scale-105"
          >
            <Share2 className="h-4 w-4" />
          </button>
        </div>

        {room.allowsWomen && (
          <span className="absolute right-3 top-[58px] z-20 rounded-full bg-pink-500 px-2.5 py-1.5 text-[10px] font-bold text-white shadow">
            Women OK
          </span>
        )}

        <div className="absolute inset-x-0 bottom-0 z-20 p-4 text-white">
          <div className="mb-2 flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full border border-white/70 bg-red-600 text-[10px] font-black shadow">
              {ownerInitial}
            </div>
            <span className="max-w-[150px] truncate text-[11px] font-semibold text-white/90">
              {ownerName}
            </span>
            {room.user?.isVerified && (
              <CheckCircle className="h-3.5 w-3.5 fill-sky-500 text-white" />
            )}
          </div>

          <h3 className="line-clamp-2 min-h-[44px] text-[19px] font-black leading-[1.15] tracking-[-0.02em]">
            {room.title}
          </h3>

          <div className="mt-2 flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-1.5 text-white/85">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-red-300" />
              <span className="truncate text-[11px] font-medium">
                {shortAddress}
              </span>
            </div>

            <span className="shrink-0 rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-semibold backdrop-blur-md">
              {room.listingStatus}
            </span>
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
              Monthly rent
            </p>
            <div className="mt-0.5 flex items-baseline gap-1">
              <span className="text-[24px] font-black tracking-[-0.03em] text-slate-950">
                {formatPriceNPR(Number(room.price))}
              </span>
              <span className="text-[10px] font-medium text-slate-400">
                /month
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setLiked((value) => !value);
            }}
            aria-label="Like"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-slate-50 transition hover:border-red-200 hover:bg-red-50"
          >
            <Heart
              className={`h-[18px] w-[18px] ${
                liked
                  ? "fill-red-500 text-red-500"
                  : "text-slate-500"
              }`}
            />
          </button>
        </div>

        <div className="grid grid-cols-3 divide-x divide-slate-200 rounded-2xl border border-slate-200 bg-slate-50/80">
          <div className="flex items-center justify-center gap-2 px-2 py-3">
            <Users className="h-4 w-4 text-red-500" />
            <div>
              <p className="text-sm font-extrabold leading-none text-slate-900">
                {room.roomCapacity}
              </p>
              <p className="mt-1 text-[9px] font-medium text-slate-500">
                People
              </p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 px-2 py-3">
            <Bath className="h-4 w-4 text-red-500" />
            <div>
              <p className="text-sm font-extrabold leading-none text-slate-900">
                {room.bathroomCapacity}
              </p>
              <p className="mt-1 text-[9px] font-medium text-slate-500">
                Bath
              </p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 px-2 py-3">
            <Square className="h-4 w-4 text-red-500" />
            <div>
              <p className="text-sm font-extrabold leading-none text-slate-900">
                {Number(room.roomArea || 0).toFixed(0)}
              </p>
              <p className="mt-1 text-[9px] font-medium text-slate-500">
                m²
              </p>
            </div>
          </div>
        </div>

        {topAmenities.length > 0 && (
          <div className="mt-3 flex min-h-[30px] flex-wrap gap-1.5">
            {topAmenities.map((amenity) => {
              const Icon =
                amenityIcons[amenity.toLowerCase()] ??
                CheckCircle;

              return (
                <span
                  key={amenity}
                  className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1.5 text-[10px] font-semibold text-slate-600 shadow-sm"
                >
                  <Icon className="h-3 w-3 text-red-500" />
                  {amenity}
                </span>
              );
            })}
          </div>
        )}

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={handleMessage}
            className="flex h-11 flex-1 items-center justify-center gap-2 rounded-2xl bg-red-600 px-4 text-sm font-bold text-white shadow-[0_8px_18px_rgba(220,38,38,0.22)] transition hover:bg-red-700 hover:shadow-[0_10px_24px_rgba(220,38,38,0.3)]"
          >
            <MessageCircle className="h-4 w-4" />
            Message
          </button>

          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              openRoom();
            }}
            className="flex h-11 items-center justify-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
          >
            View
            <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </motion.article>
  );
}
