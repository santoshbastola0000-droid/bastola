import { privateApi } from "@/http/api/privateApi";
import {
  Room,
  CreateRoomDTO,
  UpdateRoomDTO,
  RoomFilters,
  RoomsResponse,
  RoomStats,
  RoomStatus,
} from "@/types/room.types";
import { api } from "../api/api";

export const roomService = {
  // Get all rooms with pagination and filters
  getRooms: async (params: RoomFilters = {}): Promise<RoomsResponse> => {
    const response = await api.get("/rooms", { params });
    return response.data;
  },

  // Get pending rooms (using status filter)
  getPendingRooms: async (params: RoomFilters = {}): Promise<RoomsResponse> => {
    const response = await api.get("/rooms", {
      params: {
        ...params,
        status: "Pending", // Your enum value
      },
    });
    return response.data;
  },

  // Get approved rooms (using status filter)
  getApprovedRooms: async (
    params: RoomFilters = {},
  ): Promise<RoomsResponse> => {
    const response = await api.get("/rooms", {
      params: {
        ...params,
        status: "Approved", // Your enum value
      },
    });
    return response.data;
  },

  // Get single room by ID
  getRoomById: async (id: string): Promise<{ data: Room }> => {
    const response = await privateApi.get(`/rooms/${id}`);
    return response.data;
  },

  // Create new room
  createRoom: async (data: CreateRoomDTO): Promise<{ data: Room }> => {
    const response = await privateApi.post("/rooms", data);
    return response.data;
  },

  // Update room
  updateRoom: async (
    id: string,
    data: UpdateRoomDTO,
  ): Promise<{ data: Room }> => {
    const response = await privateApi.patch(`/rooms/${id}`, data);
    return response.data;
  },

  // Delete room
  deleteRoom: async (id: string): Promise<void> => {
    await privateApi.delete(`/rooms/${id}`);
  },

  // Get room statistics
  getRoomStats: async (): Promise<{ data: RoomStats }> => {
    const response = await privateApi.get("/rooms/stats");
    return response.data;
  },

  // Upload room images
  uploadImages: async (images: File[]): Promise<{ data: string[] }> => {
    const formData = new FormData();
    images.forEach((image) => {
      formData.append("images", image);
    });

    const response = await privateApi.post("/rooms/upload-images", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  updateRoomStatus: async (
    id: string,
    status: RoomStatus,
    reason?: string,
  ): Promise<{ data: Room }> => {
    const response = await privateApi.patch(`/rooms/${id}/status`, {
      status,
      reason,
    });
    return response.data;
  },
};
