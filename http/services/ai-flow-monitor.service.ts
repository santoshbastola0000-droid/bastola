import { privateApi } from "@/http/api/privateApi";

export type AiFlowMonitorIssueType =
  | "OK"
  | "WRONG_INTENT"
  | "STALE_FLOW"
  | "STUCK_LOOP"
  | "REPEATED_QUESTION"
  | "WRONG_FIELD"
  | "BAD_SWITCH"
  | "UNNECESSARY_QUESTION"
  | "TOOL_ERROR"
  | "PRIVACY_RISK"
  | "NEEDS_REVIEW";

export type AiFlowMonitorSeverity = "INFO" | "LOW" | "MEDIUM" | "HIGH";
export type AiFlowMonitorStatus = "OPEN" | "RESOLVED" | "FALSE_POSITIVE";

export interface AiFlowMonitorEvent {
  id: string;
  actorHash: string | null;
  conversationId: string | null;
  userMessage: string;
  aiReply: string;
  activeIntentBefore: string | null;
  actualIntent: string | null;
  expectedIntent: string | null;
  nextAction: string | null;
  issueType: AiFlowMonitorIssueType;
  severity: AiFlowMonitorSeverity;
  confidence: number | string;
  evaluator: "DETERMINISTIC" | "LLM" | string;
  reason: string | null;
  suggestedFix: string | null;
  status: AiFlowMonitorStatus;
  adminNote: string | null;
  reviewedAt: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface AiFlowMonitorListResponse {
  data: AiFlowMonitorEvent[];
  total: number;
  limit: number;
  offset: number;
}

export interface AiFlowMonitorStats {
  days: number;
  total: number;
  issues: number;
  healthy: number;
  issueRate: number;
  breakdown: Array<{
    issueType: AiFlowMonitorIssueType;
    severity: AiFlowMonitorSeverity;
    count: number;
  }>;
}

class AiFlowMonitorService {
  private readonly baseUrl = "/ai/admin/flow-monitor";

  async list(params?: {
    limit?: number;
    offset?: number;
    issueType?: string;
    severity?: string;
    status?: string;
  }): Promise<AiFlowMonitorListResponse> {
    const response = await privateApi.get(this.baseUrl, { params });
    return response.data;
  }

  async stats(days = 7): Promise<AiFlowMonitorStats> {
    const response = await privateApi.get(`${this.baseUrl}/stats`, {
      params: { days },
    });
    return response.data;
  }

  async review(
    id: string,
    status: AiFlowMonitorStatus,
    adminNote?: string,
  ): Promise<AiFlowMonitorEvent | null> {
    const response = await privateApi.patch(`${this.baseUrl}/${id}/review`, {
      status,
      adminNote,
    });
    return response.data?.data || null;
  }
}

export const aiFlowMonitorService = new AiFlowMonitorService();
