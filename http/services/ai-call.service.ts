import { privateApi } from "@/http/api/privateApi";

export type AiCallSettings = {
  id: string;
  enabled: boolean;
  assistantName: string;
  humanTransferNumber: string | null;
  systemPrompt: string | null;
  greetingMessage: string | null;
  goodbyeMessage: string | null;
  silenceTimeoutSeconds: number;
  silenceRetries: number;
  captureCallerDetails: boolean;
  useKnownName: boolean;
  autoTransferOnFailure: boolean;
  voiceProvider: "twilio" | "elevenlabs";
  voiceId: string | null;
  updatedAt: string;
};

export type AiCallSession = {
  id: string;
  callSid: string;
  direction: "INBOUND" | "OUTBOUND";
  phoneNumber: string | null;
  userId: string | null;
  callerName: string | null;
  status: string;
  outcome: string | null;
  transferredToHuman: boolean;
  silenceCount: number;
  callerDetails: Record<string, unknown>;
  transcript: Array<{ role: "user" | "assistant"; text: string; at: string }>;
  endedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export const aiCallService = {
  async getSettings(): Promise<AiCallSettings> {
    const response = await privateApi.get("/admin/ai-call/settings");
    return response.data.data;
  },

  async updateSettings(input: Partial<Omit<AiCallSettings, "id" | "updatedAt">>): Promise<AiCallSettings> {
    const response = await privateApi.patch("/admin/ai-call/settings", input);
    return response.data.data;
  },

  async startOutbound(to: string): Promise<{
    sid: string;
    status: string;
    to: string;
    from: string;
  }> {
    const response = await privateApi.post("/admin/ai-call/outbound", { to });
    return response.data.data;
  },

  async getSessions(limit = 30): Promise<AiCallSession[]> {
    const response = await privateApi.get("/admin/ai-call/sessions", {
      params: { limit },
    });
    return response.data.data || [];
  },
};
