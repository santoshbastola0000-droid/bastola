import { z } from "zod";
import { RoomRequestIntent, RoomRequestStatus } from "@/types/room-request.types";

export const createRoomRequestSchema = z.object({
  roomId: z.string().min(1, "Room is required"),
  ownerId: z.string().min(1, "Owner is required"),
  requestType: z.nativeEnum(RoomRequestIntent),
  message: z
    .string()
    .trim()
    .min(10, "Please add at least 10 characters")
    .max(500, "Message must be 500 characters or less"),
});

export const updateRoomRequestStatusSchema = z.object({
  status: z.nativeEnum(RoomRequestStatus),
});

export type CreateRoomRequestValues = z.infer<typeof createRoomRequestSchema>;
export type UpdateRoomRequestStatusValues = z.infer<
  typeof updateRoomRequestStatusSchema
>;
