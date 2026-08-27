'use client';
import { useEffect } from 'react';
import { privateApi } from '@/http/api/privateApi';
export function AutoLocationUpdate() {
  useEffect(() => {
    if (!('geolocation' in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => privateApi.post('/user/location', { latitude: coords.latitude, longitude: coords.longitude }).catch(() => undefined),
      () => undefined,
      { enableHighAccuracy: false, maximumAge: 24 * 60 * 60 * 1000, timeout: 10000 },
    );
  }, []);
  return null;
}
