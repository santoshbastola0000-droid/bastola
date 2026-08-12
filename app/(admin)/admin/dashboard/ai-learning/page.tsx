"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bot,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock3,
  Eye,
  Loader2,
  MessageSquare,
  RefreshCw,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  aiLearningService,
  AiLearningStatus,
  AiLearningSuggestion,
} from "@/http/services/ai-learning.service";

type Filter = AiLearningStatus | "ALL";

function formatDate(value?: string) {
  if (!value) return "—";

  try {
    return new Date(value).toLocaleString("en-NP", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return value;
  }
}

function confidence(value?: number) {
  if (value === undefined || value === null) return "—";

  const percentage = value <= 1 ? value * 100 : value;

  return `${Math.round(percentage)}%`;
}

function statusClass(status: AiLearningStatus) {
  if (status === "APPROVED") {
    return "border-green-200 bg-green-50 text-green-700 dark:border-green-900 dark:bg-green-950/30 dark:text-green-400";
  }

  if (status === "REJECTED") {
    return "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400";
  }

  return "border-yellow-200 bg-yellow-50 text-yellow-700 dark:border-yellow-900 dark:bg-yellow-950/30 dark:text-yellow-400";
}

function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-5">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="mt-1 text-2xl font-bold">{value}</p>
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-muted">
          {icon}
        </div>
      </CardContent>
    </Card>
  );
}

