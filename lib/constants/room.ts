import { RoomCategory } from "@/types/room.types";

export const DEFAULT_AMENITIES = [
  "WiFi",
  "AC",
  "Parking",
  "TV",
  "Kitchen",
  "Laundry",
  "Hot Water",
  "Security",
  "Furnished",
  "Balcony",
  "Gym",
  "Swimming Pool",
  "Elevator",
  "Pet Friendly",
  "Study Room",
  "Garden",
] as const;

export const ROOM_CATEGORIES = [
  { value: RoomCategory.STUDIO, label: "Studio" },
  { value: RoomCategory.ONE_BEDROOM, label: "One Bedroom" },
  { value: RoomCategory.TWO_BEDROOM, label: "Two Bedroom" },
  { value: RoomCategory.THREE_BEDROOM, label: "Three Bedroom" },
  { value: RoomCategory.FOUR_BEDROOM, label: "Four Bedroom" },
  { value: RoomCategory.DORMITORY, label: "Dormitory" },
  { value: RoomCategory.PG, label: "Paying Guest (PG)" },
] as const;

export const BATHROOM_CAPACITY_OPTIONS = [
  { value: 1, label: "1 person" },
  { value: 2, label: "2 people" },
  { value: 3, label: "3 people" },
  { value: 4, label: "4 people" },
  { value: 5, label: "5+ people" },
] as const;

export const INITIAL_LOCATION = {
  lat: 27.7172,
  lng: 85.324,
};
