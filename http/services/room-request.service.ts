import { privateApi } from "@/http/api/privateApi";
import { apiV1Path } from "@/http/api/versioned-path";
import type {
  CreateRoomRequestDTO,
  RoomRequestFilters,
  RoomRequestsResponse,
  RoomRequest,
  RoomRequestStatus,
} from "@/types/room-request.types";

const toQueryString = (filters: RoomRequestFilters = {}) => {
  const params = new URLSearchParams();

  if (filters.page !== undefined) params.append("page", String(filters.page));
  if (filters.take !== undefined) params.append("take", String(filters.take));
  if (filters.roomId) params.append("roomId", filters.roomId);
  if (filters.status) params.append("status", filters.status);
  if (filters.direction) params.append("direction", filters.direction);

  const query = params.toString();
  return query ? `?${query}` : "";
};

export const roomRequestService = {
  getMyRequests: async (
    filters: RoomRequestFilters = {},
  ): Promise<RoomRequestsResponse> => {
    const response = await privateApi.get<RoomRequestsResponse>(
      `${apiV1Path("/room-requests/me")}${toQueryString(filters)}`,
    );
    return response.data;
  },

  getReceivedRequests: async (
    filters: RoomRequestFilters = {},
  ): Promise<RoomRequestsResponse> => {
    const response = await privateApi.get<RoomRequestsResponse>(
      `${apiV1Path("/room-requests/incoming")}${toQueryString(filters)}`,
    );
    return response.data;
  },

  createRequest: async (payload: CreateRoomRequestDTO): Promise<{ data: RoomRequest }> => {
    const response = await privateApi.post<{ data: RoomRequest }>(
      apiV1Path("/room-requests"),
      payload,
    );
    return response.data;
  },

  updateStatus: async (
    id: string,
    status: RoomRequestStatus,
  ): Promise<{ data: RoomRequest }> => {
    const response = await privateApi.patch<{ data: RoomRequest }>(
      apiV1Path(`/room-requests/${id}/status`),
      { status },
    );
    return response.data;
  },
};
