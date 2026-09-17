"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Banknote,
  CheckCircle2,
  Clock3,
  MapPin,
  RefreshCw,
  Route,
  Search,
  UserCheck,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  staffTrackingService,
  StaffType,
} from "@/http/services/staff-tracking.service";

const money = (value: unknown) =>
  `Rs. ${Number(value || 0).toLocaleString()}`;

const threeHoursMs = 3 * 60 * 60 * 1000;

function formatLocation(point?: any) {
  if (!point) return "No location";
  const lat = Number(point.latitude);
  const lng = Number(point.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return "No location";
  return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}

function locationCheckState(row: any) {
  if (row.staffType !== "MARKETING" || !row.sessionId) {
    return { state: "not-required", label: "Not required", detail: "Reception staff" };
  }

  const referenceRaw = row.lastLocationAt || row.startedAt;
  if (!referenceRaw) {
    return { state: "missed", label: "Location missing", detail: "No GPS received" };
  }

  const reference = new Date(referenceRaw).getTime();
  const now = row.endedAt ? new Date(row.endedAt).getTime() : Date.now();
  const gapMs = Math.max(0, now - reference);
  const hours = gapMs / (60 * 60 * 1000);

  if (row.status === "ACTIVE" && gapMs > threeHoursMs) {
    return {
      state: "missed",
      label: "3H check missed",
      detail: `${hours.toFixed(1)}h since last GPS`,
    };
  }

  if (row.status === "ACTIVE") {
    const remaining = Math.max(0, (threeHoursMs - gapMs) / (60 * 60 * 1000));
    return {
      state: "ok",
      label: "GPS OK",
      detail: `Next check within ${remaining.toFixed(1)}h`,
    };
  }

  return {
    state: gapMs > threeHoursMs ? "review" : "ok",
    label: gapMs > threeHoursMs ? "Review gap" : "Completed",
    detail: `${hours.toFixed(1)}h final GPS gap`,
  };
}

export default function StaffTrackingAdminPage() {
  const [type, setType] = useState<StaffType>("MARKETING");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [rows, setRows] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [profilesLoading, setProfilesLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [userResults, setUserResults] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [routeData, setRouteData] = useState<any>(null);
  const [startLocations, setStartLocations] = useState<Record<string, any>>({});
  const [form, setForm] = useState({
    monthlySalary: "",
    allowedStartTime: "09:00",
    expectedEndTime: "17:00",
  });

  const load = async () => {
    try {
      setLoading(true);
      const dashboardRows = await staffTrackingService.dashboard(type, date);
      setRows(dashboardRows);

      if (type === "MARKETING") {
        const nextStartLocations: Record<string, any> = {};
        const sessionRows = dashboardRows.filter((row: any) => row.sessionId);
        await Promise.allSettled(
          sessionRows.map(async (row: any) => {
            const route = await staffTrackingService.route(row.sessionId);
            const firstPoint = route?.points?.[0] || null;
            if (firstPoint) nextStartLocations[row.sessionId] = firstPoint;
          }),
        );
        setStartLocations(nextStartLocations);
      } else {
        setStartLocations({});
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Staff tracking load failed");
    } finally {
      setLoading(false);
    }
  };

  const loadProfiles = async () => {
    try {
      setProfilesLoading(true);
      setProfiles(await staffTrackingService.listProfiles(""));
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Saved staff load failed");
    } finally {
      setProfilesLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, date]);

  useEffect(() => {
    void loadProfiles();
  }, []);

  useEffect(() => {
    const q = search.trim();
    if (q.length < 2 || selectedUser) {
      setUserResults([]);
      return;
    }

    const timer = window.setTimeout(async () => {
      try {
        setUserResults(await staffTrackingService.searchUsers(q));
      } catch {
        setUserResults([]);
      }
    }, 300);

    return () => window.clearTimeout(timer);
  }, [search, selectedUser]);

  const activeCount = useMemo(
    () => rows.filter((r) => r.status === "ACTIVE").length,
    [rows],
  );
  const totalMinutes = useMemo(
    () => rows.reduce((sum, r) => sum + Number(r.totalMinutes || 0), 0),
    [rows],
  );
  const missedCount = useMemo(
    () => rows.filter((r) => locationCheckState(r).state === "missed").length,
    [rows],
  );
  const activeSavedCount = useMemo(
    () => profiles.filter((profile) => profile.active).length,
    [profiles],
  );

  const clearSelection = () => {
    setSelectedUser(null);
    setSearch("");
    setUserResults([]);
    setForm({
      monthlySalary: "",
      allowedStartTime: "09:00",
      expectedEndTime: "17:00",
    });
  };

  const selectUser = (user: any) => {
    setSelectedUser(user);
    setSearch(user.name || user.phoneNumber || user.email || "Selected user");
    setUserResults([]);

    const existingProfile = profiles.find(
      (profile) => profile.userId === user.id,
    );

    if (existingProfile) {
      setType(existingProfile.staffType);
      setForm({
        monthlySalary: String(existingProfile.monthlySalary || ""),
        allowedStartTime: String(existingProfile.allowedStartTime || "09:00").slice(0, 5),
        expectedEndTime: String(existingProfile.expectedEndTime || "17:00").slice(0, 5),
      });
    }
  };

  const editSavedProfile = (profile: any) => {
    selectUser({
      id: profile.userId,
      name: profile.name,
      email: profile.email,
      phoneNumber: profile.phoneNumber,
      staffProfileId: profile.id,
      staffType: profile.staffType,
      active: profile.active,
    });
  };

  const saveStaff = async () => {
    if (!selectedUser) {
      toast.error("Staff user select गर्नुहोस्");
      return;
    }

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

      toast.success(`${selectedUser.name} staff tracking मा save भयो`);
      clearSelection();
      await Promise.all([load(), loadProfiles()]);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Staff save failed");
    } finally {
      setSaving(false);
    }
  };

  const openRoute = async (sessionId?: string) => {
    if (!sessionId) return;
    try {
      setRouteData(await staffTrackingService.route(sessionId));
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Route load failed");
    }
  };

  return (
    <div className="space-y-5 p-4 md:p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Staff Tracking System</h1>
          <p className="text-sm text-muted-foreground">
            Start location, live GPS gap र 3-hour location check status एउटै ठाउँबाट हेर्नुहोस्।
          </p>
        </div>
        <div className="flex gap-2">
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full md:w-44"
          />
          <Button variant="outline" onClick={() => void load()} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 rounded-xl bg-muted p-1 md:w-[420px]">
        <button
          onClick={() => setType("MARKETING")}
          className={`rounded-lg px-4 py-2.5 text-sm font-semibold ${type === "MARKETING" ? "bg-background shadow" : "text-muted-foreground"}`}
        >
          Marketing
        </button>
        <button
          onClick={() => setType("RECEPTION")}
          className={`rounded-lg px-4 py-2.5 text-sm font-semibold ${type === "RECEPTION" ? "bg-background shadow" : "text-muted-foreground"}`}
        >
          Reception
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Stat icon={Users} label="Saved staff" value={activeSavedCount} />
        <Stat icon={Clock3} label="Working now" value={activeCount} />
        <Stat icon={Clock3} label="Tracked hours" value={(totalMinutes / 60).toFixed(1)} />
        <Stat
          icon={Banknote}
          label="Monthly salary total"
          value={money(rows.reduce((sum, r) => sum + Number(r.monthlySalary || 0), 0))}
        />
        <Stat icon={AlertTriangle} label="3H GPS review" value={missedCount} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" /> Add / Assign {type === "MARKETING" ? "Marketing" : "Reception"} Staff
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                if (selectedUser) setSelectedUser(null);
              }}
              placeholder="User name, email वा phone खोज्नुहोस्"
              className="pl-9 pr-10"
            />
            {selectedUser && (
              <button
                type="button"
                onClick={clearSelection}
                className="absolute right-3 top-2.5 rounded p-1 text-muted-foreground hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            {userResults.length > 0 && !selectedUser && (
              <div className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border bg-background shadow-lg">
                {userResults.map((u) => {
                  const saved = profiles.find((p) => p.userId === u.id);
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => selectUser(u)}
                      className="flex w-full items-center justify-between border-b px-3 py-2 text-left text-sm hover:bg-muted"
                    >
                      <div>
                        <b>{u.name}</b>
                        <div className="text-xs text-muted-foreground">
                          {u.phoneNumber || "No phone"} · {u.email}
                        </div>
                      </div>
                      {saved && (
                        <Badge className="gap-1 bg-emerald-600">
                          <CheckCircle2 className="h-3 w-3" /> Saved
                        </Badge>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {selectedUser && (
            <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
              <UserCheck className="h-5 w-5" />
              <b>{selectedUser.name}</b> selected for staff tracking
            </div>
          )}

          <div className="grid gap-3 md:grid-cols-3">
            <div>
              <Label>Monthly Salary</Label>
              <Input
                type="number"
                min="0"
                value={form.monthlySalary}
                onChange={(e) => setForm((f) => ({ ...f, monthlySalary: e.target.value }))}
                placeholder="25000"
              />
            </div>
            <div>
              <Label>Allowed Start Time</Label>
              <Input
                type="time"
                value={form.allowedStartTime}
                onChange={(e) => setForm((f) => ({ ...f, allowedStartTime: e.target.value }))}
              />
            </div>
            <div>
              <Label>Expected End Time</Label>
              <Input
                type="time"
                value={form.expectedEndTime}
                onChange={(e) => setForm((f) => ({ ...f, expectedEndTime: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 rounded-lg border bg-muted/40 p-3 text-sm md:flex-row md:items-center md:justify-between">
            <span>
              Marketing staff को GPS work session भित्र मात्र track हुन्छ। 3 घण्टाभन्दा बढी GPS नआए payroll review flag देखिन्छ।
            </span>
            <Button onClick={() => void saveStaff()} disabled={saving || !selectedUser}>
              {saving ? "Saving..." : "Save to Staff Tracking"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Saved Staff / Staff Tracking List</CardTitle>
        </CardHeader>
        <CardContent>
          {profilesLoading ? (
            <div className="py-6 text-center text-sm text-muted-foreground">Loading saved staff...</div>
          ) : profiles.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">No saved staff found.</div>
          ) : (
            <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
              {profiles.map((profile) => (
                <button
                  key={profile.id}
                  type="button"
                  onClick={() => editSavedProfile(profile)}
                  className="rounded-xl border p-3 text-left transition hover:border-primary hover:bg-primary/5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <b className="truncate">{profile.name}</b>
                    <Badge variant={profile.active ? "default" : "secondary"}>
                      {profile.active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {profile.staffType} · {money(profile.monthlySalary)} · {String(profile.allowedStartTime).slice(0, 5)}–{String(profile.expectedEndTime).slice(0, 5)}
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{type === "MARKETING" ? "Marketing Field Staff" : "Reception Staff"}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1280px] text-sm">
              <thead className="bg-muted">
                <tr>
                  <Th>Staff</Th>
                  <Th>Salary</Th>
                  <Th>Schedule</Th>
                  <Th>Start</Th>
                  {type === "MARKETING" && <Th>Start location</Th>}
                  {type === "MARKETING" && <Th>Last location</Th>}
                  {type === "MARKETING" && <Th>3-hour GPS</Th>}
                  <Th>End</Th>
                  <Th>Worked</Th>
                  {type === "MARKETING" && <Th>Visits</Th>}
                  <Th>Status</Th>
                  <Th>Action</Th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={12} className="p-8 text-center">Loading...</td></tr>
                ) : rows.map((r) => {
                  const check = locationCheckState(r);
                  const startPoint = r.sessionId ? startLocations[r.sessionId] : null;
                  return (
                    <tr key={r.staffProfileId} className="border-t">
                      <Td>
                        <b>{r.name}</b>
                        <div className="text-xs text-muted-foreground">{r.phoneNumber || r.email}</div>
                      </Td>
                      <Td>{money(r.monthlySalary)}</Td>
                      <Td>{String(r.allowedStartTime).slice(0, 5)} – {String(r.expectedEndTime).slice(0, 5)}</Td>
                      <Td>{r.startedAt ? new Date(r.startedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "-"}</Td>
                      {type === "MARKETING" && (
                        <Td>
                          {startPoint ? (
                            <div>
                              <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{formatLocation(startPoint)}</span>
                              <div className="text-xs text-muted-foreground">{new Date(startPoint.receivedAt).toLocaleTimeString()}</div>
                            </div>
                          ) : "No start GPS"}
                        </Td>
                      )}
                      {type === "MARKETING" && (
                        <Td>
                          {r.lastLocationAt ? (
                            <div>
                              <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{Number(r.lastLatitude).toFixed(5)}, {Number(r.lastLongitude).toFixed(5)}</span>
                              <div className="text-xs text-muted-foreground">{new Date(r.lastLocationAt).toLocaleTimeString()}</div>
                            </div>
                          ) : "No location"}
                        </Td>
                      )}
                      {type === "MARKETING" && (
                        <Td>
                          <Badge
                            variant="outline"
                            className={
                              check.state === "missed"
                                ? "border-red-200 bg-red-50 text-red-700"
                                : check.state === "review"
                                  ? "border-amber-200 bg-amber-50 text-amber-700"
                                  : "border-emerald-200 bg-emerald-50 text-emerald-700"
                            }
                          >
                            {check.label}
                          </Badge>
                          <div className="mt-1 text-xs text-muted-foreground">{check.detail}</div>
                        </Td>
                      )}
                      <Td>{r.endedAt ? new Date(r.endedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "-"}</Td>
                      <Td>{Number(r.totalMinutes || 0)} min</Td>
                      {type === "MARKETING" && <Td>{r.visitCount || 0}</Td>}
                      <Td><Badge variant={r.status === "ACTIVE" ? "default" : "secondary"}>{r.status || "NO SESSION"}</Badge></Td>
                      <Td>
                        {type === "MARKETING" && r.sessionId ? (
                          <Button size="sm" variant="outline" onClick={() => void openRoute(r.sessionId)}>
                            <Route className="mr-1 h-4 w-4" /> Route
                          </Button>
                        ) : "-"}
                      </Td>
                    </tr>
                  );
                })}
                {!loading && rows.length === 0 && (
                  <tr><td colSpan={12} className="p-8 text-center text-muted-foreground">No staff found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card className="border-amber-200 bg-amber-50/40">
        <CardContent className="p-4 text-sm">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
            <div>
              <b>Payroll review rule:</b> 3 घण्टाभन्दा बढी GPS gap भए admin मा review flag आउँछ। GPS/browser/network failure हुन सक्ने भएकाले system ले आफैं salary काट्दैन; payroll adjustment गर्नु अघि admin ले कारण verify गर्नुहोस्।
            </div>
          </div>
        </CardContent>
      </Card>

      {routeData && (
        <Card className="border-primary/30">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Field Route / Tracking Points</CardTitle>
              <Button variant="ghost" onClick={() => setRouteData(null)}>Close</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4 rounded-xl border bg-muted/50 p-3 text-sm">
              <b>Start location:</b> {formatLocation(routeData.points?.[0])}
              {routeData.points?.[0]?.receivedAt && (
                <span className="ml-2 text-muted-foreground">· {new Date(routeData.points[0].receivedAt).toLocaleString()}</span>
              )}
            </div>
            <p className="mb-3 text-sm text-muted-foreground">
              Website background GPS guarantee गर्दैन। Browser बन्द/suspend वा permission blocked भए gap आउन सक्छ।
            </p>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <h3 className="mb-2 font-semibold">Location points ({routeData.points?.length || 0})</h3>
                <div className="max-h-72 space-y-1 overflow-y-auto text-xs">
                  {routeData.points?.map((p: any) => (
                    <div key={p.id} className="rounded border p-2">
                      {Number(p.latitude).toFixed(5)}, {Number(p.longitude).toFixed(5)} · ±{Math.round(Number(p.accuracy || 0))}m · {new Date(p.receivedAt).toLocaleString()}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="mb-2 font-semibold">Visits ({routeData.visits?.length || 0})</h3>
                <div className="max-h-72 space-y-1 overflow-y-auto text-xs">
                  {routeData.visits?.map((v: any) => (
                    <div key={v.id} className="rounded border p-2">
                      <b>{v.leadName || "Field visit"}</b>
                      <div>{v.note || "No note"}</div>
                      <div className="text-muted-foreground">{new Date(v.checkedInAt).toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Stat({ icon: Icon, label, value }: any) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <span className="rounded-lg bg-primary/10 p-2"><Icon className="h-5 w-5 text-primary" /></span>
        <div><div className="text-xs text-muted-foreground">{label}</div><div className="text-xl font-bold">{value}</div></div>
      </CardContent>
    </Card>
  );
}

function Th({ children }: any) {
  return <th className="px-3 py-3 text-left font-semibold">{children}</th>;
}

function Td({ children }: any) {
  return <td className="px-3 py-3 align-top">{children}</td>;
}
