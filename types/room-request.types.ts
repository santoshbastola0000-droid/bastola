import type { Room } from "./room.types";
import type { UserDetail } from "./user.types";

export enum RoomRequestStatus {
  PENDING = "PENDING",
  ACCEPTED = "ACCEPTED",
  REJECTED = "REJECTED",
  COMPLETED = "COMPLETED",
}

export enum RoomRequestIntent {
  REQUEST_VISIT = "REQUEST_VISIT",
  CONTACT_OWNER = "CONTACT_OWNER",
  BOOKING_INTEREST = "BOOKING_INTEREST",
}

export type RoomRequestDirection = "sent" | "received";

export interface RoomRequest {
  id: string;
  roomId: string;
  userId: string;
  ownerId: string;
  status: RoomRequestStatus;
  message: string;
  createdAt: string;
  updatedAt?: string;
  requestType?: RoomRequestIntent;
  room?: Pick<Room, "id" | "title" | "price" | "address" | "images">;
  requester?: Pick<UserDetail, "id" | "name" | "email" | "phone">;
  owner?: Pick<UserDetail, "id" | "name" | "email" | "phone">;
}

export interface RoomRequestFilters {
  page?: number;
  take?: number;
  roomId?: string;
  status?: RoomRequestStatus;
  direction?: RoomRequestDirection;
}

export interface CreateRoomRequestDTO {
  roomId: string;
  ownerId: string;
  message: string;
  requestType: RoomRequestIntent;
}

export interface UpdateRoomRequestStatusDTO {
  status: RoomRequestStatus;
}

export interface RoomRequestsResponse {
  data: RoomRequest[];
  pagination: {
    page: number;
    take: number;
    total: number;
    count: number;
    previousPage: number | null;
    nextPage: number | null;
  };
}
