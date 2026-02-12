import { z } from "zod";
import { RoomCategory } from "@/types/room.types";

// Water Supply Timings Schema
export const waterSupplyTimingsSchema = z.object({
  morning: z.string().min(1, "Morning timing is required"),
  evening: z.string().min(1, "Evening timing is required"),
  notes: z.string().optional(),
});

// Location Schema
export const locationSchema = z.object({
  name: z.string().min(1, "Location name is required"),
  latitude: z.number(),
  longitude: z.number(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  postalCode: z.string().optional(),
  formattedAddress: z.string().optional(),
});

// Contact Information Schema
export const contactInfoSchema = z.object({
  contactPerson: z.string().optional(),
  contactPhone: z.string().optional(),
  contactEmail: z
    .string()
    .email("Invalid email address")
    .optional()
    .or(z.literal("")),
  contactWhatsapp: z.string().optional(),
});

// Main Room Schema
export const roomSchema = z.object({
  // Basic Information
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  category: z.nativeEnum(RoomCategory),
  price: z.coerce.number().min(1, "Price must be greater than 0"),
  address: z.string().min(5, "Address must be at least 5 characters"),

  // Amenities
  amenities: z.array(z.string()).default([]),

  // Capacity & Facilities
  bathroomCapacity: z.coerce.number().min(1).max(10),
  floorNumber: z.coerce.number().min(0),
  ownerLivesInHouse: z.boolean().default(false),
  totalHouseCapacity: z.coerce.number().min(1),
  allowsWomen: z.boolean().default(true),
  roomCapacity: z.coerce.number().min(1),
  roomArea: z.coerce.number().min(1, "Room area must be greater than 0"),

  // Contact Information
  contactPerson: z.string().optional(),
  contactPhone: z.string().optional(),
  contactEmail: z
    .string()
    .email("Invalid email address")
    .optional()
    .or(z.literal("")),
  contactWhatsapp: z.string().optional(),

  // Water Supply
  waterSupplyTimings: waterSupplyTimingsSchema,

  // Location
  location: locationSchema,
});

export type RoomFormValues = z.infer<typeof roomSchema>;

export const defaultRoomValues: RoomFormValues = {
  title: "",
  description: "",
  category: RoomCategory.STUDIO,
  price: 500,
  address: "",
  amenities: ["WiFi", "AC", "Parking"],
  bathroomCapacity: 1,
  floorNumber: 0,
  ownerLivesInHouse: false,
  totalHouseCapacity: 4,
  allowsWomen: true,
  roomCapacity: 2,
  roomArea: 30,
  contactPerson: "",
  contactPhone: "",
  contactEmail: "",
  contactWhatsapp: "",
  waterSupplyTimings: {
    morning: "06:00-08:00",
    evening: "17:00-19:00",
    notes: "",
  },
  location: {
    name: "",
    latitude: 27.7172,
    longitude: 85.324,
    city: "",
    state: "",
    country: "",
    postalCode: "",
    formattedAddress: "",
  },
};
