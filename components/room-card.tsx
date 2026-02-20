"use client";

import Link from "next/link";
import { Star, MapPin } from "lucide-react";

interface RoomCardProps {
  room: {
    id: string;
    title: string;
    address: string;
    city: string;
    pricePerNight: number;
    capacity: number;
    roomType: string;
    rating?: number;
    reviews?: number;
    photos: Array<{ url: string }>;
  };
}

export function RoomCard({ room }: RoomCardProps) {
  const imageUrl = room.photos?.[0]?.url || "/placeholder.svg";
  const rating = room.rating || 4.8;
  const reviewCount = room.reviews || 0;

  return (
    <Link href={`/rooms/${room.id}`}>
      <div className="bg-[var(--card)] rounded-lg overflow-hidden shadow-md hover:shadow-xl transition cursor-pointer h-full flex flex-col">
        <div className="relative h-48 overflow-hidden bg-gray-200">
          <img
            src={imageUrl || "/placeholder.svg"}
            alt={room.title}
            className="w-full h-full object-cover hover:scale-105 transition duration-300"
          />
          <div className="absolute top-3 right-3 bg-white px-3 py-1 rounded-full text-sm font-semibold text-[var(--primary)]">
            ${room.pricePerNight}/night
          </div>
        </div>

        <div className="p-4 flex flex-col flex-1">
          <h3 className="font-semibold text-lg mb-2 line-clamp-1">
            {room.title}
          </h3>

          <div className="flex items-center text-sm text-[var(--muted-foreground)] mb-3">
            <MapPin size={16} className="mr-1 flex-shrink-0" />
            <span className="line-clamp-1">{room.city}</span>
          </div>

          <div className="flex items-center gap-1 mb-3">
            <div className="flex items-center gap-1">
              <Star size={16} className="fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-semibold">{rating.toFixed(2)}</span>
            </div>
            {reviewCount > 0 && (
              <span className="text-xs text-[var(--muted-foreground)]">
                ({reviewCount})
              </span>
            )}
          </div>

          <div className="flex gap-2 text-xs flex-wrap mt-auto">
            <span className="bg-[var(--muted)] px-2 py-1 rounded">
              {room.roomType}
            </span>
            <span className="bg-[var(--muted)] px-2 py-1 rounded">
              {room.capacity} guests
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
