import type { Room } from "@/types/room.types";

type RoomGuardOptions = {
  requireNumericPrice?: boolean;
};

export function isObjectRecord(
  value: unknown,
): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isRoomLike(
  value: unknown,
  options: RoomGuardOptions = {},
): value is Room {
  // Arrays are object-like at runtime, but a room payload must be a plain object.
  if (!isObjectRecord(value)) {
    return false;
  }

  const candidate = value as Partial<Room>;
  const hasCoreFields =
    typeof candidate.id === "string" && typeof candidate.title === "string";

  if (!hasCoreFields) return false;
  if (!options.requireNumericPrice) return true;

  return (
    typeof candidate.price === "number" && Number.isFinite(candidate.price)
  );
}
