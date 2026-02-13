"use client";

import React from "react";
import {
  Building2,
  MapPin,
  Users,
  Bath,
  Bed,
  DollarSign,
  Phone,
  Mail,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Wifi,
  Car,
  Snowflake,
  Tv,
  Utensils,
  Home,
  Droplets,
  Square,
  User,
} from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatPrice, formatDate } from "@/lib/utils";
import { Room, RoomStatus } from "@/types/room.types";
import Link from "next/link";

interface RoomDrawerProps {
  room: Room;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const getStatusBadge = (status: RoomStatus) => {
  switch (status) {
    case RoomStatus.AVAILABLE:
      return (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200 gap-1">
          <CheckCircle className="h-3 w-3" />
          Available
        </Badge>
      );
    case RoomStatus.PENDING:
      return (
        <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-200 gap-1">
          <Clock className="h-3 w-3" />
          Pending Approval
        </Badge>
      );
    case RoomStatus.OCCUPIED:
      return (
        <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200 gap-1">
          <Users className="h-3 w-3" />
          Occupied
        </Badge>
      );
    case RoomStatus.RENTED:
      return (
        <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100 border-purple-200 gap-1">
          <CheckCircle className="h-3 w-3" />
          Rented
        </Badge>
      );
    case RoomStatus.REJECTED:
      return (
        <Badge className="bg-red-100 text-red-800 hover:bg-red-100 border-red-200 gap-1">
          <XCircle className="h-3 w-3" />
          Rejected
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

const getAmenityIcon = (amenity: string) => {
  switch (amenity.toLowerCase()) {
    case "wifi":
      return <Wifi className="h-4 w-4" />;
    case "ac":
      return <Snowflake className="h-4 w-4" />;
    case "parking":
      return <Car className="h-4 w-4" />;
    case "tv":
      return <Tv className="h-4 w-4" />;
    case "kitchen":
      return <Utensils className="h-4 w-4" />;
    default:
      return <Home className="h-4 w-4" />;
  }
};

export function RoomDrawer({ room, open, onOpenChange }: RoomDrawerProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <div className="overflow-y-auto">
          <DrawerHeader className="border-b">
            <div className="flex items-start justify-between">
              <div>
                <DrawerTitle className="text-xl flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  {room.title}
                </DrawerTitle>
                <DrawerDescription className="mt-1">
                  {room.category.replace("_", " ")} • {room.address}
                </DrawerDescription>
              </div>
              {getStatusBadge(room.status)}
            </div>
          </DrawerHeader>

          <div className="p-6 space-y-6">
            {/* Price & Quick Info */}
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-primary" />
                      <span className="text-2xl font-bold text-gray-900">
                        {formatPrice(room.price)}
                      </span>
                      <span className="text-gray-500">/month</span>
                    </div>
                    <p className="text-sm text-gray-500">
                      Listed by {room.user?.name || "Unknown"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/admin/dashboard/rooms/${room.id}/edit`}>
                        Edit Room
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Details */}
              <div className="lg:col-span-2 space-y-6">
                {/* Description */}
                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-3">
                      Description
                    </h3>
                    <p className="text-gray-600">{room.description}</p>
                  </CardContent>
                </Card>

                {/* Room Specifications */}
                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-4">
                      Room Specifications
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-50 rounded-lg">
                            <Square className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Room Area</p>
                            <p className="font-semibold">{room.roomArea} m²</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-purple-50 rounded-lg">
                            <Users className="h-5 w-5 text-purple-600" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">
                              Room Capacity
                            </p>
                            <p className="font-semibold">
                              {room.roomCapacity} persons
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-green-50 rounded-lg">
                            <Bed className="h-5 w-5 text-green-600" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">
                              Floor Number
                            </p>
                            <p className="font-semibold">{room.floorNumber}</p>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-red-50 rounded-lg">
                            <Bath className="h-5 w-5 text-red-600" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">
                              Bathroom Capacity
                            </p>
                            <p className="font-semibold">
                              {room.bathroomCapacity} shared
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-yellow-50 rounded-lg">
                            <Home className="h-5 w-5 text-yellow-600" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">
                              House Capacity
                            </p>
                            <p className="font-semibold">
                              {room.totalHouseCapacity} persons
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-pink-50 rounded-lg">
                            <User className="h-5 w-5 text-pink-600" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">
                              Owner Lives Here
                            </p>
                            <p className="font-semibold">
                              {room.ownerLivesInHouse ? "Yes" : "No"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Water Supply Timings */}
                    {room.waterSupplyTimings && (
                      <div className="mt-6 pt-4 border-t">
                        <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                          <Droplets className="h-4 w-4" />
                          Water Supply Timings
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <p className="text-sm text-gray-500">Morning</p>
                            <p className="font-medium">
                              {room.waterSupplyTimings.morning}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm text-gray-500">Evening</p>
                            <p className="font-medium">
                              {room.waterSupplyTimings.evening}
                            </p>
                          </div>
                        </div>
                        {room.waterSupplyTimings.notes && (
                          <p className="text-sm text-gray-500 mt-2">
                            Note: {room.waterSupplyTimings.notes}
                          </p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Amenities */}
                {room.amenities && room.amenities.length > 0 && (
                  <Card>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-gray-900 mb-4">
                        Amenities
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {room.amenities.map((amenity) => (
                          <div
                            key={amenity}
                            className="flex items-center gap-2 p-3 border rounded-lg hover:border-primary transition-colors"
                          >
                            {getAmenityIcon(amenity)}
                            <span className="text-sm">{amenity}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Right Column - Contact & Info */}
              <div className="space-y-6">
                {/* Contact Information */}
                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Contact Information
                    </h3>
                    <div className="space-y-4">
                      {room.contactPerson && (
                        <div>
                          <p className="text-sm text-gray-500">
                            Contact Person
                          </p>
                          <p className="font-medium">{room.contactPerson}</p>
                        </div>
                      )}
                      {room.contactPhone && (
                        <div>
                          <p className="text-sm text-gray-500">Phone Number</p>
                          <a
                            href={`tel:${room.contactPhone}`}
                            className="font-medium text-blue-600 hover:underline flex items-center gap-2"
                          >
                            <Phone className="h-4 w-4" />
                            {room.contactPhone}
                          </a>
                        </div>
                      )}
                      {room.contactEmail && (
                        <div>
                          <p className="text-sm text-gray-500">Email Address</p>
                          <a
                            href={`mailto:${room.contactEmail}`}
                            className="font-medium text-blue-600 hover:underline flex items-center gap-2"
                          >
                            <Mail className="h-4 w-4" />
                            {room.contactEmail}
                          </a>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Rules & Restrictions */}
                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-4">Rules</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">
                          Women Allowed
                        </span>
                        <Badge
                          variant={room.allowsWomen ? "default" : "outline"}
                          className={
                            room.allowsWomen
                              ? "bg-green-100 text-green-800"
                              : ""
                          }
                        >
                          {room.allowsWomen ? "Yes" : "No"}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">
                          Current Occupants
                        </span>
                        <span className="font-medium">
                          {room.currentOccupants} / {room.roomCapacity}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">
                          Rented Rooms
                        </span>
                        <span className="font-medium">
                          {room.rentedRoomsCount}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Location Info */}
                {room.location && (
                  <Card>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Location Details
                      </h3>
                      <div className="space-y-3">
                        {room.location.city && (
                          <div>
                            <p className="text-sm text-gray-500">City</p>
                            <p className="font-medium">{room.location.city}</p>
                          </div>
                        )}
                        {room.location.state && (
                          <div>
                            <p className="text-sm text-gray-500">State</p>
                            <p className="font-medium">{room.location.state}</p>
                          </div>
                        )}
                        {room.location.country && (
                          <div>
                            <p className="text-sm text-gray-500">Country</p>
                            <p className="font-medium">
                              {room.location.country}
                            </p>
                          </div>
                        )}
                        <div>
                          <p className="text-sm text-gray-500">Coordinates</p>
                          <p className="font-mono text-xs">
                            {room.location.latitude.toFixed(6)},{" "}
                            {room.location.longitude.toFixed(6)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Additional Info */}
                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Additional Information
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Created</span>
                        <span>{formatDate(room.createdAt)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Category</span>
                        <Badge variant="outline" className="capitalize">
                          {room.category.replace("_", " ")}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Listing ID</span>
                        <span className="font-mono">{room.id.slice(0, 8)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
