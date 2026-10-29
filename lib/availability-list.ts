import { api } from "@/http/api/api";
import type { AvailableRoom } from "@/components/office/RoomAvailability";

export type AvailabilityFilters = { search:string; page:number; savedIds?:string[]; maxRent:number; roomType:string; signal?:AbortSignal };
const unwrap=(response:any)=>response.data?.data||response.data;
const normalize=(value:string)=>value.toLowerCase().replace(/[_-]/g," ").trim();
export function filterAvailabilityRooms(rooms:AvailableRoom[],filters:Pick<AvailabilityFilters,"search"|"maxRent"|"roomType">) {
  const search=normalize(filters.search),type=normalize(filters.roomType);
  return rooms.filter(room=>{
    if(String(room.status).toUpperCase()!=="AVAILABLE")return false;
    const content=normalize([room.code,room.title,room.location,room.details,room.matchProfile?.city,room.matchProfile?.area,room.matchProfile?.roomType].filter(Boolean).join(" "));
    if(search&&!content.includes(search))return false;
    if(filters.maxRent>0&&(!Number.isFinite(Number(room.price))||Number(room.price)<=0||Number(room.price)>filters.maxRent))return false;
    const roomType=normalize(room.matchProfile?.roomType||room.title);
    return !type||roomType.includes(type);
  });
}
export async function loadAvailabilityRooms(filters:AvailabilityFilters):Promise<{rooms:AvailableRoom[];total:number}> {
  const localFilters=filters.maxRent>0||Boolean(filters.roomType);
  if(filters.savedIds!==undefined) {
    const ids=[...new Set(filters.savedIds)].slice(0,500),pool:AvailableRoom[]=[];
    for(let offset=0;offset<ids.length;offset+=6) {
      filters.signal?.throwIfAborted();
      const batch=await Promise.all(ids.slice(offset,offset+6).map(async id=>{
        try{return unwrap(await api.get("/office/availability/"+encodeURIComponent(id),{signal:filters.signal})) as AvailableRoom;}
        catch(error){if((error as {response?:{status?:number}})?.response?.status===404)return null;throw error;}
      }));
      pool.push(...batch.filter((room):room is AvailableRoom=>Boolean(room)));
    }
    const matches=filterAvailabilityRooms(pool,filters);
    return {rooms:matches.slice(filters.page*24,(filters.page+1)*24),total:matches.length};
  }
  const first=unwrap(await api.get("/office/availability",{params:{q:filters.search,page:localFilters?0:filters.page},signal:filters.signal}));
  const pool:AvailableRoom[]=Array.isArray(first.rooms)?first.rooms:[];
  if(!localFilters)return {rooms:pool.filter(room=>String(room.status).toUpperCase()==="AVAILABLE"),total:Number(first.total)||0};
  const total=Number(first.total)||pool.length;
  for(let offset=24;offset<total;offset+=24) {
    filters.signal?.throwIfAborted();
    const next=unwrap(await api.get("/office/availability",{params:{q:filters.search,page:offset/24},signal:filters.signal}));
    pool.push(...(Array.isArray(next.rooms)?next.rooms:[]));
  }
  // Search was applied by the server (including its URL/room-code normalization).
  const matches=filterAvailabilityRooms([...new Map(pool.map(room=>[room.id,room])).values()],{...filters,search:""});
  return {rooms:matches.slice(filters.page*24,(filters.page+1)*24),total:matches.length};
}
