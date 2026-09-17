"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Banknote,
  CheckCircle2,
  Clock3,
  MapPin,
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
  const [form, setForm] = useState({
    monthlySalary: "",
    allowedStartTime: "09:00",
    expectedEndTime: "17:00",
  });

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
        allowedStartTime: String(existingProfile.allowedStartTime || "09:00").slice(
          0,
          5,
        ),
        expectedEndTime: String(existingProfile.expectedEndTime || "17:00").slice(
          0,
          5,
        ),
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

      toast.success(
        `${selectedUser.name} लाई Staff Tracking मा save गरियो`,
      );
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
            User लाई tick/select गरेर Staff Tracking मा save गर्नुहोस्। Saved staff
            छुट्टै list मा देखिन्छ।
          </p>
        </div>
        <Input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full md:w-44"
        />
      </div>

      <div className="grid grid-cols-2 gap-2 rounded-xl bg-muted p-1 md:w-[420px]">
        <button
          onClick={() => setType("MARKETING")}
          className={`rounded-lg px-4 py-2.5 text-sm font-semibold ${
            type === "MARKETING"
              ? "bg-background shadow"
              : "text-muted-foreground"
          }`}
        >
          Marketing
        </button>
        <button
          onClick={() => setType("RECEPTION")}
          className={`rounded-lg px-4 py-2.5 text-sm font-semibold ${
            type === "RECEPTION"
              ? "bg-background shadow"
              : "text-muted-foreground"
          }`}
        >
          Reception
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={Users} label="Saved staff" value={profiles.length} />
        <Stat icon={UserCheck} label="Active saved" value={activeSavedCount} />
        <Stat icon={Clock3} label="Working now" value={activeCount} />
        <Stat
          icon={Banknote}
          label="Monthly salary total"
          value={money(
            rows.reduce(
              (sum, r) => sum + Number(r.monthlySalary || 0),
              0,
            ),
          )}
        />
      </div>

      <Card className="border-emerald-200 bg-emerald-50/30">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              Saved Staff / Staff Tracking List
            </CardTitle>
            <Badge
              variant="outline"
              className="w-fit border-emerald-200 bg-white text-emerald-700"
            >
              {profiles.length} saved
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {profilesLoading ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Saved staff loading...
            </div>
          ) : profiles.length === 0 ? (
            <div className="rounded-xl border border-dashed bg-white p-6 text-center">
              <UserPlus className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
              <p className="font-semibold">अहिलेसम्म staff save गरिएको छैन।</p>
              <p className="mt-1 text-xs text-muted-foreground">
                तल user खोजेर tick/select गरी Save to Staff Tracking गर्नुहोस्।
              </p>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {profiles.map((profile) => (
                <button
                  key={profile.id}
                  type="button"
                  onClick={() => editSavedProfile(profile)}
                  className="rounded-xl border bg-white p-3 text-left transition hover:border-primary/40 hover:shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                          <CheckCircle2 className="h-4 w-4" />
                        </span>
                        <b className="truncate">{profile.name}</b>
                      </div>
                      <p className="mt-1 truncate text-xs text-muted-foreground">
                        {profile.phoneNumber || profile.email || "No contact"}
                      </p>
                    </div>
                    <Badge
                      variant={profile.active ? "default" : "secondary"}
                      className="shrink-0"
                    >
                      {profile.active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    <Badge variant="outline">{profile.staffType}</Badge>
                    <Badge variant="outline">{money(profile.monthlySalary)}</Badge>
                    <Badge variant="outline">
                      {String(profile.allowedStartTime).slice(0, 5)} –{" "}
                      {String(profile.expectedEndTime).slice(0, 5)}
                    </Badge>
                  </div>
                  <p className="mt-2 text-[11px] font-medium text-primary">
                    Click to edit / select
                  </p>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Add / Assign {type === "MARKETING" ? "Marketing" : "Reception"} Staff
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
            {(search || selectedUser) && (
              <button
                type="button"
                onClick={clearSelection}
                className="absolute right-3 top-2.5 rounded-full p-1 text-muted-foreground hover:bg-muted"
                aria-label="Clear user selection"
              >
                <X className="h-4 w-4" />
              </button>
            )}

            {userResults.length > 0 && !selectedUser && (
              <div className="absolute z-20 mt-1 max-h-72 w-full overflow-y-auto rounded-lg border bg-background shadow-lg">
                {userResults.map((u) => {
                  const alreadySaved = profiles.some(
                    (profile) => profile.userId === u.id,
                  );
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => selectUser(u)}
                      className="flex w-full items-center gap-3 border-b px-3 py-3 text-left text-sm hover:bg-muted"
                    >
                      <span
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border ${
                          alreadySaved
                            ? "border-emerald-500 bg-emerald-500 text-white"
                            : "border-slate-300 bg-white"
                        }`}
                      >
                        {alreadySaved && <CheckCircle2 className="h-4 w-4" />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <b className="block truncate">{u.name}</b>
                        <span className="block truncate text-xs text-muted-foreground">
                          {u.phoneNumber || "No phone"} · {u.email || "No email"}
                        </span>
                      </span>
                      {alreadySaved && (
                        <Badge
                          variant="outline"
                          className="border-emerald-200 bg-emerald-50 text-emerald-700"
                        >
                          Saved
                        </Badge>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {selectedUser && (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white">
                  <CheckCircle2 className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">
                    {selectedUser.name} ✓ Selected
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {selectedUser.phoneNumber || selectedUser.email || "No contact"}
                  </p>
                </div>
              </div>
              <Button size="sm" variant="ghost" onClick={clearSelection}>
                Change
              </Button>
            </div>
          )}

          <div className="grid gap-3 md:grid-cols-3">
            <div>
              <Label>Monthly Salary</Label>
              <Input
                type="number"
                min="0"
                value={form.monthlySalary}
                onChange={(e) =>
                  setForm((f) => ({ ...f, monthlySalary: e.target.value }))
                }
                placeholder="25000"
              />
            </div>
            <div>
              <Label>Allowed Start Time</Label>
              <Input
                type="time"
                value={form.allowedStartTime}
                onChange={(e) =>
                  setForm((f) => ({ ...f, allowedStartTime: e.target.value }))
                }
              />
            </div>
            <div>
              <Label>Expected End Time</Label>
              <Input
                type="time"
                value={form.expectedEndTime}
                onChange={(e) =>
                  setForm((f) => ({ ...f, expectedEndTime: e.target.value }))
                }
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 rounded-lg border bg-muted/40 p-3 text-sm sm:flex-row sm:items-center sm:justify-between">
            <span>
              User select गरेपछि माथि green tick देखिन्छ। Save गरेपछि त्यो user Saved
              Staff list र Staff Tracking dashboard दुबैमा देखिन्छ।
            </span>
            <Button
              onClick={() => void saveStaff()}
              disabled={saving || !selectedUser}
              className="shrink-0"
            >
              {saving ? "Saving..." : "Save to Staff Tracking"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            {type === "MARKETING" ? "Marketing Field Staff" : "Reception Staff"}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] text-sm">
              <thead className="bg-muted">
                <tr>
                  <Th>Staff</Th>
                  <Th>Salary</Th>
                  <Th>Schedule</Th>
                  <Th>Start</Th>
                  <Th>End</Th>
                  <Th>Worked</Th>
                  {type === "MARKETING" && (
                    <>
                      <Th>Last location</Th>
                      <Th>Visits</Th>
                    </>
                  )}
                  <Th>Status</Th>
                  <Th>Action</Th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={10} className="p-8 text-center">
                      Loading...
                    </td>
                  </tr>
                ) : (
                  rows.map((r) => (
                    <tr key={r.staffProfileId} className="border-t">
                      <Td>
                        <b>{r.name}</b>
                        <div className="text-xs text-muted-foreground">
                          {r.phoneNumber || r.email}
                        </div>
                      </Td>
                      <Td>{money(r.monthlySalary)}</Td>
                      <Td>
                        {String(r.allowedStartTime).slice(0, 5)} –{" "}
                        {String(r.expectedEndTime).slice(0, 5)}
                      </Td>
                      <Td>
                        {r.startedAt
                          ? new Date(r.startedAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "-"}
                      </Td>
                      <Td>
                        {r.endedAt
                          ? new Date(r.endedAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "-"}
                      </Td>
                      <Td>{Number(r.totalMinutes || 0)} min</Td>
                      {type === "MARKETING" && (
                        <>
                          <Td>
                            {r.lastLocationAt ? (
                              <div>
                                <span className="inline-flex items-center gap-1">
                                  <MapPin className="h-3.5 w-3.5" />
                                  {Number(r.lastLatitude).toFixed(4)},{" "}
                                  {Number(r.lastLongitude).toFixed(4)}
                                </span>
                                <div className="text-xs text-muted-foreground">
                                  {new Date(r.lastLocationAt).toLocaleTimeString()}
                                </div>
                              </div>
                            ) : (
                              "No location"
                            )}
                          </Td>
                          <Td>{r.visitCount || 0}</Td>
                        </>
                      )}
                      <Td>
                        <Badge
                          variant={r.status === "ACTIVE" ? "default" : "secondary"}
                        >
                          {r.status || "NO SESSION"}
                        </Badge>
                      </Td>
                      <Td>
                        {type === "MARKETING" && r.sessionId ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => void openRoute(r.sessionId)}
                          >
                            <Route className="mr-1 h-4 w-4" /> Route
                          </Button>
                        ) : (
                          "-"
                        )}
                      </Td>
                    </tr>
                  ))
                )}
                {!loading && rows.length === 0 && (
                  <tr>
                    <td colSpan={10} className="p-8 text-center text-muted-foreground">
                      No staff found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {routeData && (
        <Card className="border-primary/30">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Field Route / Tracking Points</CardTitle>
              <Button variant="ghost" onClick={() => setRouteData(null)}>
                Close
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <p className="mb-3 text-sm text-muted-foreground">
              Website background GPS guarantee गर्दैन। बीचमा browser बन्द/suspend भए gaps
              हुन सक्छन्। यहाँ server ले पाएका points मात्र देखाइन्छ।
            </p>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <h3 className="mb-2 font-semibold">
                  Location points ({routeData.points?.length || 0})
                </h3>
                <div className="max-h-72 space-y-1 overflow-y-auto text-xs">
                  {routeData.points?.map((p: any) => (
                    <div key={p.id} className="rounded border p-2">
                      {Number(p.latitude).toFixed(5)},{" "}
                      {Number(p.longitude).toFixed(5)} · ±
                      {Math.round(Number(p.accuracy || 0))}m ·{" "}
                      {new Date(p.receivedAt).toLocaleString()}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="mb-2 font-semibold">
                  Visits ({routeData.visits?.length || 0})
                </h3>
                <div className="max-h-72 space-y-1 overflow-y-auto text-xs">
                  {routeData.visits?.map((v: any) => (
                    <div key={v.id} className="rounded border p-2">
                      <b>{v.leadName || "Field visit"}</b>
                      <div>{v.note || "No note"}</div>
                      <div className="text-muted-foreground">
                        {new Date(v.checkedInAt).toLocaleString()}
                      </div>
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
        <span className="rounded-lg bg-primary/10 p-2">
          <Icon className="h-5 w-5 text-primary" />
        </span>
        <div>
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className="text-xl font-bold">{value}</div>
        </div>
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
