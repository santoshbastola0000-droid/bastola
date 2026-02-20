"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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
  Maximize2,
  Minimize2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

// Fix for default Leaflet icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Default center: Pokhara, Nepal
const DEFAULT_CENTER: [number, number] = [28.2096, 83.9856];
const DEFAULT_ZOOM = 13;

const createSelectedIcon = () =>
  L.divIcon({
    html: `<div style="position:relative;display:inline-block;">
      <div style="width:40px;height:40px;background:#E23744;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;">
        <div style="width:12px;height:12px;background:white;border-radius:50%;"></div>
      </div>
      <div style="position:absolute;bottom:-8px;left:50%;transform:translateX(-50%);width:0;height:0;border-left:8px solid transparent;border-right:8px solid transparent;border-top:8px solid #E23744;"></div>
    </div>`,
    className: "bg-transparent border-none",
    iconSize: [40, 48],
    iconAnchor: [20, 48],
    popupAnchor: [0, -48],
  });

const createCurrentLocationIcon = () =>
  L.divIcon({
    html: `<div style="position:relative;display:flex;align-items:center;justify-content:center;width:48px;height:48px;">
      <div style="width:32px;height:32px;background:#3B82F6;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(59,130,246,0.5);display:flex;align-items:center;justify-content:center;z-index:2;position:relative;">
        <div style="width:10px;height:10px;background:white;border-radius:50%;"></div>
      </div>
      <div style="position:absolute;width:48px;height:48px;background:rgba(59,130,246,0.2);border-radius:50%;animation:mapPing 1.5s cubic-bezier(0,0,0.2,1) infinite;"></div>
    </div>`,
    className: "bg-transparent border-none",
    iconSize: [48, 48],
    iconAnchor: [24, 24],
    popupAnchor: [0, -24],
  });

export interface Location {
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

async function reverseGeocode(
  lat: number,
  lng: number,
): Promise<Omit<Location, "lat" | "lng">> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      { headers: { "Accept-Language": "en-US,en;q=0.9" } },
    );
    if (!response.ok) throw new Error("Request failed");
    const data = await response.json();
    return {
      formattedAddress:
        data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
      name:
        data.name ||
        data.address?.road ||
        data.display_name?.split(",")[0] ||
        "Selected Location",
      city:
        data.address?.city || data.address?.town || data.address?.village || "",
      state: data.address?.state || "",
      country: data.address?.country || "",
      postalCode: data.address?.postcode || "",
    };
  } catch {
    return {
      formattedAddress: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
      name: "Selected Location",
      city: "",
      state: "",
      country: "",
      postalCode: "",
    };
  }
}

