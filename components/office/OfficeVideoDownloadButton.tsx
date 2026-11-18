"use client";
import { useState } from 'react';
import { Download } from 'lucide-react';
import { officeService, officeError } from '@/http/services/office.service';
import { saveVideoBlob } from '@/lib/save-video-blob';

export function OfficeVideoDownloadButton({roomId}:{roomId:string}) {
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  async function download(e:React.MouseEvent<HTMLButtonElement>) {
    e.stopPropagation();
    if(busy)return;
    setBusy(true);setError('');
    try {
      const blob=await officeService.downloadVideo(roomId);
      if(!blob.size)throw new Error('Video file is empty');
      await saveVideoBlob(blob,`RoomKhoj-${roomId}.mp4`);
    } catch(err) { setError(officeError(err)); }
    finally { setBusy(false); }
  }
  return <div className="min-w-0">
    <button type="button" onClick={download} disabled={busy} className="flex w-full min-h-[38px] items-center justify-center gap-1 rounded-md border border-slate-300 bg-slate-50 px-1.5 py-2 text-[11px] font-semibold text-slate-800 hover:bg-slate-100 disabled:opacity-50"><Download className="h-3.5 w-3.5 shrink-0"/><span className="truncate">{busy?'Preparing…':'Download Video'}</span></button>
    {error&&<p role="alert" className="mt-1 break-words text-[10px] text-red-600">{error}</p>}
  </div>;
}
