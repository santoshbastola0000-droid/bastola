import { useQuery } from "@tanstack/react-query";
import { roomRequestService } from "@/http/services/room-request.service";
import type { RoomRequestFilters } from "@/types/room-request.types";

export const ROOM_REQUEST_QUERY_KEYS = {
  LIST_SENT: "room-requests-sent",
  LIST_RECEIVED: "room-requests-received",
  CREATE: "create-room-request",
  UPDATE_STATUS: "update-room-request-status",
};

export const useMyRoomRequestsQuery = (
  filters: RoomRequestFilters = {},
  enabled: boolean = true,
) => {
  return useQuery({
    queryKey: [ROOM_REQUEST_QUERY_KEYS.LIST_SENT, filters],
    queryFn: () => roomRequestService.getMyRequests(filters),
    enabled,
  });
};

export const useReceivedRoomRequestsQuery = (
  filters: RoomRequestFilters = {},
  enabled: boolean = true,
) => {
  return useQuery({
    queryKey: [ROOM_REQUEST_QUERY_KEYS.LIST_RECEIVED, filters],
    queryFn: () => roomRequestService.getReceivedRequests(filters),
    enabled,
  });
};