async function searchLocation(query: string): Promise<any[]> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`,
      { headers: { "Accept-Language": "en-US,en;q=0.9" } },
    );
    if (!response.ok) return [];
    return await response.json();
  } catch {
    return [];
  }
}

// ── ClickHandler ──────────────────────────────────────────────────────────────

const ClickHandler = dynamic(
  () =>
    import("react-leaflet").then((mod) => {
      const Comp = ({
        onSelect,
      }: {
        onSelect: (lat: number, lng: number) => void;
      }) => {
        mod.useMapEvents({
          click: (e) => onSelect(e.latlng.lat, e.latlng.lng),
        });
        return null;
      };
      Comp.displayName = "ClickHandler";
      return Comp;
    }),
  { ssr: false },
);

// ── MapController ─────────────────────────────────────────────────────────────

const MapController = dynamic(
  () =>
    import("react-leaflet").then((mod) => {
      const Comp = ({
        flyTarget,
      }: {
        flyTarget: [number, number, number] | null;
      }) => {
        const map = mod.useMap();
        const prevTargetRef = useRef<[number, number, number] | null>(null);

        useEffect(() => {
          if (!flyTarget) return;
          const [lat, lng, zoom] = flyTarget;
          const prev = prevTargetRef.current;
          if (prev && prev[0] === lat && prev[1] === lng && prev[2] === zoom)
            return;
          prevTargetRef.current = [lat, lng, zoom];

          const timerId = setTimeout(() => {
            try {
              map.flyTo([lat, lng], zoom, { animate: true, duration: 1.5 });
            } catch {
              try {
                map.setView([lat, lng], zoom);
              } catch {
                // silently ignore
              }
            }
          }, 150);

          return () => clearTimeout(timerId);
        }, [flyTarget, map]);

        return null;
      };
      Comp.displayName = "MapController";
      return Comp;
    }),
  { ssr: false },
);

// ── InvalidateSizeOnFullscreen ────────────────────────────────────────────────
// When the map container changes size (fullscreen toggle), Leaflet needs
// invalidateSize() to recalculate tile positions correctly.

const InvalidateSizeOnFullscreen = dynamic(
  () =>
    import("react-leaflet").then((mod) => {
      const Comp = ({ isFullscreen }: { isFullscreen: boolean }) => {
        const map = mod.useMap();
        useEffect(() => {
          // Small delay so the CSS transition finishes before we recalc
          const t = setTimeout(() => {
            map.invalidateSize({ animate: false });
          }, 320);
          return () => clearTimeout(t);
        }, [isFullscreen, map]);
        return null;
      };
      Comp.displayName = "InvalidateSizeOnFullscreen";
      return Comp;
    }),
  { ssr: false },
);

// ── Leaflet dynamic imports ───────────────────────────────────────────────────

const MapContainer = dynamic(
  () => import("react-leaflet").then((m) => m.MapContainer),
  { ssr: false },
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((m) => m.TileLayer),
  { ssr: false },
);
const Marker = dynamic(() => import("react-leaflet").then((m) => m.Marker), {
  ssr: false,
});
const Popup = dynamic(() => import("react-leaflet").then((m) => m.Popup), {
  ssr: false,
});

// ── Main Component ────────────────────────────────────────────────────────────

export default function MapPicker({
  onLocationSelect,
  initialLocation,
}: MapPickerProps) {
  const [position, setPosition] = useState<Location | null>(
    initialLocation ?? null,
  );
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [isGeolocating, setIsGeolocating] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [flyTarget, setFlyTarget] = useState<[number, number, number] | null>(
    null,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const geoWatchIdRef = useRef<number | null>(null);
  const fullscreenContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setIsMounted(true);
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
      if (geoWatchIdRef.current !== null) {
        navigator.geolocation.clearWatch(geoWatchIdRef.current);
      }
    };
  }, []);

  // Close fullscreen on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen]);

  // Lock body scroll when fullscreen
  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isFullscreen]);

  // ── Map click ─────────────────────────────────────────────────────────────

  const handleMapClick = useCallback(
    async (lat: number, lng: number) => {
      setPosition({ lat, lng });
      setMapError(null);
      const address = await reverseGeocode(lat, lng);
      const locationData: Location = { lat, lng, ...address };
      setPosition(locationData);
      onLocationSelect(locationData);
    },
    [onLocationSelect],
  );

  // ── Current location ──────────────────────────────────────────────────────

  const handleUseCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    if (geoWatchIdRef.current !== null) {
      navigator.geolocation.clearWatch(geoWatchIdRef.current);
      geoWatchIdRef.current = null;
    }

    setIsGeolocating(true);
    setMapError(null);

    geoWatchIdRef.current = navigator.geolocation.watchPosition(
      async (pos) => {
        if (geoWatchIdRef.current !== null) {
          navigator.geolocation.clearWatch(geoWatchIdRef.current);
          geoWatchIdRef.current = null;
        }

        const { latitude: lat, longitude: lng, accuracy } = pos.coords;

        if (accuracy > 500) {
          toast.warning(
            `Low accuracy (~${Math.round(accuracy)}m). Try moving to an open area.`,
          );
        }

        const address = await reverseGeocode(lat, lng);
        const locationData: Location = { lat, lng, ...address };

        setCurrentLocation({ lat, lng });
        setPosition(locationData);
        onLocationSelect(locationData);
        setFlyTarget([lat, lng, 16]);

        toast.success("Current location detected!");
        setIsGeolocating(false);
        setMapError(null);
      },
      (err) => {
        if (geoWatchIdRef.current !== null) {
          navigator.geolocation.clearWatch(geoWatchIdRef.current);
          geoWatchIdRef.current = null;
        }
        setIsGeolocating(false);

        switch (err.code) {
          case err.PERMISSION_DENIED:
            toast.error(
              "Location access denied. Please allow it in your browser settings.",
            );
            break;
          case err.POSITION_UNAVAILABLE:
            toast.error(
              "Location unavailable. Check your GPS or network connection.",
            );
            break;
          case err.TIMEOUT:
            toast.error("Location request timed out. Please try again.");
            break;
          default:
            toast.error("Could not get your location. Please try again.");
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  }, [onLocationSelect]);

  // ── Search ────────────────────────────────────────────────────────────────

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (query.length < 3) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }
    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchLocation(query);
        setSearchResults(results);
        setShowSearchResults(results.length > 0);
      } catch {
        toast.error("Search failed. Please try again.");
      } finally {
        setIsSearching(false);
      }
    }, 500);
  };

  const handleSearchSelect = async (result: any) => {
    try {
      const lat = parseFloat(result.lat);
      const lng = parseFloat(result.lon);
      const address: Omit<Location, "lat" | "lng"> = {
        formattedAddress: result.display_name,
        name: result.display_name.split(",")[0],
        city:
          result.address?.city ||
          result.address?.town ||
          result.address?.village ||
          "",
        state: result.address?.state || "",
        country: result.address?.country || "",
        postalCode: result.address?.postcode || "",
      };
      const locationData: Location = { lat, lng, ...address };
      setPosition(locationData);
      onLocationSelect(locationData);
      setShowSearchResults(false);
      setSearchQuery(address.name ?? "");
      setFlyTarget([lat, lng, 16]);
      setMapError(null);
    } catch {
      toast.error("Failed to select this location.");
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  if (!isMounted) {
    return (
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-[600px] w-full rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  const mapCenter: [number, number] = position
    ? [position.lat, position.lng]
    : DEFAULT_CENTER;
  const mapZoom = position ? 15 : DEFAULT_ZOOM;

  // ── Shared map UI (rendered in both normal + fullscreen modes) ────────────

  const MapUI = (
    <div className="relative h-full w-full">
      {/* Top-right controls row */}
      <div className="absolute right-3 top-3 z-[1000] flex flex-col gap-2 items-end">
        {/* Fullscreen toggle */}
        <button
          onClick={() => setIsFullscreen((v) => !v)}
          type="button"
          className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm shadow-lg hover:bg-gray-100 active:bg-gray-200 transition-colors border border-gray-200 select-none"
          title={isFullscreen ? "Exit fullscreen (Esc)" : "Enter fullscreen"}
        >
          {isFullscreen ? (
            <Minimize2 size={16} className="text-gray-700" />
          ) : (
            <Maximize2 size={16} className="text-gray-700" />
          )}
          <span>{isFullscreen ? "Exit fullscreen" : "Fullscreen"}</span>
        </button>

        {/* Current location button */}
        <button
          onClick={handleUseCurrentLocation}
          type="button"
          disabled={isGeolocating}
          className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm shadow-lg hover:bg-gray-100 active:bg-gray-200 transition-colors border border-gray-200 disabled:opacity-60 disabled:cursor-not-allowed select-none"
        >
          {isGeolocating ? (
            <Loader2 size={16} className="animate-spin text-blue-600" />
          ) : (
            <LocateFixed size={16} className="text-blue-600" />
          )}
          {isGeolocating ? "Getting location…" : "Use current location"}
        </button>
      </div>

      {/* Search bar — inside the map when fullscreen */}
      {isFullscreen && (
        <div className="absolute left-3 top-3 z-[1000] w-72 sm:w-96">
          <div className="relative bg-white rounded-lg border shadow-lg">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <input
              placeholder="Search for a location..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg outline-none"
              onFocus={() =>
                searchResults.length > 0 && setShowSearchResults(true)
              }
              onBlur={() => setTimeout(() => setShowSearchResults(false), 200)}
            />
            <AnimatePresence>
              {showSearchResults && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
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
                        className="w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors flex items-start gap-2"
                        onMouseDown={() => handleSearchSelect(result)}
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
        </div>
      )}

      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        className="h-full w-full"
        scrollWheelZoom
        style={{ background: "#f0f0f0" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapController flyTarget={flyTarget} />
        <ClickHandler onSelect={handleMapClick} />
        <InvalidateSizeOnFullscreen isFullscreen={isFullscreen} />

        {position && (
          <Marker
            position={[position.lat, position.lng]}
            icon={createSelectedIcon()}
          >
            <Popup>
              <div className="p-2 min-w-[200px]">
                <p className="font-medium text-sm text-[#E23744]">
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
        )}

        {currentLocation && (
          <Marker
            position={[currentLocation.lat, currentLocation.lng]}
            icon={createCurrentLocationIcon()}
          >
            <Popup>
              <div className="p-2">
                <p className="font-medium text-sm text-blue-600 flex items-center gap-1">
                  <LocateFixed className="h-3 w-3" />
                  Your Current Location
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {currentLocation.lat.toFixed(6)},{" "}
                  {currentLocation.lng.toFixed(6)}
                </p>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>

      {/* Bottom instruction bar */}
      <div className="absolute bottom-4 left-4 right-4 z-[1000] pointer-events-none">
        <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-3 border">
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-[#E23744] flex-shrink-0" />
            <p className="text-gray-600">
              <span className="font-medium text-[#E23744]">
                Click on the map
              </span>{" "}
              to select a location, or use the buttons above
              {isFullscreen && (
                <span className="text-gray-400 ml-1">
                  · Press Esc to exit fullscreen
                </span>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Search Bar (normal mode only — in fullscreen it moves inside the map) */}
      {!isFullscreen && (
        <Card className="border shadow-lg">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <Input
                placeholder="Search for a location..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-9"
                onFocus={() =>
                  searchResults.length > 0 && setShowSearchResults(true)
                }
                onBlur={() =>
                  setTimeout(() => setShowSearchResults(false), 200)
                }
              />
              <AnimatePresence>
                {showSearchResults && (
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
                          className="w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors flex items-start gap-2"
                          onMouseDown={() => handleSearchSelect(result)}
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
          </CardContent>
        </Card>
      )}

      {mapError && !isFullscreen && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{mapError}</AlertDescription>
        </Alert>
      )}

      {/* ── Normal map card ── */}
      {!isFullscreen && (
        <Card className="overflow-hidden border shadow-lg">
          <div className="relative h-[600px]">{MapUI}</div>
        </Card>
      )}

      {/* ── Fullscreen overlay ── */}
      <AnimatePresence>
        {isFullscreen && (
          <motion.div
            ref={fullscreenContainerRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[9999] bg-black"
            style={{ height: "100dvh", width: "100dvw" }}
          >
            {MapUI}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Selected location summary */}
      <AnimatePresence>
        {position && !isFullscreen && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-green-100 rounded-lg flex-shrink-0">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
                      <h4 className="font-semibold text-gray-900">
                        Selected Location
                      </h4>
                      <Badge
                        variant="outline"
                        className="bg-white font-mono text-xs"
                      >
                        {position.lat.toFixed(5)}, {position.lng.toFixed(5)}
                      </Badge>
                    </div>
                    {position.formattedAddress && (
                      <p className="text-sm text-gray-700 bg-white p-2 rounded border border-green-200 break-words">
                        {position.formattedAddress}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty state */}
      {!position && !isFullscreen && (
        <Card className="border-dashed">
          <CardContent className="p-6 text-center">
            <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <h4 className="font-medium text-gray-900 mb-1">
              No Location Selected
            </h4>
            <p className="text-sm text-gray-500">
              Click on the map or press "Use current location" to set the
              address
            </p>
          </CardContent>
        </Card>
      )}

      {/* Global styles */}
      <style jsx global>{`
        @keyframes mapPing {
          0% {
            transform: scale(0.8);
            opacity: 0.8;
          }
          75%,
          100% {
            transform: scale(2.2);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
