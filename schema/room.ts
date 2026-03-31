import { z } from "zod";
import { RoomCategory, TenantType, GenderPreference } from "@/types/room.types";

export const waterSupplyTimingsSchema = z.object({
  morning: z.string().min(1, "Morning timing is required"),
  evening: z.string().min(1, "Evening timing is required"),
  notes: z.string().optional(),
});

export const locationSchema = z.object({
  name: z.string().min(1, "Location name is required"),
  formattedAddress: z.string().optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  postalCode: z.string().optional(),
});

export const createRoomSchema = z.object({
  // ── Existing required fields ───────────────────────────────────────────────
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  category: z.nativeEnum(RoomCategory),
  price: z.coerce.number().min(1, "Price must be greater than 0"),
  address: z.string().min(5, "Address must be at least 5 characters"),
  amenities: z.array(z.string()).default([]),
  bathroomCapacity: z.coerce.number().min(1).max(10),
  floorNumber: z.coerce.number().min(0),
  ownerLivesInHouse: z.boolean().default(false),
  ownerFloorNumber: z.coerce.number().min(0).nullable().optional(),
  totalHouseCapacity: z.coerce.number().min(1),
  rentedRoomsCount: z.coerce.number().min(0).default(0),
  currentOccupants: z.coerce.number().min(0).default(0),
  waterSupplyTimings: waterSupplyTimingsSchema,
  allowsWomen: z.boolean().default(true),
  roomCapacity: z.coerce.number().min(1),
  roomArea: z.coerce.number().min(1),
  contactPerson: z.string().optional(),
  contactPhone: z.string().optional(),
  contactEmail: z.string().email().optional().or(z.literal("")),
  contactWhatsapp: z.string().optional(),
  location: locationSchema,
  tiktokUrl: z
    .string()
    .url("Please provide a valid TikTok URL")
    .optional()
    .or(z.literal("")),

  // ── New optional tenant preference fields ──────────────────────────────────
  tenantTypes: z.array(z.nativeEnum(TenantType)).optional().default([]),
  genderPreference: z.nativeEnum(GenderPreference).optional(),
  smokingAllowed: z.boolean().nullable().optional(),
  alcoholAllowed: z.boolean().nullable().optional(),
  nonVegAllowed: z.boolean().nullable().optional(),
  buffaloMeatAllowed: z.boolean().nullable().optional(),
  porkAllowed: z.boolean().nullable().optional(),
  lateNightAllowed: z.boolean().nullable().optional(),
  babyAllowed: z.boolean().nullable().optional(),
  otherRules: z.string().optional(),
  gateClosingTime: z.string().optional(),
  hasClothDryingArea: z.boolean().nullable().optional(),
  hasSunlight: z.boolean().nullable().optional(),
  existingProblems: z.string().optional(),
  ownerCommunity: z.string().optional(),
  communityPreference: z.string().optional(),

  // ── Nearby Distance (metres) — optional ───────────────────────────────────
  /** Distance from nearest highway / राजमार्गबाट दूरी (metres) */
  distanceHighwayM: z.coerce.number().int().min(0).nullable().optional(),
});

export type CreateRoomFormValues = z.infer<typeof createRoomSchema>;
