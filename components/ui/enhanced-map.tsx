"use client";

import { useEffect, useRef, useState } from "react";
import {
  MapPin,
  Navigation,
  Compass,
  Maximize2,
  X,
  ZoomIn,
  ZoomOut,
  Layers,
  Loader2,
  Minimize2,
} from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Button } from "./button";

// Fix Leaflet icon issue in Next.js
const fixLeafletIcon = () => {
  // Delete the default icon properties to avoid the error
  delete (L.Icon.Default.prototype as any)._getIconUrl;

  // Set the correct icon paths
  L.Icon.Default.mergeOptions({
    iconRetinaUrl:
      "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
  });
};

// Create custom marker icon with red theme
const createCustomIcon = (isLarge = false) => {
  const size = isLarge ? 56 : 40;

  return L.divIcon({
    className: "custom-marker",
    html: `
      <div class="relative" style="transform: translateY(-${size}px);">
        <div style="
          width: ${size}px; 
          height: ${size}px; 
          background: linear-gradient(135deg, #ef4444, #dc2626);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          animation: ${isLarge ? "pulse 2s infinite" : "bounce 2s infinite"};
        ">
          <svg width="${isLarge ? 28 : 20}" height="${isLarge ? 28 : 20}" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12 4-8 8-8 8 4 8 8z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
        </div>
        <div style="
          position: absolute;
          bottom: -4px;
          left: 50%;
          transform: translateX(-50%) rotate(45deg);
          width: 8px;
          height: 8px;
          background: #dc2626;
        "></div>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });
};

interface EnhancedMapProps {
  latitude: number;
  longitude: number;
  popupText?: string;
  zoom?: number;
}

export default function EnhancedMap({
  latitude,
  longitude,
  popupText = "Property Location",
  zoom = 16,
}: EnhancedMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const fullscreenMapRef = useRef<L.Map | null>(null);
  const fullscreenContainerRef = useRef<HTMLDivElement>(null);

  const [showFullscreen, setShowFullscreen] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(zoom);
  const [mapType, setMapType] = useState<"street" | "satellite">("street");
  const [isMapReady, setIsMapReady] = useState(false);
  const [isFullscreenReady, setIsFullscreenReady] = useState(false);

  // Initialize main map
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!mapContainerRef.current) return;

    // Fix Leaflet icons
    fixLeafletIcon();

    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      if (!mapRef.current && mapContainerRef.current) {
        setIsMapReady(false);

        // Create map instance
        mapRef.current = L.map(mapContainerRef.current, {
          center: [latitude, longitude],
          zoom: zoom,
          zoomControl: false, // We'll use custom controls
          attributionControl: true,
        });

        // Add tile layer (default street map)
        L.tileLayer(
          "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
          {
            attribution:
              '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
            maxZoom: 19,
            subdomains: "abcd",
          },
        ).addTo(mapRef.current);

        // Add custom marker
        const marker = L.marker([latitude, longitude], {
          icon: createCustomIcon(false),
          riseOnHover: true,
        }).addTo(mapRef.current);

        // Add pulsing circle
        L.circle([latitude, longitude], {
          color: "#ef4444",
          fillColor: "#ef4444",
          fillOpacity: 0.1,
          radius: 50,
        }).addTo(mapRef.current);

        // Add popup
        if (popupText) {
          marker
            .bindPopup(
              `
            <div style="font-family: system-ui; padding: 12px; min-width: 200px;">
              <strong style="color: #ef4444; font-size: 14px;">${popupText}</strong>
              <br />
              <span style="font-size: 11px; color: #64748b;">${latitude.toFixed(6)}, ${longitude.toFixed(6)}</span>
              <br />
              <a 
                href="https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}" 
                target="_blank" 
                rel="noopener noreferrer"
                style="display: inline-block; margin-top: 8px; padding: 4px 12px; background: #ef4444; color: white; text-decoration: none; border-radius: 20px; font-size: 11px; font-weight: 500;"
              >
                Get Directions
              </a>
            </div>
          `,
            )
            .openPopup();
        }

        // Add scale control
        L.control
          .scale({ imperial: false, metric: true })
          .addTo(mapRef.current);

        // Update zoom state on zoom change
        mapRef.current.on("zoomend", () => {
          if (mapRef.current) {
            setCurrentZoom(mapRef.current.getZoom());
          }
        });

        // Force a resize to ensure map renders properly
        setTimeout(() => {
          if (mapRef.current) {
            mapRef.current.invalidateSize();
            setIsMapReady(true);
          }
        }, 100);
      }
    }, 200);

    return () => {
      clearTimeout(timer);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [latitude, longitude, popupText, zoom]);

  // Initialize fullscreen map when opened
  useEffect(() => {
    if (!showFullscreen || !fullscreenContainerRef.current) return;

    setIsFullscreenReady(false);

    // Small delay to ensure dialog is rendered
    const timer = setTimeout(() => {
      fixLeafletIcon();

      if (!fullscreenMapRef.current && fullscreenContainerRef.current) {
        fullscreenMapRef.current = L.map(fullscreenContainerRef.current, {
          center: [latitude, longitude],
          zoom: currentZoom,
          zoomControl: false,
          attributionControl: true,
        });

        // Add tile layer based on map type
        const tileLayer =
          mapType === "street"
            ? "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            : "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";

        L.tileLayer(tileLayer, {
          attribution:
            mapType === "street"
              ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              : '&copy; <a href="https://www.esri.com/">Esri</a>',
          maxZoom: 19,
          subdomains: "abcd",
        }).addTo(fullscreenMapRef.current);

        // Add custom marker (larger version)
        const marker = L.marker([latitude, longitude], {
          icon: createCustomIcon(true),
          riseOnHover: true,
        }).addTo(fullscreenMapRef.current);

        // Add pulsing circle
        L.circle([latitude, longitude], {
          color: "#ef4444",
          fillColor: "#ef4444",
          fillOpacity: 0.15,
          radius: 100,
        }).addTo(fullscreenMapRef.current);

        // Add popup
        if (popupText) {
          marker
            .bindPopup(
              `
            <div style="font-family: system-ui; padding: 16px; min-width: 250px;">
              <strong style="color: #ef4444; font-size: 16px;">${popupText}</strong>
              <br />
              <span style="font-size: 12px; color: #64748b;">${latitude.toFixed(6)}, ${longitude.toFixed(6)}</span>
              <br />
              <a 
                href="https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}" 
                target="_blank" 
                rel="noopener noreferrer"
                style="display: inline-block; margin-top: 12px; padding: 6px 16px; background: #ef4444; color: white; text-decoration: none; border-radius: 24px; font-size: 12px; font-weight: 500;"
              >
                Get Directions
              </a>
            </div>
          `,
            )
            .openPopup();
        }

        // Add scale control
        L.control
          .scale({ imperial: false, metric: true })
          .addTo(fullscreenMapRef.current);

        // Force resize
        setTimeout(() => {
          if (fullscreenMapRef.current) {
            fullscreenMapRef.current.invalidateSize();
            setIsFullscreenReady(true);
          }
        }, 100);
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      if (fullscreenMapRef.current) {
        fullscreenMapRef.current.remove();
        fullscreenMapRef.current = null;
      }
    };
  }, [showFullscreen, latitude, longitude, popupText, currentZoom, mapType]);

  const centerMap = () => {
    if (mapRef.current) {
      mapRef.current.setView([latitude, longitude], zoom);
    }
  };

  const zoomIn = () => {
    if (mapRef.current) {
      mapRef.current.setZoom((mapRef.current.getZoom() || zoom) + 1);
    }
  };

  const zoomOut = () => {
    if (mapRef.current) {
      mapRef.current.setZoom((mapRef.current.getZoom() || zoom) - 1);
    }
  };

  const openInGoogleMaps = () => {
    const url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
    window.open(url, "_blank");
  };

  const toggleMapType = () => {
    setMapType((prev) => (prev === "street" ? "satellite" : "street"));
    if (fullscreenMapRef.current) {
      fullscreenMapRef.current.remove();
      fullscreenMapRef.current = null;
    }
  };

  const toggleFullscreen = () => {
    setShowFullscreen(!showFullscreen);
  };

  return (
    <>
      {/* Main Map */}
      <div className="relative w-full h-full group">
        {/* Map Container */}
        <div
          ref={mapContainerRef}
          className="w-full h-full rounded-xl"
          style={{ background: "#f8fafc", minHeight: "300px" }}
        />

        {/* Loading Indicator */}
        {!isMapReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-100 rounded-xl">
            <div className="text-center">
              <Loader2 className="w-8 h-8 text-red-500 animate-spin mx-auto mb-2" />
              <p className="text-sm text-slate-500">Loading map...</p>
            </div>
          </div>
        )}

        {/* Map Controls */}
        <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
          <Button
            size="icon"
            variant="secondary"
            onClick={centerMap}
            title="Center map"
            className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white transition-all hover:scale-110"
          >
            <Compass className="w-4 h-4 text-slate-600" />
          </Button>
          <Button
            size="icon"
            variant="secondary"
            onClick={zoomIn}
            title="Zoom in"
            className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white transition-all hover:scale-110"
          >
            <ZoomIn className="w-4 h-4 text-slate-600" />
          </Button>
          <Button
            size="icon"
            variant="secondary"
            onClick={zoomOut}
            title="Zoom out"
            className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white transition-all hover:scale-110"
          >
            <ZoomOut className="w-4 h-4 text-slate-600" />
          </Button>
          <Button
            size="icon"
            variant="secondary"
            onClick={toggleFullscreen}
            title="View fullscreen"
            className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white transition-all hover:scale-110"
          >
            <Maximize2 className="w-4 h-4 text-slate-600" />
          </Button>
        </div>

        {/* Location Badge */}
        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-3 flex items-center gap-3 border border-slate-200 z-10">
          <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center shrink-0">
            <MapPin className="w-4 h-4 text-red-500" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-900 truncate max-w-[150px] sm:max-w-[200px]">
              {popupText}
            </p>
            <p className="text-xs text-slate-500">
              {latitude.toFixed(6)}, {longitude.toFixed(6)}
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center z-10">
          <Button
            size="sm"
            variant="secondary"
            onClick={openInGoogleMaps}
            className="rounded-full bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white gap-2"
          >
            <Navigation className="w-4 h-4" />
            <span className="hidden sm:inline">Directions</span>
            <span className="sm:hidden">Go</span>
          </Button>

          <div className="bg-white/90 backdrop-blur-sm rounded-full shadow-lg px-3 py-1.5 text-xs text-slate-500">
            Zoom: {currentZoom}
          </div>
        </div>

        {/* Attribution */}
        <div className="absolute bottom-2 right-2 bg-white/80 backdrop-blur-sm text-xs text-slate-500 px-2 py-1 rounded shadow-sm z-10">
          © OpenStreetMap
        </div>
      </div>

      {/* Fullscreen Map Modal */}
      {showFullscreen && (
        <div className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center p-4">
          <div className="relative w-full h-full max-w-7xl mx-auto bg-white rounded-2xl overflow-hidden shadow-2xl">
            {/* Fullscreen Map Container */}
            <div
              ref={fullscreenContainerRef}
              className="w-full h-full"
              style={{ minHeight: "500px" }}
            />

            {/* Loading Indicator for Fullscreen Map */}
            {!isFullscreenReady && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
                <div className="text-center">
                  <Loader2 className="w-10 h-10 text-red-500 animate-spin mx-auto mb-3" />
                  <p className="text-sm text-white/80">Loading map...</p>
                </div>
              </div>
            )}

            {/* Fullscreen Map Controls */}
            <div className="absolute top-4 right-4 flex flex-col gap-2 z-20">
              <Button
                size="icon"
                variant="secondary"
                onClick={toggleMapType}
                className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white"
                title={
                  mapType === "street"
                    ? "Switch to satellite"
                    : "Switch to street"
                }
              >
                <Layers className="w-4 h-4" />
              </Button>
              <Button
                size="icon"
                variant="secondary"
                onClick={() => {
                  if (fullscreenMapRef.current) {
                    fullscreenMapRef.current.setView([latitude, longitude], 18);
                  }
                }}
                className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white"
                title="Center map"
              >
                <Compass className="w-4 h-4" />
              </Button>
              <Button
                size="icon"
                variant="secondary"
                onClick={openInGoogleMaps}
                className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white"
                title="Open in Google Maps"
              >
                <Navigation className="w-4 h-4" />
              </Button>
              <Button
                size="icon"
                variant="secondary"
                onClick={toggleFullscreen}
                className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white"
                title="Exit fullscreen"
              >
                <Minimize2 className="w-4 h-4" />
              </Button>
            </div>

            {/* Fullscreen Map Location Info */}
            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-4 z-20 max-w-xs">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 text-red-500" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900 truncate">
                    {popupText}
                  </p>
                  <p className="text-xs text-slate-500 mt-1 break-all">
                    {latitude.toFixed(6)}, {longitude.toFixed(6)}
                  </p>
                  <Button
                    size="sm"
                    onClick={openInGoogleMaps}
                    className="mt-3 rounded-full bg-red-500 hover:bg-red-600 text-white w-full"
                  >
                    <Navigation className="w-3 h-3 mr-2" />
                    Get Directions
                  </Button>
                </div>
              </div>
            </div>

            {/* Map Type Indicator */}
            <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg z-20">
              <span className="text-xs font-medium capitalize">
                {mapType === "street" ? "Street Map" : "Satellite View"}
              </span>
            </div>

            {/* Attribution */}
            <div className="absolute bottom-4 right-4 bg-white/80 backdrop-blur-sm text-xs text-slate-500 px-3 py-1.5 rounded-full shadow-lg z-20">
              {mapType === "street" ? "© OpenStreetMap" : "© Esri"}
            </div>
          </div>
        </div>
      )}

      {/* Add animation styles */}
      <style jsx>{`
        @keyframes bounce {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-5px);
          }
        }
        @keyframes pulse {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.8;
          }
        }
      `}</style>
    </>
  );
}
