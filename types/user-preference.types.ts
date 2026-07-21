import type { RoomCategory } from "./room.types";

export interface UserPreference {
  userId: string;
  preferredCity?: string | null;
  preferredArea?: string | null;
  budget?: number | null;
  roomType?: RoomCategory | null;
  facilities: string[];
  instantAlertsEnabled?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface UpsertUserPreferenceDTO {
  preferredCity?: string;
  preferredArea?: string;
  budget?: number | null;
  roomType?: RoomCategory | null;
  facilities: string[];
  instantAlertsEnabled?: boolean;
}
