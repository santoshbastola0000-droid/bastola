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
    const response = await privateApi.get("/rooms", { params });
    return response.data;
  },

  // Get public rooms (approved and available)
  getPublicRooms: async (params: RoomFilters = {}): Promise<RoomsResponse> => {
    const response = await api.get("/rooms/public", { params });
    return response.data;
  },

  // Get user's own rooms
  getMyRooms: async (params: RoomFilters = {}): Promise<RoomsResponse> => {
    const response = await privateApi.get("/rooms/my-rooms", { params });
    return response.data;
  },

  // Get pending rooms (admin only)
  getPendingRooms: async (params: RoomFilters = {}): Promise<RoomsResponse> => {
    const response = await privateApi.get("/rooms/pending", {
      params: { ...params, approvalStatus: RoomStatus.PENDING },
    });
    return response.data;
  },

  // Get room stats (admin only)
  getRoomStats: async (): Promise<{ data: RoomStats }> => {
    const response = await privateApi.get("/rooms/stats");
    return response.data;
  },

  // Get single room by ID
  getRoomById: async (id: string): Promise<{ data: Room }> => {
    const response = await privateApi.get(`/rooms/${id}`);
    return response.data;
  },

  // Create new room
  createRoom: async (data: FormData): Promise<{ data: Room }> => {
    const response = await privateApi.post("/rooms", data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
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

  // Delete room (archive)
  deleteRoom: async (id: string): Promise<void> => {
    await privateApi.delete(`/rooms/${id}`);
  },

  // Update approval status (admin only)
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

  // Update listing status (admin only)
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
