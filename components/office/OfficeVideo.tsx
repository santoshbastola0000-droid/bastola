"use client";
import { useEffect, useState } from 'react';
import { officeService, officeError, officeBackend } from '@/http/services/office.service';

export function OfficeVideo({ roomId, recipient = false, available = false, compact = false }: { roomId: string; recipient?: boolean; available?: boolean; compact?: boolean }) {
  const [url,setUrl] = useState('');
  const [error,setError] = useState('');
  const [loading,setLoading] = useState(false);
  useEffect(() => () => { if (url.startsWith('blob:')) URL.revokeObjectURL(url); },[url]);
  useEffect(()=>{setUrl('');setError('');},[roomId]);
  const load = async () => {
    if(loading)return;
    if(available){setUrl(officeBackend+'/office/availability/'+encodeURIComponent(roomId)+'/video');return;}
    setLoading(true); setError('');
    try { setUrl(URL.createObjectURL(await (recipient ? officeService.myVideo(roomId) : officeService.video(roomId)))); }
    catch (e) { setError(officeError(e)); }
    finally { setLoading(false); }
  };
  return <div className="aspect-video bg-slate-950 rounded-xl overflow-hidden flex flex-col items-center justify-center text-white">
    {url ? <video src={url} data-video-intent="room" controls playsInline preload={compact?"none":"metadata"} className="w-full h-full" onError={()=>{setUrl('');setError('Video playback failed. Please retry or upload an H.264 MP4.');}} /> : <button type="button" onClick={load} disabled={loading} className={"rounded-full bg-white/15 hover:bg-white/25 disabled:opacity-50 "+(compact?"px-2 py-1 text-[10px]":"px-5 py-3")}>{loading ? (compact?'Loading…':'Loading private video…') : error ? (compact?'↻ Retry':'↻ Retry room video') : (compact?'▶ Video':'▶ Play room video')}</button>}
    {error && <p role="alert" className="p-3 text-sm text-red-300">{error}</p>}
  </div>;
}

