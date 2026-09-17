"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Banknote,
  CalendarDays,
  CheckCircle2,
  Clock3,
  HousePlus,
  MapPin,
  Navigation,
  Play,
  RefreshCw,
  ShieldCheck,
  Square,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { staffTrackingService } from "@/http/services/staff-tracking.service";

type PositionPayload = {
  latitude: number;
  longitude: number;
  accuracy: number;
  capturedAt: string;
  source?: string;
};

function positionPayload(position: GeolocationPosition): PositionPayload {
  return {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    accuracy: position.coords.accuracy,
    capturedAt: new Date(position.timestamp).toISOString(),
  };
}

function getPosition(): Promise<PositionPayload> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error("Location not supported"));
    navigator.geolocation.getCurrentPosition(
      (position) => resolve(positionPayload(position)),
      reject,
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 15000 },
    );
  });
}

function formatDuration(ms: number) {
  const safe = Math.max(0, ms);
  const totalMinutes = Math.ceil(safe / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours <= 0) return `${minutes} min`;
  return `${hours}h ${minutes}m`;
}

function timeLabel(value?: string) {
  return String(value || "").slice(0, 5);
}

function money(value: unknown) {
  return `Rs. ${Number(value || 0).toLocaleString(undefined, {
    maximumFractionDigits: 2,
  })}`;
}

