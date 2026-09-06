"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit, Eye, Plus, Search, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { recordService } from "@/http/services/record.service";
import { PaymentStatus, RecordsFilter } from "@/types/record.types";

interface Props {
  recordYearId: string;
  title?: string;
  showBackButton?: boolean;
  onBack?: () => void;
}

export default function RecordList({ recordYearId, title = "Daily Records" }: Props) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [page, setPage] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filters: RecordsFilter = {
    page,
    take: 50,
    search: appliedSearch || undefined,
  };

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
    onError: (error: any) =>
      toast.error(error?.response?.data?.message || "Delete failed"),
  });

  const runSearch = () => {
    setAppliedSearch(search.trim());
    setPage(0);
  };

  return (
    <div className="space-y-5 p-4 md:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="text-sm text-muted-foreground">
            Office staff daily customer/user record. Total: {total}
          </p>
        </div>
        <Button asChild>
          <Link href={`/admin/dashboard/records/year/${recordYearId}/create`}>
            <Plus className="mr-2 h-4 w-4" /> Add Daily Record
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9 pr-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && runSearch()}
                placeholder="Search name, phone, place, room/showroom, status..."
              />
              {search && (
                <button
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  onClick={() => {
                    setSearch("");
                    setAppliedSearch("");
                    setPage(0);
                  }}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <Button onClick={runSearch}>Search</Button>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table className="min-w-[1450px] text-xs">
            <TableHeader>
              <TableRow className="bg-green-700 hover:bg-green-700">
                <TableHead className="text-white">Name</TableHead>
                <TableHead className="text-white">Phone Number</TableHead>
                <TableHead className="text-white">Form/Filling Date</TableHead>
                <TableHead className="text-white">Room / Showroom</TableHead>
                <TableHead className="text-white">Payment</TableHead>
                <TableHead className="text-white">Place</TableHead>
                <TableHead className="text-white">Fixed / Unfixed</TableHead>
                <TableHead className="text-white">Authorized Name</TableHead>
                <TableHead className="text-white">Status</TableHead>
                <TableHead className="text-white">User Details</TableHead>
                <TableHead className="text-right text-white">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading || (isFetching && records.length === 0) ? (
                <TableRow><TableCell colSpan={11} className="h-24 text-center">Loading records...</TableCell></TableRow>
              ) : records.length === 0 ? (
                <TableRow><TableCell colSpan={11} className="h-24 text-center">No record found</TableCell></TableRow>
              ) : (
                records.map((record) => (
                  <TableRow key={record.id} className="odd:bg-green-50 even:bg-green-100/60">
                    <TableCell className="font-medium">{record.name}</TableCell>
                    <TableCell>{record.customerNumber}</TableCell>
                    <TableCell>{record.entryDate || "-"}</TableCell>
                    <TableCell>{record.roomPlaceAddress || "-"}</TableCell>
                    <TableCell>
                      <div className="whitespace-nowrap">Rs. {Number(record.formCharge || 0).toLocaleString()}</div>
                      <div className="text-[11px] text-muted-foreground">{record.payMode}</div>
                      <Badge variant={record.paymentStatus === PaymentStatus.PAID ? "default" : "secondary"} className="mt-1 text-[10px]">
                        {record.paymentStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>{record.place || "-"}</TableCell>
                    <TableCell>{record.workType || "-"}</TableCell>
                    <TableCell>{record.authorizedName || "-"}</TableCell>
                    <TableCell className="max-w-[220px] whitespace-normal">{record.status || record.remarks || "-"}</TableCell>
                    <TableCell className="max-w-[260px] whitespace-normal">{record.userDetails || "-"}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => setSelectedId(record.id)} title="View details">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" asChild title="Edit">
                          <Link href={`/admin/dashboard/records/${record.id}/edit`}><Edit className="h-4 w-4" /></Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Delete"
                          disabled={deleteMutation.isPending}
                          onClick={() => {
                            if (window.confirm(`Delete ${record.name}'s record?`)) deleteMutation.mutate(record.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" disabled={page <= 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>Previous</Button>
          <span className="text-sm">Page {page + 1} / {totalPages}</span>
          <Button variant="outline" disabled={page + 1 >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
        </div>
      )}

      <Dialog open={!!selectedId} onOpenChange={(open) => !open && setSelectedId(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Record Details</DialogTitle></DialogHeader>
          {selected && (
            <div className="grid gap-3 text-sm sm:grid-cols-2">
              <Detail label="Name" value={selected.name} />
              <Detail label="Phone" value={selected.customerNumber} />
              <Detail label="Date" value={selected.entryDate} />
              <Detail label="Room / Showroom" value={selected.roomPlaceAddress} />
              <Detail label="Owner Phone" value={selected.roomPlaceNumber} />
              <Detail label="Place" value={selected.place} />
              <Detail label="Fixed / Unfixed" value={selected.workType} />
              <Detail label="Authorized Name" value={selected.authorizedName} />
              <Detail label="Payment" value={`Rs. ${Number(selected.formCharge || 0).toLocaleString()} • ${selected.payMode} • ${selected.paymentStatus}`} />
              <Detail label="Status" value={selected.status} />
              <div className="sm:col-span-2"><Detail label="User Details" value={selected.userDetails} /></div>
              <div className="sm:col-span-2"><Detail label="Remarks" value={selected.remarks} /></div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Detail({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="rounded-lg border p-3">
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      <div className="mt-1 whitespace-pre-wrap">{value || "-"}</div>
    </div>
  );
}
