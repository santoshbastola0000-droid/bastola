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
  // ─── Settings ───────────────────────────────────────────────────────────────

  async getSettings(): Promise<CommissionSettings> {
    const { data } = await privateApi.get("/unlock/settings");
    return data.data;
  },

  async updateSettings(payload: {
    serviceCharge?: number;
    adminQrCodeUrl?: string;
    adminPaymentLabel?: string;
  }): Promise<CommissionSettings> {
    const { data } = await privateApi.patch("/unlock/admin/settings", payload);
    return data.data;
  },

  // ─── Room Unlock ─────────────────────────────────────────────────────────────

  async getRoomUnlockStatus(roomId: string): Promise<UnlockStatus> {
    const { data } = await privateApi.get(`/unlock/room/${roomId}/status`);
    return data.data;
  },

  async unlockRoom(roomId: string): Promise<UnlockResult> {
    const { data } = await privateApi.post("/unlock/room", { roomId });
    return data.data;
  },

  // ─── File Upload ──────────────────────────────────────────────────────────────

  /**
   * Upload any image file to the server and return the stored path/URL.
   * Used for both QR code uploads (admin) and payment screenshots (user).
   */
  async uploadFile(file: File): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);

    const { data } = await privateApi.post("/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    // Handle different response shapes your backend may return
    const path: string =
      data?.data?.url ??
      data?.data?.path ??
      data?.data?.filename ??
      data?.url ??
      data?.path ??
      data?.filename;

    if (!path) {
      throw new Error("Upload succeeded but no file path was returned");
    }

    return path;
  },

  /** Convenience alias used in the admin QR settings panel */
  async uploadScreenshot(file: File): Promise<string> {
    return this.uploadFile(file);
  },

  // ─── Top-Up Requests (User) ───────────────────────────────────────────────────

  /**
   * Upload screenshot first, then create the top-up request in one step.
   * This is the method called from TopUpRequestDialog.
   */
  async createTopUpWithScreenshot(
    amount: number,
    screenshotFile: File,
  ): Promise<TopUpRequest> {
    // 1. Upload the screenshot image
    const screenshotUrl = await this.uploadFile(screenshotFile);

    // 2. Create the top-up request with the returned URL
    const { data } = await privateApi.post("/unlock/topup", {
      amount,
      screenshotUrl,
    });
    return data.data;
  },

  async createTopUpRequest(payload: {
    amount: number;
    screenshotUrl: string;
  }): Promise<TopUpRequest> {
    const { data } = await privateApi.post("/unlock/topup", payload);
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

  // ─── Top-Up Requests (Admin) ─────────────────────────────────────────────────

  async getAllTopUpRequests(query: ListTopUpQuery = {}): Promise<{
    data: TopUpRequest[];
    pagination: any;
  }> {
    const { data } = await privateApi.get("/unlock/admin/topup", {
      params: query,
    });
    return data;
  },

  async processTopUpRequest(
    id: string,
    payload: ProcessTopUpDTO,
  ): Promise<TopUpRequest> {
    const { data } = await privateApi.patch(
      `/unlock/admin/topup/${id}/process`,
      payload,
    );
    return data.data;
  },
};

export { unlockService };
