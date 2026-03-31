import { privateApi } from "@/http/api/privateApi";
import {
  Room,
  UpdateRoomDTO,
  RoomFilters,
  RoomsResponse,
  RoomStats,
  RoomStatus,
} from "@/types/room.types";
import { api } from "../api/api";

export const roomService = {
  getRooms: async (params: RoomFilters = {}): Promise<RoomsResponse> => {
    const response = await privateApi.get("/rooms", { params });
    return response.data;
  },

  getPublicRooms: async (params: RoomFilters = {}): Promise<RoomsResponse> => {
    const response = await api.get("/rooms/public", { params });
    return response.data;
  },

  getMyRooms: async (filters?: RoomFilters): Promise<RoomsResponse> => {
    const params = new URLSearchParams();

    if (filters?.approvalStatus) {
      params.append("approvalStatus", filters.approvalStatus);
    }
    if (filters?.listingStatus) {
      params.append("listingStatus", filters.listingStatus);
    }
    if (filters?.search) {
      params.append("search", filters.search);
    }
    if (filters?.page !== undefined) {
      params.append("page", filters.page.toString());
    }
    if (filters?.take !== undefined) {
      params.append("take", filters.take.toString());
    }

    const response = await privateApi.get(
      `/rooms/my-rooms?${params.toString()}`,
    );
    return response.data;
  },

  getPendingRooms: async (params: RoomFilters = {}): Promise<RoomsResponse> => {
    const response = await privateApi.get("/rooms/pending", {
      params: { ...params, approvalStatus: RoomStatus.PENDING },
    });
    return response.data;
  },

  getRoomStats: async (): Promise<{ data: RoomStats }> => {
    const response = await privateApi.get("/rooms/stats");
    return response.data;
  },

  getRoomById: async (id: string): Promise<{ data: Room }> => {
    const response = await privateApi.get(`/rooms/${id}`);
    return response.data;
  },

  createRoom: async (data: FormData): Promise<{ data: Room }> => {
    const response = await privateApi.post("/rooms", data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  updateRoom: async (
    id: string,
    data: UpdateRoomDTO | FormData,
  ): Promise<{ data: Room }> => {
    const isFormData = data instanceof FormData;
    const response = await privateApi.patch(`/rooms/${id}`, data, {
      headers: isFormData
        ? { "Content-Type": "multipart/form-data" }
        : undefined,
    });
    return response.data;
  },

  deleteRoom: async (id: string): Promise<void> => {
    await privateApi.delete(`/rooms/${id}`);
  },

  updateApprovalStatus: async (
    id: string,
    status: RoomStatus.APPROVED | RoomStatus.REJECTED,
    reason?: string,
  ): Promise<{ data: Room }> => {
    const response = await privateApi.patch(`/rooms/${id}/approval`, {
      approvalStatus: status,
      remarks: reason,
    });
    return response.data;
  },

  updateListingStatus: async (
    id: string,
    status: RoomStatus.AVAILABLE | RoomStatus.RENTED | RoomStatus.ARCHIVED,
  ): Promise<{ data: Room }> => {
    const response = await privateApi.patch(`/rooms/${id}/listing`, {
      listingStatus: status,
    });
    return response.data;
  },
};
