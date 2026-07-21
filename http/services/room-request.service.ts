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

export const roomRequestService = {
  getMyRequests: async (
    filters: RoomRequestFilters = {},
  ): Promise<RoomRequestsResponse> => {
    const response = await privateApi.get<RoomRequestsResponse>(
      `${apiV1Path("/room-requests/me")}${
        toQueryString({
          page: filters.page,
          take: filters.take,
          roomId: filters.roomId,
          status: filters.status,
          direction: filters.direction,
        })
      }`,
    );
    return response.data;
  },

  getReceivedRequests: async (
    filters: RoomRequestFilters = {},
  ): Promise<RoomRequestsResponse> => {
    const response = await privateApi.get<RoomRequestsResponse>(
      `${apiV1Path("/room-requests/incoming")}${
        toQueryString({
          page: filters.page,
          take: filters.take,
          roomId: filters.roomId,
          status: filters.status,
          direction: filters.direction,
        })
      }`,
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
