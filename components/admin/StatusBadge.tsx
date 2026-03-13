import { RoomCategory, RoomStatus } from "@/types/room.types";
import {
  Archive,
  Badge,
  Bed,
  Building2,
  Car,
  CheckCircle,
  Clock,
  Home,
  Snowflake,
  Tv,
  Users,
  Utensils,
  Wifi,
  XCircle,
} from "lucide-react";

export const ApprovalStatusBadge = ({ status }: { status: RoomStatus }) => {
  switch (status) {
    case RoomStatus.APPROVED:
      return (
        <Badge className="bg-green-100 text-green-800 border-green-200 gap-1 cursor-default">
          <CheckCircle className="h-3 w-3" />
          Approved
        </Badge>
      );
    case RoomStatus.PENDING:
      return (
        <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 gap-1 cursor-default">
          <Clock className="h-3 w-3" />
          Pending
        </Badge>
      );
    case RoomStatus.REJECTED:
      return (
        <Badge className="bg-red-100 text-red-800 border-red-200 gap-1 cursor-default">
          <XCircle className="h-3 w-3" />
          Rejected
        </Badge>
      );
    default:
      return (
        <Badge className="bg-gray-50 text-gray-800 border-gray-200 gap-1 cursor-default">
          {status}
        </Badge>
      );
  }
};

export const ListingStatusBadge = ({ status }: { status: RoomStatus }) => {
  switch (status) {
    case RoomStatus.AVAILABLE:
      return (
        <Badge className="bg-green-100 text-green-800 border-green-200 gap-1 cursor-default">
          <CheckCircle className="h-3 w-3" />
          Available
        </Badge>
      );
    case RoomStatus.RENTED:
      return (
        <Badge className="bg-blue-100 text-blue-800 border-blue-200 gap-1 cursor-default">
          <Users className="h-3 w-3" />
          Rented
        </Badge>
      );
    case RoomStatus.ARCHIVED:
      return (
        <Badge className="bg-gray-100 text-gray-800 border-gray-200 gap-1 cursor-default">
          <Archive className="h-3 w-3" />
          Archived
        </Badge>
      );
    default:
      return <Badge>{status}</Badge>;
  }
};

export const getCategoryIcon = (category: RoomCategory) => {
  switch (category) {
    case RoomCategory.APARTMENT:
      return <Building2 className="h-4 w-4" />;
    case RoomCategory.SINGLE:
      return <Bed className="h-4 w-4" />;
    case RoomCategory.SHARED:
      return <Users className="h-4 w-4" />;
    case RoomCategory.HOUSE:
      return <Home className="h-4 w-4" />;
    default:
      return <Building2 className="h-4 w-4" />;
  }
};

export const getAmenityIcon = (amenity: string) => {
  switch (amenity.toLowerCase()) {
    case "wifi":
      return <Wifi className="h-3 w-3" />;
    case "ac":
      return <Snowflake className="h-3 w-3" />;
    case "parking":
      return <Car className="h-3 w-3" />;
    case "tv":
      return <Tv className="h-3 w-3" />;
    case "kitchen":
      return <Utensils className="h-3 w-3" />;
    default:
      return null;
  }
};
