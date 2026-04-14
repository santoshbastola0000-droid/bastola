import { Badge } from "@/components/ui/badge";
import { RoomStatus, TenantType } from "@/types/room.types";
import {
  Clock,
  CheckCircle,
  XCircle,
  Archive,
  Wifi,
  Snowflake,
  Car,
  Tv,
  Utensils,
  Shield,
  Home,
  Droplets,
  MapPin,
  Bed,
  Heart,
  ImageIcon,
  User,
  Wind,
} from "lucide-react";

export const getStatusBadge = (status: RoomStatus) => {
  const variants = {
    [RoomStatus.PENDING]: {
      icon: Clock,
      color: "bg-yellow-100 text-yellow-700 border-yellow-200",
      label: "Pending",
    },
    [RoomStatus.APPROVED]: {
      icon: CheckCircle,
      color: "bg-green-100 text-green-700 border-green-200",
      label: "Approved",
    },
    [RoomStatus.REJECTED]: {
      icon: XCircle,
      color: "bg-red-100 text-red-700 border-red-200",
      label: "Rejected",
    },
    [RoomStatus.ARCHIVED]: {
      icon: Archive,
      color: "bg-gray-100 text-gray-700 border-gray-200",
      label: "Archived",
    },
  };

  const variant =
    variants[RoomStatus.APPROVED] ||
    variants[RoomStatus.PENDING] ||
    variants[RoomStatus.REJECTED] ||
    variants[RoomStatus.ARCHIVED] ||
    variants[RoomStatus.PENDING];
  const Icon = variant.icon;

  return (
    <Badge
      className={`${variant.color} border-0 flex items-center gap-1 w-fit`}
    >
      <Icon className="h-3 w-3" />
      {variant.label}
    </Badge>
  );
};

export const getStatusOptions = () => {
  return [
    { value: RoomStatus.PENDING, label: "Pending" },
    { value: RoomStatus.APPROVED, label: "Approved" },
    { value: RoomStatus.REJECTED, label: "Rejected" },
    { value: RoomStatus.ARCHIVED, label: "Archived" },
  ];
};

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL!;

export const resolveImageUrl = (imagePath: string): string => {
  if (!imagePath) return "";
  if (imagePath.startsWith("http") || imagePath.startsWith("blob:"))
    return imagePath;
  return `${API_BASE_URL.replace(/\/$/, "")}/${imagePath.replace(/^\//, "")}`;
};

export const extractLocationName = (formattedAddress: string): string => {
  if (!formattedAddress) return "";
  const patterns = [
    /^([^,]+(?:चोक|टोल|गाउँ|बजार|मार्ग|रोड|Road|Chowk))/i,
    /^([^,]+)/,
  ];
  for (const pattern of patterns) {
    const match = formattedAddress.match(pattern);
    if (match?.[1]) return match[1].trim();
  }
  return formattedAddress.split(",")[0]?.trim() || "";
};

export const detectWaterType = (timings?: {
  morning?: string;
  evening?: string;
  notes?: string;
}): string => {
  if (!timings) return "morning-evening";
  const note = timings.notes || "";
  if (note.startsWith("TYPE:")) return note.replace("TYPE:", "");
  if (timings.morning === "00:00-24:00") return "24-hour";
  if (note.includes("ट्याङ्कर")) return "tanker";
  if (note.includes("एक दिन छाडी")) return "alternate-days";
  if (timings.morning && !timings.evening) return "morning-only";
  if (!timings.morning && timings.evening) return "evening-only";
  return "morning-evening";
};

/** Formats metres into a readable distance string */
export const formatDistance = (metres: number): string => {
  if (metres >= 1000) return `${(metres / 1000).toFixed(2)} km`;
  return `${metres} m`;
};

export const amenitiesList = [
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

export const morningSlots = [
  "५:०० - ७:०० बिहान",
  "६:०० - ८:०० बिहान",
  "७:०० - ९:०० बिहान",
  "८:०० - १०:०० बिहान",
];

export const eveningSlots = [
  "४:०० - ६:०० साँझ",
  "५:०० - ७:०० साँझ",
  "६:०० - ८:०० साँझ",
  "७:०० - ९:०० (राति)",
];

export const morningSlotValues = [
  "05:00-07:00",
  "06:00-08:00",
  "07:00-09:00",
  "08:00-10:00",
];

export const eveningSlotValues = [
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

export const TABS = [
  {
    value: "basic",
    label: "Basic",
    labelNp: "आधारभूत",
    icon: Home,
    required: true,
  },
  {
    value: "location",
    label: "Location",
    labelNp: "स्थान",
    icon: MapPin,
    required: true,
  },
  {
    value: "details",
    label: "Details",
    labelNp: "विवरण",
    icon: Bed,
    required: true,
  },
  {
    value: "amenities",
    label: "Amenities",
    labelNp: "सुविधा",
    icon: Wifi,
    required: true,
  },
  {
    value: "preferences",
    label: "Preferences",
    labelNp: "प्राथमिकता",
    icon: Heart,
    required: false,
  },
  {
    value: "photos",
    label: "Photos",
    labelNp: "फोटो",
    icon: ImageIcon,
    required: true,
  },
  {
    value: "contact",
    label: "Contact",
    labelNp: "सम्पर्क",
    icon: User,
    required: true,
  },
];

export const amenityIcons: Record<string, React.ElementType> = {
  wifi: Wifi,
  parking: Car,
  kitchen: Utensils,
  "air conditioning": Wind,
  ac: Wind,
  tv: Tv,
};

export const categoryConfig: Record<
  string,
  { label: string; labelNp: string; color: string; bg: string }
> = {
  Flat: { label: "Flat", labelNp: "फ्ल्याट", color: "#1e40af", bg: "#eff6ff" },
  Single: { label: "Single", labelNp: "एकल", color: "#065f46", bg: "#ecfdf5" },
  Apartment: {
    label: "Apartment",
    labelNp: "अपार्टमेनट",
    color: "#6b21a8",
    bg: "#faf5ff",
  },
  Shared: {
    label: "Shared",
    labelNp: "साझा",
    color: "#92400e",
    bg: "#fffbeb",
  },
  Double: {
    label: "Double",
    labelNp: "डबल",
    color: "#9f1239",
    bg: "#fff1f2",
  },
  House: { label: "House", labelNp: "घर", color: "#065f46", bg: "#f0fdf4" },
  "Attached Bathroom": {
    label: "Attached Bath",
    labelNp: "अट्याच्ड बाथ",
    color: "#0369a1",
    bg: "#f0f9ff",
  },
  Hostel: {
    label: "Hostel",
    labelNp: "होस्टेल",
    color: "#7c3aed",
    bg: "#f5f3ff",
  },
  Hotel: {
    label: "Hotel",
    labelNp: "होटेल",
    color: "#b45309",
    bg: "#fffbeb",
  },
  "Office Space": {
    label: "Office",
    labelNp: "अफिस",
    color: "#0f766e",
    bg: "#f0fdfa",
  },
  Shutter: {
    label: "Shutter",
    labelNp: "शटर",
    color: "#475569",
    bg: "#f8fafc",
  },
};
