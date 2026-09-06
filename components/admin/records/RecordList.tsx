"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit, Eye, Home, MapPinned, MessageCircle, Plus, Search, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { recordService } from "@/http/services/record.service";
import { roomService } from "@/http/services/room.service";
import { messageService } from "@/http/services/message.service";
import { PaymentStatus, RecordsFilter } from "@/types/record.types";

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
  const [messagingId, setMessagingId] = useState<string | null>(null);

  const filters: RecordsFilter = { page, take: 50, search: appliedSearch || undefined };
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["records", recordYearId, filters],
    queryFn: () => recordService.getRecordsByYear(recordYearId, filters),
    enabled: !!recordYearId,
  });

  const records = data?.data || [];
  const selected = records.find((r) => r.id === selectedId);
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
          <p className="text-sm text-muted-foreground">Office daily customer follow-up record. Total: {total}</p>
        </div>
        <Button asChild><Link href={`/admin/dashboard/records/year/${recordYearId}/create`}><Plus className="mr-2 h-4 w-4" /> Add Daily Record</Link></Button>
      </div>

      <Card><CardContent className="p-4"><div className="flex gap-2"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9 pr-9" value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === "Enter" && runSearch()} placeholder="Search name, phone, destination, place, room, status..." />{search && <button className="absolute right-3 top-1/2 -translate-y-1/2" onClick={() => { setSearch(""); setAppliedSearch(""); setPage(0); }}><X className="h-4 w-4" /></button>}</div><Button onClick={runSearch}>Search</Button></div></CardContent></Card>

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
                  <TableCell><div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openFollowUp(record)} title="Message for follow-up" disabled={messagingId === record.id}><MessageCircle className="h-4 w-4 text-green-700" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => setSelectedId(record.id)} title="View details"><Eye className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" asChild title="Edit"><Link href={`/admin/dashboard/records/${record.id}/edit`}><Edit className="h-4 w-4" /></Link></Button>
                    <Button variant="ghost" size="icon" title="Delete" disabled={deleteMutation.isPending} onClick={() => { if (window.confirm(`Delete ${record.name}'s record?`)) deleteMutation.mutate(record.id); }}><Trash2 className="h-4 w-4 text-red-600" /></Button>
                  </div></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {totalPages > 1 && <div className="flex items-center justify-end gap-2"><Button variant="outline" disabled={page <= 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>Previous</Button><span className="text-sm">Page {page + 1} / {totalPages}</span><Button variant="outline" disabled={page + 1 >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button></div>}

      <Dialog open={!!selectedId} onOpenChange={(open) => !open && setSelectedId(null)}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto"><DialogHeader><DialogTitle>Record Details</DialogTitle></DialogHeader>
          {selected && <div className="space-y-4">
            <div className="grid gap-3 text-sm sm:grid-cols-2"><Detail label="Name" value={selected.name} /><Detail label="Phone" value={selected.customerNumber} /><Detail label="Date" value={selected.entryDate} /><Detail label="Room / Showroom" value={selected.roomPlaceAddress} /><Detail label="Owner Phone" value={selected.roomPlaceNumber} /><Detail label="Place" value={selected.place} /><Detail label="Customer lai pathako thau" value={selected.customerDestination} /><Detail label="Fixed / Unfixed" value={selected.workType} /><Detail label="Authorized Name" value={selected.authorizedName} /><Detail label="Payment" value={`Rs. ${Number(selected.formCharge || 0).toLocaleString()} • ${selected.payMode} • ${selected.paymentStatus}`} /><Detail label="Status" value={selected.status} /><div className="sm:col-span-2"><Detail label="User Details" value={selected.userDetails} /></div><div className="sm:col-span-2"><Detail label="Remarks / Follow-up" value={selected.remarks} /></div></div>
            <div><div className="mb-2 text-sm font-semibold">Customer lai show gareko rooms</div><AttachedRooms ids={selected.shownRoomIds || []} /></div>
            <Button className="w-full sm:w-auto" onClick={() => openFollowUp(selected)} disabled={messagingId === selected.id}><MessageCircle className="mr-2 h-4 w-4" />Message Customer for Follow-up</Button>
          </div>}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AttachedRooms({ ids }: { ids: string[] }) {
  const roomQueries = useQueries({ queries: ids.map((id) => ({ queryKey: ["record-attached-room", id], queryFn: () => roomService.getAdminRoomById(id), staleTime: 60_000 })) });
  if (!ids.length) return <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">No rooms attached.</div>;
  return <div className="grid gap-2 sm:grid-cols-2">{roomQueries.map((query, index) => { const room = query.data?.data; return <div key={ids[index]} className="rounded-lg border p-3"><div className="font-medium">{room?.title || (query.isLoading ? "Loading room..." : "Room unavailable")}</div>{room && <><div className="mt-1 text-xs text-muted-foreground">{room.address || room.location?.name || "-"}</div><div className="mt-1 text-xs">Rs. {Number(room.price || 0).toLocaleString()} • {room.listingStatus}</div><Link className="mt-2 inline-block text-xs font-medium underline" href={`/property/${room.id}`}>Open room</Link></>}</div>; })}</div>;
}

function Detail({ label, value }: { label: string; value?: string | null }) {
  return <div className="rounded-lg border p-3"><div className="text-xs font-medium text-muted-foreground">{label}</div><div className="mt-1 whitespace-pre-wrap">{value || "-"}</div></div>;
}
