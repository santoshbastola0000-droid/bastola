"use client";

import { useState } from "react";
import { MapPin, Search } from "lucide-react";

interface SearchBarProps {
  onLocationFound: (location: { latitude: number; longitude: number }) => void;
}

export function SearchBar({ onLocationFound }: SearchBarProps) {
  const [isLocating, setIsLocating] = useState(false);

  const handleGetLocation = () => {
    setIsLocating(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          onLocationFound({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          setIsLocating(false);
        },
        (error) => {
          console.error("Geolocation error:", error);
          setIsLocating(false);
        },
      );
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-12">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 flex items-center border border-[var(--border)] rounded-lg px-4 py-2">
          <Search className="text-[var(--muted-foreground)] mr-2" size={20} />
          <input
            type="text"
            placeholder="Search rooms, cities, or neighborhoods..."
            className="flex-1 outline-none text-sm"
          />
        </div>
        <button
          onClick={handleGetLocation}
          disabled={isLocating}
          className="bg-[var(--primary)] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[var(--primary-dark)] transition flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <MapPin size={20} />
          {isLocating ? "Getting location..." : "Use my location"}
        </button>
      </div>
    </div>
  );
}
