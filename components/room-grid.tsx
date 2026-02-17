"use client";

import { RoomCard } from "./room-card";

interface Room {
  id: string;
  title: string;
  address: string;
  city: string;
  pricePerNight: number;
  capacity: number;
  roomType: string;
  latitude: number;
  longitude: number;
  photos: Array<{ url: string }>;
}

interface RoomGridProps {
  rooms: Room[];
}

export function RoomGrid({ rooms }: RoomGridProps) {
  if (rooms.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-[var(--muted-foreground)] text-lg">
          No rooms found in your area. Try a different location.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {rooms.map((room) => (
        <RoomCard key={room.id} room={room} />
      ))}
    </div>
  );
}
