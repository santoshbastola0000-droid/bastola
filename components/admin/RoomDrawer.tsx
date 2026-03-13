"use client";

import { useState } from "react";
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
  ChevronLeft,
  ChevronRight,
  Instagram,
  Globe,
  Maximize2,
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
import { formatPrice, formatDate } from "@/lib/utils";
import { Room, RoomStatus } from "@/types/room.types";
import Link from "next/link";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogHeader,
} from "@/components/ui/dialog";

// Add dynamic import for map to avoid SSR issues
const MapComponent = dynamic(() => import("@/components/ui/map"), {
  ssr: false,
  loading: () => (
    <div className="h-[200px] w-full bg-gray-100 animate-pulse rounded-lg flex items-center justify-center">
      <Globe className="h-8 w-8 text-gray-400" />
    </div>
  ),
});

import dynamic from "next/dynamic";

// Get the base URL from environment variable
// axios instance cannot be added directly to the image url
const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "";

interface RoomDrawerProps {
  room: Room;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const getStatusBadge = (status: RoomStatus) => {
  switch (status) {
    case RoomStatus.APPROVED:
      return (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200 gap-1 cursor-default">
          <CheckCircle className="h-3 w-3" />
          Approved
        </Badge>
      );
    case RoomStatus.PENDING:
      return (
        <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-200 gap-1 cursor-default">
          <Clock className="h-3 w-3" />
          Pending Approval
        </Badge>
      );
    case RoomStatus.ARCHIVED:
      return (
        <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200 gap-1 cursor-default">
          <Users className="h-3 w-3" />
          Archived
        </Badge>
      );
    case RoomStatus.REJECTED:
      return (
        <Badge className="bg-red-100 text-red-800 hover:bg-red-100 border-red-200 gap-1 cursor-default">
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

// Image Carousel Component
interface ImageCarouselProps {
  images: string[];
  title: string;
}

const ImageCarousel = ({ images, title }: ImageCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showFullscreen, setShowFullscreen] = useState(false);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

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

  if (!images || images.length === 0) {
    return (
      <div className="h-[300px] w-full bg-gray-100 rounded-lg flex items-center justify-center">
        <Building2 className="h-16 w-16 text-gray-400" />
        <p className="text-gray-500 mt-2">No images available</p>
      </div>
    );
  }

  return (
    <>
      <div className="relative h-[300px] w-full group">
        {/* Main Image */}
        <div className="relative h-full w-full rounded-lg overflow-hidden">
          <img
            src={getImageUrl(images[currentIndex])}
            alt={`${title} - Image ${currentIndex + 1}`}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback to placeholder on error
              const target = e.target as HTMLImageElement;
              target.src = "/placeholder-image.jpg";
            }}
          />
        </div>

        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={goToPrevious}
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={goToNext}
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          </>
        )}

        {/* Image Counter */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
          {currentIndex + 1} / {images.length}
        </div>

        {/* Fullscreen Button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => setShowFullscreen(true)}
        >
          <Maximize2 className="h-4 w-4" />
        </Button>

        {/* Thumbnail Strip */}
        {images.length > 1 && (
          <div className="absolute -bottom-16 left-0 right-0 flex justify-center gap-2 p-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg">
            {images.map((image, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`relative w-12 h-12 rounded-md overflow-hidden transition-all ${
                  index === currentIndex
                    ? "ring-2 ring-primary scale-110"
                    : "opacity-70 hover:opacity-100"
                }`}
              >
                <Image
                  src={getImageUrl(image)}
                  alt={`Thumbnail ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="48px"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Fullscreen Dialog */}
      <Dialog open={showFullscreen} onOpenChange={setShowFullscreen}>
        <DialogContent className="max-w-5xl w-[95vw] h-[90vh]">
          <DialogHeader>
            <DialogTitle className="sr-only">Room Images</DialogTitle>
          </DialogHeader>
          <div className="relative h-full w-full">
            <img
              src={getImageUrl(images[currentIndex])}
              alt={`${title} - Fullscreen ${currentIndex + 1}`}
              className="object-contain"
              sizes="(max-width: 1280px) 100vw, 1200px"
            />
            {images.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full"
                  onClick={goToPrevious}
                >
                  <ChevronLeft className="h-8 w-8" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full"
                  onClick={goToNext}
                >
                  <ChevronRight className="h-8 w-8" />
                </Button>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-4 py-2 rounded-full text-sm">
                  {currentIndex + 1} / {images.length}
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export function RoomDrawer({ room, open, onOpenChange }: RoomDrawerProps) {
  // Ensure latitude and longitude are numbers
  const latitude = room.location?.latitude
    ? Number(room.location.latitude)
    : null;
  const longitude = room.location?.longitude
    ? Number(room.location.longitude)
    : null;
  const hasValidCoordinates =
    latitude && longitude && !isNaN(latitude) && !isNaN(longitude);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <div className="overflow-y-auto">
          <DrawerHeader className="border-b sticky top-0 bg-white z-10">
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
              <div className="flex gap-2 justify-center items-center">
                {getStatusBadge(room.approvalStatus)}
                {getStatusBadge(room.listingStatus)}
              </div>
            </div>
          </DrawerHeader>

          <div className="p-6 space-y-6">
            {/* Image Carousel */}
            {room.images && room.images.length > 0 && (
              <div className="mb-8 pb-4">
                <ImageCarousel images={room.images} title={room.title} />
              </div>
            )}

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

            {/* TikTok Link */}
            {room.tiktokUrl && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-black rounded-lg">
                        <Instagram className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">TikTok Profile</p>
                        <a
                          href={room.tiktokUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-blue-600 hover:underline flex items-center gap-1"
                        >
                          {room.tiktokUrl.replace(
                            /^https?:\/\/(www\.)?tiktok\.com\/@?/,
                            "@",
                          )}
                          <Globe className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Details */}
              <div className="lg:col-span-2 space-y-6">
                {/* Description */}
                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-3">
                      Description
                    </h3>
                    <p className="text-gray-600 whitespace-pre-wrap">
                      {room.description}
                    </p>
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

                {/* Location Map */}
                {hasValidCoordinates && (
                  <Card>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Location on Map
                      </h3>
                      <div className="h-[300px] w-full rounded-lg overflow-hidden">
                        <MapComponent
                          latitude={latitude}
                          longitude={longitude}
                          popupText={room.title}
                        />
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
                      {room.contactWhatsapp && (
                        <div>
                          <p className="text-sm text-gray-500">WhatsApp</p>
                          <a
                            href={`https://wa.me/${room.contactWhatsapp.replace(/\D/g, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-green-600 hover:underline flex items-center gap-2"
                          >
                            <Phone className="h-4 w-4" />
                            {room.contactWhatsapp}
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
                        {room.location.formattedAddress && (
                          <div>
                            <p className="text-sm text-gray-500">Address</p>
                            <p className="font-medium text-sm">
                              {room.location.formattedAddress}
                            </p>
                          </div>
                        )}
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
                        {room.location.postalCode && (
                          <div>
                            <p className="text-sm text-gray-500">Postal Code</p>
                            <p className="font-medium">
                              {room.location.postalCode}
                            </p>
                          </div>
                        )}
                        {hasValidCoordinates && (
                          <div>
                            <p className="text-sm text-gray-500">Coordinates</p>
                            <p className="font-mono text-xs">
                              {latitude.toFixed(6)}, {longitude.toFixed(6)}
                            </p>
                          </div>
                        )}
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
