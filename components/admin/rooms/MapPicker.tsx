"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  MapPin,
  LocateFixed,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Search,
  Navigation,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";

// Fix for default Leaflet icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Custom red theme marker icons
const createSelectedMarkerIcon = () => {
  return L.divIcon({
    html: `<div class="relative">
      <div class="w-8 h-8 bg-[#E11D48] rounded-full border-2 border-white shadow-lg flex items-center justify-center">
        <div class="w-2 h-2 bg-white rounded-full"></div>
      </div>
      <div class="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-[#E11D48]"></div>
    </div>`,
    className: "bg-transparent border-none",
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

const createCurrentLocationMarkerIcon = () => {
  return L.divIcon({
    html: `<div class="relative">
      <div class="w-6 h-6 bg-[#2563EB] rounded-full border-3 border-white shadow-lg flex items-center justify-center animate-pulse">
        <div class="w-2 h-2 bg-white rounded-full"></div>
      </div>
      <div class="absolute -inset-2 bg-[#2563EB]/20 rounded-full animate-ping"></div>
    </div>`,
    className: "bg-transparent border-none",
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });
};

// Dynamically import Leaflet components to avoid SSR issues
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false },
);

const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false },
);

const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false },
);

const Popup = dynamic(() => import("react-leaflet").then((mod) => mod.Popup), {
  ssr: false,
});

const MapEvents = dynamic(
  () => import("react-leaflet").then((mod) => mod.useMapEvents),
  { ssr: false },
);

const MapController = dynamic(
  () =>
    import("react-leaflet").then((mod) => {
      const Component = ({ center }: { center: [number, number] }) => {
        const map = mod.useMap();

        useEffect(() => {
          if (map) {
            map.flyTo(center, 15, {
              duration: 1.5,
              easeLinearity: 0.25,
            });
          }
        }, [center, map]);

        return null;
      };
      return Component;
    }),
  { ssr: false },
);

interface Location {
  lat: number;
  lng: number;
  name?: string;
  formattedAddress?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
}

interface MapPickerProps {
  onLocationSelect: (location: Location) => void;
  initialLocation?: Location | null;
}

// Location Marker Component
const LocationMarker = dynamic(
  () =>
    import("react-leaflet").then((mod) => {
      const Component = ({
        position,
        setPosition,
        onLocationSelect,
      }: {
        position: Location | null;
        setPosition: (pos: Location) => void;
        onLocationSelect: (location: Location) => void;
      }) => {
        const map = mod.useMapEvents({
          click: async (e) => {
            const { lat, lng } = e.latlng;
            const newPos = { lat, lng };
            setPosition(newPos);

            try {
              const address = await reverseGeocode(lat, lng);
              onLocationSelect({
                ...newPos,
                ...address,
              });
            } catch (error) {
              onLocationSelect(newPos);
            }
          },
        });

        if (!position) return null;

        return (
          <Marker
            position={[position.lat, position.lng]}
            icon={createSelectedMarkerIcon()}
          >
            <Popup>
              <div className="p-2 min-w-[200px]">
                <p className="font-medium text-sm text-[#E11D48]">
                  Selected Location
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  {position.name || "Location selected"}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {position.lat.toFixed(6)}, {position.lng.toFixed(6)}
                </p>
              </div>
            </Popup>
          </Marker>
        );
      };
      return Component;
    }),
  { ssr: false },
);

// Current Location Marker Component
const CurrentLocationMarker = dynamic(
  () =>
    import("react-leaflet").then((mod) => {
      const Component = ({ position }: { position: Location | null }) => {
        if (!position) return null;

        return (
          <Marker
            position={[position.lat, position.lng]}
            icon={createCurrentLocationMarkerIcon()}
          >
            <Popup>
              <div className="p-2">
                <p className="font-medium text-sm text-blue-600 flex items-center gap-1">
                  <LocateFixed className="h-3 w-3" />
                  Your Current Location
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  {position.lat.toFixed(6)}, {position.lng.toFixed(6)}
                </p>
              </div>
            </Popup>
          </Marker>
        );
      };
      return Component;
    }),
  { ssr: false },
);

// Reverse geocoding function
async function reverseGeocode(lat: number, lng: number) {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
    );
    const data = await response.json();

    return {
      formattedAddress: data.display_name,
      name:
        data.name ||
        data.address?.road ||
        data.display_name?.split(",")[0] ||
        "Selected Location",
      city: data.address?.city || data.address?.town || data.address?.village,
      state: data.address?.state,
      country: data.address?.country,
      postalCode: data.address?.postcode,
    };
  } catch (error) {
    console.error("Reverse geocoding failed:", error);
    return {
      formattedAddress: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
      name: "Selected Location",
    };
  }
}

