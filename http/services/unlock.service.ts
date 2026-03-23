import { api } from "@/http/api/api";
import type {
  CommissionSettings,
  TopUpRequest,
  UnlockResult,
  UnlockStatus,
} from "@/types/unlock.types";
import { TopUpStatus } from "@/types/unlock.types";
import { privateApi } from "../api/privateApi";

export interface ListTopUpQuery {
  page?: number;
  take?: number;
  search?: string;
  status?: TopUpStatus;
}

export interface ProcessTopUpDTO {
  status: TopUpStatus.APPROVED | TopUpStatus.REJECTED;
  adminRemarks?: string;
}

const unlockService = {
  // ─── Settings ─────────────────────────────────────────────────────────────

  async getSettings(): Promise<CommissionSettings> {
    const { data } = await api.get("/unlock/settings");
    return data.data;
  },

  async updateSettings(
    payload: Partial<CommissionSettings>,
  ): Promise<CommissionSettings> {
    const { data } = await api.patch("/unlock/admin/settings", payload);
    return data.data;
  },

  // ─── Room Unlock ──────────────────────────────────────────────────────────

  async getRoomUnlockStatus(roomId: string): Promise<UnlockStatus> {
    const { data } = await privateApi.get(`/unlock/room/${roomId}/status`);
    return data.data;
  },

  async unlockRoom(roomId: string): Promise<UnlockResult> {
    const { data } = await privateApi.post("/unlock/room", { roomId });
    return data.data;
  },

  // ─── Top-Up (User) - Direct upload to unlock/topup endpoint ──────────────

  async createTopUpWithScreenshot(
    amount: number,
    file: File,
  ): Promise<TopUpRequest> {
    const formData = new FormData();
    formData.append("amount", amount.toString());
    formData.append("screenshot", file);

    const { data } = await privateApi.post("/unlock/topup", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data.data;
  },

  // Keep for backward compatibility
  async createTopUpRequest(payload: {
    amount: number;
    screenshotUrl: string;
  }): Promise<TopUpRequest> {
    const { data } = await api.post("/unlock/topup", payload);
    return data.data;
  },

  async getMyTopUpRequests(query: ListTopUpQuery = {}): Promise<{
    data: TopUpRequest[];
    pagination: any;
  }> {
    const { data } = await privateApi.get("/unlock/topup/my", {
      params: query,
    });
    return data;
  },

  // ─── Top-Up (Admin) ───────────────────────────────────────────────────────

  async getAllTopUpRequests(query: ListTopUpQuery = {}): Promise<{
    data: TopUpRequest[];
    pagination: any;
  }> {
    const { data } = await api.get("/unlock/admin/topup", { params: query });
    return data;
  },

  async processTopUpRequest(
    id: string,
    payload: ProcessTopUpDTO,
  ): Promise<TopUpRequest> {
    const { data } = await api.patch(
      `/unlock/admin/topup/${id}/process`,
      payload,
    );
    return data.data;
  },
};

export { unlockService };
