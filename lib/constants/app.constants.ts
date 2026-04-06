export const STATUS_CODES = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  UNPROCESSABLE_ENTITY: 422,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
};

export const TOKENS = {
  AUTH_TOKEN_LABEL: "auth_token",
};

export const SUCCESSTOAST = "#4CAF50";

export const FAILURETOAST = "#F44336";

export const PAGE_SIZE_OPTIONS = [5, 10, 20, 50] as const;

export const sizeConstants = {
  email: {
    minLength: 1,
    message: "Email is required",
  },
};

export const GOOGLE_MAPS_URL = "https://maps.app.goo.gl/JLAQ5KnQBGMoSNa19";

export const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL!;

export type Step = "info" | "amount" | "payment" | "success";

export const MIN_TOPUP = 1500;

import {
  Wifi,
  Snowflake,
  Car,
  Tv,
  Utensils,
  Shield,
  Droplets,
  Home,
  MapPin,
  Bed,
  Heart,
  User,
  Image as ImageIcon,
} from "lucide-react";
import { TenantType, GenderPreference, RoomCategory } from "@/types/room.types";

export const DEFAULT_LAT = 27.7172;
export const DEFAULT_LNG = 85.324;

export const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "";

export const TABS = [
  { value: "basic", label: "Basic", labelNp: "आधारभूत", icon: Home },
  { value: "location", label: "Location", labelNp: "स्थान", icon: MapPin },
  { value: "details", label: "Details", labelNp: "विवरण", icon: Bed },
  { value: "amenities", label: "Amenities", labelNp: "सुविधा", icon: Wifi },
  {
    value: "preferences",
    label: "Preferences",
    labelNp: "प्राथमिकता",
    icon: Heart,
  },
  { value: "photos", label: "Photos", labelNp: "फोटो", icon: ImageIcon },
  { value: "contact", label: "Contact", labelNp: "सम्पर्क", icon: User },
];

export const AMENITIES_LIST = [
  { id: "wifi", label: "WiFi", icon: Wifi, description: "High-speed internet" },
  { id: "ac", label: "AC", icon: Snowflake, description: "Air conditioning" },
  {
    id: "parking",
    label: "Parking",
    icon: Car,
    description: "Vehicle parking",
  },
  { id: "tv", label: "TV", icon: Tv, description: "Cable TV" },
  {
    id: "modular-kitchen",
    label: "Modular Kitchen",
    icon: Utensils,
    description: "Modern kitchen",
  },
  {
    id: "kitchen",
    label: "Kitchen",
    icon: Utensils,
    description: "Shared kitchen",
  },
  {
    id: "security",
    label: "Security",
    icon: Shield,
    description: "24/7 security",
  },
  { id: "water", label: "पानी", icon: Droplets, description: "पानी सुविधा" },
  {
    id: "furnished",
    label: "Furnished",
    icon: Home,
    description: "Fully furnished",
  },
];

export const WATER_SUPPLY_OPTIONS = [
  { value: "24-hour", label: "२४ घण्टा", emoji: "💧" },
  { value: "morning-only", label: "बिहान मात्र", emoji: "🌅" },
  { value: "evening-only", label: "साँझ मात्र", emoji: "🌙" },
  { value: "morning-evening", label: "बिहान र साँझ", emoji: "☀️" },
  { value: "alternate-days", label: "एक दिन छाडी", emoji: "📅" },
  { value: "tanker", label: "ट्याङ्कर", emoji: "🚛" },
];

export const MORNING_SLOTS = [
  "५:०० - ७:०० बिहान",
  "६:०० - ८:०० बिहान",
  "७:०० - ९:०० बिहान",
  "८:०० - १०:०० बिहान",
];

export const EVENING_SLOTS = [
  "४:०० - ६:०० साँझ",
  "५:०० - ७:०० साँझ",
  "६:०० - ८:०० साँझ",
  "७:०० - ९:०० (राति)",
];

export const MORNING_SLOT_VALUES = [
  "05:00-07:00",
  "06:00-08:00",
  "07:00-09:00",
  "08:00-10:00",
];

export const EVENING_SLOT_VALUES = [
  "16:00-18:00",
  "17:00-19:00",
  "18:00-20:00",
  "19:00-21:00",
];

export const TENANT_TYPE_OPTIONS: {
  value: TenantType;
  labelEn: string;
  labelNp: string;
  emoji: string;
}[] = [
  {
    value: TenantType.STUDENT,
    labelEn: "Student",
    labelNp: "विद्यार्थी",
    emoji: "🎓",
  },
  {
    value: TenantType.WORKING_PROFESSIONAL,
    labelEn: "Working Professional",
    labelNp: "कामकाजी",
    emoji: "💼",
  },
  {
    value: TenantType.FAMILY,
    labelEn: "Family",
    labelNp: "परिवार",
    emoji: "👨‍👩‍👧",
  },
  {
    value: TenantType.SINGLE_PERSON,
    labelEn: "Single Person",
    labelNp: "एकल व्यक्ति",
    emoji: "🧑",
  },
  { value: TenantType.COUPLE, labelEn: "Couple", labelNp: "जोडी", emoji: "💑" },
  {
    value: TenantType.ANY,
    labelEn: "Any / जुनसुकै",
    labelNp: "जुनसुकै",
    emoji: "🤝",
  },
];

export const COMMUNITY_OPTIONS = [
  { value: "Hindu", labelEn: "Hindu", labelNp: "हिन्दू" },
  { value: "Muslim", labelEn: "Muslim", labelNp: "मुस्लिम" },
  { value: "Christian", labelEn: "Christian", labelNp: "क्रिस्चियन" },
  { value: "Buddhist", labelEn: "Buddhist", labelNp: "बौद्ध" },
  { value: "Any", labelEn: "Any Community", labelNp: "जुनसुकै" },
  { value: "Other", labelEn: "Other", labelNp: "अन्य" },
];

export const GENDER_PREFERENCE_OPTIONS = [
  {
    v: GenderPreference.MALE_ONLY,
    en: "Male Only",
    np: "पुरुष मात्र",
    emoji: "👨",
  },
  {
    v: GenderPreference.FEMALE_ONLY,
    en: "Female Only",
    np: "महिला मात्र",
    emoji: "👩",
  },
  {
    v: GenderPreference.NO_PREFERENCE,
    en: "No Preference",
    np: "जुनसुकै",
    emoji: "🤝",
  },
];
