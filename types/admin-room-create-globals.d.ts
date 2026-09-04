import type { CircleDollarSign as CircleDollarSignIcon } from "lucide-react";
import type { roomService as RoomServiceType } from "@/http/services/room.service";
import type { Button as ButtonComponent } from "@/components/ui/button";

declare global {
  const roomService: typeof RoomServiceType;
  const CircleDollarSign: typeof CircleDollarSignIcon;
  const Button: typeof ButtonComponent;
}

export {};
