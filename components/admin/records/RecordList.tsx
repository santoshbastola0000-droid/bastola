"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Edit, Eye, Home, MapPinned, MessageCircle, PencilLine, Plus, Search, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { recordService } from "@/http/services/record.service";
import { roomService } from "@/http/services/room.service";
import { messageService } from "@/http/services/message.service";
import { PaymentStatus, RecordsFilter, UpdateRecordDTO } from "@/types/record.types";

interface Props {
  recordYearId: string;
  title?: string;
  showBackButton?: boolean;
  onBack?: () => void;
}

export default function RecordList({ recordYearId, title = "Daily Records" }: Props) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [page, setPage] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [quickEditId, setQuickEditId] = useState<string | null>(null);
  const [messagingId, setMessagingId] = useState<string | null>(null);

  const filters: RecordsFilter = { page, take: 50, search: appliedSearch || undefined };
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["records", recordYearId, filters],
    queryFn: () => recordService.getRecordsByYear(recordYearId, filters),
    enabled: !!recordYearId,
  });

  const records = data?.data || [];
  const selected = records.find((r) => r.id === selectedId);
  const quickEditRecord = records.find((r) => r.id === quickEditId);
  const total = data?.pagination?.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / 50));

  const deleteMutation = useMutation({
    mutationFn: recordService.deleteRecord,
    onSuccess: () => {
      toast.success("Record deleted");
      queryClient.invalidateQueries({ queryKey: ["records", recordYearId] });
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || "Delete failed"),
  });

  const openFollowUp = async (record: (typeof records)[number]) => {
    try {
      setMessagingId(record.id);
      const result = record.customerUserId
        ? await messageService.startByUser(record.customerUserId)
        : await messageService.startByContact(record.customerNumber);
      const conversationId = result?.conversation?.id || result?.id;
      if (!conversationId) throw new Error("Conversation could not be created");
      router.push(`/messages?conversation=${encodeURIComponent(conversationId)}`);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Customer RoomKhoj account भेटिएन वा message सुरु गर्न सकिएन");
    } finally {
      setMessagingId(null);
    }
  };

  const runSearch = () => { setAppliedSearch(search.trim()); setPage(0); };

  return (
    <div className="space-y-5 p-4 md:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="text-sm text-muted-foreground">Staff-friendly daily customer follow-up record. Total: {total}</p>
        </div>
        <Button asChild><Link href={`/admin/dashboard/records/year/${recordYearId}/create`}><Plus className="mr-2 h-4 w-4" /> Add Daily Record</Link></Button>
      </div>

      <Card className="border-green-200 bg-green-50/50"><CardContent className="p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9 pr-9 bg-white" value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === "Enter" && runSearch()} placeholder="Name, phone, destination, room वा status खोज्नुहोस्..." />{search && <button className="absolute right-3 top-1/2 -translate-y-1/2" onClick={() => { setSearch(""); setAppliedSearch(""); setPage(0); }}><X className="h-4 w-4" /></button>}</div>
          <Button onClick={runSearch}>Search</Button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">Staff ले row को <b>Quick Update</b> थिचेर status, follow-up note, destination, payment र fixed/unfixed तुरुन्त update गर्न सक्छ।</p>
      </CardContent></Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table className="min-w-[1750px] text-xs">
            <TableHeader><TableRow className="bg-green-700 hover:bg-green-700">
              <TableHead className="text-white">Name</TableHead><TableHead className="text-white">Phone</TableHead><TableHead className="text-white">Date</TableHead><TableHead className="text-white">Room / Showroom</TableHead><TableHead className="text-white">Payment</TableHead><TableHead className="text-white">Place</TableHead><TableHead className="text-white">Customer Pathako Thau</TableHead><TableHead className="text-white">Shown Rooms</TableHead><TableHead className="text-white">Fixed / Unfixed</TableHead><TableHead className="text-white">Authorized</TableHead><TableHead className="text-white">Status</TableHead><TableHead className="text-white">User Details</TableHead><TableHead className="text-right text-white">Actions</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {isLoading || (isFetching && records.length === 0) ? <TableRow><TableCell colSpan={13} className="h-24 text-center">Loading records...</TableCell></TableRow> : records.length === 0 ? <TableRow><TableCell colSpan={13} className="h-24 text-center">No record found</TableCell></TableRow> : records.map((record) => (
                <TableRow key={record.id} className="odd:bg-green-50 even:bg-green-100/60">
                  <TableCell className="font-medium">{record.name}</TableCell><TableCell>{record.customerNumber}</TableCell><TableCell>{record.entryDate || "-"}</TableCell><TableCell>{record.roomPlaceAddress || "-"}</TableCell>
                  <TableCell><div className="whitespace-nowrap">Rs. {Number(record.formCharge || 0).toLocaleString()}</div><div className="text-[11px] text-muted-foreground">{record.payMode}</div><Badge variant={record.paymentStatus === PaymentStatus.PAID ? "default" : "secondary"} className="mt-1 text-[10px]">{record.paymentStatus}</Badge></TableCell>
                  <TableCell>{record.place || "-"}</TableCell>
                  <TableCell className="max-w-[220px] whitespace-normal"><div className="flex gap-1"><MapPinned className="mt-0.5 h-3.5 w-3.5 shrink-0" />{record.customerDestination || "-"}</div></TableCell>
                  <TableCell><Badge variant="outline"><Home className="mr-1 h-3 w-3" />{record.shownRoomIds?.length || 0} room</Badge></TableCell>
                  <TableCell>{record.workType || "-"}</TableCell><TableCell>{record.authorizedName || "-"}</TableCell><TableCell className="max-w-[220px] whitespace-normal">{record.status || record.remarks || "-"}</TableCell><TableCell className="max-w-[260px] whitespace-normal">{record.userDetails || "-"}</TableCell>
                  <TableCell><div className="flex min-w-[190px] justify-end gap-1">
                    <Button variant="outline" size="sm" onClick={() => setQuickEditId(record.id)} title="Quick Update"><PencilLine className="mr-1 h-3.5 w-3.5" />Quick Update</Button>
                    <Button variant="ghost" size="icon" onClick={() => openFollowUp(record)} title="Message for follow-up" disabled={messagingId === record.id}><MessageCircle className="h-4 w-4 text-green-700" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => setSelectedId(record.id)} title="View details"><Eye className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" asChild title="Full Edit"><Link href={`/admin/dashboard/records/${record.id}/edit`}><Edit className="h-4 w-4" /></Link></Button>
                    <Button variant="ghost" size="icon" title="Delete" disabled={deleteMutation.isPending} onClick={() => { if (window.confirm(`Delete ${record.name}'s record?`)) deleteMutation.mutate(record.id); }}><Trash2 className="h-4 w-4 text-red-600" /></Button>
                  </div></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {totalPages > 1 && <div className="flex items-center justify-end gap-2"><Button variant="outline" disabled={page <= 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>Previous</Button><span className="text-sm">Page {page + 1} / {totalPages}</span><Button variant="outline" disabled={page + 1 >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button></div>}

      <Dialog open={!!quickEditId} onOpenChange={(open) => !open && setQuickEditId(null)}>
        <DialogContent className="max-w-xl"><DialogHeader><DialogTitle>Quick Update</DialogTitle></DialogHeader>
          {quickEditRecord && <QuickUpdateForm record={quickEditRecord} onDone={() => setQuickEditId(null)} recordYearId={recordYearId} />}
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedId} onOpenChange={(open) => !open && setSelectedId(null)}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto"><DialogHeader><DialogTitle>Record Details</DialogTitle></DialogHeader>
          {selected && <div className="space-y-4">
            <div className="grid gap-3 text-sm sm:grid-cols-2"><Detail label="Name" value={selected.name} /><Detail label="Phone" value={selected.customerNumber} /><Detail label="Date" value={selected.entryDate} /><Detail label="Room / Showroom" value={selected.roomPlaceAddress} /><Detail label="Owner Phone" value={selected.roomPlaceNumber} /><Detail label="Place" value={selected.place} /><Detail label="Customer lai pathako thau" value={selected.customerDestination} /><Detail label="Fixed / Unfixed" value={selected.workType} /><Detail label="Authorized Name" value={selected.authorizedName} /><Detail label="Payment" value={`Rs. ${Number(selected.formCharge || 0).toLocaleString()} • ${selected.payMode} • ${selected.paymentStatus}`} /><Detail label="Status" value={selected.status} /><div className="sm:col-span-2"><Detail label="User Details" value={selected.userDetails} /></div><div className="sm:col-span-2"><Detail label="Remarks / Follow-up" value={selected.remarks} /></div></div>
            <div><div className="mb-2 text-sm font-semibold">Customer lai show gareko rooms</div><AttachedRooms ids={selected.shownRoomIds || []} /></div>
            <div className="flex flex-col gap-2 sm:flex-row"><Button variant="outline" onClick={() => { setSelectedId(null); setQuickEditId(selected.id); }}><PencilLine className="mr-2 h-4 w-4" />Quick Update</Button><Button onClick={() => openFollowUp(selected)} disabled={messagingId === selected.id}><MessageCircle className="mr-2 h-4 w-4" />Message Customer for Follow-up</Button></div>
          </div>}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function QuickUpdateForm({ record, onDone, recordYearId }: { record: any; onDone: () => void; recordYearId: string }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<UpdateRecordDTO>({
    status: record.status || "",
    remarks: record.remarks || "",
    customerDestination: record.customerDestination || "",
    workType: record.workType || "Fixed",
    paymentStatus: record.paymentStatus || PaymentStatus.DUE,
    authorizedName: record.authorizedName || "",
  });

  useEffect(() => {
    setForm({
      status: record.status || "",
      remarks: record.remarks || "",
      customerDestination: record.customerDestination || "",
      workType: record.workType || "Fixed",
      paymentStatus: record.paymentStatus || PaymentStatus.DUE,
      authorizedName: record.authorizedName || "",
    });
  }, [record.id]);

  const mutation = useMutation({
    mutationFn: () => recordService.updateRecord(record.id, form),
    onSuccess: () => {
      toast.success("Record updated");
      queryClient.invalidateQueries({ queryKey: ["records", recordYearId] });
      onDone();
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || "Update failed"),
  });

  const setField = (key: keyof UpdateRecordDTO, value: any) => setForm((prev) => ({ ...prev, [key]: value }));

  return <div className="space-y-4">
    <div className="rounded-lg bg-muted p-3 text-sm"><b>{record.name}</b> • {record.customerNumber}</div>
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-2"><Label>Status</Label><Select value={form.status || ""} onValueChange={(v) => setField("status", v)}><SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger><SelectContent><SelectItem value="Follow-up">Follow-up</SelectItem><SelectItem value="Contacted">Contacted</SelectItem><SelectItem value="Room Shown">Room Shown</SelectItem><SelectItem value="Interested">Interested</SelectItem><SelectItem value="Not Interested">Not Interested</SelectItem><SelectItem value="Fixed">Fixed</SelectItem><SelectItem value="Pending">Pending</SelectItem><SelectItem value="No Response">No Response</SelectItem></SelectContent></Select></div>
      <div className="space-y-2"><Label>Fixed / Unfixed</Label><Select value={form.workType || "Fixed"} onValueChange={(v) => setField("workType", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Fixed">Fixed</SelectItem><SelectItem value="Unfixed">Unfixed</SelectItem></SelectContent></Select></div>
      <div className="space-y-2"><Label>Payment Status</Label><Select value={form.paymentStatus || PaymentStatus.DUE} onValueChange={(v) => setField("paymentStatus", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value={PaymentStatus.PAID}>Paid</SelectItem><SelectItem value={PaymentStatus.DUE}>Due</SelectItem></SelectContent></Select></div>
      <div className="space-y-2"><Label>Authorized Staff</Label><Input value={form.authorizedName || ""} onChange={(e) => setField("authorizedName", e.target.value)} placeholder="Staff name" /></div>
    </div>
    <div className="space-y-2"><Label>Customer lai pathako thau</Label><Input value={form.customerDestination || ""} onChange={(e) => setField("customerDestination", e.target.value)} placeholder="e.g. Lakeside, Room #123 owner ko ma" /></div>
    <div className="space-y-2"><Label>Follow-up Note</Label><Textarea value={form.remarks || ""} onChange={(e) => setField("remarks", e.target.value)} placeholder="Aaja call garyo, bholi feri contact garne..." rows={3} /></div>
    <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={onDone} disabled={mutation.isPending}>Cancel</Button><Button onClick={() => mutation.mutate()} disabled={mutation.isPending}><CheckCircle2 className="mr-2 h-4 w-4" />{mutation.isPending ? "Saving..." : "Save Update"}</Button></div>
  </div>;
}

function AttachedRooms({ ids }: { ids: string[] }) {
  const roomQueries = useQueries({ queries: ids.map((id) => ({ queryKey: ["record-attached-room", id], queryFn: () => roomService.getAdminRoomById(id), staleTime: 60_000 })) });
  if (!ids.length) return <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">No rooms attached.</div>;
  return <div className="grid gap-2 sm:grid-cols-2">{roomQueries.map((query, index) => { const room = query.data?.data; return <div key={ids[index]} className="rounded-lg border p-3"><div className="font-medium">{room?.title || (query.isLoading ? "Loading room..." : "Room unavailable")}</div>{room && <><div className="mt-1 text-xs text-muted-foreground">{room.address || room.location?.name || "-"}</div><div className="mt-1 text-xs">Rs. {Number(room.price || 0).toLocaleString()} • {room.listingStatus}</div><Link className="mt-2 inline-block text-xs font-medium underline" href={`/property/${room.id}`}>Open room</Link></>}</div>; })}</div>;
}

function Detail({ label, value }: { label: string; value?: string | null }) {
  return <div className="rounded-lg border p-3"><div className="text-xs font-medium text-muted-foreground">{label}</div><div className="mt-1 whitespace-pre-wrap">{value || "-"}</div></div>;
}
