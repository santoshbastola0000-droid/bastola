import { z } from "zod";
import { RoomCategory } from "@/types/room.types";

export const userPreferenceSchema = z.object({
  preferredCity: z.string().trim().max(100, "City is too long").optional(),
  preferredArea: z.string().trim().max(120, "Area is too long").optional(),
  budget: z
    .union([z.number().min(0, "Budget must be positive"), z.null()])
    .optional(),
  roomType: z.nativeEnum(RoomCategory).nullable().optional(),
  facilities: z.array(z.string()).default([]),
  instantAlertsEnabled: z.boolean().default(true),
});

export type UserPreferenceValues = z.infer<typeof userPreferenceSchema>;
