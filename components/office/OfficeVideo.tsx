"use client";
import { useEffect, useState } from 'react';
import { officeService, officeError, officeBackend } from '@/http/services/office.service';

export function OfficeVideo({ roomId, recipient = false, available = false }: { roomId: string; recipient?: boolean; available?: boolean }) {
  const [url,setUrl] = useState('');
  const [error,setError] = useState('');
  const [loading,setLoading] = useState(false);
  useEffect(() => () => { if (url.startsWith('blob:')) URL.revokeObjectURL(url); },[url]);
  useEffect(()=>{setUrl('');setError('');},[roomId]);
  const load = async () => {
    if(loading)return;
    if(available || recipient){setUrl(officeBackend+'/office/availability/'+roomId+'/video');return;}
    setLoading(true); setError('');
    try { setUrl(URL.createObjectURL(await (recipient ? officeService.myVideo(roomId) : officeService.video(roomId)))); }
    catch (e) { setError(officeError(e)); }
    finally { setLoading(false); }
  };
  return <div className="aspect-video bg-slate-950 rounded-xl overflow-hidden flex flex-col items-center justify-center text-white">
    {url ? <video src={url} data-video-intent="room" controls playsInline preload="none" className="w-full h-full" /> : <button type="button" onClick={load} disabled={loading} className="rounded-full bg-white/15 px-5 py-3 hover:bg-white/25 disabled:opacity-50">{loading ? 'Loading private video…' : '▶ Play room video'}</button>}
    {error && <p role="alert" className="p-3 text-sm text-red-300">{error}</p>}
  </div>;
}
