"use client";

import { useEffect, useState } from "react";
import { userService } from "@/http/services/user.service";
import type { UserDetail } from "@/types/user.types";

export function AiOwnerUserSelector({ onSelect }: { onSelect: (user: UserDetail) => void }) {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<UserDetail[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    const timeout = setTimeout(async () => {
      setLoading(true);
      try {
        const result = await userService.getUsers({search: query.trim(), take: 20, page: 0});
        if (active) { setUsers(result.data.filter(user => !user.isBanned)); setError(""); }
      } catch {
        if (active) { setUsers([]); setError("Could not load users. Check admin permissions."); }
      } finally { if (active) setLoading(false); }
    }, 300);
    return () => { active = false; clearTimeout(timeout); };
  }, [query]);
  return <section className="rounded-xl border p-5 space-y-3">
    <h2 className="font-semibold">Select RoomKhoj user for AI call</h2>
    <p className="text-sm text-muted-foreground">Search a registered account. Selecting a user prepares a call request; it does not call them until the secure AI voice bridge is enabled.</p>
    <input className="w-full rounded-md border bg-background p-3" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search user name or phone" aria-label="Search registered users" />
    {loading && <p role="status">Loading users…</p>}
    {error && <p role="alert" className="text-red-700">{error}</p>}
    <div className="max-h-64 overflow-y-auto divide-y rounded border">
      {users.map(user => <button key={user.id} type="button" onClick={() => onSelect(user)} className="block w-full p-3 text-left hover:bg-muted">
        <span className="font-medium">{user.name}</span> <span className="text-sm text-muted-foreground">{user.phone || "No phone"} · {user.isOnline ? "Online" : "Offline"}</span>
      </button>)}
    </div>
  </section>;
}
