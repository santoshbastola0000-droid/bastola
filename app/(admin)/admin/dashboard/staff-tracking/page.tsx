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
import { Switch } from "@/components/ui/switch";
import {
  staffTrackingService,
  StaffType,
} from "@/http/services/staff-tracking.service";

const money = (value: unknown) =>
  `Rs. ${Number(value || 0).toLocaleString(undefined, {
    maximumFractionDigits: 2,
  })}`;

const weekdays = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
];

function formatLocation(point?: any) {
  if (!point) return "No location";
  const lat = Number(point.latitude);
  const lng = Number(point.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return "No location";
  return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}

function locationCheckState(row: any) {
  if (row.staffType !== "MARKETING" || !row.sessionId) {
    return { state: "not-required", label: "Not required", detail: "No active marketing session" };
  }

  const referenceRaw = row.lastLocationAt || row.startedAt;
  if (!referenceRaw) {
    return { state: "missed", label: "Location missing", detail: "No GPS received" };
  }

  const reference = new Date(referenceRaw).getTime();
  const now = row.endedAt ? new Date(row.endedAt).getTime() : Date.now();
  const gapMs = Math.max(0, now - reference);
  const intervalHours = Number(row.trackingIntervalHours || 3);
  const limitMs = intervalHours * 60 * 60 * 1000;
  const hours = gapMs / (60 * 60 * 1000);

  if (row.status === "ACTIVE" && gapMs > limitMs) {
    return {
      state: "missed",
      label: `${intervalHours}H check missed`,
      detail: `${hours.toFixed(1)}h since last GPS`,
    };
  }

  if (row.status === "ACTIVE") {
    const remaining = Math.max(0, (limitMs - gapMs) / (60 * 60 * 1000));
    return {
      state: "ok",
      label: "GPS OK",
      detail: `Next check within ${remaining.toFixed(1)}h`,
    };
  }

  return {
    state: gapMs > limitMs ? "review" : "ok",
    label: gapMs > limitMs ? "Review gap" : "Completed",
    detail: `${hours.toFixed(1)}h final GPS gap`,
  };
}

function calendarBreakdown(profile: any, date: string) {
  const [year, month] = date.split("-").map(Number);
  const calendarDays = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const offDay = String(profile?.weeklyOffDay || "SATURDAY").toUpperCase();
  let weeklyOffDays = 0;
  for (let day = 1; day <= calendarDays; day += 1) {
    const weekday = weekdays[new Date(Date.UTC(year, month - 1, day)).getUTCDay()];
    if (weekday === offDay) weeklyOffDays += 1;
  }
  const workDays = Math.max(1, calendarDays - weeklyOffDays);
  return {
    calendarDays,
    weeklyOffDays,
    workDays,
    dailyRate: Number(profile?.monthlySalary || 0) / workDays,
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
  const [accessBusyUserId, setAccessBusyUserId] = useState<string | null>(null);
  const [routeData, setRouteData] = useState<any>(null);
  const [form, setForm] = useState({
    monthlySalary: "",
    allowedStartTime: "13:00",
    expectedEndTime: "17:00",
    maxRadiusKm: "2",
    trackingIntervalHours: "3",
    startGraceMinutes: "15",
    checkoutGraceMinutes: "15",
    weeklyOffDay: "SATURDAY",
    offDayBonus: "100",
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
  const creditedToday = useMemo(
    () => rows.reduce((sum, r) => sum + (r.creditStatus === "CREDITED" ? Number(r.creditAmount || 0) : 0), 0),
    [rows],
  );
  const noCreditCount = useMemo(
    () => rows.filter((r) => r.creditStatus === "NO_CREDIT").length,
    [rows],
  );

  const resetForm = (staffType: StaffType = type) => {
    setForm({
      monthlySalary: "",
      allowedStartTime: staffType === "MARKETING" ? "13:00" : "09:00",
      expectedEndTime: "17:00",
      maxRadiusKm: "2",
      trackingIntervalHours: "3",
      startGraceMinutes: "15",
      checkoutGraceMinutes: "15",
      weeklyOffDay: "SATURDAY",
      offDayBonus: "100",
    });
  };

  const clearSelection = () => {
    setSelectedUser(null);
    setSearch("");
    setUserResults([]);
    resetForm();
  };

  const selectUser = (user: any) => {
    setSelectedUser(user);
    setSearch(user.name || user.phoneNumber || user.email || "Selected user");
    setUserResults([]);

    const existingProfile = profiles.find((profile) => profile.userId === user.id);
    if (existingProfile) {
      setType(existingProfile.staffType);
      setForm({
        monthlySalary: String(existingProfile.monthlySalary || ""),
        allowedStartTime: String(existingProfile.allowedStartTime || "13:00").slice(0, 5),
        expectedEndTime: String(existingProfile.expectedEndTime || "17:00").slice(0, 5),
        maxRadiusKm: String(existingProfile.maxRadiusKm || 2),
        trackingIntervalHours: String(existingProfile.trackingIntervalHours || 3),
        startGraceMinutes: String(existingProfile.startGraceMinutes || 15),
        checkoutGraceMinutes: String(existingProfile.checkoutGraceMinutes || 15),
        weeklyOffDay: String(existingProfile.weeklyOffDay || "SATURDAY"),
        offDayBonus: String(existingProfile.offDayBonus || 100),
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

  const changeType = (nextType: StaffType) => {
    setType(nextType);
    if (!selectedUser || !profiles.some((profile) => profile.userId === selectedUser.id)) {
      resetForm(nextType);
    }
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
        maxRadiusKm: Number(form.maxRadiusKm || 2),
        trackingIntervalHours: Number(form.trackingIntervalHours || 3),
        startGraceMinutes: Number(form.startGraceMinutes || 15),
        checkoutGraceMinutes: Number(form.checkoutGraceMinutes || 15),
        weeklyOffDay: form.weeklyOffDay,
        offDayBonus: Number(form.offDayBonus || 100),
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

  const toggleStaffAccess = async (
    profile: any,
    active: boolean,
  ) => {
    try {
      setAccessBusyUserId(profile.userId);
      await staffTrackingService.setAccess(profile.userId, active);

      setProfiles((current) =>
        current.map((item) =>
          item.userId === profile.userId
            ? { ...item, active }
            : item,
        ),
      );

      setRows((current) =>
        current.map((item) =>
          item.userId === profile.userId
            ? { ...item, active }
            : item,
        ),
      );

      toast.success(
        active
          ? `${profile.name} को Staff Tracking sidebar ON भयो`
          : `${profile.name} को Staff Tracking sidebar OFF भयो`,
      );
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          "Staff Tracking access update failed",
      );
    } finally {
      setAccessBusyUserId(null);
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

  const selectedCalendar = calendarBreakdown(
    {
      monthlySalary: form.monthlySalary,
      weeklyOffDay: form.weeklyOffDay,
    },
    date,
  );

  return (
    <div className="space-y-5 p-4 md:p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Staff Tracking System</h1>
          <p className="text-sm text-muted-foreground">
            Marketing 1–5 shift, 2 km work-zone, GPS verification र daily wallet credit एउटै ठाउँबाट manage गर्नुहोस्।
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
          onClick={() => changeType("MARKETING")}
          className={`rounded-lg px-4 py-2.5 text-sm font-semibold ${
            type === "MARKETING" ? "bg-background shadow" : "text-muted-foreground"
          }`}
        >
          Marketing
        </button>
        <button
          onClick={() => changeType("RECEPTION")}
          className={`rounded-lg px-4 py-2.5 text-sm font-semibold ${
            type === "RECEPTION" ? "bg-background shadow" : "text-muted-foreground"
          }`}
        >
          Reception
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        <Stat icon={Users} label="Saved staff" value={activeSavedCount} />
        <Stat icon={Clock3} label="Working now" value={activeCount} />
        <Stat icon={Clock3} label="Tracked hours" value={(totalMinutes / 60).toFixed(1)} />
        <Stat icon={Banknote} label="Credited today" value={money(creditedToday)} />
        <Stat icon={AlertTriangle} label="No credit" value={noCreditCount} />
        <Stat icon={AlertTriangle} label="GPS review" value={missedCount} />
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

          <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-4">
            <Field label="Monthly Salary">
              <Input
                type="number"
                min="0"
                value={form.monthlySalary}
                onChange={(e) => setForm((f) => ({ ...f, monthlySalary: e.target.value }))}
                placeholder="25000"
              />
            </Field>
            <Field label="Allowed Start Time">
              <Input
                type="time"
                value={form.allowedStartTime}
                onChange={(e) => setForm((f) => ({ ...f, allowedStartTime: e.target.value }))}
              />
            </Field>
            <Field label="Expected End / Final GPS">
              <Input
                type="time"
                value={form.expectedEndTime}
                onChange={(e) => setForm((f) => ({ ...f, expectedEndTime: e.target.value }))}
              />
            </Field>
            <Field label="Work Radius (km)">
              <Input
                type="number"
                min="0.1"
                step="0.1"
                value={form.maxRadiusKm}
                onChange={(e) => setForm((f) => ({ ...f, maxRadiusKm: e.target.value }))}
              />
            </Field>
            <Field label="GPS Check Every (hours)">
              <Input
                type="number"
                min="1"
                max="12"
                value={form.trackingIntervalHours}
                onChange={(e) => setForm((f) => ({ ...f, trackingIntervalHours: e.target.value }))}
              />
            </Field>
            <Field label="Start Grace (minutes)">
              <Input
                type="number"
                min="0"
                max="120"
                value={form.startGraceMinutes}
                onChange={(e) => setForm((f) => ({ ...f, startGraceMinutes: e.target.value }))}
              />
            </Field>
            <Field label="5 PM Checkout Grace (minutes)">
              <Input
                type="number"
                min="0"
                max="120"
                value={form.checkoutGraceMinutes}
                onChange={(e) => setForm((f) => ({ ...f, checkoutGraceMinutes: e.target.value }))}
              />
            </Field>
            <Field label="Weekly Off Day">
              <select
                value={form.weeklyOffDay}
                onChange={(e) => setForm((f) => ({ ...f, weeklyOffDay: e.target.value }))}
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              >
                {weekdays.map((day) => (
                  <option key={day} value={day}>
                    {day}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Off-day Extra Credit">
              <Input
                type="number"
                min="0"
                value={form.offDayBonus}
                onChange={(e) => setForm((f) => ({ ...f, offDayBonus: e.target.value }))}
              />
            </Field>
          </div>

          {type === "MARKETING" && (
            <div className="grid gap-2 rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm sm:grid-cols-2 lg:grid-cols-5">
              <Policy label="Month" value={`${selectedCalendar.calendarDays} days`} />
              <Policy label="Work days" value={`${selectedCalendar.workDays} days`} />
              <Policy label="Weekly off" value={`${selectedCalendar.weeklyOffDays} days/month`} />
              <Policy label="Normal daily credit" value={money(selectedCalendar.dailyRate)} />
              <Policy label="Off-day work credit" value={`${money(selectedCalendar.dailyRate)} + ${money(form.offDayBonus)}`} />
            </div>
          )}

          <div className="flex flex-col gap-3 rounded-lg border bg-muted/40 p-3 text-sm md:flex-row md:items-center md:justify-between">
            <span>
              Marketing default: 13:00–17:00, 2 km radius, 3-hour GPS check, Saturday weekly off। Shift end मा valid location आए मात्र daily rate wallet मा credit हुन्छ; weekly off मा काम गरे configured +Rs.100 bonus थपिन्छ।
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
              {profiles.map((profile) => {
                const cal = calendarBreakdown(profile, date);
                return (
                  <div
                    key={profile.id}
                    className="rounded-xl border p-3 transition hover:border-primary hover:bg-primary/5"
                  >
                    <button
                      type="button"
                      onClick={() => editSavedProfile(profile)}
                      className="block w-full text-left"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <b className="truncate">{profile.name}</b>
                        <Badge variant={profile.active ? "default" : "secondary"}>
                          {profile.active ? "Allowed" : "Hidden"}
                        </Badge>
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {profile.staffType} · {money(profile.monthlySalary)} · {String(profile.allowedStartTime).slice(0, 5)}–{String(profile.expectedEndTime).slice(0, 5)}
                      </div>
                      {profile.staffType === "MARKETING" && (
                        <div className="mt-2 text-xs text-slate-600">
                          {Number(profile.maxRadiusKm || 2)} km · {profile.weeklyOffDay || "SATURDAY"} off · +{money(profile.offDayBonus || 100)} off-day · {cal.workDays}/{cal.calendarDays} work days
                        </div>
                      )}
                    </button>

                    <div className="mt-3 flex items-center justify-between gap-3 border-t pt-3">
                      <div>
                        <div className="text-xs font-bold text-foreground">
                          Staff Tracking sidebar
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {profile.active
                            ? "यो user लाई sidebar र tracking access देखिन्छ"
                            : "यो user बाट sidebar र tracking access hide छ"}
                        </div>
                      </div>

                      <Switch
                        checked={Boolean(profile.active)}
                        disabled={accessBusyUserId === profile.userId}
                        onCheckedChange={(checked) =>
                          void toggleStaffAccess(profile, Boolean(checked))
                        }
                        aria-label={`Staff Tracking access for ${profile.name}`}
                      />
                    </div>
                  </div>
                );
              })}
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
            <table className="w-full min-w-[1450px] text-sm">
              <thead className="bg-muted">
                <tr>
                  <Th>Staff</Th>
                  <Th>Salary</Th>
                  <Th>Schedule</Th>
                  <Th>Start</Th>
                  {type === "MARKETING" && <Th>Start location</Th>}
                  {type === "MARKETING" && <Th>Last location</Th>}
                  {type === "MARKETING" && <Th>2 km zone</Th>}
                  {type === "MARKETING" && <Th>GPS check</Th>}
                  <Th>End</Th>
                  <Th>Worked</Th>
                  {type === "MARKETING" && <Th>Wallet credit</Th>}
                  {type === "MARKETING" && <Th>Visits</Th>}
                  <Th>Status</Th>
                  <Th>Action</Th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={14} className="p-8 text-center">Loading...</td></tr>
                ) : rows.map((r) => {
                  const check = locationCheckState(r);
                  const maxDistance = Number(r.maxDistanceKm || 0);
                  const outCount = Number(r.outOfRadiusCount || 0);
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
                          {r.startLatitude != null ? (
                            <div>
                              <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{formatLocation({ latitude: r.startLatitude, longitude: r.startLongitude })}</span>
                            </div>
                          ) : "No start GPS"}
                        </Td>
                      )}
                      {type === "MARKETING" && (
                        <Td>
                          {r.lastLocationAt ? (
                            <div>
                              <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{Number(r.lastLatitude).toFixed(5)}, {Number(r.lastLongitude).toFixed(5)}</span>
                              <div className="text-xs text-muted-foreground">{new Date(r.lastLocationAt).toLocaleTimeString()} · {Number(r.lastDistanceKm || 0).toFixed(2)} km</div>
                            </div>
                          ) : "No location"}
                        </Td>
                      )}
                      {type === "MARKETING" && (
                        <Td>
                          <Badge
                            variant="outline"
                            className={outCount > 0 ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}
                          >
                            {outCount > 0 ? `${outCount} outside` : "Inside zone"}
                          </Badge>
                          <div className="mt-1 text-xs text-muted-foreground">Max {maxDistance.toFixed(2)} / {Number(r.maxRadiusKm || 2)} km</div>
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
                      {type === "MARKETING" && (
                        <Td>
                          <Badge
                            variant="outline"
                            className={
                              r.creditStatus === "CREDITED"
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                : r.creditStatus === "NO_CREDIT"
                                  ? "border-red-200 bg-red-50 text-red-700"
                                  : "border-slate-200 bg-slate-50 text-slate-600"
                            }
                          >
                            {r.creditStatus || "PENDING"}
                          </Badge>
                          {r.creditStatus === "CREDITED" && (
                            <div className="mt-1 font-semibold text-emerald-700">+{money(r.creditAmount)}</div>
                          )}
                          {r.creditReason && (
                            <div className="mt-1 max-w-[260px] text-xs text-muted-foreground">{r.creditReason}</div>
                          )}
                        </Td>
                      )}
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
                  <tr><td colSpan={14} className="p-8 text-center text-muted-foreground">No staff found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card className="border-blue-200 bg-blue-50/40">
        <CardContent className="p-4 text-sm">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-700" />
            <div>
              <b>Wallet credit rule:</b> Marketing staff ले configured start window भित्र काम सुरु गरेको, GPS gap configured limit ननाघेको, start location बाट work radius बाहिर नगएको र shift end (+ grace) भित्र final location server मा पठाएको अवस्थामा मात्र daily salary rate wallet मा credit हुन्छ। Weekly off मा काम गरे normal daily rate माथि configured bonus थपिन्छ।
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
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-3">
              <Policy label="Start location" value={formatLocation(routeData.points?.[0])} />
              <Policy label="Work radius" value={`${Number(routeData.session?.maxRadiusKm || 2)} km`} />
              <Policy
                label="Wallet credit"
                value={routeData.credit ? `${routeData.credit.eligible ? "CREDITED" : "NO CREDIT"} ${routeData.credit.eligible ? money(routeData.credit.totalAmount) : ""}` : "Pending"}
              />
            </div>

            {routeData.credit?.reason && (
              <div className={`rounded-lg border p-3 text-sm ${routeData.credit.eligible ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-800"}`}>
                {routeData.credit.reason}
              </div>
            )}

            <p className="text-sm text-muted-foreground">
              Browser बन्द/suspend वा permission blocked भए GPS gap आउन सक्छ। Server मा प्राप्त भएको point मात्र यहाँ देखाइन्छ।
            </p>

            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <h3 className="mb-2 font-semibold">Location points ({routeData.points?.length || 0})</h3>
                <div className="max-h-80 space-y-1 overflow-y-auto text-xs">
                  {routeData.points?.map((p: any) => (
                    <div key={p.id} className={`rounded border p-2 ${p.withinRadius === false ? "border-red-200 bg-red-50" : ""}`}>
                      <div className="font-semibold">{p.source || "AUTO"} · {Number(p.distanceFromStartKm || 0).toFixed(2)} km · {p.withinRadius === false ? "OUTSIDE" : "inside"}</div>
                      <div>{Number(p.latitude).toFixed(5)}, {Number(p.longitude).toFixed(5)} · ±{Math.round(Number(p.accuracy || 0))}m</div>
                      <div className="text-muted-foreground">{new Date(p.receivedAt).toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="mb-2 font-semibold">Visits ({routeData.visits?.length || 0})</h3>
                <div className="max-h-80 space-y-1 overflow-y-auto text-xs">
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function Policy({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-background/70 p-2.5">
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className="mt-0.5 font-semibold">{value}</div>
    </div>
  );
}

function Th({ children }: any) {
  return <th className="px-3 py-3 text-left font-semibold">{children}</th>;
}

function Td({ children }: any) {
  return <td className="px-3 py-3 align-top">{children}</td>;
}
