import type { CircleDollarSign as CircleDollarSignIcon } from "lucide-react";
import type { roomService as RoomServiceType } from "@/http/services/room.service";

declare global {
  const roomService: typeof RoomServiceType;
  const CircleDollarSign: typeof CircleDollarSignIcon;
}

export {};
