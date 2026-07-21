import { privateApi } from "@/http/api/privateApi";
import { apiV1Path } from "@/http/api/versioned-path";
import { toQueryString } from "@/http/services/query-string";
import type {
  CreateRoomRequestDTO,
  RoomRequestFilters,
  RoomRequestsResponse,
  RoomRequest,
  RoomRequestStatus,
} from "@/types/room-request.types";

const getRequestQuery = (filters: RoomRequestFilters = {}) =>
  toQueryString({
    page: filters.page,
    take: filters.take,
    roomId: filters.roomId,
    status: filters.status,
    direction: filters.direction,
  });

export const roomRequestService = {
  getMyRequests: async (
    filters: RoomRequestFilters = {},
  ): Promise<RoomRequestsResponse> => {
    const query = getRequestQuery(filters);
    const response = await privateApi.get<RoomRequestsResponse>(
      `${apiV1Path("/room-requests/me")}${query}`,
    );
    return response.data;
  },

  getReceivedRequests: async (
    filters: RoomRequestFilters = {},
  ): Promise<RoomRequestsResponse> => {
    const query = getRequestQuery(filters);
    const response = await privateApi.get<RoomRequestsResponse>(
      `${apiV1Path("/room-requests/incoming")}${query}`,
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
