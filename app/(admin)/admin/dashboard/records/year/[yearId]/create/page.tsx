"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Link2, MapPinned, Save, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { recordService } from "@/http/services/record.service";
import { roomService } from "@/http/services/room.service";
import { messageService } from "@/http/services/message.service";
import { CreateRecordDTO, PaymentStatus, PayMode } from "@/types/record.types";

export default function CreateDailyRecordPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const recordYearId = String(params.yearId || "");
  const [roomSearch, setRoomSearch] = useState("");
  const [showMoreRooms, setShowMoreRooms] = useState(false);
  const [linkedUserName, setLinkedUserName] = useState("");
  const [linkingUser, setLinkingUser] = useState(false);

  const initialData = useMemo<CreateRecordDTO>(() => ({
    name: "",
    customerNumber: "",
    roomPlaceNumber: "",
    roomPlaceAddress: "",
    payMode: PayMode.CASH,
    paymentStatus: PaymentStatus.PAID,
    formCharge: 0,
    remarks: "",
    recordYearId,
    entryDate: "",
    place: "",
    workType: "Fixed",
    authorizedName: "",
    status: "",
    userDetails: "",
    customerDestination: "",
    shownRoomIds: [],
  }), [recordYearId]);

  const [form, setForm] = useState<CreateRecordDTO>(initialData);
  const setField = (key: keyof CreateRecordDTO, value: any) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const { data: roomsData, isLoading: roomsLoading } = useQuery({
    queryKey: ["record-room-options", roomSearch],
    queryFn: () => roomService.getAdminRooms({ page: 0, take: 100, search: roomSearch || undefined }),
  });
  const rooms = roomsData?.data || [];
  const visibleRooms = showMoreRooms || roomSearch.trim() ? rooms : rooms.slice(0, 3);

  const toggleRoom = (roomId: string) => {
    const current = form.shownRoomIds || [];
    setField(
      "shownRoomIds",
      current.includes(roomId) ? current.filter((id) => id !== roomId) : [...current, roomId],
    );
  };

  const linkCustomer = async () => {
    if (!form.customerNumber.trim()) return toast.error("Enter customer phone first");
    try {
      setLinkingUser(true);
      const user = await messageService.findProfileByContact(form.customerNumber.trim());
      setField("customerUserId", user.id);
      setLinkedUserName(user.name);
      toast.success(`Linked with RoomKhoj user: ${user.name}`);
    } catch (error: any) {
      setField("customerUserId", undefined);
      setLinkedUserName("");
      toast.error(error?.response?.data?.message || "RoomKhoj user not found for this phone");
    } finally {
      setLinkingUser(false);
    }
  };

  const mutation = useMutation({
    mutationFn: () => recordService.createRecord({ ...form, recordYearId, formCharge: Number(form.formCharge || 0) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["records", recordYearId] });
      toast.success("Daily record saved");
      router.push("/admin/dashboard/records");
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || "Record save failed"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.customerNumber.trim()) {
      toast.error("Name and phone number are required");
      return;
    }
    mutation.mutate();
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 p-4 md:p-6">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" onClick={() => router.back()}><ArrowLeft className="h-4 w-4" /></Button>
        <div>
          <h1 className="text-2xl font-bold">Daily Office Record</h1>
          <p className="text-sm text-muted-foreground">Customer details, destination, shown rooms and follow-up history.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Card>
          <CardHeader><CardTitle>Customer & office details</CardTitle></CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Field label="Name *"><Input value={form.name} onChange={(e) => setField("name", e.target.value)} placeholder="Customer name" /></Field>
            <Field label="Phone Number *">
              <div className="flex gap-2">
                <Input value={form.customerNumber} onChange={(e) => { setField("customerNumber", e.target.value); setField("customerUserId", undefined); setLinkedUserName(""); }} placeholder="98XXXXXXXX" />
                <Button type="button" variant="outline" onClick={linkCustomer} disabled={linkingUser}><Link2 className="h-4 w-4" /></Button>
              </div>
              {linkedUserName && <p className="text-xs text-green-700">Linked user: {linkedUserName}</p>}
            </Field>
            <Field label="Form/Filling Date"><Input value={form.entryDate || ""} onChange={(e) => setField("entryDate", e.target.value)} placeholder="2083/05/19" /></Field>
            <Field label="Customer lai kata pathako ho">
              <div className="relative"><MapPinned className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input className="pl-9" value={form.customerDestination || ""} onChange={(e) => setField("customerDestination", e.target.value)} placeholder="Lakeside office / Parsyang room / owner ko ghar..." /></div>
            </Field>
            <Field label="Room / Showroom"><Input value={form.roomPlaceAddress} onChange={(e) => setField("roomPlaceAddress", e.target.value)} placeholder="Room, showroom or branch" /></Field>
            <Field label="Room Owner Number"><Input value={form.roomPlaceNumber} onChange={(e) => setField("roomPlaceNumber", e.target.value)} placeholder="Optional" /></Field>
            <Field label="Place"><Input value={form.place || ""} onChange={(e) => setField("place", e.target.value)} placeholder="Parsyang, Nayabazar..." /></Field>
            <Field label="Payment Amount"><Input type="number" min="0" value={form.formCharge} onChange={(e) => setField("formCharge", Number(e.target.value))} /></Field>
            <Field label="Payment Mode"><Select value={form.payMode} onValueChange={(v) => setField("payMode", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value={PayMode.CASH}>Cash</SelectItem><SelectItem value={PayMode.DIGITAL}>Online / Digital</SelectItem></SelectContent></Select></Field>
            <Field label="Payment Status"><Select value={form.paymentStatus} onValueChange={(v) => setField("paymentStatus", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value={PaymentStatus.PAID}>Paid</SelectItem><SelectItem value={PaymentStatus.DUE}>Due</SelectItem></SelectContent></Select></Field>
            <Field label="Fixed / Unfixed"><Select value={form.workType || "Fixed"} onValueChange={(v) => setField("workType", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Fixed">Fixed</SelectItem><SelectItem value="Unfixed">Unfixed</SelectItem></SelectContent></Select></Field>
            <Field label="Authorized Name"><Input value={form.authorizedName || ""} onChange={(e) => setField("authorizedName", e.target.value)} placeholder="Authorized staff/person" /></Field>
            <Field label="Status"><Input value={form.status || ""} onChange={(e) => setField("status", e.target.value)} placeholder="Follow-up / contacted / pending..." /></Field>
            <div className="space-y-2 md:col-span-2 lg:col-span-3"><Label>User Details</Label><Textarea value={form.userDetails || ""} onChange={(e) => setField("userDetails", e.target.value)} placeholder="Requirement, family size, budget, preferred area, reference, etc." rows={3} /></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Kun kun room customer lai show gareko?</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input className="pl-9" value={roomSearch} onChange={(e) => { setRoomSearch(e.target.value); if (e.target.value.trim()) setShowMoreRooms(true); }} placeholder="Search room by title/place..." /></div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {roomsLoading ? <p className="text-sm text-muted-foreground">Loading rooms...</p> : visibleRooms.map((room) => {
                const selected = (form.shownRoomIds || []).includes(room.id);
                return (
                  <button key={room.id} type="button" onClick={() => toggleRoom(room.id)} className={`rounded-lg border p-3 text-left transition ${selected ? "border-green-600 bg-green-50" : "hover:bg-muted/50"}`}>
                    <div className="font-medium line-clamp-1">{room.title}</div>
                    <div className="mt-1 text-xs text-muted-foreground line-clamp-2">{room.address || room.location?.name || "Location not set"}</div>
                    <div className="mt-1 text-xs">Rs. {Number(room.price || 0).toLocaleString()} • {room.listingStatus}</div>
                    <div className="mt-2 text-xs font-medium">{selected ? "✓ Attached / Shown" : "+ Attach room"}</div>
                  </button>
                );
              })}
            </div>

            {!roomSearch.trim() && rooms.length > 3 && (
              <div className="flex justify-center">
                <Button type="button" variant="outline" onClick={() => setShowMoreRooms((prev) => !prev)}>
                  {showMoreRooms ? "See less" : `See more rooms (${rooms.length - 3})`}
                </Button>
              </div>
            )}

            <p className="text-sm text-muted-foreground">Selected rooms: {(form.shownRoomIds || []).length}</p>
          </CardContent>
        </Card>

        <Card><CardContent className="space-y-4 p-5"><div className="space-y-2"><Label>Remarks / Follow-up Note</Label><Textarea value={form.remarks} onChange={(e) => setField("remarks", e.target.value)} placeholder="Call back date, response, next action..." rows={3} /></div><div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => router.back()} disabled={mutation.isPending}>Cancel</Button><Button type="submit" disabled={mutation.isPending}><Save className="mr-2 h-4 w-4" />{mutation.isPending ? "Saving..." : "Save Record"}</Button></div></CardContent></Card>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-2"><Label>{label}</Label>{children}</div>;
}
