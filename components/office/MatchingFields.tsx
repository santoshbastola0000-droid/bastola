"use client";

export const facilityOptions = [
  ['WIFI','Wi-Fi'],['PARKING','Parking'],['PRIVATE_BATHROOM','Private bathroom'],
  ['KITCHEN','Kitchen'],['WATER','Water supply'],['FURNISHED','Furnished'],['PETS_ALLOWED','Pets allowed'],
] as const;
export type MatchDraft = { city: string; area: string; roomType: string; capacity: string; people: string; minRent: string; maxRent: string; facilities: string[] };
export const blankMatch: MatchDraft = { city:'',area:'',roomType:'',capacity:'',people:'1',minRent:'0',maxRent:'',facilities:[] };

export function MatchingFields({ value, onChange, tenant = false }: { value: MatchDraft; onChange: (value: MatchDraft) => void; tenant?: boolean }) {
  const field='mt-1 w-full rounded-lg border bg-white p-2.5 text-slate-900';
  return <fieldset className="space-y-3 rounded-xl border p-3">
    <legend className="px-1 text-sm font-semibold">{tenant?'Tenant requirements':'Room matching details'}</legend>
    <div className="grid grid-cols-2 gap-3">
      <label className="text-sm">City *<input required maxLength={100} className={field} value={value.city} placeholder="Pokhara" onChange={event=>onChange({...value,city:event.target.value})}/></label>
      <label className="text-sm">{tenant?'Preferred area (optional)':'Area'}<input maxLength={100} className={field} value={value.area} placeholder={tenant?'Any area if blank':'Lakeside'} onChange={event=>onChange({...value,area:event.target.value})}/></label>
      <label className="text-sm">Room type *<select required className={field} value={value.roomType} onChange={event=>onChange({...value,roomType:event.target.value})}><option value="">Choose type</option>{tenant&&<option value="ANY">Any room type</option>}<option value="SINGLE">Single room</option><option value="FLAT">Flat</option><option value="HOSTEL">Hostel</option></select></label>
      <label className="text-sm">{tenant?'People staying *':'Maximum people *'}<input required type="number" min={1} max={100} step={1} className={field} value={tenant?value.people:value.capacity} onChange={event=>onChange({...value,[tenant?'people':'capacity']:event.target.value})}/></label>
      {tenant&&<><label className="text-sm">Minimum rent (Rs)<input type="number" min={0} className={field} value={value.minRent} onChange={event=>onChange({...value,minRent:event.target.value})}/></label><label className="text-sm">Maximum rent (Rs) *<input required type="number" min={1} className={field} value={value.maxRent} onChange={event=>onChange({...value,maxRent:event.target.value})}/></label></>}
    </div>
    <p className="text-xs text-slate-500">{tenant?'Select every must-have facility. A blank area means any area within the chosen city.':'Select only verified facilities available in this room.'}</p>
    <div className="flex flex-wrap gap-3">{facilityOptions.map(([key,label])=><label className="flex items-center gap-2 text-sm" key={key}><input type="checkbox" checked={value.facilities.includes(key)} onChange={event=>onChange({...value,facilities:event.target.checked?[...value.facilities,key]:value.facilities.filter(item=>item!==key)})}/>{label}</label>)}</div>
  </fieldset>;
}
