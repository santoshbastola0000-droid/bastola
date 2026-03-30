import { z } from "zod";
import { RoomCategory } from "@/types/room.types";

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

export const lifestyleRulesSchema = z.object({
  smokingAllowed: z.boolean().default(false),
  alcoholAllowed: z.boolean().default(false),
  nonVegetarianAllowed: z.boolean().default(false),
  buffaloMeatAllowed: z.boolean().default(false),
  porkAllowed: z.boolean().default(false),
  lateNightAllowed: z.boolean().default(false),
  babyAllowed: z.boolean().default(false),
  otherRules: z.string().optional(),
});

export const foodPreferencesSchema = z.object({
  vegetarianAllowed: z.boolean().default(false),
  nonVegetarianAllowed: z.boolean().default(false),
  buffaloMeatAllowed: z.boolean().default(false),
  porkAllowed: z.boolean().default(false),
  allAllowed: z.boolean().default(false),
});
export const createRoomSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  category: z.nativeEnum(RoomCategory),
  price: z.coerce.number().min(1, "Price must be greater than 0"),
  address: z.string().min(5, "Address must be at least 5 characters"),
  amenities: z.array(z.string()).default([]),
  bathroomCapacity: z.coerce.number().min(1).max(10),
  floorNumber: z.coerce.number().min(0),
  ownerLivesInHouse: z.boolean().default(false),
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
  idealTenants: z.array(z.string()).default([]),
  genderPreference: z.string().optional(),
  lifestyleRules: lifestyleRulesSchema.default({}),
  gateClosingTime: z.string().optional(),
  foodPreferences: foodPreferencesSchema.default({}),
  restrictions: z.array(z.string()).default([]),
  ownerCommunity: z.string().optional(),
  allMixCommunity: z.boolean().default(false),
  communityWelcomeNote: z.string().optional(),
  ownerFloor: z.coerce.number().optional(),
  hasClothesDryingArea: z.boolean().default(false),
  getsSunlight: z.boolean().default(false),
  roomIssues: z.string().optional(),
  religionPreference: z.string().optional(),
});

export type CreateRoomFormValues = z.infer<typeof createRoomSchema>;
