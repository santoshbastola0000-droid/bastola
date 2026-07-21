"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, Shield } from "lucide-react";
import { createReportSchema, type CreateReportValues } from "@/schema/report.schema";
import { useMyReportsQuery } from "@/hooks/use-report-queries";
import { useCreateReportMutation } from "@/http/mutations/report.mutations";
import { ReportStatus, ReportType } from "@/types/report.types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  [ReportType.FAKE_ROOM]: "Fake room",
  [ReportType.WRONG_INFORMATION]: "Wrong information",
  [ReportType.FRAUD_OWNER]: "Fraud owner",
  [ReportType.SPAM]: "Spam",
};

const REPORT_STATUS_STYLES: Record<ReportStatus, string> = {
  [ReportStatus.PENDING]: "bg-amber-100 text-amber-700 border-amber-200",
  [ReportStatus.UNDER_REVIEW]: "bg-blue-100 text-blue-700 border-blue-200",
  [ReportStatus.RESOLVED]: "bg-emerald-100 text-emerald-700 border-emerald-200",
  [ReportStatus.REJECTED]: "bg-rose-100 text-rose-700 border-rose-200",
};

const formatDate = (value: string) =>
  new Date(value).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });

export function ReportsDashboard() {
  const [statusFilter, setStatusFilter] = useState<"ALL" | ReportStatus>("ALL");
  const [open, setOpen] = useState(false);
  const { data, isLoading } = useMyReportsQuery({
    page: 1,
    take: 20,
    status: statusFilter === "ALL" ? undefined : statusFilter,
  });
  const { mutate: createReport, isPending } = useCreateReportMutation();

  const form = useForm<CreateReportValues>({
    resolver: zodResolver(createReportSchema),
    defaultValues: {
      targetId: "",
      type: ReportType.WRONG_INFORMATION,
      description: "",
    },
  });

  const onSubmit = (values: CreateReportValues) => {
    createReport(values, {
      onSuccess: () => {
        form.reset({
          targetId: "",
          type: ReportType.WRONG_INFORMATION,
          description: "",
        });
        setOpen(false);
      },
    });
  };

  return (
    <Card className="rounded-3xl border-0 shadow-sm">
      <CardHeader className="space-y-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Shield className="w-5 h-5 text-red-500" />
              Safety reports
            </CardTitle>
            <CardDescription>
              Report fake rooms, wrong information, spam, or suspicious owner activity.
            </CardDescription>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as "ALL" | ReportStatus)}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter reports" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All statuses</SelectItem>
                {Object.values(ReportStatus).map((status) => (
                  <SelectItem key={status} value={status}>
                    {status.replaceAll("_", " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button className="rounded-full bg-red-600 hover:bg-red-700" onClick={() => setOpen(true)}>
              <AlertTriangle className="w-4 h-4" /> New report
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading reports...</p>
        ) : (data?.data?.length ?? 0) === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-200 p-8 text-center text-sm text-muted-foreground">
            You have not submitted any reports yet.
          </div>
        ) : (
          data?.data.map((report) => (
            <Card key={report.id} className="rounded-3xl border border-slate-200 shadow-none">
              <CardContent className="p-5 space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-semibold text-slate-900">
                      {report.room?.title || `Target #${report.targetId}`}
                    </p>
                    <p className="text-xs text-muted-foreground">Submitted {formatDate(report.createdAt)}</p>
                  </div>
                  <Badge className={REPORT_STATUS_STYLES[report.status]}>
                    {report.status.replaceAll("_", " ")}
                  </Badge>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Type</p>
                    <p className="text-sm font-medium text-slate-900">{REPORT_TYPE_LABELS[report.type]}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Target ID</p>
                    <p className="text-sm font-medium text-slate-900">{report.targetId}</p>
                  </div>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700 whitespace-pre-wrap">
                  {report.description}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Submit a safety report</DialogTitle>
            <DialogDescription>
              Use the listing or owner ID if you are reporting something outside an individual property page.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="targetId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target listing or owner ID</FormLabel>
                    <FormControl>
                      <Input placeholder="room_or_owner_id" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Issue type</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select issue type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(ReportType).map((value) => (
                          <SelectItem key={value} value={value}>
                            {REPORT_TYPE_LABELS[value]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea rows={5} placeholder="Describe the safety issue clearly..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="submit" className="rounded-full bg-red-600 hover:bg-red-700" isLoading={isPending}>
                  Submit report
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