function SuggestionCard({
  item,
  onReview,
  onQuickReview,
}: {
  item: AiLearningSuggestion;
  onReview: (
    item: AiLearningSuggestion,
    action?: "APPROVED" | "REJECTED",
  ) => void;
  onQuickReview: (
    item: AiLearningSuggestion,
    action: "APPROVED" | "REJECTED",
  ) => void;
}) {
  const [showEntities, setShowEntities] = useState(false);

  return (
    <Card className="overflow-hidden transition hover:shadow-md">
      <CardContent className="p-4 sm:p-5">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-start">
            <div className="flex min-w-0 gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 dark:bg-red-950/40">
                <Bot className="h-5 w-5 text-red-600" />
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className={statusClass(item.status)}>
                    {item.status}
                  </Badge>

                  {item.detectedIntent && (
                    <Badge variant="secondary">
                      {item.detectedIntent}
                    </Badge>
                  )}

                  {item.suggestedIntent &&
                    item.suggestedIntent !== item.detectedIntent && (
                      <Badge variant="outline">
                        → {item.suggestedIntent}
                      </Badge>
                    )}
                </div>

                <p className="mt-2 text-sm font-semibold">
                  User message
                </p>

                <p className="mt-1 break-words rounded-lg bg-muted/40 p-3 text-sm">
                  {item.userMessage}
                </p>
              </div>
            </div>

            <div className="shrink-0 text-left lg:text-right">
              <p className="text-xs text-muted-foreground">
                Confidence
              </p>
              <p className="text-lg font-bold">
                {confidence(item.confidence)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {formatDate(item.createdAt)}
              </p>
            </div>
          </div>

          {item.suggestedRule && (
            <div className="rounded-xl border bg-muted/20 p-4">
              <p className="mb-1 text-xs font-medium text-muted-foreground">
                Suggested rule
              </p>
              <p className="whitespace-pre-wrap break-words text-sm">
                {item.suggestedRule}
              </p>
            </div>
          )}

          {item.extractedEntities &&
            Object.keys(item.extractedEntities).length > 0 && (
              <div className="rounded-xl border">
                <button
                  type="button"
                  onClick={() => setShowEntities((v) => !v)}
                  className="flex w-full items-center justify-between p-3 text-left text-sm font-medium"
                >
                  <span>Extracted entities</span>
                  {showEntities ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </button>

                {showEntities && (
                  <pre className="overflow-x-auto border-t bg-muted/20 p-4 text-xs">
                    {JSON.stringify(item.extractedEntities, null, 2)}
                  </pre>
                )}
              </div>
            )}

          <div className="flex flex-col justify-between gap-3 border-t pt-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock3 className="h-3.5 w-3.5" />
              Created {formatDate(item.createdAt)}
            </div>

            <div className="flex flex-wrap gap-2">
              {item.status === "PENDING" && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      onQuickReview(item, "APPROVED")
                    }
                  >
                    <CheckCircle2 className="mr-1.5 h-4 w-4" />
                    Approve
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      onQuickReview(item, "REJECTED")
                    }
                  >
                    <XCircle className="mr-1.5 h-4 w-4" />
                    Reject
                  </Button>
                </>
              )}

              <Button
                size="sm"
                variant="secondary"
                onClick={() => onReview(item)}
              >
                <Eye className="mr-1.5 h-4 w-4" />
                Review
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AiLearningPage() {
  const queryClient = useQueryClient();

  const [filter, setFilter] = useState<Filter>("PENDING");
  const [selected, setSelected] =
    useState<AiLearningSuggestion | null>(null);
  const [reviewAction, setReviewAction] = useState<
    "APPROVED" | "REJECTED" | null
  >(null);
  const [approvedRule, setApprovedRule] = useState("");
  const [adminNote, setAdminNote] = useState("");

  const statuses: AiLearningStatus[] = [
    "PENDING",
    "APPROVED",
    "REJECTED",
  ];

  const queries = useQuery({
    queryKey: ["admin-ai-learning", filter],
    queryFn: async () => {
      if (filter === "ALL") {
        const results = await Promise.all(
          statuses.map((status) =>
            aiLearningService.getSuggestions(status),
          ),
        );

        const map = new Map<string, AiLearningSuggestion>();

        results.flat().forEach((item) => {
          map.set(item.id, item);
        });

        return Array.from(map.values());
      }

      return aiLearningService.getSuggestions(filter);
    },
    staleTime: 15_000,
  });

  const statQueries = useQuery({
    queryKey: ["admin-ai-learning-stats"],
    queryFn: async () => {
      const results = await Promise.all(
        statuses.map((status) =>
          aiLearningService.getSuggestions(status),
        ),
      );

      return {
        PENDING: results[0].length,
        APPROVED: results[1].length,
        REJECTED: results[2].length,
      };
    },
    staleTime: 15_000,
  });

  const reviewMutation = useMutation({
    mutationFn: async ({
      id,
      status,
      adminNote,
      approvedRule,
    }: {
      id: string;
      status: "APPROVED" | "REJECTED";
      adminNote?: string;
      approvedRule?: string;
    }) => {
      return aiLearningService.reviewSuggestion(id, {
        status,
        adminNote: adminNote?.trim() || undefined,
        approvedRule:
          status === "APPROVED"
            ? approvedRule?.trim()
            : undefined,
      });
    },

    onSuccess: (_, variables) => {
      toast.success(
        variables.status === "APPROVED"
          ? "AI learning rule approved."
          : "AI learning suggestion rejected.",
      );

      queryClient.invalidateQueries({
        queryKey: ["admin-ai-learning"],
      });

      queryClient.invalidateQueries({
        queryKey: ["admin-ai-learning-stats"],
      });

      closeReview();
    },

    onError: () => {
      toast.error("AI learning review failed. Please try again.");
    },
  });

  function openReview(
    item: AiLearningSuggestion,
    action?: "APPROVED" | "REJECTED",
  ) {
    setSelected(item);
    setReviewAction(action ?? null);
    setApprovedRule(item.approvedRule || item.suggestedRule || "");
    setAdminNote(item.adminNote || "");
  }

  function closeReview() {
    setSelected(null);
    setReviewAction(null);
    setApprovedRule("");
    setAdminNote("");
  }

  function submitReview(status: "APPROVED" | "REJECTED") {
    if (!selected) return;

    if (status === "APPROVED" && !approvedRule.trim()) {
      toast.error("Approved rule is required.");
      return;
    }

    reviewMutation.mutate({
      id: selected.id,
      status,
      adminNote,
      approvedRule,
    });
  }

  const list = useMemo(
    () => queries.data ?? [],
    [queries.data],
  );

  const pendingCount = statQueries.data?.PENDING ?? 0;
  const approvedCount = statQueries.data?.APPROVED ?? 0;
  const rejectedCount = statQueries.data?.REJECTED ?? 0;

  return (
    <div className="space-y-5 p-1 sm:p-2">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <Bot className="h-6 w-6 text-red-600" />
            <h1 className="text-2xl font-bold">
              AI Learning Queue
            </h1>
          </div>

          <p className="mt-1 text-sm text-muted-foreground">
            Review chatbot learning suggestions before approving them.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            queries.refetch();
            statQueries.refetch();
          }}
          disabled={queries.isFetching}
        >
          <RefreshCw
            className={`mr-1.5 h-4 w-4 ${
              queries.isFetching ? "animate-spin" : ""
            }`}
          />
          Refresh
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          title="Pending"
          value={pendingCount}
          icon={<Clock3 className="h-5 w-5 text-yellow-600" />}
        />
        <StatCard
          title="Approved"
          value={approvedCount}
          icon={
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          }
        />
        <StatCard
          title="Rejected"
          value={rejectedCount}
          icon={<XCircle className="h-5 w-5 text-red-600" />}
        />
      </div>

      <Card>
        <CardContent className="p-3">
          <div className="flex flex-wrap gap-2">
            {(["PENDING", "APPROVED", "REJECTED", "ALL"] as Filter[]).map(
              (status) => (
                <Button
                  key={status}
                  size="sm"
                  variant={filter === status ? "default" : "outline"}
                  onClick={() => setFilter(status)}
                >
                  {status === "ALL" ? "All" : status}
                </Button>
              ),
            )}
          </div>
        </CardContent>
      </Card>

      {queries.isLoading ? (
        <div className="grid gap-3">
          {[1, 2, 3].map((item) => (
            <Card key={item}>
              <CardContent className="space-y-3 p-5">
                <div className="h-5 w-32 animate-pulse rounded bg-muted" />
                <div className="h-16 animate-pulse rounded bg-muted" />
                <div className="h-10 animate-pulse rounded bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : queries.error ? (
        <Card>
          <CardContent className="p-10 text-center">
            <XCircle className="mx-auto mb-3 h-10 w-10 text-destructive" />
            <p className="font-medium">
              AI learning suggestions load गर्न सकिएन।
            </p>
            <Button
              className="mt-4"
              variant="outline"
              onClick={() => queries.refetch()}
            >
              Try again
            </Button>
          </CardContent>
        </Card>
      ) : list.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center">
            <MessageSquare className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
            <p className="font-medium">
              No {filter === "ALL" ? "" : filter.toLowerCase()} learning suggestions found.
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              New chatbot learning suggestions will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {list.map((item) => (
            <SuggestionCard
              key={item.id}
              item={item}
              onReview={openReview}
              onQuickReview={openReview}
            />
          ))}
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-background shadow-xl">
            <Card className="border-0 shadow-none">
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle>Review AI Learning Suggestion</CardTitle>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Approve only the rule you want the AI to use.
                    </p>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={closeReview}
                    disabled={reviewMutation.isPending}
                  >
                    <XCircle className="h-5 w-5" />
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="space-y-5">
                <div>
                  <p className="mb-1 text-xs font-medium text-muted-foreground">
                    Original user message
                  </p>
                  <div className="rounded-xl bg-muted/40 p-3 text-sm">
                    {selected.userMessage}
                  </div>
                </div>

                {selected.botReply && (
                  <div>
                    <p className="mb-1 text-xs font-medium text-muted-foreground">
                      Bot reply
                    </p>
                    <div className="rounded-xl bg-muted/40 p-3 text-sm">
                      {selected.botReply}
                    </div>
                  </div>
                )}

                {selected.suggestedIntent && (
                  <div>
                    <p className="mb-1 text-xs font-medium text-muted-foreground">
                      Suggested intent
                    </p>
                    <Badge variant="secondary">
                      {selected.suggestedIntent}
                    </Badge>
                  </div>
                )}

                <div>
                  <p className="mb-1 text-sm font-medium">
                    Approved rule
                  </p>
                  <Textarea
                    value={approvedRule}
                    onChange={(e) =>
                      setApprovedRule(e.target.value)
                    }
                    placeholder="Write the rule the AI should follow..."
                    rows={6}
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Required when approving.
                  </p>
                </div>

                <div>
                  <p className="mb-1 text-sm font-medium">
                    Admin note
                  </p>
                  <Textarea
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    placeholder="Optional note for this review..."
                    rows={3}
                  />
                </div>

                {selected.extractedEntities &&
                  Object.keys(selected.extractedEntities).length > 0 && (
                    <div>
                      <p className="mb-1 text-xs font-medium text-muted-foreground">
                        Extracted entities
                      </p>
                      <pre className="max-h-48 overflow-auto rounded-xl bg-muted/40 p-3 text-xs">
                        {JSON.stringify(
                          selected.extractedEntities,
                          null,
                          2,
                        )}
                      </pre>
                    </div>
                  )}

                {reviewAction && (
                  <div className="rounded-xl border border-yellow-300 bg-yellow-50 p-3 text-sm dark:border-yellow-900 dark:bg-yellow-950/30">
                    You are preparing to{" "}
                    <strong>
                      {reviewAction === "APPROVED"
                        ? "approve"
                        : "reject"}
                    </strong>{" "}
                    this learning suggestion.
                  </div>
                )}

                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <Button
                    variant="outline"
                    onClick={closeReview}
                    disabled={reviewMutation.isPending}
                  >
                    Cancel
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => submitReview("REJECTED")}
                    disabled={reviewMutation.isPending}
                  >
                    {reviewMutation.isPending &&
                    reviewAction === "REJECTED" ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <XCircle className="mr-2 h-4 w-4" />
                    )}
                    Reject
                  </Button>

                  <Button
                    onClick={() => submitReview("APPROVED")}
                    disabled={
                      reviewMutation.isPending ||
                      !approvedRule.trim()
                    }
                  >
                    {reviewMutation.isPending &&
                    reviewAction === "APPROVED" ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                    )}
                    Approve
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
