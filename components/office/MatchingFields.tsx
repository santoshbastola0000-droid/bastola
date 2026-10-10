"use client";
import type { TenantRequirements } from '@/http/services/office.service';

export const facilityOptions = [
  ['WIFI','Wi-Fi'],['PARKING','Parking'],['PRIVATE_BATHROOM','Private bathroom'],
  ['KITCHEN','Kitchen'],['WATER','Water supply'],['FURNISHED','Furnished'],['PETS_ALLOWED','Pets allowed'],
] as const;
export type MatchDraft = { city: string; area: string; roomType: string; capacity: string; people: string; minRent: string; maxRent: string; facilities: string[]; alternativeAreas: string[]; occupancy: string; parkingRequired: boolean; vehicle: string; vehicleCount: string; rentalEndsOn: string; moveInDate: string; parkingVehicles: string[] };
export const blankMatch: MatchDraft = { city:'',area:'',roomType:'',capacity:'',people:'1',minRent:'0',maxRent:'',facilities:[],alternativeAreas:[],occupancy:'ANY',parkingRequired:false,vehicle:'NONE',vehicleCount:'1',rentalEndsOn:'',moveInDate:'',parkingVehicles:[] };

export function MatchingFields({ value, onChange, tenant = false }: { value: MatchDraft; onChange: (value: MatchDraft) => void; tenant?: boolean }) {
  const field='mt-1 w-full rounded-lg border bg-white p-2.5 text-slate-900';
  return <fieldset className="space-y-3 rounded-xl border p-3">
    <legend className="px-1 text-sm font-semibold">{tenant?'Tenant requirements':'Room matching details'}</legend>
    <div className="grid grid-cols-2 gap-3">
      <label className="text-sm">City<input maxLength={100} className={field} value={value.city} placeholder="Pokhara" onChange={event=>onChange({...value,city:event.target.value})}/></label>
      <label className="text-sm">{tenant?'Main preferred area':'Area'}<input maxLength={100} className={field} value={value.area} placeholder={tenant?'Any area if blank':'Lakeside'} onChange={event=>onChange({...value,area:event.target.value})}/></label>
      <label className="text-sm">Room type<select className={field} value={value.roomType} onChange={event=>onChange({...value,roomType:event.target.value})}><option value="">Choose type</option>{tenant&&<option value="ANY">Any room type</option>}<option value="SINGLE">Single room</option><option value="FLAT">Flat</option><option value="HOSTEL">Hostel</option></select></label>
      <label className="text-sm">{tenant?'People staying':'Maximum people'}<input type="number" min={1} max={100} step={1} className={field} value={tenant?value.people:value.capacity} onChange={event=>onChange({...value,[tenant?'people':'capacity']:event.target.value})}/></label>
      {tenant&&<><label className="text-sm">Minimum rent (Rs)<input type="number" min={0} className={field} value={value.minRent} onChange={event=>onChange({...value,minRent:event.target.value})}/></label><label className="text-sm">Maximum rent (Rs)<input type="number" min={1} className={field} value={value.maxRent} onChange={event=>onChange({...value,maxRent:event.target.value})}/></label></>}
      <label className="text-sm">{tenant?'Who will stay?':'Allowed occupancy'}<select className={field} value={value.occupancy} onChange={e=>onChange({...value,occupancy:e.target.value})}>{['ANY','LADIES','GENTS','FAMILY','MIXED'].map(v=><option key={v} value={v}>{v==='ANY'?'Any / no restriction':v}</option>)}</select></label>
      {tenant && <>
        {[0,1,2,3].map(index=><label key={index} className="text-sm">Alternative nearby area {index+1}<input maxLength={100} className={field} value={value.alternativeAreas[index]||''} onChange={e=>{const areas=[...value.alternativeAreas];areas[index]=e.target.value;onChange({...value,alternativeAreas:areas});}}/></label>)}
        <label className="text-sm">Vehicle<select className={field} value={value.vehicle} onChange={e=>onChange({...value,vehicle:e.target.value})}>{['NONE','BIKE','CAR','BOTH'].map(v=><option key={v}>{v}</option>)}</select></label>
        {value.vehicle!=='NONE'&&<label className="text-sm">Vehicle count<input type="number" min={1} max={100} className={field} value={value.vehicleCount} onChange={e=>onChange({...value,vehicleCount:e.target.value})}/></label>}
        <label className="text-sm">Current paid rental ends<input type="date" className={field} value={value.rentalEndsOn} onChange={e=>onChange({...value,rentalEndsOn:e.target.value})}/></label>
        <label className="text-sm">Desired move-in date<input type="date" className={field} value={value.moveInDate} onChange={e=>onChange({...value,moveInDate:e.target.value})}/></label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={value.parkingRequired} onChange={e=>onChange({...value,parkingRequired:e.target.checked})}/>Parking needed</label>
      </>}
      {!tenant&&<div className="col-span-2 flex gap-3 text-sm">Verified parking for:{['BIKE','CAR'].map(v=><label key={v}><input type="checkbox" checked={value.parkingVehicles.includes(v)} onChange={e=>onChange({...value,parkingVehicles:e.target.checked?[...value.parkingVehicles,v]:value.parkingVehicles.filter(x=>x!==v)})}/> {v}</label>)}</div>}
    </div>
    <p className="text-xs text-slate-500">{tenant?'Location first, then budget and people. Parking mismatches remain visible; other selected facilities are must-haves. A blank main area accepts any area in the city.':'Select only verified facilities available in this room.'}</p>
    <div className="flex flex-wrap gap-3">{facilityOptions.map(([key,label])=><label className="flex items-center gap-2 text-sm" key={key}><input type="checkbox" checked={value.facilities.includes(key)} onChange={event=>onChange({...value,facilities:event.target.checked?[...value.facilities,key]:value.facilities.filter(item=>item!==key)})}/>{label}</label>)}</div>
  </fieldset>;
}


export function requirementsPayload(draft: MatchDraft): TenantRequirements {
  return {...draft,people:Number(draft.people),minRent:Number(draft.minRent),maxRent:Number(draft.maxRent),vehicleCount:draft.vehicle==='NONE'?0:Number(draft.vehicleCount),alternativeAreas:draft.alternativeAreas.map(a=>a.trim()).filter(Boolean)};
}
export function requirementsDraft(r?: Partial<TenantRequirements>): MatchDraft {
  return {...blankMatch,...r,roomType:r?.roomType||'ANY',people:String(r?.people||1),minRent:String(r?.minRent||0),maxRent:r?.maxRent?String(r.maxRent):'',vehicleCount:String(r?.vehicleCount||1)};
}
