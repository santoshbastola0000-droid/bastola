"use client";

import { useEffect, useMemo, useState } from "react";
import { MapPin, Search, UserPlus, Users, Clock3, Banknote, Route } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { staffTrackingService, StaffType } from "@/http/services/staff-tracking.service";

const money = (value: unknown) => `Rs. ${Number(value || 0).toLocaleString()}`;

export default function StaffTrackingAdminPage() {
  const [type, setType] = useState<StaffType>("MARKETING");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [userResults, setUserResults] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [routeData, setRouteData] = useState<any>(null);
  const [form, setForm] = useState({ monthlySalary: "", allowedStartTime: "09:00", expectedEndTime: "17:00" });

  const load = async () => {
    try {
      setLoading(true);
      setRows(await staffTrackingService.dashboard(type, date));
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Staff tracking load failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, [type, date]);

  useEffect(() => {
    const q = search.trim();
    if (q.length < 2) { setUserResults([]); return; }
    const timer = window.setTimeout(async () => {
      try { setUserResults(await staffTrackingService.searchUsers(q)); } catch { setUserResults([]); }
    }, 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  const activeCount = useMemo(() => rows.filter((r) => r.status === "ACTIVE").length, [rows]);
  const totalMinutes = useMemo(() => rows.reduce((sum, r) => sum + Number(r.totalMinutes || 0), 0), [rows]);

  const saveStaff = async () => {
    if (!selectedUser) { toast.error("Staff user select गर्नुहोस्"); return; }
    try {
      setSaving(true);
      await staffTrackingService.saveProfile({
        userId: selectedUser.id,
        staffType: type,
        monthlySalary: Number(form.monthlySalary || 0),
        allowedStartTime: form.allowedStartTime,
        expectedEndTime: form.expectedEndTime,
        timezone: "Asia/Kathmandu",
        active: true,
      });
      toast.success(`${selectedUser.name} लाई ${type === "MARKETING" ? "Marketing" : "Reception"} staff बनाइयो`);
      setSelectedUser(null); setSearch(""); setUserResults([]); setForm((f) => ({ ...f, monthlySalary: "" }));
      await load();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Staff save failed");
    } finally { setSaving(false); }
  };

  const openRoute = async (sessionId?: string) => {
    if (!sessionId) return;
    try { setRouteData(await staffTrackingService.route(sessionId)); }
    catch (error: any) { toast.error(error?.response?.data?.message || "Route load failed"); }
  };

  return (
    <div className="space-y-5 p-4 md:p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Staff Tracking System</h1>
          <p className="text-sm text-muted-foreground">Marketing field tracking र Reception attendance अलग-अलग manage गर्नुहोस्।</p>
        </div>
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full md:w-44" />
      </div>

      <div className="grid grid-cols-2 gap-2 rounded-xl bg-muted p-1 md:w-[420px]">
        <button onClick={() => setType("MARKETING")} className={`rounded-lg px-4 py-2.5 text-sm font-semibold ${type === "MARKETING" ? "bg-background shadow" : "text-muted-foreground"}`}>Marketing</button>
        <button onClick={() => setType("RECEPTION")} className={`rounded-lg px-4 py-2.5 text-sm font-semibold ${type === "RECEPTION" ? "bg-background shadow" : "text-muted-foreground"}`}>Reception</button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={Users} label="Total staff" value={rows.length} />
        <Stat icon={Clock3} label="Working now" value={activeCount} />
        <Stat icon={Clock3} label="Tracked hours" value={(totalMinutes / 60).toFixed(1)} />
        <Stat icon={Banknote} label="Monthly salary total" value={money(rows.reduce((sum, r) => sum + Number(r.monthlySalary || 0), 0))} />
      </div>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><UserPlus className="h-5 w-5" /> Add / Assign {type === "MARKETING" ? "Marketing" : "Reception"} Staff</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="User name, email वा phone खोज्नुहोस्" className="pl-9" />
            {userResults.length > 0 && !selectedUser && (
              <div className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border bg-background shadow-lg">
                {userResults.map((u) => <button key={u.id} type="button" onClick={() => { setSelectedUser(u); setSearch(`${u.name} · ${u.phoneNumber || u.email}`); setUserResults([]); }} className="block w-full border-b px-3 py-2 text-left text-sm hover:bg-muted"><b>{u.name}</b><div className="text-xs text-muted-foreground">{u.phoneNumber} · {u.email}</div></button>)}
              </div>
            )}
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <div><Label>Monthly Salary</Label><Input type="number" min="0" value={form.monthlySalary} onChange={(e) => setForm((f) => ({ ...f, monthlySalary: e.target.value }))} placeholder="25000" /></div>
            <div><Label>Allowed Start Time</Label><Input type="time" value={form.allowedStartTime} onChange={(e) => setForm((f) => ({ ...f, allowedStartTime: e.target.value }))} /></div>
            <div><Label>Expected End Time</Label><Input type="time" value={form.expectedEndTime} onChange={(e) => setForm((f) => ({ ...f, expectedEndTime: e.target.value }))} /></div>
          </div>
          <div className="flex items-center justify-between gap-3 rounded-lg border bg-muted/40 p-3 text-sm">
            <span>Staff account मा RoomKhoj monetization activate हुँदैन; staff-specific salary/attendance rules लागू हुन्छन्।</span>
            <Button onClick={() => void saveStaff()} disabled={saving || !selectedUser}>{saving ? "Saving..." : "Save Staff"}</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>{type === "MARKETING" ? "Marketing Field Staff" : "Reception Staff"}</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] text-sm">
              <thead className="bg-muted"><tr><Th>Staff</Th><Th>Salary</Th><Th>Schedule</Th><Th>Start</Th><Th>End</Th><Th>Worked</Th>{type === "MARKETING" && <><Th>Last location</Th><Th>Visits</Th></>}<Th>Status</Th><Th>Action</Th></tr></thead>
              <tbody>{loading ? <tr><td colSpan={10} className="p-8 text-center">Loading...</td></tr> : rows.map((r) => (
                <tr key={r.staffProfileId} className="border-t">
                  <Td><b>{r.name}</b><div className="text-xs text-muted-foreground">{r.phoneNumber || r.email}</div></Td>
                  <Td>{money(r.monthlySalary)}</Td><Td>{String(r.allowedStartTime).slice(0,5)} – {String(r.expectedEndTime).slice(0,5)}</Td>
                  <Td>{r.startedAt ? new Date(r.startedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "-"}</Td>
                  <Td>{r.endedAt ? new Date(r.endedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "-"}</Td>
                  <Td>{Number(r.totalMinutes || 0)} min</Td>
                  {type === "MARKETING" && <><Td>{r.lastLocationAt ? <div><span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{Number(r.lastLatitude).toFixed(4)}, {Number(r.lastLongitude).toFixed(4)}</span><div className="text-xs text-muted-foreground">{new Date(r.lastLocationAt).toLocaleTimeString()}</div></div> : "No location"}</Td><Td>{r.visitCount || 0}</Td></>}
                  <Td><Badge variant={r.status === "ACTIVE" ? "default" : "secondary"}>{r.status || "NO SESSION"}</Badge></Td>
                  <Td>{type === "MARKETING" && r.sessionId ? <Button size="sm" variant="outline" onClick={() => void openRoute(r.sessionId)}><Route className="mr-1 h-4 w-4" /> Route</Button> : "-"}</Td>
                </tr>
              ))}{!loading && rows.length === 0 && <tr><td colSpan={10} className="p-8 text-center text-muted-foreground">No staff found.</td></tr>}</tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {routeData && (
        <Card className="border-primary/30">
          <CardHeader><div className="flex items-center justify-between"><CardTitle>Field Route / Tracking Points</CardTitle><Button variant="ghost" onClick={() => setRouteData(null)}>Close</Button></div></CardHeader>
          <CardContent>
            <p className="mb-3 text-sm text-muted-foreground">Website background GPS guarantee गर्दैन। बीचमा browser बन्द/suspend भए gaps हुन सक्छन्। यहाँ server ले पाएका points मात्र देखाइन्छ।</p>
            <div className="grid gap-3 md:grid-cols-2"><div><h3 className="mb-2 font-semibold">Location points ({routeData.points?.length || 0})</h3><div className="max-h-72 space-y-1 overflow-y-auto text-xs">{routeData.points?.map((p: any) => <div key={p.id} className="rounded border p-2">{Number(p.latitude).toFixed(5)}, {Number(p.longitude).toFixed(5)} · ±{Math.round(Number(p.accuracy || 0))}m · {new Date(p.receivedAt).toLocaleString()}</div>)}</div></div><div><h3 className="mb-2 font-semibold">Visits ({routeData.visits?.length || 0})</h3><div className="max-h-72 space-y-1 overflow-y-auto text-xs">{routeData.visits?.map((v: any) => <div key={v.id} className="rounded border p-2"><b>{v.leadName || "Field visit"}</b><div>{v.note || "No note"}</div><div className="text-muted-foreground">{new Date(v.checkedInAt).toLocaleString()}</div></div>)}</div></div></div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Stat({ icon: Icon, label, value }: any) { return <Card><CardContent className="flex items-center gap-3 p-4"><span className="rounded-lg bg-primary/10 p-2"><Icon className="h-5 w-5 text-primary" /></span><div><div className="text-xs text-muted-foreground">{label}</div><div className="text-xl font-bold">{value}</div></div></CardContent></Card>; }
function Th({ children }: any) { return <th className="px-3 py-3 text-left font-semibold">{children}</th>; }
function Td({ children }: any) { return <td className="px-3 py-3 align-top">{children}</td>; }
