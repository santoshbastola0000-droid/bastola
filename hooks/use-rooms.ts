"use client";

import { useEffect, useState } from "react";
import { mockRooms } from "@/lib/mock-data";

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

export function useRooms(
  location: { latitude: number; longitude: number } | null,
) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    try {
      if (location) {
        // Filter rooms by distance if location is provided (simplified - within ~25km)
        const filteredRooms = mockRooms.filter((room) => {
          const lat1 = location.latitude;
          const lon1 = location.longitude;
          const lat2 = room.latitude;
          const lon2 = room.longitude;

          // Simple distance calculation
          const distance =
            Math.sqrt(Math.pow(lat2 - lat1, 2) + Math.pow(lon2 - lon1, 2)) *
            111; // rough km conversion

          return distance <= 25;
        });
        setRooms(filteredRooms);
      } else {
        // Show all rooms if no location provided
        setRooms(mockRooms);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load rooms");
      setRooms([]);
    } finally {
      setLoading(false);
    }
  }, [location]);

  return { rooms, loading, error };
}
