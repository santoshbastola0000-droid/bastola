"use client";

import { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  BrainCircuit,
  CheckCircle2,
  RefreshCw,
  ShieldAlert,
} from "lucide-react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  aiFlowMonitorService,
  AiFlowMonitorEvent,
  AiFlowMonitorStatus,
} from "@/http/services/ai-flow-monitor.service";

const issueOptions = [
  "",
  "WRONG_INTENT",
  "STALE_FLOW",
  "STUCK_LOOP",
  "REPEATED_QUESTION",
  "WRONG_FIELD",
  "BAD_SWITCH",
  "UNNECESSARY_QUESTION",
  "TOOL_ERROR",
  "PRIVACY_RISK",
  "NEEDS_REVIEW",
  "OK",
];

const severityOptions = ["", "HIGH", "MEDIUM", "LOW", "INFO"];
const statusOptions = ["", "OPEN", "RESOLVED", "FALSE_POSITIVE"];

function severityVariant(severity: string) {
  if (severity === "HIGH") return "destructive" as const;
  if (severity === "MEDIUM") return "secondary" as const;
  return "outline" as const;
}

function EventCard({
  event,
  onReview,
  reviewing,
}: {
  event: AiFlowMonitorEvent;
  onReview: (id: string, status: AiFlowMonitorStatus) => void;
  reviewing: boolean;
}) {
  const confidence = Math.round(Number(event.confidence || 0) * 100);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={severityVariant(event.severity)}>
                {event.severity}
              </Badge>
              <Badge variant={event.issueType === "OK" ? "outline" : "secondary"}>
                {event.issueType}
              </Badge>
              <Badge variant="outline">{event.evaluator}</Badge>
              <span className="text-xs text-muted-foreground">
                {confidence}% confidence
              </span>
            </div>
            <CardTitle className="text-base">
              {event.issueType === "OK"
                ? "Healthy AI turn"
                : event.reason || "Flow issue detected"}
            </CardTitle>
            <CardDescription>
              {new Date(event.createdAt).toLocaleString()}
            </CardDescription>
          </div>

          <Badge
            variant={event.status === "OPEN" ? "destructive" : "outline"}
          >
            {event.status}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-lg border p-3">
            <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
              User
            </p>
            <p className="whitespace-pre-wrap text-sm">{event.userMessage}</p>
          </div>

          <div className="rounded-lg border p-3">
            <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
              RoomKhoj AI
            </p>
            <p className="whitespace-pre-wrap text-sm">{event.aiReply}</p>
          </div>
        </div>

        <div className="grid gap-2 text-sm md:grid-cols-4">
          <div>
            <span className="text-muted-foreground">Before:</span>{" "}
            {event.activeIntentBefore || "—"}
          </div>
          <div>
            <span className="text-muted-foreground">Expected:</span>{" "}
            {event.expectedIntent || "—"}
          </div>
          <div>
            <span className="text-muted-foreground">Actual:</span>{" "}
            {event.actualIntent || "—"}
          </div>
          <div>
            <span className="text-muted-foreground">Action:</span>{" "}
            {event.nextAction || "—"}
          </div>
        </div>

        {event.suggestedFix && (
          <div className="rounded-lg border border-dashed p-3">
            <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
              Suggested fix
            </p>
            <p className="text-sm">{event.suggestedFix}</p>
          </div>
        )}

        {event.issueType !== "OK" && event.status === "OPEN" && (
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              onClick={() => onReview(event.id, "RESOLVED")}
              disabled={reviewing}
            >
              Mark resolved
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onReview(event.id, "FALSE_POSITIVE")}
              disabled={reviewing}
            >
              False positive
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function AiFlowMonitorPage() {
  const queryClient = useQueryClient();
  const [issueType, setIssueType] = useState("");
  const [severity, setSeverity] = useState("");
  const [status, setStatus] = useState("OPEN");
  const [days, setDays] = useState(7);

  const listQuery = useQuery({
    queryKey: ["ai-flow-monitor", issueType, severity, status],
    queryFn: () =>
      aiFlowMonitorService.list({
        limit: 100,
        issueType: issueType || undefined,
        severity: severity || undefined,
        status: status || undefined,
      }),
    refetchInterval: 15000,
  });

  const statsQuery = useQuery({
    queryKey: ["ai-flow-monitor-stats", days],
    queryFn: () => aiFlowMonitorService.stats(days),
    refetchInterval: 15000,
  });

  const reviewMutation = useMutation({
    mutationFn: ({
      id,
      nextStatus,
    }: {
      id: string;
      nextStatus: AiFlowMonitorStatus;
    }) => aiFlowMonitorService.review(id, nextStatus),
    onSuccess: () => {
      toast.success("AI monitor event updated");
      queryClient.invalidateQueries({ queryKey: ["ai-flow-monitor"] });
      queryClient.invalidateQueries({ queryKey: ["ai-flow-monitor-stats"] });
    },
    onError: () => toast.error("Could not update AI monitor event"),
  });

  const stats = statsQuery.data;
  const events = listQuery.data?.data || [];

  const highIssues = useMemo(
    () =>
      stats?.breakdown
        .filter((row) => row.severity === "HIGH" && row.issueType !== "OK")
        .reduce((sum, row) => sum + row.count, 0) || 0,
    [stats],
  );

  const refresh = () => {
    listQuery.refetch();
    statsQuery.refetch();
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <BrainCircuit className="h-7 w-7" />
            <h1 className="text-2xl font-bold md:text-3xl">AI Flow Monitor</h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            RoomKhoj AI को intent, flow, repeated questions र evaluator findings monitor गर्नुहोस्।
          </p>
        </div>

        <Button variant="outline" onClick={refresh}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-5">
            <Activity className="h-7 w-7" />
            <div>
              <p className="text-xs text-muted-foreground">Turns</p>
              <p className="text-2xl font-bold">{stats?.total || 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-5">
            <CheckCircle2 className="h-7 w-7" />
            <div>
              <p className="text-xs text-muted-foreground">Healthy</p>
              <p className="text-2xl font-bold">{stats?.healthy || 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-5">
            <AlertTriangle className="h-7 w-7" />
            <div>
              <p className="text-xs text-muted-foreground">Issues</p>
              <p className="text-2xl font-bold">{stats?.issues || 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-5">
            <ShieldAlert className="h-7 w-7" />
            <div>
              <p className="text-xs text-muted-foreground">High severity</p>
              <p className="text-2xl font-bold">{highIssues}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="grid gap-3 p-4 md:grid-cols-4">
          <select
            className="h-10 rounded-md border bg-background px-3 text-sm"
            value={issueType}
            onChange={(event) => setIssueType(event.target.value)}
          >
            {issueOptions.map((value) => (
              <option key={value || "all"} value={value}>
                {value || "All issue types"}
              </option>
            ))}
          </select>

          <select
            className="h-10 rounded-md border bg-background px-3 text-sm"
            value={severity}
            onChange={(event) => setSeverity(event.target.value)}
          >
            {severityOptions.map((value) => (
              <option key={value || "all"} value={value}>
                {value || "All severities"}
              </option>
            ))}
          </select>

          <select
            className="h-10 rounded-md border bg-background px-3 text-sm"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            {statusOptions.map((value) => (
              <option key={value || "all"} value={value}>
                {value || "All statuses"}
              </option>
            ))}
          </select>

          <select
            className="h-10 rounded-md border bg-background px-3 text-sm"
            value={days}
            onChange={(event) => setDays(Number(event.target.value))}
          >
            <option value={1}>Last 24 hours</option>
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
        </CardContent>
      </Card>

      {listQuery.isLoading ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            Loading AI flow events…
          </CardContent>
        </Card>
      ) : listQuery.isError ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-sm text-destructive">
              AI Flow Monitor load गर्न सकिएन।
            </p>
          </CardContent>
        </Card>
      ) : events.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            यो filter मा monitor event छैन।
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              reviewing={reviewMutation.isPending}
              onReview={(id, nextStatus) =>
                reviewMutation.mutate({ id, nextStatus })
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
