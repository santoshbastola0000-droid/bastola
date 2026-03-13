"use client";

import { useState, useEffect } from "react";
import { adaptRoomsToProperties } from "@/lib/adapters/room-adapter";
import type { Room, RoomFilters } from "@/types/room.types";
import type { Property } from "@/types/property.types";
import { roomService } from "@/http/services/room.service";

interface UseRoomsReturn {
  rooms: Property[];
  rawRooms: Room[];
  loading: boolean;
  error: string | null;
  pagination: {
    previousPage: number | null;
    nextPage: number | null;
    total: number;
    count: number;
  } | null;
  refetch: (filters?: RoomFilters) => Promise<void>;
}

interface PaginationInfo {
  page: number;
  take: number;
  total: number;
  count: number;
  previousPage: number | null;
  nextPage: number | null;
}

export function useRooms(initialFilters?: RoomFilters): UseRoomsReturn {
  const [rooms, setRooms] = useState<Property[]>([]);
  const [rawRooms, setRawRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);

  const fetchRooms = async (filters?: RoomFilters) => {
    try {
      setLoading(true);
      setError(null);

      const response = await roomService.getRooms(filters || initialFilters);

      // Store raw rooms
      setRawRooms(response.data);

      // Adapt to Property type for display
      const adaptedRooms = adaptRoomsToProperties(response.data);
      setRooms(adaptedRooms);

      setPagination(response.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch rooms");
      console.error("Error fetching rooms:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  return {
    rooms,
    rawRooms,
    loading,
    error,
    pagination,
    refetch: fetchRooms,
  };
}