// Search location function
async function searchLocation(query: string) {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`,
    );
    return await response.json();
  } catch (error) {
    console.error("Location search failed:", error);
    return [];
  }
}

export default function MapPicker({
  onLocationSelect,
  initialLocation,
}: MapPickerProps) {
  const [position, setPosition] = useState<Location | null>(
    initialLocation || null,
  );
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [mapKey, setMapKey] = useState(0);
  const searchTimeout = useRef<NodeJS.Timeout>();
  const [isMounted, setIsMounted] = useState(false);

  // Handle client-side mounting
  useEffect(() => {
    setIsMounted(true);
    setIsLoading(false);
  }, []);

  // Get user's current location
  const getCurrentLocation = useCallback(() => {
    setIsGettingLocation(true);
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      setIsGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const newPos = { lat: latitude, lng: longitude };

        setCurrentLocation(newPos);
        setPosition(newPos);

        // Reverse geocode the current location
        const address = await reverseGeocode(latitude, longitude);
        const locationData = {
          ...newPos,
          ...address,
        };

        setPosition(locationData);
        onLocationSelect(locationData);
        setIsGettingLocation(false);
        setMapKey((prev) => prev + 1);
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError(
              "Please allow location access to use this feature",
            );
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError("Location information is unavailable");
            break;
          case error.TIMEOUT:
            setLocationError("Location request timed out");
            break;
          default:
            setLocationError("An unknown error occurred");
        }
        setIsGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    );
  }, [onLocationSelect]);

  // Try to get current location when component mounts
  useEffect(() => {
    if (isMounted) {
      getCurrentLocation();
    }
  }, [isMounted, getCurrentLocation]);

  // Handle search input
  const handleSearch = async (query: string) => {
    setSearchQuery(query);

    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    if (query.length < 3) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    searchTimeout.current = setTimeout(async () => {
      setIsSearching(true);
      const results = await searchLocation(query);
      setSearchResults(results);
      setShowSearchResults(true);
      setIsSearching(false);
    }, 500);
  };

  // Handle location selection from search
  const handleSearchSelect = async (result: any) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);

    const newPos = { lat, lng };
    setPosition(newPos);

    const address = await reverseGeocode(lat, lng);
    const locationData = {
      ...newPos,
      ...address,
      name: result.display_name.split(",")[0],
      formattedAddress: result.display_name,
    };

    onLocationSelect(locationData);
    setShowSearchResults(false);
    setSearchQuery(result.display_name.split(",")[0]);
    setMapKey((prev) => prev + 1);
  };

  if (!isMounted || isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-[400px] w-full rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Location Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <Input
                placeholder="Search for a location..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-9"
                onFocus={() =>
                  searchResults.length > 0 && setShowSearchResults(true)
                }
              />

              {/* Search Results Dropdown */}
              <AnimatePresence>
                {showSearchResults && searchResults.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute z-50 mt-1 w-full bg-white rounded-lg border shadow-lg max-h-60 overflow-y-auto"
                  >
                    {isSearching ? (
                      <div className="p-4 text-center text-gray-500">
                        <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
                        <p className="text-sm">Searching...</p>
                      </div>
                    ) : (
                      searchResults.map((result, index) => (
                        <button
                          key={index}
                          type="button"
                          className="w-full px-4 py-2 text-left hover:bg-[#E11D48]/5 transition-colors flex items-start gap-2"
                          onClick={() => handleSearchSelect(result)}
                        >
                          <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-gray-500" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {result.display_name.split(",")[0]}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {result.display_name}
                            </p>
                          </div>
                        </button>
                      ))
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={getCurrentLocation}
                disabled={isGettingLocation}
                className="relative border-[#E11D48]/20 hover:bg-[#E11D48]/5 hover:text-[#E11D48]"
              >
                {isGettingLocation ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <LocateFixed className="h-4 w-4" />
                )}
                <span className="ml-2 hidden sm:inline">
                  {isGettingLocation
                    ? "Getting Location..."
                    : "Current Location"}
                </span>
              </Button>
            </div>
          </div>

          {/* Location Error Alert */}
          <AnimatePresence>
            {locationError && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3"
              >
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{locationError}</AlertDescription>
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Map */}
      <Card className="overflow-hidden border-2 hover:border-[#E11D48]/20 transition-colors">
        <div className="relative h-[450px] w-full">
          <MapContainer
            key={mapKey}
            center={
              position ? [position.lat, position.lng] : [20.5937, 78.9629]
            }
            zoom={position ? 15 : 5}
            className="h-full w-full"
            scrollWheelZoom={true}
            zoomControl={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Map Controls */}
            <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="bg-white shadow-md hover:bg-gray-50"
                onClick={() => {
                  if (position) {
                    setMapKey((prev) => prev + 1);
                  }
                }}
              >
                <Navigation className="h-4 w-4" />
              </Button>
            </div>

            {position && (
              <MapController center={[position.lat, position.lng]} />
            )}

            <LocationMarker
              position={position}
              setPosition={setPosition}
              onLocationSelect={onLocationSelect}
            />

            {currentLocation && (
              <CurrentLocationMarker position={currentLocation} />
            )}
          </MapContainer>

          {/* Map Overlay Instructions */}
          <div className="absolute bottom-4 left-4 right-4 z-[1000]">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-3 border border-[#E11D48]/20"
            >
              <div className="flex items-center gap-2 text-sm">
                <div className="w-6 h-6 bg-[#E11D48]/10 rounded-full flex items-center justify-center">
                  <MapPin className="h-3 w-3 text-[#E11D48]" />
                </div>
                <p className="text-gray-600 flex-1">
                  <span className="font-medium text-[#E11D48]">
                    Click on the map
                  </span>{" "}
                  to select a location, or{" "}
                  <button
                    type="button"
                    onClick={getCurrentLocation}
                    className="text-[#E11D48] hover:underline font-medium"
                  >
                    use your current location
                  </button>
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </Card>

      {/* Selected Location Details */}
      <AnimatePresence>
        {position && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <Card className="border-[#E11D48]/20 bg-[#E11D48]/5">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-[#E11D48]/10 rounded-lg">
                    <CheckCircle2 className="h-5 w-5 text-[#E11D48]" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-gray-900">
                        Selected Location
                      </h4>
                      <Badge
                        variant="outline"
                        className="bg-white border-[#E11D48]/20 text-[#E11D48]"
                      >
                        {position.lat.toFixed(6)}, {position.lng.toFixed(6)}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      {position.name && (
                        <div className="space-y-1">
                          <p className="text-gray-500 text-xs">Location Name</p>
                          <p className="font-medium">{position.name}</p>
                        </div>
                      )}

                      {position.city && (
                        <div className="space-y-1">
                          <p className="text-gray-500 text-xs">City</p>
                          <p className="font-medium">{position.city}</p>
                        </div>
                      )}

                      {position.state && (
                        <div className="space-y-1">
                          <p className="text-gray-500 text-xs">State</p>
                          <p className="font-medium">{position.state}</p>
                        </div>
                      )}

                      {position.country && (
                        <div className="space-y-1">
                          <p className="text-gray-500 text-xs">Country</p>
                          <p className="font-medium">{position.country}</p>
                        </div>
                      )}

                      {position.formattedAddress && (
                        <div className="space-y-1 md:col-span-2">
                          <p className="text-gray-500 text-xs">Full Address</p>
                          <p className="text-sm bg-white/50 p-2 rounded border border-[#E11D48]/20">
                            {position.formattedAddress}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Current Location Indicator */}
                    {currentLocation &&
                      currentLocation.lat === position.lat &&
                      currentLocation.lng === position.lng && (
                        <Badge className="bg-blue-100 text-blue-700 border-blue-200 mt-2">
                          <LocateFixed className="h-3 w-3 mr-1" />
                          Your Current Location
                        </Badge>
                      )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* No Location Selected */}
      {!position && (
        <Card className="border-dashed border-[#E11D48]/30">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-[#E11D48]/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <MapPin className="h-6 w-6 text-[#E11D48]" />
            </div>
            <h4 className="font-medium text-gray-900 mb-1">
              No Location Selected
            </h4>
            <p className="text-sm text-gray-500 mb-4">
              Click on the map or use your current location to set the property
              address
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={getCurrentLocation}
              disabled={isGettingLocation}
              className="mx-auto border-[#E11D48]/20 hover:bg-[#E11D48]/5 hover:text-[#E11D48]"
            >
              {isGettingLocation ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <LocateFixed className="h-4 w-4 mr-2" />
              )}
              Use My Current Location
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
