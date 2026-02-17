"use client";

import { useState } from "react";
import { Hero } from "@/components/hero";
import { SearchBar } from "@/components/search-bar";
import { RoomGrid } from "@/components/room-grid";
import { useRooms } from "@/hooks/use-rooms";

export default function Home() {
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const { rooms, loading, error } = useRooms(location);

  return (
    <div>
      <Hero />
      <div className="container mx-auto px-4 py-12">
        <SearchBar onLocationFound={setLocation} />
        <div className="text-center py-12">
          <p className="text-[var(--muted-foreground)]">Loading rooms...</p>
        </div>
        {error && <div className="text-center py-12 text-red-500">{error}</div>}
        {rooms && <RoomGrid rooms={rooms} />}
      </div>
    </div>
  );
}
