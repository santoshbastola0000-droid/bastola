import { privateApi } from "@/http/api/privateApi";

export type AiLearningStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED";

export interface AiLearningSuggestion {
  id: string;
  userMessage: string;
  botReply?: string;
  detectedIntent?: string;
  extractedEntities?: Record<string, unknown>;
  suggestedIntent?: string;
  suggestedRule?: string;
  confidence?: number;
  status: AiLearningStatus;
  adminNote?: string;
  approvedRule?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
}

export interface ReviewAiLearningPayload {
  status: "APPROVED" | "REJECTED";
  adminNote?: string;
  approvedRule?: string;
}

export const aiLearningService = {
  getSuggestions: async (
    status?: AiLearningStatus,
  ): Promise<AiLearningSuggestion[]> => {
    const response = await privateApi.get("/admin/ai-learning", {
      params: status ? { status } : undefined,
    });

    return response.data?.data ?? [];
  },

  reviewSuggestion: async (
    id: string,
    payload: ReviewAiLearningPayload,
  ): Promise<AiLearningSuggestion> => {
    const response = await privateApi.patch(
      `/admin/ai-learning/${id}/review`,
      payload,
    );

    return response.data?.data;
  },
};
