import type { OfficeHistory } from '@/http/services/office.service';

export function clientHistoryGroups(entries: OfficeHistory[]): OfficeHistory[][] {
  const groups = new Map<string, OfficeHistory[]>();
  for (const entry of entries) {
    // Missing identity must not merge unrelated people by a display name.
    const key = entry.clientId || 'entry:' + entry.id;
    const group = groups.get(key) || [];
    group.push(entry);
    groups.set(key, group);
  }
  return [...groups.values()];
}

export function clientRoomHistory(clientId: string, entries: OfficeHistory[]): OfficeHistory[] {
  const rooms = new Map<string, OfficeHistory>();
  const time = (entry: OfficeHistory) => Date.parse(entry.createdAt) || 0;
  for (const entry of entries) {
    if (!clientId || entry.clientId !== clientId || !entry.roomId) continue;
    const previous = rooms.get(entry.roomId);
    if (!previous || time(entry) > time(previous)) rooms.set(entry.roomId, entry);
  }
  return [...rooms.values()].sort((a,b) => time(b)-time(a));
}
