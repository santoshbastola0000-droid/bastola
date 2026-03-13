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
