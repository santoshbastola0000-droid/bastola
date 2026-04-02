"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Building2,
  MapPin,
  Users,
  Bath,
  Bed,
  IndianRupee,
  Calendar,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  Home,
  Ruler,
} from "lucide-react";
import { Room, RoomStatus } from "@/types/room.types";
import { formatNepaliCurrency, formatDate } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface RoomCardProps {
  room: Room;
  onViewDetails: (room: Room) => void;
}

export function RoomCard({ room, onViewDetails }: RoomCardProps) {
  const getStatusBadge = () => {
    switch (room.approvalStatus) {
      case RoomStatus.PENDING:
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
            <Clock className="h-3 w-3 mr-1" />
            Pending Review
          </Badge>
        );
      case RoomStatus.APPROVED:
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        );
      case RoomStatus.REJECTED:
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return null;
    }
  };

  const getListingStatusBadge = () => {
    switch (room.listingStatus) {
      case RoomStatus.AVAILABLE:
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            Available
          </Badge>
        );
      case RoomStatus.RENTED:
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-200">
            Rented
          </Badge>
        );
      case RoomStatus.ARCHIVED:
        return (
          <Badge className="bg-gray-100 text-gray-800 border-gray-200">
            Archived
          </Badge>
        );
      default:
        return null;
    }
  };

  const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "";

  const router = useRouter();

  // Construct the full image URL
  const getImageUrl = (imagePath: string) => {
    if (imagePath.startsWith("http")) {
      return imagePath;
    }
    // Remove any leading slash from imagePath and ensure API_BASE_URL doesn't have trailing slash
    const cleanImagePath = imagePath.replace(/^\//, "");
    const baseUrl = API_BASE_URL.replace(/\/$/, "");

    return `${baseUrl}/${cleanImagePath}`;
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow border border-gray-200">
      <div className="relative h-48 w-full bg-gray-100">
        {room.images && room.images.length > 0 ? (
          <img
            src={getImageUrl(room.images[0])}
            alt={room.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10">
            <Building2 className="h-16 w-16 text-primary/30" />
          </div>
        )}
        <div className="absolute top-3 right-3 flex flex-col gap-2">
          {getStatusBadge()}
          {room.approvalStatus === RoomStatus.APPROVED &&
            getListingStatusBadge()}
        </div>
      </div>

      <CardContent className="p-4">
        <div className="mb-3">
          <h3 className="font-semibold text-lg text-gray-900 line-clamp-1 mb-1">
            {room.title}
          </h3>
          <p className="text-sm text-gray-600 flex items-start gap-1">
            <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
            <span className="line-clamp-2">{room.address}</span>
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <div className="p-1.5 bg-primary/10 rounded-lg">
              <IndianRupee className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Price</p>
              <p className="font-semibold text-primary">
                ₹{formatNepaliCurrency(room.price)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <div className="p-1.5 bg-blue-50 rounded-lg">
              <Home className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Category</p>
              <p className="font-medium text-gray-700 capitalize">
                {room.category.replace("_", " ")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <div className="p-1.5 bg-purple-50 rounded-lg">
              <Users className="h-4 w-4 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Capacity</p>
              <p className="font-medium text-gray-700">
                {room.roomCapacity} persons
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <div className="p-1.5 bg-orange-50 rounded-lg">
              <Ruler className="h-4 w-4 text-orange-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Area</p>
              <p className="font-medium text-gray-700">{room.roomArea} m²</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <div className="p-1.5 bg-green-50 rounded-lg">
              <Bed className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Floor</p>
              <p className="font-medium text-gray-700">{room.floorNumber}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <div className="p-1.5 bg-pink-50 rounded-lg">
              <Bath className="h-4 w-4 text-pink-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Bathroom</p>
              <p className="font-medium text-gray-700">
                {room.bathroomCapacity}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Calendar className="h-3 w-3" />
            <span>Listed: {formatDate(room.createdAt)}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewDetails(room)}
            className="border-primary text-primary hover:bg-primary hover:text-white"
          >
            <Eye className="h-4 w-4 mr-1" />
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
