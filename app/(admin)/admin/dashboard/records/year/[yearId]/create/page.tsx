"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Save } from "lucide-react";
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
import {
  CreateRecordDTO,
  PaymentStatus,
  PayMode,
} from "@/types/record.types";

export default function CreateDailyRecordPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const recordYearId = String(params.yearId || "");

  const initialData = useMemo<CreateRecordDTO>(
    () => ({
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
    }),
    [recordYearId],
  );

  const [form, setForm] = useState<CreateRecordDTO>(initialData);

  const setField = (key: keyof CreateRecordDTO, value: string | number) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const mutation = useMutation({
    mutationFn: () =>
      recordService.createRecord({
        ...form,
        recordYearId,
        formCharge: Number(form.formCharge || 0),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["records", recordYearId] });
      toast.success("Daily record saved");
      router.push("/admin/dashboard/records");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Record save failed");
    },
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
    <div className="mx-auto w-full max-w-6xl space-y-5 p-4 md:p-6">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Daily Office Record</h1>
          <p className="text-sm text-muted-foreground">
            Staff can save complete customer/user details here for office use.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Record details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input value={form.name} onChange={(e) => setField("name", e.target.value)} placeholder="Customer name" />
            </div>

            <div className="space-y-2">
              <Label>Phone Number *</Label>
              <Input value={form.customerNumber} onChange={(e) => setField("customerNumber", e.target.value)} placeholder="98XXXXXXXX" />
            </div>

            <div className="space-y-2">
              <Label>Form/Filling Date</Label>
              <Input value={form.entryDate || ""} onChange={(e) => setField("entryDate", e.target.value)} placeholder="2083/05/19" />
            </div>

            <div className="space-y-2">
              <Label>Room / Showroom</Label>
              <Input value={form.roomPlaceAddress} onChange={(e) => setField("roomPlaceAddress", e.target.value)} placeholder="Room, showroom or branch" />
            </div>

            <div className="space-y-2">
              <Label>Room Owner Number</Label>
              <Input value={form.roomPlaceNumber} onChange={(e) => setField("roomPlaceNumber", e.target.value)} placeholder="Optional" />
            </div>

            <div className="space-y-2">
              <Label>Place</Label>
              <Input value={form.place || ""} onChange={(e) => setField("place", e.target.value)} placeholder="Parsyang, Nayabazar..." />
            </div>

            <div className="space-y-2">
              <Label>Payment Amount</Label>
              <Input type="number" min="0" value={form.formCharge} onChange={(e) => setField("formCharge", Number(e.target.value))} />
            </div>

            <div className="space-y-2">
              <Label>Payment Mode</Label>
              <Select value={form.payMode} onValueChange={(v) => setField("payMode", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={PayMode.CASH}>Cash</SelectItem>
                  <SelectItem value={PayMode.DIGITAL}>Online / Digital</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Payment Status</Label>
              <Select value={form.paymentStatus} onValueChange={(v) => setField("paymentStatus", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={PaymentStatus.PAID}>Paid</SelectItem>
                  <SelectItem value={PaymentStatus.DUE}>Due</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Fixed / Unfixed</Label>
              <Select value={form.workType || "Fixed"} onValueChange={(v) => setField("workType", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Fixed">Fixed</SelectItem>
                  <SelectItem value="Unfixed">Unfixed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Authorized Name</Label>
              <Input value={form.authorizedName || ""} onChange={(e) => setField("authorizedName", e.target.value)} placeholder="Authorized staff/person" />
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Input value={form.status || ""} onChange={(e) => setField("status", e.target.value)} placeholder="Follow-up / contacted / pending..." />
            </div>

            <div className="space-y-2 md:col-span-2 lg:col-span-3">
              <Label>User Details</Label>
              <Textarea value={form.userDetails || ""} onChange={(e) => setField("userDetails", e.target.value)} placeholder="Any extra user details, requirement, address, job/room need, reference, etc." rows={3} />
            </div>

            <div className="space-y-2 md:col-span-2 lg:col-span-3">
              <Label>Remarks / Follow-up Note</Label>
              <Textarea value={form.remarks} onChange={(e) => setField("remarks", e.target.value)} placeholder="Office remarks" rows={3} />
            </div>

            <div className="flex justify-end gap-2 md:col-span-2 lg:col-span-3">
              <Button type="button" variant="outline" onClick={() => router.back()} disabled={mutation.isPending}>Cancel</Button>
              <Button type="submit" disabled={mutation.isPending}>
                <Save className="mr-2 h-4 w-4" />
                {mutation.isPending ? "Saving..." : "Save Record"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
