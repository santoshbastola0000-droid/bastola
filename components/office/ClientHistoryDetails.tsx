"use client";
import { useEffect, useRef, useState } from 'react';
import { officeService, officeError, ReceptionClient } from '@/http/services/office.service';
import { PhoneReveal } from './PhoneReveal';

export function ClientHistoryDetails({clientId,phone}:{clientId:string;phone:string}) {
  const [client,setClient]=useState<ReceptionClient|null>(null);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState('');
  const [page,setPage]=useState(-1);
  const [more,setMore]=useState(false);
  const pending=useRef(false),alive=useRef(true);
  useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
  async function load() {
    if(pending.current||!clientId||!phone)return;
    pending.current=true;setLoading(true);setError('');
    try {
      const next=page+1,result=await officeService.clients(phone,next);
      if(!alive.current)return;
      // Never select a namesake or another phone-search result.
      const exact=result.clients.find(value=>value.id===clientId);
      setClient(exact||null);setPage(next);setMore(!exact&&(next+1)*20<result.total);
    } catch(error){if(alive.current)setError(officeError(error));}
    finally{pending.current=false;if(alive.current)setLoading(false);}
  }
  const r=client?.requirements;
  const fields: Array<[string,unknown]> = [
    ['City',r?.city],['Area',r?.area],['Alternative areas',r?.alternativeAreas?.join(', ')],
    ['Room type',r?.roomType],['People',r?.people],
    ['Minimum rent',r?.minRent],['Maximum rent',r?.maxRent],
    ['Facilities',r?.facilities?.join(', ')],['Occupancy',r?.occupancy],
    ['Parking required',r?.parkingRequired==null?undefined:r.parkingRequired?'Yes':'No'],
    ['Vehicle',r?.vehicle],['Vehicle count',r?.vehicleCount],
    ['Move-in date',r?.moveInDate],['Rental ends',r?.rentalEndsOn],
  ];
  return <details className="mb-2 rounded-lg border border-slate-200 bg-white text-xs" onToggle={event=>{if(event.currentTarget.open&&page<0&&!client)void load();}}>
    <summary className="cursor-pointer px-2 py-1.5 font-semibold text-blue-700">Client details</summary>
    <div className="space-y-2 border-t p-2">
      {loading&&<p role="status">Loading client details…</p>}
      {error&&<p role="alert" className="text-red-700">{error}</p>}
      {client&&<><p className="break-words font-semibold">{client.name}</p><PhoneReveal phone={client.phone} label="Client phone"/>
        <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-2 gap-y-1">{fields.filter(([,value])=>value!==undefined&&value!==null&&value!=='').map(([label,value])=><div key={label} className="contents"><dt className="text-slate-500">{label}</dt><dd className="min-w-0 break-words">{String(value)}</dd></div>)}</dl>
        {client.notes&&<p className="whitespace-pre-wrap break-words">{client.notes}</p>}
        <p className="text-slate-500">Saved client status: {client.active?'Active':'Inactive'}</p>
      </>}
      {!loading&&!client&&!error&&page>=0&&!more&&<p>Saved details for this exact client were not found.</p>}
      {!loading&&(more||error)&&<button type="button" className="font-semibold text-blue-700 underline" onClick={()=>void load()}>{error?'Retry':'Find next records'}</button>}
      {(!clientId||!phone)&&<p>Client reference or phone is missing.</p>}
    </div>
  </details>;
}
