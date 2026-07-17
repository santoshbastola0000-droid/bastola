"use client";

import { useEffect, useRef, useCallback } from "react";
import { userService } from "@/http/services/user.service";
import { useUserRole } from "@/stores/user-store";

const LOCATION_KEY = "roomkhoj.user-location";
const HEARTBEAT_INTERVAL_MS = 60_000;
const LOCATION_UPDATE_INTERVAL_MS = 5 * 60_000;

interface StoredLocation {
  latitude: number;
  longitude: number;
  city?: string;
  address?: string;
  updatedAt: number;
}

function readStoredLocation(): StoredLocation | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(LOCATION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredLocation;
  } catch {
    return null;
  }
}

function writeStoredLocation(location: StoredLocation) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LOCATION_KEY, JSON.stringify(location));
}

export function useUserLocation() {
  const { user } = useUserRole();
  const lastSentRef = useRef<number>(0);

  const sendLocation = useCallback(async (location: StoredLocation) => {
    try {
      await userService.updateLocation({
        latitude: location.latitude,
        longitude: location.longitude,
        city: location.city,
        address: location.address,
      });
      lastSentRef.current = Date.now();
    } catch {
      // silent fail; will retry next cycle
    }
  }, []);

  const sendHeartbeat = useCallback(async () => {
    if (!user) return;
    try {
      await userService.heartbeat();
    } catch {
      // silent fail
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;

    sendHeartbeat();
    const heartbeatId = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_MS);

    const stored = readStoredLocation();
    if (stored) {
      sendLocation(stored);
    }

    return () => clearInterval(heartbeatId);
  }, [user, sendHeartbeat, sendLocation]);

  const requestAndStoreLocation = useCallback(async () => {
    if (typeof window === "undefined" || !navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const location: StoredLocation = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          updatedAt: Date.now(),
        };
        writeStoredLocation(location);
        await sendLocation(location);
      },
      () => {
        // permission denied or unavailable — leave stored value as is
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 300_000 },
    );
  }, [sendLocation]);

  useEffect(() => {
    if (!user) return;

    const stored = readStoredLocation();
    const isStale =
      !stored || Date.now() - stored.updatedAt > LOCATION_UPDATE_INTERVAL_MS;

    if (isStale) {
      requestAndStoreLocation();
    }

    const id = setInterval(requestAndStoreLocation, LOCATION_UPDATE_INTERVAL_MS);
    return () => clearInterval(id);
  }, [user, requestAndStoreLocation]);

  return { requestPermission: requestAndStoreLocation };
}

export function getStoredUserLocation(): StoredLocation | null {
  return readStoredLocation();
}
