import { useQuery } from "@tanstack/react-query";
import { roomService } from "@/http/services/room.service";
import { RoomFilters } from "@/types/room.types";

export const ROOM_QUERY_KEYS = {
  GET_ROOMS: "getRooms",
  GET_ROOM: "getRoom",
  GET_ROOM_STATS: "getRoomStats",
  CREATE_ROOM: "createRoom",
  UPDATE_ROOM: "updateRoom",
  DELETE_ROOM: "deleteRoom",
  UPDATE_ROOM_STATUS: "updateRoomStatus",
};

/**
 * Query for fetching rooms with pagination and filters
 */
export const useGetRoomsQuery = (filters: RoomFilters = {}) => {
  return useQuery({
    queryKey: [ROOM_QUERY_KEYS.GET_ROOMS, filters],
    queryFn: () => roomService.getRooms(filters),
  });
};

/**
 * Query for fetching a single room by ID
 */
export const useGetRoomQuery = (id: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: [ROOM_QUERY_KEYS.GET_ROOM, id],
    queryFn: () => roomService.getRoomById(id),
    enabled: !!id && enabled,
  });
};

/**
 * Query for fetching room statistics
 */
export const useGetRoomStatsQuery = () => {
  return useQuery({
    queryKey: [ROOM_QUERY_KEYS.GET_ROOM_STATS],
    queryFn: () => roomService.getRoomStats(),
  });
};
