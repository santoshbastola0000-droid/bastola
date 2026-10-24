import type { RoomMatchProfile } from '@/http/services/office.service';

export function ClientRoomDetails({profile}: {profile?: RoomMatchProfile}) {
  if (!profile) return null;
  const rows = [
    ['City', profile.city], ['Area', profile.area], ['Room type', profile.roomType],
    ['Capacity', profile.capacity == null ? '' : String(profile.capacity)],
    ['Occupancy', profile.occupancy],
    ['Facilities', profile.facilities?.map(value => value.replaceAll('_', ' ')).join(' · ')],
    ['Parking vehicles', profile.parkingVehicles?.join(' · ')],
  ].filter((row) => row[1]);
  if (!rows.length) return null;
  return <section className="rounded-xl border bg-slate-50 p-3" aria-label="Room specifications">
    <h4 className="mb-2 text-sm font-semibold">Room details</h4>
    <dl className="grid gap-2 text-sm">{rows.map(([label,value]) => <div key={label} className="flex flex-wrap justify-between gap-2">
      <dt className="text-slate-500">{label}</dt><dd className="break-words font-medium">{value}</dd>
    </div>)}</dl>
  </section>;
}