export default function StaffTrackingPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [trackingState, setTrackingState] = useState("Stopped");
  const [lastLocationAt, setLastLocationAt] = useState<string | null>(null);
  const [lastRequiredCheckAt, setLastRequiredCheckAt] = useState<string | null>(null);
  const [clockNow, setClockNow] = useState(() => Date.now());
  const [permissionState, setPermissionState] = useState<string>("unknown");
  const [currentDistanceKm, setCurrentDistanceKm] = useState<number | null>(null);
  const [visit, setVisit] = useState({ leadName: "", note: "", roomId: "" });
  const watchIdRef = useRef<number | null>(null);
  const lastPingRef = useRef(0);
  const dueToastShownRef = useRef(false);

  const load = async () => {
    try {
      setData(await staffTrackingService.getMe());
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Staff profile भेटिएन");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setClockNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let active = true;
    const updatePermission = async () => {
      try {
        if (!("permissions" in navigator)) return;
        const status = await navigator.permissions.query({
          name: "geolocation" as PermissionName,
        });
        if (!active) return;
        setPermissionState(status.state);
        status.onchange = () => setPermissionState(status.state);
      } catch {
        setPermissionState("unknown");
      }
    };
    void updatePermission();
    return () => {
      active = false;
    };
  }, []);

  const stopWatcher = () => {
    if (watchIdRef.current !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }
    watchIdRef.current = null;
    setTrackingState("Stopped");
  };

  const handleCreditResult = async (credit: any, automatic = false) => {
    if (!credit) return;
    if (credit.eligible) {
      toast.success(`${automatic ? "5 PM location verified automatically. " : ""}${money(credit.amount)} wallet मा credit भयो`, {
        description:
          Number(credit.bonusAmount || 0) > 0
            ? `Weekly-off bonus ${money(credit.bonusAmount)} सहित।`
            : "आजको eligible work-day credit सफल भयो।",
        duration: 9000,
      });
    } else {
      toast.error("आज wallet credit भएन", {
        description: credit.reason || "Tracking rule पूरा भएन।",
        duration: 12000,
      });
    }
  };

  const startWatcher = () => {
    if (
      !navigator.geolocation ||
      data?.profile?.staffType !== "MARKETING" ||
      watchIdRef.current !== null
    ) {
      return;
    }

    setTrackingState("Tracking active");
    watchIdRef.current = navigator.geolocation.watchPosition(
      async (position) => {
        const now = Date.now();
        if (now - lastPingRef.current < 45_000) return;
        lastPingRef.current = now;
        try {
          const result = await staffTrackingService.pingLocation({
            ...positionPayload(position),
            source: "AUTO",
          });
          setLastLocationAt(new Date().toISOString());
          setTrackingState("Tracking active");
          setPermissionState("granted");
          if (Number.isFinite(Number(result?.distanceFromStartKm))) {
            setCurrentDistanceKm(Number(result.distanceFromStartKm));
          }

          if (result?.autoCompleted) {
            stopWatcher();
            await handleCreditResult(result.credit, true);
            await load();
          }
        } catch {
          setTrackingState("Tracking gap / sync failed");
        }
      },
      (error) => {
        setTrackingState("Location permission/offline gap");
        if (error.code === error.PERMISSION_DENIED) setPermissionState("denied");
      },
      { enableHighAccuracy: true, maximumAge: 20000, timeout: 20000 },
    );
  };

  useEffect(() => {
    if (data?.activeSession && data?.profile?.staffType === "MARKETING") {
      startWatcher();
    }
    return () => stopWatcher();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.activeSession?.id, data?.profile?.staffType]);

  useEffect(() => {
    const session = data?.activeSession;
    if (!session?.id || data?.profile?.staffType !== "MARKETING") {
      setLastRequiredCheckAt(null);
      dueToastShownRef.current = false;
      return;
    }

    const key = `roomkhoj_staff_location_check_${session.id}`;
    const saved = window.localStorage.getItem(key);
    const initial = saved || session.startedAt;
    setLastRequiredCheckAt(initial);
  }, [data?.activeSession?.id, data?.activeSession?.startedAt, data?.profile?.staffType]);

  const trackingIntervalMs =
    Number(data?.policy?.trackingIntervalHours || data?.profile?.trackingIntervalHours || 3) *
    60 *
    60 *
    1000;

  const nextRequiredCheckAt = useMemo(() => {
    if (!lastRequiredCheckAt) return null;
    return new Date(lastRequiredCheckAt).getTime() + trackingIntervalMs;
  }, [lastRequiredCheckAt, trackingIntervalMs]);

  const requiredCheckDue =
    Boolean(
      data?.activeSession &&
        data?.profile?.staffType === "MARKETING" &&
        nextRequiredCheckAt,
    ) && clockNow >= Number(nextRequiredCheckAt);

  useEffect(() => {
    if (requiredCheckDue && !dueToastShownRef.current) {
      dueToastShownRef.current = true;
      toast.error("Location verification required", {
        description: `हरेक ${Number(data?.policy?.trackingIntervalHours || 3)} घण्टामा current location verify गर्नुहोस्। ठूलो GPS gap भए आजको wallet credit रोकिन्छ।`,
        duration: 10000,
      });
    }
    if (!requiredCheckDue) dueToastShownRef.current = false;
  }, [requiredCheckDue, data?.policy?.trackingIntervalHours]);

  const startWork = async () => {
    if (!data?.profile) return;
    try {
      setBusy(true);
      const payload =
        data.profile.staffType === "MARKETING" ? await getPosition() : {};
      await staffTrackingService.start({ ...payload, source: "START" });
      if (data.profile.staffType === "MARKETING") {
        setPermissionState("granted");
      }
      toast.success(
        data.profile.staffType === "MARKETING"
          ? `Field work started. आजको ${Number(data?.policy?.maxRadiusKm || 2)} km work zone start location बाट गणना हुन्छ।`
          : "Reception shift started",
      );
      await load();
    } catch (error: any) {
      if (error?.code === 1) setPermissionState("denied");
      toast.error(
        error?.response?.data?.message || error?.message || "Work start failed",
      );
    } finally {
      setBusy(false);
    }
  };

  const verifyRequiredLocation = async () => {
    const session = data?.activeSession;
    if (!session?.id) return;

    try {
      setBusy(true);
      const location = await getPosition();
      const result = await staffTrackingService.pingLocation({
        ...location,
        source: "MANUAL_3H",
      });
      const checkedAt = new Date().toISOString();
      window.localStorage.setItem(
        `roomkhoj_staff_location_check_${session.id}`,
        checkedAt,
      );
      setLastRequiredCheckAt(checkedAt);
      setLastLocationAt(checkedAt);
      setTrackingState("Tracking active");
      setPermissionState("granted");
      if (Number.isFinite(Number(result?.distanceFromStartKm))) {
        setCurrentDistanceKm(Number(result.distanceFromStartKm));
      }
      dueToastShownRef.current = false;

      if (result?.autoCompleted) {
        stopWatcher();
        await handleCreditResult(result.credit, true);
        await load();
        return;
      }

      toast.success("Current location verified");
    } catch (error: any) {
      if (error?.code === 1) setPermissionState("denied");
      setTrackingState("Location verification failed");
      toast.error(
        error?.response?.data?.message ||
          "Location verify भएन। Browser location permission Allow गरेर फेरि प्रयास गर्नुहोस्।",
      );
    } finally {
      setBusy(false);
    }
  };

  const endWork = async () => {
    if (!data?.activeSession) return;
    try {
      setBusy(true);
      let payload: any = {};
      if (data.profile.staffType === "MARKETING") {
        try {
          payload = await getPosition();
        } catch {
          payload = {};
        }
      }
      const result = await staffTrackingService.end(payload);
      stopWatcher();
      if (data.profile.staffType === "MARKETING") {
        await handleCreditResult(result?.credit, false);
      } else {
        toast.success("Today's work ended");
      }
      await load();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Work end failed");
    } finally {
      setBusy(false);
    }
  };

  const addVisit = async () => {
    if (!data?.activeSession) return;
    try {
      setBusy(true);
      const location = await getPosition();
      const result = await staffTrackingService.addVisit({ ...location, ...visit });
      setVisit({ leadName: "", note: "", roomId: "" });
      setPermissionState("granted");
      if (Number.isFinite(Number(result?.distanceFromStartKm))) {
        setCurrentDistanceKm(Number(result.distanceFromStartKm));
      }
      toast.success(
        `Field visit saved · start location बाट ${Number(result?.distanceFromStartKm || 0).toFixed(2)} km`,
      );
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || error?.message || "Visit save failed",
      );
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return <div className="p-10 text-center">Loading staff profile...</div>;
  }

  if (!data?.profile) {
    return (
      <div className="mx-auto max-w-xl p-8">
        <Card>
          <CardContent className="p-8 text-center">
            Active staff profile छैन। Admin ले Staff Tracking बाट role assign गर्नुपर्छ।
          </CardContent>
        </Card>
      </div>
    );
  }

  const profile = data.profile;
  const session = data.activeSession;
  const calendar = data.calendar || {};
  const maxRadiusKm = Number(data?.policy?.maxRadiusKm || profile.maxRadiusKm || 2);
  const outsideZone =
    currentDistanceKm !== null && currentDistanceKm > maxRadiusKm;
  const startTime = timeLabel(profile.allowedStartTime);
  const endTime = timeLabel(profile.expectedEndTime);

  return (
    <main className="mx-auto max-w-4xl space-y-5 p-4 md:p-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-primary">
          RoomKhoj Staff
        </p>
        <h1 className="text-2xl font-black">
          {profile.staffType === "MARKETING"
            ? "Marketing Field Tracking"
            : "Reception Shift"}
        </h1>
        <p className="text-sm text-muted-foreground">
          Tracking work session सुरु भएपछि मात्र active हुन्छ।
        </p>
      </div>

      {profile.staffType === "MARKETING" && (
        <Card className="border-blue-300 bg-blue-50/60">
          <CardContent className="space-y-3 p-5">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-6 w-6 flex-shrink-0 text-blue-700" />
              <div>
                <h2 className="font-black text-blue-950">आजको Marketing Rule</h2>
                <p className="mt-1 text-sm leading-6 text-blue-900">
                  आफ्नो काम सुरु हुने समयमा <b>Start Field Work</b> थिच्नुहोस्। तपाईंको shift <b>{startTime}–{endTime}</b> हो र यो समयभित्र RoomKhoj ले location tracking गर्नेछ। Room खोज्दा आजको start location बाट <b>{maxRadiusKm} km भित्र</b> रहनुपर्छ। साँझ <b>{endTime}</b> मा location update प्राप्त भयो, GPS gap/radius rule पूरा भयो भने आजको credit wallet मा स्वतः जान्छ; नत्र credit हुँदैन।
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
          <Info icon={UserRound} label="Staff" value={profile.name || "Staff"} />
          <Info
            icon={Clock3}
            label="Allowed schedule"
            value={`${startTime} – ${endTime}`}
          />
          <Info
            icon={Banknote}
            label="Monthly salary"
            value={money(profile.monthlySalary)}
          />
          <Info
            icon={Navigation}
            label="Status"
            value={session ? "Working" : "Not working"}
          />
        </CardContent>
      </Card>

      {profile.staffType === "MARKETING" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" /> Work Calendar & Wallet Credit
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <MiniStat label="This month" value={`${calendar.calendarDays || "-"} days`} sub={`${calendar.scheduledWorkDays || "-"} work days`} />
            <MiniStat label="Every week" value="7 days" sub={`${calendar.workDaysPerWeek || 6} work + ${calendar.weeklyOffDaysPerWeek || 1} off`} />
            <MiniStat label="Weekly off" value={calendar.weeklyOffDay || profile.weeklyOffDay || "SATURDAY"} sub={`${calendar.weeklyOffDays || "-"} off days this month`} />
            <MiniStat
              label={calendar.isWeeklyOff ? "Today off-day credit" : "Normal daily credit"}
              value={money(calendar.todayExpectedCredit || calendar.dailyBaseCredit)}
              sub={calendar.isWeeklyOff ? `Normal day भन्दा +${money(calendar.offDayBonus || profile.offDayBonus || 100)}` : `Off day मा +${money(calendar.offDayBonus || profile.offDayBonus || 100)}`}
            />
            <MiniStat label="Credited this month" value={money(data?.monthCredit?.total)} sub={`${data?.monthCredit?.creditedDays || 0} eligible days`} />
          </CardContent>
        </Card>
      )}

      <Card className={session ? "border-primary/40" : ""}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Today's Work</CardTitle>
            <Badge variant={session ? "default" : "secondary"}>
              {session ? "ACTIVE" : "NOT STARTED"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {session ? (
            <>
              <div className="rounded-xl bg-muted p-4 text-sm">
                <b>Started:</b> {new Date(session.startedAt).toLocaleString()}
                <br />
                <b>Work date:</b> {String(session.workDate).slice(0, 10)}
                <br />
                <b>Wallet status:</b> {session.creditStatus || "PENDING"}
              </div>

              {profile.staffType === "MARKETING" && (
                <>
                  <div
                    className={`flex items-center gap-2 rounded-xl border p-3 text-sm ${
                      outsideZone ? "border-red-300 bg-red-50" : ""
                    }`}
                  >
                    <MapPin
                      className={`h-5 w-5 ${outsideZone ? "text-red-600" : "text-primary"}`}
                    />
                    <div className="flex-1">
                      <b>{outsideZone ? "Outside 2 km work zone" : trackingState}</b>
                      <div className="text-xs text-muted-foreground">
                        {currentDistanceKm !== null
                          ? `Start location बाट ${currentDistanceKm.toFixed(2)} km`
                          : lastLocationAt
                            ? `Last synced ${new Date(lastLocationAt).toLocaleTimeString()}`
                            : "Browser open हुँदा foreground GPS sync हुन्छ।"}
                      </div>
                    </div>
                    <Badge
                      variant={
                        permissionState === "granted" && !outsideZone
                          ? "default"
                          : "destructive"
                      }
                    >
                      GPS {permissionState}
                    </Badge>
                  </div>

                  <div
                    className={`rounded-xl border p-4 ${
                      requiredCheckDue
                        ? "border-red-300 bg-red-50"
                        : "border-emerald-200 bg-emerald-50"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {requiredCheckDue ? (
                        <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
                      ) : (
                        <ShieldCheck className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-600" />
                      )}
                      <div className="flex-1">
                        <p
                          className={`font-bold ${
                            requiredCheckDue ? "text-red-800" : "text-emerald-800"
                          }`}
                        >
                          {requiredCheckDue
                            ? `${Number(data?.policy?.trackingIntervalHours || 3)}-hour location check is due`
                            : "Location check OK"}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {requiredCheckDue
                            ? "Current location verify गर्नुहोस्। ठूलो GPS gap भए आजको wallet credit रोकिन्छ।"
                            : nextRequiredCheckAt
                              ? `Next required verification in ${formatDuration(Number(nextRequiredCheckAt) - clockNow)} (${new Date(Number(nextRequiredCheckAt)).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })})`
                              : "Waiting for schedule"}
                        </p>
                      </div>
                    </div>
                    <Button
                      className="mt-3 w-full"
                      variant={requiredCheckDue ? "destructive" : "outline"}
                      onClick={() => void verifyRequiredLocation()}
                      disabled={busy}
                    >
                      <RefreshCw
                        className={`mr-2 h-4 w-4 ${busy ? "animate-spin" : ""}`}
                      />
                      Verify Current Location Now
                    </Button>
                  </div>

                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                    <b>{endTime} final rule:</b> {endTime} पछि browser बाट valid location server मा पुगेपछि shift स्वतः complete भएर wallet credit check हुन्छ। Automatic update नआए तलको button थिच्नुहोस्। Checkout grace {Number(data?.policy?.checkoutGraceMinutes || 15)} minutes छ।
                  </div>
                </>
              )}

              <Button
                variant="destructive"
                className="w-full"
                onClick={() => void endWork()}
                disabled={busy}
              >
                <Square className="mr-2 h-4 w-4" />
                {profile.staffType === "MARKETING"
                  ? `${endTime} Final Location + End & Check Credit`
                  : "End Work / Go Home"}
              </Button>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Admin ले तोकेको start time भन्दा अघि server ले start गर्न दिँदैन। Marketing staff को Start मा current location permission आवश्यक हुन्छ र यही location आजको {maxRadiusKm} km work-zone center बन्छ।
              </p>
              <Button
                className="w-full"
                onClick={() => void startWork()}
                disabled={busy}
              >
                <Play className="mr-2 h-4 w-4" />
                {profile.staffType === "MARKETING"
                  ? "Start Field Work + Share Start Location"
                  : "Start Reception Shift"}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {profile.staffType === "MARKETING" && session && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HousePlus className="h-5 w-5" /> Add Field Visit / Room Lead
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Field visit आजको start location बाट {maxRadiusKm} km भन्दा बाहिर भए server ले save गर्दैन।
            </p>
            <div>
              <Label>Owner / Lead name</Label>
              <Input
                value={visit.leadName}
                onChange={(e) =>
                  setVisit((v) => ({ ...v, leadName: e.target.value }))
                }
                placeholder="Owner / property name"
              />
            </div>
            <div>
              <Label>Room ID (optional)</Label>
              <Input
                value={visit.roomId}
                onChange={(e) =>
                  setVisit((v) => ({ ...v, roomId: e.target.value }))
                }
                placeholder="Existing RoomKhoj room UUID"
              />
            </div>
            <div>
              <Label>Visit note</Label>
              <Input
                value={visit.note}
                onChange={(e) =>
                  setVisit((v) => ({ ...v, note: e.target.value }))
                }
                placeholder="Owner भेटियो, 2BHK available..."
              />
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => void addVisit()}
              disabled={busy}
            >
              <MapPin className="mr-2 h-4 w-4" /> Save Visit with Current Location
            </Button>
          </CardContent>
        </Card>
      )}

      {profile.staffType === "MARKETING" && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-xs text-blue-800">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <p>
              Location active work session भित्र मात्र प्रयोग हुन्छ। Browser बन्द/suspend, network समस्या वा Location blocked हुँदा GPS gap आउन सक्छ। Server ले wallet credit गर्दा start time, location gap, {maxRadiusKm} km work zone र {endTime} final location सबै जाँच गर्छ।
            </p>
          </div>
        </div>
      )}
    </main>
  );
}

function Info({ icon: Icon, label, value }: any) {
  return (
    <div className="flex items-center gap-3">
      <span className="rounded-lg bg-primary/10 p-2">
        <Icon className="h-5 w-5 text-primary" />
      </span>
      <div>
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="font-semibold">{value}</div>
      </div>
    </div>
  );
}

function MiniStat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border bg-muted/30 p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-lg font-black">{value}</div>
      {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}
