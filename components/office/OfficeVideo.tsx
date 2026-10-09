"use client";
import { useEffect, useState } from 'react';
import { officeService, officeError } from '@/http/services/office.service';

export function OfficeVideo({ roomId, recipient = false }: { roomId: string; recipient?: boolean }) {
  const [url,setUrl] = useState('');
  const [error,setError] = useState('');
  const [loading,setLoading] = useState(false);
  useEffect(() => () => { if (url) URL.revokeObjectURL(url); },[url]);
  const load = async () => {
    setLoading(true); setError('');
    try { setUrl(URL.createObjectURL(await (recipient ? officeService.myVideo(roomId) : officeService.video(roomId)))); }
    catch (e) { setError(officeError(e)); }
    finally { setLoading(false); }
  };
  return <div className="aspect-video bg-slate-950 rounded-xl overflow-hidden flex flex-col items-center justify-center text-white">
    {url ? <video src={url} controls playsInline preload="metadata" className="w-full h-full" /> : <button type="button" onClick={load} disabled={loading} className="rounded-full bg-white/15 px-5 py-3 hover:bg-white/25 disabled:opacity-50">{loading ? 'Loading private video…' : '▶ Play room video'}</button>}
    {error && <p role="alert" className="p-3 text-sm text-red-300">{error}</p>}
  </div>;
}
