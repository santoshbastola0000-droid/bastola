"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
    page: number;
    take: number;
    total: number;
    count: number;
    previousPage: number | null;
    nextPage: number | null;
  } | null;
  refetch: (filters?: RoomFilters) => Promise<void>;
}

export function useRooms(filters: RoomFilters = {}): UseRoomsReturn {
  const [rooms, setRooms] = useState<Property[]>([]);
  const [rawRooms, setRawRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] =
    useState<UseRoomsReturn["pagination"]>(null);

  // Serialize filters to a stable string for comparison
  const filtersKey = JSON.stringify(filters);
  const prevFiltersKey = useRef<string>("");

  const fetchRooms = useCallback(
    async (overrideFilters?: RoomFilters) => {
      try {
        setLoading(true);
        setError(null);

        const cleanFilters: RoomFilters = {};
        const source = overrideFilters ?? filters;

        // Only include defined, non-null values
        (Object.keys(source) as Array<keyof RoomFilters>).forEach((key) => {
          const value = source[key];
          if (value !== undefined && value !== null && value !== "") {
            (cleanFilters as any)[key] = value;
          }
        });

        const response = await roomService.getPublicRooms(cleanFilters);

        setRawRooms(response.data);
        setRooms(adaptRoomsToProperties(response.data));
        setPagination(response.pagination);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch rooms");
        console.error("Error fetching rooms:", err);
      } finally {
        setLoading(false);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [filtersKey],
  ); // Re-create fetchRooms whenever filters change

  // Re-fetch whenever the serialized filters change
  useEffect(() => {
    if (filtersKey === prevFiltersKey.current) return;
    prevFiltersKey.current = filtersKey;
    fetchRooms();
  }, [filtersKey, fetchRooms]);

  return {
    rooms,
    rawRooms,
    loading,
    error,
    pagination,
    refetch: fetchRooms,
  };
}
