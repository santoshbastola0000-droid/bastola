'use client';

import { useEffect, useState } from 'react';
import { MapPin, Navigation, X } from 'lucide-react';
import { privateApi } from '@/http/api/privateApi';

export function AutoLocationUpdate() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const saveLocation = ({ coords }: GeolocationPosition) => {
    localStorage.setItem('roomkhoj-viewer-location', JSON.stringify({ latitude: coords.latitude, longitude: coords.longitude }));
    privateApi.post('/user/location', { latitude: coords.latitude, longitude: coords.longitude }).catch(() => undefined);
    setLoading(false);
    window.dispatchEvent(new Event('roomkhoj-location-updated'));
    if (!sessionStorage.getItem('roomkhoj-location-feed-refreshed')) {
      sessionStorage.setItem('roomkhoj-location-feed-refreshed', '1');
      window.location.reload();
    }
  };

  const requestLocation = () => {
    if (!('geolocation' in navigator)) return;
    setLoading(true); setMessage('');
    navigator.geolocation.getCurrentPosition(saveLocation, () => {
      setLoading(false);
      setOpen(true);
      setMessage('Location अनुमति browser settings बाट Allow गर्नुहोस्।');
    }, { enableHighAccuracy: false, maximumAge: 0, timeout: 10000 });
  };

  useEffect(() => {
    if (!('geolocation' in navigator)) return;
    const saved = localStorage.getItem('roomkhoj-viewer-location');
    if (saved) requestLocation(); else setOpen(true);
  }, []);

  if (!open) return null;
  return <div className="fixed inset-0 z-[100] flex items-end bg-black/45 p-4 sm:items-center sm:justify-center">
    <section className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
      <button onClick={() => setOpen(false)} className="float-right rounded-full p-1 text-slate-400"><X className="h-5 w-5" /></button>
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600"><MapPin className="h-7 w-7" /></div>
      <h2 className="text-xl font-bold text-slate-900">तपाईं नजिकका room खोजौँ</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">तपाईंको location प्रयोग गरेर नजिकका खाली room हरू सबैभन्दा पहिले देखाउँछौँ। तपाईंको अनुमति बिना location साझा हुँदैन।</p>
      <button onClick={requestLocation} disabled={loading} className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-red-600 px-4 py-3 font-semibold text-white disabled:opacity-60"><Navigation className="h-5 w-5" />{loading ? 'Location खोज्दै...' : 'Enable location'}</button>
      <button onClick={() => setOpen(false)} className="mt-3 w-full py-2 text-sm font-medium text-slate-500">अहिले होइन</button>
      {message && <p className="mt-3 text-center text-sm text-red-600">{message}</p>}
    </section>
  </div>;
}
