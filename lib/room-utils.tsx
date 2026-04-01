import { Badge } from "@/components/ui/badge";
import { RoomStatus } from "@/types/room.types";
import { Clock, CheckCircle, XCircle, Archive } from "lucide-react";

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
