// components/ui/map.tsx
"use client";

import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default markers in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface MapProps {
  latitude: number;
  longitude: number;
  popupText?: string;
  zoom?: number;
}

export default function Map({
  latitude,
  longitude,
  popupText,
  zoom = 15,
}: MapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize map
    if (!mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current).setView(
        [latitude, longitude],
        zoom,
      );

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(mapRef.current);

      // Add marker
      const marker = L.marker([latitude, longitude]).addTo(mapRef.current);

      if (popupText) {
        marker.bindPopup(popupText).openPopup();
      }
    } else {
      // Update view if coordinates change
      mapRef.current.setView([latitude, longitude], zoom);

      // Update marker
      mapRef.current.eachLayer((layer) => {
        if (layer instanceof L.Marker) {
          mapRef.current?.removeLayer(layer);
        }
      });

      const marker = L.marker([latitude, longitude]).addTo(mapRef.current);
      if (popupText) {
        marker.bindPopup(popupText).openPopup();
      }
    }

    // Cleanup
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [latitude, longitude, popupText, zoom]);

  return <div ref={mapContainerRef} className="h-full w-full" />;
}
