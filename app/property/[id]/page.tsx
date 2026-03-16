"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Bath,
  Square,
  ArrowLeft,
  Check,
  Share2,
  Heart,
  Users,
  Home,
  Wifi,
  Car,
  Coffee,
  Tv,
  Utensils,
  Wind,
  Dumbbell,
  ChevronLeft,
  ChevronRight,
  Clock,
  Shield,
  Phone,
  X,
  Maximize2,
  Droplets,
  Building2,
  Instagram,
  AlertCircle,
  Navigation,
  ExternalLink,
  Landmark,
  Compass,
  LocateFixed,
  Map,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { NavBar } from "@/components/common/navbar";
import Footer from "@/components/common/footer";
import { formatPriceNPR, formatDate } from "@/lib/utils";
import { Room, RoomStatus } from "@/types/room.types";
import { api } from "@/http/api/api";
import { MapComponent } from "@/components/common/MapComponent";

// Amenity icons mapping
const amenityIcons: Record<string, any> = {
  wifi: Wifi,
  parking: Car,
  kitchen: Coffee,
  "air conditioning": Wind,
  ac: Wind,
  tv: Tv,
  gym: Dumbbell,
  "dining area": Utensils,
};

// Status badge component
const getStatusBadge = (status: RoomStatus) => {
  switch (status) {
    case "Approved":
      return (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200 gap-1 cursor-default">
          <Check className="h-3 w-3" />
          Available
        </Badge>
      );
    case "Pending":
      return (
        <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-200 gap-1 cursor-default">
          <Clock className="h-3 w-3" />
          Pending Approval
        </Badge>
      );
    case "Rejected":
      return (
        <Badge className="bg-red-100 text-red-800 hover:bg-red-100 border-red-200 gap-1 cursor-default">
          <AlertCircle className="h-3 w-3" />
          Not Available
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
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

  const getImageUrl = (imagePath: string) => {
    if (imagePath.startsWith("http")) {
      return imagePath;
    }
    const cleanImagePath = imagePath.replace(/^\//, "");
    const baseUrl = api.defaults.baseURL || "";
    return `${baseUrl}/${cleanImagePath}`;
  };

  if (!images || images.length === 0) {
    return (
      <div className="h-[400px] w-full bg-gray-100 rounded-2xl flex items-center justify-center">
        <div className="text-center">
          <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500">No images available</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="relative h-[400px] w-full group rounded-2xl overflow-hidden">
        {/* Main Image */}
        <div className="relative h-full w-full">
          <img
            src={getImageUrl(images[currentIndex])}
            alt={`${title} - Image ${currentIndex + 1}`}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = "/placeholder-image.jpg";
            }}
          />
        </div>

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={goToPrevious}
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={goToNext}
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          </>
        )}

        {/* Image Counter */}
        <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-sm">
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
            {images.slice(0, 5).map((image, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`relative w-12 h-12 rounded-md overflow-hidden transition-all ${
                  index === currentIndex
                    ? "ring-2 ring-red-500 scale-110"
                    : "opacity-70 hover:opacity-100"
                }`}
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

      {/* Fullscreen Dialog */}
      <Dialog open={showFullscreen} onOpenChange={setShowFullscreen}>
        <DialogContent className="max-w-5xl w-[95vw] h-[90vh] p-0">
          <DialogTitle className="sr-only">Room Images</DialogTitle>
          <div className="relative h-full w-full bg-black">
            <img
              src={getImageUrl(images[currentIndex])}
              alt={`${title} - Fullscreen ${currentIndex + 1}`}
              className="w-full h-full object-contain"
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

export default function PropertyDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [showAllAmenities, setShowAllAmenities] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [guests, setGuests] = useState(1);

  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const res = await fetch(`${api.defaults.baseURL}/rooms/${id}`);
        const data = await res.json();
        setRoom(data.data || data);
      } catch (err) {
        console.error("Error fetching room:", err);
        toast.error("Failed to load property details");
      } finally {
        setLoading(false);
      }
    };
    fetchRoom();
  }, [id]);

  const handleShare = async () => {
    if (!room) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: room.title,
          text: `Check out this amazing property: ${room.title}`,
          url: window.location.href,
        });
      } catch (err) {
        if (err instanceof Error && err.name !== "AbortError") {
          copyToClipboard();
        }
      }
    } else {
      copyToClipboard();
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied to clipboard!", {
      icon: "🔗",
      duration: 3000,
    });
  };

  const handleWhatsApp = () => {
    if (!room) return;

    const phoneNumber = "977976-9493954";
    const message =
      `Hello! I'm interested in your property: ${room.title}\n\n` +
      `📍 Location: ${room.location?.formattedAddress || room.address}\n` +
      `💰 Price: रू ${formatPriceNPR(room.price)}/month\n` +
      `👥 Guests: ${guests}\n` +
      `📅 Check-in: ${selectedDate || "Flexible"}\n\n` +
      `Can you provide more details?`;

    const whatsappUrl = `https://wa.me/${phoneNumber.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");

    toast.success("Opening WhatsApp...", {
      description: "You can now chat with the host directly.",
      duration: 3000,
    });
  };

  const handleContact = () => {
    if (room?.contactPhone) {
      window.location.href = `tel:${room.contactPhone}`;
    } else {
      toast.info("Contact feature coming soon!", {
        description: "You'll be able to message hosts directly.",
        duration: 3000,
      });
    }
  };

  const openDirections = () => {
    if (room?.location?.latitude && room?.location?.longitude) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${room.location.latitude},${room.location.longitude}`;
      window.open(url, "_blank");
    }
  };

  if (loading) {
    return (
      <>
        <NavBar />
        <div className="min-h-screen bg-slate-50 pt-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="animate-pulse space-y-8">
              <div className="h-8 bg-slate-200 rounded w-1/4" />
              <div className="h-[400px] bg-slate-200 rounded-2xl" />
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-4">
                  <div className="h-6 bg-slate-200 rounded w-3/4" />
                  <div className="h-4 bg-slate-200 rounded w-1/2" />
                  <div className="h-32 bg-slate-200 rounded" />
                </div>
                <div className="h-64 bg-slate-200 rounded" />
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (!room) {
    return (
      <>
        <NavBar />
        <div className="min-h-screen bg-slate-50 pt-24 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-4">
            <div className="w-24 h-24 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-6">
              <Home className="w-12 h-12 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              Property Not Found
            </h2>
            <p className="text-slate-500 mb-8">
              The property you're looking for doesn't exist or may have been
              removed.
            </p>
            <Link href="/rooms">
              <Button className="rounded-full px-8 bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Listings
              </Button>
            </Link>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  const mainAmenities = room.amenities?.slice(0, 6) || [];
  const additionalAmenities = room.amenities?.slice(6) || [];

  // Safely access location properties
  const location = room.location;
  const hasValidCoordinates = !!(location?.latitude && location?.longitude);
  const latitude = hasValidCoordinates ? Number(location.latitude) : null;
  const longitude = hasValidCoordinates ? Number(location.longitude) : null;

  // Format price in NPR
  const formattedPrice = formatPriceNPR(room.price);
  const priceNumber = room.price;
  const totalPrice = priceNumber + 200;

  return (
    <>
      <NavBar />
      <div className="min-h-screen bg-slate-50 pt-24 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Navigation Bar */}
          <div className="flex items-center justify-between mb-6">
            <Link
              href="/rooms"
              className="inline-flex items-center gap-2 text-slate-500 hover:text-red-500 text-sm font-medium transition-colors group"
            >
              <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center group-hover:bg-red-50 transition-colors">
                <ArrowLeft className="w-4 h-4" />
              </div>
              <span>Back to listings</span>
            </Link>

            <div className="flex items-center gap-2">
              {/* Status Badge */}
              {getStatusBadge(room.approvalStatus)}

              {/* Share Button */}
              <Button
                variant="outline"
                size="icon"
                onClick={handleShare}
                className="rounded-full w-10 h-10 border-slate-200 hover:bg-red-50 hover:border-red-200 transition-all"
              >
                <Share2 className="w-4 h-4 text-slate-600" />
              </Button>

              {/* Like Button */}
              <Button
                variant="outline"
                size="icon"
                onClick={() => setLiked(!liked)}
                className={`rounded-full w-10 h-10 border-slate-200 transition-all ${
                  liked
                    ? "bg-red-50 border-red-200"
                    : "hover:bg-red-50 hover:border-red-200"
                }`}
              >
                <Heart
                  className={`w-4 h-4 transition-all ${
                    liked
                      ? "fill-red-500 text-red-500 scale-110"
                      : "text-slate-600"
                  }`}
                />
              </Button>
            </div>
          </div>

          {/* Image Carousel */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10"
          >
            <ImageCarousel images={room.images || []} title={room.title} />
          </motion.div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
            {/* Left Column - Main Info */}
            <div className="lg:col-span-2 space-y-8">
              {/* Title and Rating */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <Badge className="mb-3 bg-red-50 text-red-600 border-0 font-semibold px-3 py-1 capitalize">
                      {room.category}
                    </Badge>
                    <h1 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
                      {room.title}
                    </h1>
                    <div className="flex items-center gap-4 mt-3">
                      <div className="flex items-center gap-1 text-slate-500">
                        <MapPin className="w-4 h-4 text-red-400" />
                        <span className="text-sm">
                          {location?.city || "Pokhara"},{" "}
                          {location?.state || "Gandaki"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Host Info */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="flex items-center gap-4 p-4 bg-white rounded-xl border border-slate-100"
              >
                <Avatar className="h-14 w-14 ring-2 ring-red-100">
                  <AvatarFallback className="bg-red-50 text-red-600">
                    {room.user?.name?.charAt(0) || "H"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-sm text-slate-500">Hosted by</p>
                  <p className="font-semibold text-slate-900">
                    {room.user?.name || "Property Owner"}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Shield className="w-3 h-3 text-green-500" />
                    <span className="text-xs text-slate-500">
                      {room.user?.isVerified ? "Verified host" : "New host"}
                    </span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                  onClick={handleContact}
                >
                  <Phone className="w-4 h-4 mr-2" />
                  Call
                </Button>
              </motion.div>

              {/* Quick Stats */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="grid grid-cols-3 gap-4 p-6 bg-white rounded-2xl border border-slate-100"
              >
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-2">
                    <Users className="w-5 h-5 text-red-500" />
                  </div>
                  <p className="text-lg font-semibold text-slate-900">
                    {room.roomCapacity}
                  </p>
                  <p className="text-xs text-slate-500">Guests</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-2">
                    <Bath className="w-5 h-5 text-red-500" />
                  </div>
                  <p className="text-lg font-semibold text-slate-900">
                    {room.bathroomCapacity}
                  </p>
                  <p className="text-xs text-slate-500">Bathrooms</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-2">
                    <Square className="w-5 h-5 text-red-500" />
                  </div>
                  <p className="text-lg font-semibold text-slate-900">
                    {room.roomArea} m²
                  </p>
                  <p className="text-xs text-slate-500">Area</p>
                </div>
              </motion.div>

              {/* Description */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
              >
                <h3 className="text-xl font-semibold text-slate-900 mb-3">
                  About this property
                </h3>
                <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">
                  {room.description}
                </p>
              </motion.div>

              {/* Amenities */}
              {room.amenities && room.amenities.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <h3 className="text-xl font-semibold text-slate-900 mb-4">
                    Amenities
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {mainAmenities.map((amenity: string) => {
                      const Icon = amenityIcons[amenity.toLowerCase()] || Check;
                      return (
                        <div
                          key={amenity}
                          className="flex items-center gap-2.5 p-3 rounded-xl bg-white border border-slate-100 hover:border-red-200 transition-colors group"
                        >
                          <Icon className="w-4 h-4 text-red-500 group-hover:scale-110 transition-transform" />
                          <span className="text-sm text-slate-700 capitalize">
                            {amenity}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {additionalAmenities.length > 0 && (
                    <button
                      onClick={() => setShowAllAmenities(true)}
                      className="mt-4 text-sm text-red-500 hover:text-red-600 font-medium inline-flex items-center gap-1"
                    >
                      View all {room.amenities.length} amenities
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                </motion.div>
              )}

              {/* Water Supply Info */}
              {room.waterSupplyTimings && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                  className="bg-white rounded-2xl border border-slate-100 p-6"
                >
                  <h3 className="text-xl font-semibold text-slate-900 mb-4 flex items-center gap-2">
                    <Droplets className="w-5 h-5 text-blue-500" />
                    Water Supply
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <p className="text-sm text-slate-500">Morning</p>
                      <p className="font-medium">
                        {room.waterSupplyTimings.morning}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-slate-500">Evening</p>
                      <p className="font-medium">
                        {room.waterSupplyTimings.evening}
                      </p>
                    </div>
                  </div>
                  {room.waterSupplyTimings.notes && (
                    <p className="text-sm text-slate-500 mt-3 pt-3 border-t">
                      Note: {room.waterSupplyTimings.notes}
                    </p>
                  )}
                </motion.div>
              )}

              {/* Location Map with enhanced design */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white rounded-2xl border border-slate-100 p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-red-500" />
                    Location
                  </h3>
                  {hasValidCoordinates && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={openDirections}
                      className="rounded-full gap-2 border-red-200 hover:bg-red-50 hover:text-red-600 transition-all group"
                    >
                      <Navigation className="w-4 h-4 group-hover:scale-110 transition-transform" />
                      <span>Directions</span>
                    </Button>
                  )}
                </div>

                {hasValidCoordinates ? (
                  <div className="space-y-4">
                    <div className="h-[350px] w-full rounded-xl overflow-hidden border-2 border-slate-100 shadow-lg relative group">
                      <MapComponent
                        latitude={latitude!}
                        longitude={longitude!}
                        popupText={room.title}
                      />

                      {/* Map overlay with location info */}
                      <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-lg border border-slate-200 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center">
                            <Compass className="w-4 h-4 text-red-500" />
                          </div>
                          <div>
                            <p className="text-xs font-medium text-slate-900">
                              Exact Location
                            </p>
                            <p className="text-xs text-slate-500">
                              {location?.formattedAddress
                                ? location.formattedAddress.length > 50
                                  ? `${location.formattedAddress.slice(0, 50)}...`
                                  : location.formattedAddress
                                : room.address.length > 50
                                  ? `${room.address.slice(0, 50)}...`
                                  : room.address}
                            </p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            const url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
                            window.open(url, "_blank");
                          }}
                          className="rounded-full gap-1 text-xs"
                        >
                          <LocateFixed className="w-3 h-3" />
                          <span>Larger Map</span>
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-slate-500 bg-slate-50 p-3 rounded-lg">
                      <MapPin className="w-4 h-4 text-red-400 shrink-0" />
                      <span>{location?.formattedAddress || room.address}</span>
                    </div>
                  </div>
                ) : (
                  <div className="relative h-64 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-3">
                          <MapPin className="w-8 h-8 text-red-400" />
                        </div>
                        <p className="text-sm font-medium text-slate-700 mb-1">
                          {location?.formattedAddress || room.address}
                        </p>
                        <p className="text-xs text-slate-400">
                          Exact location provided after booking
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </div>

            {/* Right Column - Booking Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="lg:col-span-1"
            >
              <div className="sticky top-28 space-y-6">
                {/* Price Card */}
                <Card className="rounded-2xl border-slate-100 shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-baseline justify-between mb-6">
                      <div>
                        <span className="text-3xl font-bold text-slate-900 flex items-center gap-1">
                          <Landmark className="w-5 h-5 text-red-500" />
                          {formattedPrice}
                        </span>
                        <span className="text-slate-500 text-sm">/month</span>
                      </div>
                      <Badge className="bg-green-50 text-green-600 border-0">
                        Available
                      </Badge>
                    </div>

                    {/* Quick Info */}
                    <div className="space-y-3 mb-6">
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-600">
                          Room capacity: {room.roomCapacity} persons
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Home className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-600">
                          House capacity: {room.totalHouseCapacity} persons
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-600">
                          Listed {formatDate(room.createdAt)}
                        </span>
                      </div>
                    </div>

                    {/* Booking Form */}
                    <div className="space-y-4">
                      {/* WhatsApp Button instead of Book Now */}
                      <Button
                        className="w-full rounded-xl py-6 bg-green-600 hover:bg-green-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all group"
                        onClick={handleWhatsApp}
                      >
                        <svg
                          className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path d="M19.077 4.928C17.191 3.041 14.683 2 12.006 2 6.798 2 2.528 6.17 2.527 11.26c0 1.695.444 3.355 1.291 4.815L2 22l5.995-1.788c1.44.79 3.064 1.206 4.722 1.207h.005c5.195 0 9.476-4.17 9.477-9.26 0-2.476-.966-4.804-2.842-6.69l.005-.002-.003.001zm-7.066 14.252h-.003c-1.44 0-2.853-.384-4.07-1.106l-.293-.172-3.465 1.035.936-3.333-.19-.295c-.762-1.186-1.164-2.56-1.163-3.976.002-4.063 3.346-7.368 7.47-7.368 2.0 0 3.876.776 5.288 2.185 1.412 1.409 2.188 3.279 2.187 5.28-.002 4.065-3.337 7.367-7.447 7.367zm4.088-5.523c-.225-.113-1.327-.648-1.532-.723-.206-.074-.355-.113-.504.113-.149.226-.578.723-.708.87-.13.148-.26.165-.484.055-.224-.11-.948-.347-1.806-1.106-.668-.59-1.12-1.32-1.25-1.543-.13-.223-.014-.343.097-.453.1-.1.223-.26.335-.39.111-.13.148-.223.223-.37.074-.148.037-.28-.019-.392-.055-.113-.504-1.205-.69-1.65-.18-.435-.36-.38-.493-.38-.13 0-.282-.018-.434-.018-.15 0-.394.056-.6.28-.205.222-.783.76-.783 1.855 0 1.094.8 2.152.912 2.302.112.15 1.538 2.395 3.794 3.26 2.256.866 2.256.578 2.664.542.407-.037 1.316-.534 1.502-1.05.186-.517.186-.96.13-1.05-.055-.093-.204-.15-.428-.264z" />
                        </svg>
                        Contact on WhatsApp
                      </Button>

                      <p className="text-xs text-slate-400 text-center">
                        Chat directly with the host on WhatsApp
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Info Card */}
                <Card className="rounded-2xl border-slate-100">
                  <CardContent className="p-6">
                    <h4 className="text-sm font-semibold text-slate-900 mb-4">
                      Property Details
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Property Type</span>
                        <span className="font-medium text-slate-900 capitalize">
                          {room.category}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Floor Number</span>
                        <span className="font-medium text-slate-900">
                          {room.floorNumber}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Owner Lives Here</span>
                        <span className="font-medium text-emerald-600">
                          {room.ownerLivesInHouse ? "Yes" : "No"}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Women Allowed</span>
                        <span className="font-medium text-emerald-600">
                          {room.allowsWomen ? "Yes" : "No"}
                        </span>
                      </div>
                    </div>

                    {room.contactPhone && (
                      <>
                        <Separator className="my-4" />
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                            <Phone className="w-4 h-4 text-red-500" />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs text-slate-500">Call host</p>
                            <a
                              href={`tel:${room.contactPhone}`}
                              className="text-sm font-medium text-slate-900 hover:text-red-600 transition-colors"
                            >
                              {room.contactPhone}
                            </a>
                          </div>
                        </div>
                      </>
                    )}

                    {room.tiktokUrl && (
                      <>
                        <Separator className="my-4" />
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center">
                            <Instagram className="w-4 h-4 text-white" />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs text-slate-500">
                              TikTok Profile
                            </p>
                            <a
                              href={room.tiktokUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm font-medium text-slate-900 hover:text-blue-600 transition-colors flex items-center gap-1"
                            >
                              View Profile
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* Safety Badge */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 flex items-start gap-3 border border-green-100">
                  <Shield className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-green-700 mb-1">
                      Book with confidence
                    </p>
                    <p className="text-xs text-green-600">
                      This property is verified by our team. Your payment is
                      protected by our secure platform.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* All Amenities Modal */}
      <AnimatePresence>
        {showAllAmenities && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowAllAmenities(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white border-b border-slate-100 p-6 flex items-center justify-between">
                <h3 className="text-xl font-semibold text-slate-900">
                  All Amenities
                </h3>
                <button
                  onClick={() => setShowAllAmenities(false)}
                  className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  {room.amenities?.map((amenity: string) => {
                    const Icon = amenityIcons[amenity.toLowerCase()] || Check;
                    return (
                      <div key={amenity} className="flex items-center gap-3">
                        <Icon className="w-5 h-5 text-red-500" />
                        <span className="text-sm text-slate-700 capitalize">
                          {amenity}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
    </>
  );
}
