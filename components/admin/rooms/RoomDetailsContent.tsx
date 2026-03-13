"use client";

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
  Instagram,
  Globe,
  IndianRupee,
  AlertCircle,
  MessageCircle,
  Archive,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatNepaliCurrency, formatDate } from "@/lib/utils";
import { Room, RoomStatus } from "@/types/room.types";
import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface RoomDetailsContentProps {
  room: Room;
}

const getStatusBadge = (status: RoomStatus) => {
  switch (status) {
    case RoomStatus.APPROVED:
      return (
        <Badge className="bg-green-100 text-green-800 border-green-200">
          <CheckCircle className="h-3 w-3 mr-1" />
          Approved
        </Badge>
      );
    case RoomStatus.PENDING:
      return (
        <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
          <Clock className="h-3 w-3 mr-1" />
          Pending
        </Badge>
      );
    case RoomStatus.REJECTED:
      return (
        <Badge className="bg-red-100 text-red-800 border-red-200">
          <XCircle className="h-3 w-3 mr-1" />
          Rejected
        </Badge>
      );
    case RoomStatus.AVAILABLE:
      return (
        <Badge className="bg-green-100 text-green-800 border-green-200">
          <CheckCircle className="h-3 w-3 mr-1" />
          Available
        </Badge>
      );
    case RoomStatus.RENTED:
      return (
        <Badge className="bg-blue-100 text-blue-800 border-blue-200">
          <Users className="h-3 w-3 mr-1" />
          Rented
        </Badge>
      );
    case RoomStatus.ARCHIVED:
      return (
        <Badge className="bg-gray-100 text-gray-800 border-gray-200">
          <Archive className="h-3 w-3 mr-1" />
          Archived
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

export function RoomDetailsContent({ room }: RoomDetailsContentProps) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [activeTab, setActiveTab] = useState("details");

  const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "";

  const getImageUrl = (imagePath: string) => {
    if (imagePath.startsWith("http")) return imagePath;
    const cleanPath = imagePath.replace(/^\//, "");
    const baseUrl = API_BASE_URL.replace(/\/$/, "");
    return `${baseUrl}/${cleanPath}`;
  };

  return (
    <div className="space-y-6">
      {/* Image Gallery */}
      {room.images && room.images.length > 0 && (
        <div className="space-y-3">
          <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
            <img
              src={getImageUrl(room.images[selectedImage])}
              alt={room.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/placeholder-room.jpg";
              }}
            />
          </div>
          {room.images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {room.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={cn(
                    "relative aspect-video rounded-lg overflow-hidden border-2 transition-all",
                    selectedImage === index
                      ? "border-primary"
                      : "border-transparent hover:border-primary/50",
                  )}
                >
                  <img
                    src={getImageUrl(image)}
                    alt={`Thumbnail ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Title and Status */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
        <div>
          <h2 className="text-xl md:text-2xl font-bold">{room.title}</h2>
          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
            <MapPin className="h-3 w-3" />
            {room.address}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge(room.approvalStatus)}
          {getStatusBadge(room.listingStatus)}
        </div>
      </div>

      {/* Price Card */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Monthly Price</p>
              <p className="text-2xl font-bold text-primary flex items-center gap-1">
                <IndianRupee className="h-5 w-5" />
                {formatNepaliCurrency(room.price)}
              </p>
            </div>
            {room.category && (
              <Badge variant="outline" className="capitalize">
                {room.category.replace("_", " ")}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs for different sections */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="amenities">Amenities</TabsTrigger>
          <TabsTrigger value="contact">Contact</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-4 mt-4">
          {/* Description */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {room.description}
              </p>
            </CardContent>
          </Card>

          {/* Specifications */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3">Specifications</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Capacity</p>
                    <p className="text-sm font-medium">
                      {room.roomCapacity} persons
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Bath className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Bathroom</p>
                    <p className="text-sm font-medium">
                      {room.bathroomCapacity} shared
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Bed className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Floor</p>
                    <p className="text-sm font-medium">{room.floorNumber}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Square className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Area</p>
                    <p className="text-sm font-medium">{room.roomArea} m²</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Water Supply */}
          {room.waterSupplyTimings && (
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Droplets className="h-4 w-4" />
                  Water Supply
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Morning:</span>
                    <span className="font-medium">
                      {room.waterSupplyTimings.morning}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Evening:</span>
                    <span className="font-medium">
                      {room.waterSupplyTimings.evening}
                    </span>
                  </div>
                  {room.waterSupplyTimings.notes && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Note: {room.waterSupplyTimings.notes}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="amenities" className="mt-4">
          <Card>
            <CardContent className="p-4">
              {room.amenities && room.amenities.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {room.amenities.map((amenity) => (
                    <div
                      key={amenity}
                      className="flex items-center gap-2 p-2 border rounded-lg"
                    >
                      {amenity === "wifi" && <Wifi className="h-4 w-4" />}
                      {amenity === "ac" && <Snowflake className="h-4 w-4" />}
                      {amenity === "parking" && <Car className="h-4 w-4" />}
                      {amenity === "tv" && <Tv className="h-4 w-4" />}
                      {amenity === "kitchen" && (
                        <Utensils className="h-4 w-4" />
                      )}
                      <span className="text-sm capitalize">{amenity}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No amenities listed
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contact" className="space-y-4 mt-4">
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3">Contact Information</h3>
              <div className="space-y-3">
                {room.contactPerson && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{room.contactPerson}</span>
                  </div>
                )}
                {room.contactPhone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a
                      href={`tel:${room.contactPhone}`}
                      className="text-sm text-primary hover:underline"
                    >
                      {room.contactPhone}
                    </a>
                  </div>
                )}
                {room.contactWhatsapp && (
                  <div className="flex items-center gap-2">
                    <MessageCircle className="h-4 w-4 text-muted-foreground" />
                    <a
                      href={`https://wa.me/${room.contactWhatsapp.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-green-600 hover:underline"
                    >
                      {room.contactWhatsapp}
                    </a>
                  </div>
                )}
                {room.contactEmail && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a
                      href={`mailto:${room.contactEmail}`}
                      className="text-sm text-primary hover:underline"
                    >
                      {room.contactEmail}
                    </a>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Owner Info */}
          {room.user && (
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-3">Owner Information</h3>
                <div className="space-y-2">
                  <p className="text-sm">
                    <span className="text-muted-foreground">Name:</span>{" "}
                    <span className="font-medium">{room.user.name}</span>
                  </p>
                  <p className="text-sm">
                    <span className="text-muted-foreground">Email:</span>{" "}
                    <span className="font-medium">{room.user.email}</span>
                  </p>
                  <p className="text-sm">
                    <span className="text-muted-foreground">Phone:</span>{" "}
                    <span className="font-medium">{room.user.phoneNumber}</span>
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* TikTok */}
          {room.tiktokUrl && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Instagram className="h-4 w-4" />
                    <span className="text-sm">TikTok Profile</span>
                  </div>
                  <a
                    href={room.tiktokUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline flex items-center gap-1"
                  >
                    View <Globe className="h-3 w-3" />
                  </a>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Additional Info */}
      <Card>
        <CardContent className="p-4">
          <h3 className="font-semibold mb-3">Additional Information</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-muted-foreground">Created</p>
              <p className="font-medium">{formatDate(room.createdAt)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Last Updated</p>
              <p className="font-medium">{formatDate(room.updatedAt)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Room ID</p>
              <p className="font-mono text-xs">{room.id.slice(0, 8)}...</p>
            </div>
            <div>
              <p className="text-muted-foreground">Women Allowed</p>
              <p className="font-medium">{room.allowsWomen ? "Yes" : "No"}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
