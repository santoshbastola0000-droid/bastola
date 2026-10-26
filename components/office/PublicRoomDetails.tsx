"use client";
import type { AvailableRoom } from './RoomAvailability';
type PublicRoom = Pick<AvailableRoom,'code'|'title'|'location'|'price'|'details'|'tiktokUrl'|'matchProfile'>;
const labels=['Water / Electricity','Wi-Fi','Parking','Suitable tenants','Not suitable tenants','Neighbors / surroundings','Additional questions'];
export function PublicRoomDetails({room}:{room:PublicRoom}) {
 const parsed:Record<string,string>={}; const extra:string[]=[]; const custom:Array<[string,string]>=[];
 for(const line of (room.details||'').split('\n')) {
  if(line.startsWith('Custom question: ')){const [q,a='']=line.slice(17).split(' | Answer: ');custom.push([q,a]);continue;}
  const label=labels.find(k=>line.startsWith(k+': '));if(label)parsed[label]=line.slice(label.length+2);else if(line.trim())extra.push(line);
 }
 const p=room.matchProfile;
 const entries:Array<[string,unknown]>=[
 ['Room Code',room.code],['Room Type',p?.roomType],['Location',room.location],['City',p?.city],['Area',p?.area],
 ['Owner Name','***'],['Owner Phone','***'],['Exact Address','***'],['Latitude','***'],['Longitude','***'],
 ['Monthly Rent',Number(room.price)>0?'Rs. '+Number(room.price).toLocaleString():'Not entered'],['Capacity',p?.capacity],
 ['Water / Electricity',parsed['Water / Electricity']],['Wi-Fi',parsed['Wi-Fi']],['Parking',parsed['Parking']],
 ['Facilities',p?.facilities],['Parking Vehicles',p?.parkingVehicles],['Occupancy',p?.occupancy],
 ['Suitable Tenants',parsed['Suitable tenants']],['Not Suitable Tenants',parsed['Not suitable tenants']],
 ['Neighbors / Surroundings',parsed['Neighbors / surroundings']],['Additional Questions',parsed['Additional questions']],
 ...custom,['Room Rules / Other Details',extra.join('\n')],['TikTok URL',room.tiktokUrl]];
 const format=(v:unknown)=>Array.isArray(v)?(v.length?v.join(', '):'Not entered'):v===null||v===undefined||v===''?'Not entered':String(v);
 return <section className="rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-900"><h3 className="mb-2 font-bold">Room Details</h3>
 <ol className="list-decimal divide-y divide-slate-100 pl-6">{entries.map(([label,v],i)=><li key={i} className="py-2 pl-1"><div className="grid grid-cols-[minmax(0,42%)_minmax(0,1fr)] gap-2"><strong>{label}</strong><span className="min-w-0 whitespace-pre-wrap break-words">{format(v)}</span></div></li>)}</ol></section>;
}
