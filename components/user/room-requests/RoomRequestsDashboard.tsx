"use client";

import { useMemo, useState } from "react";
import { CheckCircle, Clock3, Inbox, MessageSquare, SendHorizontal, XCircle } from "lucide-react";
import { useMyRoomRequestsQuery, useReceivedRoomRequestsQuery } from "@/hooks/room-requests/use-room-request-queries";
import { useUpdateRoomRequestStatusMutation } from "@/http/mutations/room-request.mutations";
import {
  RoomRequestIntent,
  RoomRequestStatus,
  type RoomRequest,
} from "@/types/room-request.types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const STATUS_LABELS: Record<RoomRequestStatus, string> = {
  [RoomRequestStatus.PENDING]: "Pending",
  [RoomRequestStatus.ACCEPTED]: "Accepted",
  [RoomRequestStatus.REJECTED]: "Rejected",
  [RoomRequestStatus.COMPLETED]: "Completed",
};

const STATUS_STYLES: Record<RoomRequestStatus, string> = {
  [RoomRequestStatus.PENDING]: "bg-amber-100 text-amber-700 border-amber-200",
  [RoomRequestStatus.ACCEPTED]: "bg-emerald-100 text-emerald-700 border-emerald-200",
  [RoomRequestStatus.REJECTED]: "bg-rose-100 text-rose-700 border-rose-200",
  [RoomRequestStatus.COMPLETED]: "bg-slate-100 text-slate-700 border-slate-200",
};

const REQUEST_TYPE_LABELS: Record<RoomRequestIntent, string> = {
  [RoomRequestIntent.REQUEST_VISIT]: "Visit request",
  [RoomRequestIntent.CONTACT_OWNER]: "Contact owner",
  [RoomRequestIntent.BOOKING_INTEREST]: "Booking interest",
};

const getRequestTypeLabel = (requestType?: RoomRequestIntent | null) => {
  if (!requestType) {
    return REQUEST_TYPE_LABELS[RoomRequestIntent.CONTACT_OWNER];
  }

  return REQUEST_TYPE_LABELS[requestType];
};

const formatDate = (value: string) =>
  new Date(value).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });

function RequestCard({
  request,
  mode,
  onStatusChange,
  isPending,
}: {
  request: RoomRequest;
  mode: "sent" | "received";
  onStatusChange: (id: string, status: RoomRequestStatus) => void;
  isPending: boolean;
}) {
  return (
    <Card className="rounded-3xl border border-slate-200 shadow-sm">
      <CardContent className="p-5 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-slate-900">
              {request.room?.title || "Room request"}
            </p>
            <p className="text-xs text-muted-foreground">{request.room?.address || "Room details will appear once connected."}</p>
          </div>
          <Badge className={STATUS_STYLES[request.status]}>{STATUS_LABELS[request.status]}</Badge>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Intent</p>
            <p className="text-sm font-medium text-slate-900">
              {getRequestTypeLabel(request.requestType)}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              {mode === "sent" ? "Owner" : "Requester"}
            </p>
            <p className="text-sm font-medium text-slate-900">
              {mode === "sent"
                ? request.owner?.name || "Room owner"
                : request.requester?.name || "Interested user"}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Created</p>
            <p className="text-sm font-medium text-slate-900">{formatDate(request.createdAt)}</p>
          </div>
        </div>

        <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700 whitespace-pre-wrap">
          {request.message}
        </div>

        {mode === "received" && (
          <div className="flex flex-wrap gap-2">
            {request.status === RoomRequestStatus.PENDING && (
              <>
                <Button
                  size="sm"
                  className="rounded-full bg-emerald-600 hover:bg-emerald-700"
                  disabled={isPending}
                  onClick={() => onStatusChange(request.id, RoomRequestStatus.ACCEPTED)}
                >
                  <CheckCircle className="w-4 h-4" /> Accept
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-full border-rose-200 text-rose-600 hover:bg-rose-50"
                  disabled={isPending}
                  onClick={() => onStatusChange(request.id, RoomRequestStatus.REJECTED)}
                >
                  <XCircle className="w-4 h-4" /> Reject
                </Button>
              </>
            )}
            {request.status === RoomRequestStatus.ACCEPTED && (
              <Button
                size="sm"
                variant="outline"
                className="rounded-full"
                disabled={isPending}
                onClick={() => onStatusChange(request.id, RoomRequestStatus.COMPLETED)}
              >
                <Clock3 className="w-4 h-4" /> Mark completed
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function RoomRequestsDashboard() {
  const [tab, setTab] = useState<"sent" | "received">("sent");
  const [statusFilter, setStatusFilter] = useState<"ALL" | RoomRequestStatus>("ALL");
  const requestFilters = useMemo(
    () => ({
      status: statusFilter === "ALL" ? undefined : statusFilter,
      page: 1,
      take: 20,
    }),
    [statusFilter],
  );

  const sentQuery = useMyRoomRequestsQuery(requestFilters, tab === "sent");
  const receivedQuery = useReceivedRoomRequestsQuery(requestFilters, tab === "received");
  const { mutate: updateStatus, isPending: isUpdating } = useUpdateRoomRequestStatusMutation();

  const activeQuery = tab === "sent" ? sentQuery : receivedQuery;
  const requests = activeQuery.data?.data ?? [];

  return (
    <Card className="rounded-3xl border-0 shadow-sm">
      <CardHeader className="space-y-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl">
              <MessageSquare className="w-5 h-5 text-red-500" />
              Room requests
            </CardTitle>
            <CardDescription>
              Track visit requests, owner contact requests, and booking interest from one place.
            </CardDescription>
          </div>
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as "ALL" | RoomRequestStatus)}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All statuses</SelectItem>
              {Object.values(RoomRequestStatus).map((status) => (
                <SelectItem key={status} value={status}>
                  {STATUS_LABELS[status]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={tab} onValueChange={(value) => setTab(value as "sent" | "received")}> 
          <TabsList className="mb-6 grid w-full grid-cols-2 rounded-2xl bg-slate-100">
            <TabsTrigger value="sent" className="rounded-2xl">
              <SendHorizontal className="w-4 h-4" /> Sent by me
            </TabsTrigger>
            <TabsTrigger value="received" className="rounded-2xl">
              <Inbox className="w-4 h-4" /> Received on my rooms
            </TabsTrigger>
          </TabsList>

          <TabsContent value="sent" className="space-y-4">
            {sentQuery.isLoading ? (
              <p className="text-sm text-muted-foreground">Loading sent requests...</p>
            ) : requests.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-200 p-8 text-center text-sm text-muted-foreground">
                You have not submitted any room requests yet.
              </div>
            ) : (
              requests.map((request) => (
                <RequestCard
                  key={request.id}
                  request={request}
                  mode="sent"
                  onStatusChange={(id, status) => updateStatus({ id, status })}
                  isPending={isUpdating}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="received" className="space-y-4">
            {receivedQuery.isLoading ? (
              <p className="text-sm text-muted-foreground">Loading incoming requests...</p>
            ) : requests.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-200 p-8 text-center text-sm text-muted-foreground">
                No one has sent a request to your rooms yet.
              </div>
            ) : (
              requests.map((request) => (
                <RequestCard
                  key={request.id}
                  request={request}
                  mode="received"
                  onStatusChange={(id, status) => updateStatus({ id, status })}
                  isPending={isUpdating}
                />
              ))
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
