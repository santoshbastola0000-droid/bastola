"use client";

import { useEffect, useRef, useState } from "react";
import { Clock3, MapPin, Navigation, Play, Square, UserRound, HousePlus } from "lucide-react";
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

export default function StaffTrackingPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [trackingState, setTrackingState] = useState("Stopped");
  const [lastLocationAt, setLastLocationAt] = useState<string | null>(null);
  const [visit, setVisit] = useState({ leadName: "", note: "", roomId: "" });
  const watchIdRef = useRef<number | null>(null);
  const lastPingRef = useRef(0);

  const load = async () => {
    try { setData(await staffTrackingService.getMe()); }
    catch (error: any) { toast.error(error?.response?.data?.message || "Staff profile भेटिएन"); }
    finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, []);

  const stopWatcher = () => {
    if (watchIdRef.current !== null && navigator.geolocation) navigator.geolocation.clearWatch(watchIdRef.current);
    watchIdRef.current = null;
    setTrackingState("Stopped");
  };

  const startWatcher = () => {
    if (!navigator.geolocation || data?.profile?.staffType !== "MARKETING" || watchIdRef.current !== null) return;
    setTrackingState("Tracking active");
    watchIdRef.current = navigator.geolocation.watchPosition(
      async (position) => {
        const now = Date.now();
        if (now - lastPingRef.current < 45_000) return;
        lastPingRef.current = now;
        try {
          await staffTrackingService.pingLocation(positionPayload(position));
          setLastLocationAt(new Date().toISOString());
          setTrackingState("Tracking active");
        } catch {
          setTrackingState("Tracking gap / sync failed");
        }
      },
      () => setTrackingState("Location permission/offline gap"),
      { enableHighAccuracy: true, maximumAge: 20000, timeout: 20000 },
    );
  };

  useEffect(() => {
    if (data?.activeSession && data?.profile?.staffType === "MARKETING") startWatcher();
    return () => stopWatcher();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.activeSession?.id, data?.profile?.staffType]);

  const startWork = async () => {
    if (!data?.profile) return;
    try {
      setBusy(true);
      const payload = data.profile.staffType === "MARKETING" ? await getPosition() : {};
      await staffTrackingService.start(payload);
      toast.success(data.profile.staffType === "MARKETING" ? "Field work started" : "Reception shift started");
      await load();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error?.message || "Work start failed");
    } finally { setBusy(false); }
  };

  const endWork = async () => {
    if (!data?.activeSession) return;
    try {
      setBusy(true);
      let payload: any = {};
      if (data.profile.staffType === "MARKETING") {
        try { payload = await getPosition(); } catch { payload = {}; }
      }
      await staffTrackingService.end(payload);
      stopWatcher();
      toast.success("Today's work ended");
      await load();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Work end failed");
    } finally { setBusy(false); }
  };

  const addVisit = async () => {
    if (!data?.activeSession) return;
    try {
      setBusy(true);
      const location = await getPosition();
      await staffTrackingService.addVisit({ ...location, ...visit });
      setVisit({ leadName: "", note: "", roomId: "" });
      toast.success("Field visit saved");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error?.message || "Visit save failed");
    } finally { setBusy(false); }
  };

  if (loading) return <div className="p-10 text-center">Loading staff profile...</div>;
  if (!data?.profile) return <div className="mx-auto max-w-xl p-8"><Card><CardContent className="p-8 text-center">Active staff profile छैन। Admin ले Staff Tracking बाट role assign गर्नुपर्छ।</CardContent></Card></div>;

  const profile = data.profile;
  const session = data.activeSession;

  return (
    <main className="mx-auto max-w-3xl space-y-5 p-4 md:p-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-primary">RoomKhoj Staff</p>
        <h1 className="text-2xl font-black">{profile.staffType === "MARKETING" ? "Marketing Field Tracking" : "Reception Shift"}</h1>
        <p className="text-sm text-muted-foreground">Tracking work session सुरु हुँदा मात्र active हुन्छ। काम सकिएपछि End Work थिच्नुहोस्।</p>
      </div>

      <Card>
        <CardContent className="grid gap-4 p-5 sm:grid-cols-2">
          <Info icon={UserRound} label="Staff" value={profile.name || "Staff"} />
          <Info icon={Clock3} label="Allowed schedule" value={`${String(profile.allowedStartTime).slice(0,5)} – ${String(profile.expectedEndTime).slice(0,5)}`} />
          <Info icon={Clock3} label="Monthly salary" value={`Rs. ${Number(profile.monthlySalary || 0).toLocaleString()}`} />
          <Info icon={Navigation} label="Status" value={session ? "Working" : "Not working"} />
        </CardContent>
      </Card>

      <Card className={session ? "border-primary/40" : ""}>
        <CardHeader><div className="flex items-center justify-between"><CardTitle>Today's Work</CardTitle><Badge variant={session ? "default" : "secondary"}>{session ? "ACTIVE" : "NOT STARTED"}</Badge></div></CardHeader>
        <CardContent className="space-y-4">
          {session ? (
            <>
              <div className="rounded-xl bg-muted p-4 text-sm"><b>Started:</b> {new Date(session.startedAt).toLocaleString()}<br/><b>Work date:</b> {String(session.workDate).slice(0,10)}</div>
              {profile.staffType === "MARKETING" && <div className="flex items-center gap-2 rounded-xl border p-3 text-sm"><MapPin className="h-5 w-5 text-primary"/><div><b>{trackingState}</b><div className="text-xs text-muted-foreground">{lastLocationAt ? `Last synced ${new Date(lastLocationAt).toLocaleTimeString()}` : "Browser open हुँदा foreground GPS sync हुन्छ।"}</div></div></div>}
              <Button variant="destructive" className="w-full" onClick={() => void endWork()} disabled={busy}><Square className="mr-2 h-4 w-4"/> End Work / Go Home</Button>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">Admin ले तोकेको start time भन्दा अघि server ले start गर्न दिँदैन। Marketing staff को Start मा location permission आवश्यक हुन्छ।</p>
              <Button className="w-full" onClick={() => void startWork()} disabled={busy}><Play className="mr-2 h-4 w-4"/> {profile.staffType === "MARKETING" ? "Start Field Work" : "Start Reception Shift"}</Button>
            </>
          )}
        </CardContent>
      </Card>

      {profile.staffType === "MARKETING" && session && (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><HousePlus className="h-5 w-5"/> Add Field Visit / Room Lead</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div><Label>Owner / Lead name</Label><Input value={visit.leadName} onChange={(e) => setVisit((v) => ({ ...v, leadName: e.target.value }))} placeholder="Owner / property name"/></div>
            <div><Label>Room ID (optional)</Label><Input value={visit.roomId} onChange={(e) => setVisit((v) => ({ ...v, roomId: e.target.value }))} placeholder="Existing RoomKhoj room UUID"/></div>
            <div><Label>Visit note</Label><Input value={visit.note} onChange={(e) => setVisit((v) => ({ ...v, note: e.target.value }))} placeholder="Owner भेटियो, 2BHK available..."/></div>
            <Button variant="outline" className="w-full" onClick={() => void addVisit()} disabled={busy}><MapPin className="mr-2 h-4 w-4"/> Save Visit with Current Location</Button>
          </CardContent>
        </Card>
      )}

      <p className="text-xs text-muted-foreground">Privacy: precise location active Marketing work session भित्र मात्र पठाइन्छ। Normal website background मा बन्द/suspend हुँदा GPS guarantee हुँदैन; त्यस्तो समय admin मा tracking gap को रूपमा बुझ्नुपर्छ।</p>
    </main>
  );
}

function Info({ icon: Icon, label, value }: any) { return <div className="flex items-center gap-3"><span className="rounded-lg bg-primary/10 p-2"><Icon className="h-5 w-5 text-primary"/></span><div><div className="text-xs text-muted-foreground">{label}</div><div className="font-semibold">{value}</div></div></div>; }
