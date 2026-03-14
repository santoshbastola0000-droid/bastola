// src/http/services/commission.service.ts
import { privateApi } from "@/http/api/privateApi";

export interface CommissionSettings {
  id: string;
  serviceCharge: number;
  commissionPercentage: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CommissionStats {
  activeSettings: CommissionSettings;
  settingsHistory: CommissionSettings[];
  stats: {
    totalRooms: number;
    approvedRooms: number;
    commissionedRooms: number;
    pendingCommissionRooms: number;
    totalServiceCharge: number;
    totalCommission: number;
    totalPaidToUsers: number;
    pendingServiceCharge: number;
    pendingCommission: number;
    pendingPayout: number;
    platformRevenue: number;
    userEarnings: number;
  };
}

export interface CommissionFilters {
  page?: number;
  take?: number;
  search?: string;
  sort?: "newest" | "oldest";
}

export interface CommissionsResponse {
  data: CommissionSettings[];
  pagination: {
    page: number;
    take: number;
    total: number;
    count: number;
    previousPage: number | null;
    nextPage: number | null;
  };
}

export const commissionService = {
  // Get active settings
  getActiveSettings: async (): Promise<CommissionSettings> => {
    const response = await privateApi.get("/commission/settings");
    return response.data.data;
  },

  // Get all settings with pagination
  getAllSettings: async (
    params?: CommissionFilters,
  ): Promise<CommissionsResponse> => {
    const response = await privateApi.get("/commission/settings/all", {
      params,
    });
    return response.data;
  },

  // Get settings by ID
  getSettingsById: async (id: string): Promise<CommissionSettings> => {
    const response = await privateApi.get(`/commission/settings/${id}`);
    return response.data.data;
  },

  // Create settings
  createSettings: async (data: {
    serviceCharge: number;
    commissionPercentage: number;
    isActive?: boolean;
  }): Promise<CommissionSettings> => {
    const response = await privateApi.post("/commission/settings", data);
    return response.data.data;
  },

  // Update settings
  updateSettings: async (
    id: string,
    data: {
      serviceCharge?: number;
      commissionPercentage?: number;
    },
  ): Promise<CommissionSettings> => {
    const response = await privateApi.put(`/commission/settings/${id}`, data);
    return response.data.data;
  },

  // Update status
  updateStatus: async (
    id: string,
    data: { isActive: boolean },
  ): Promise<CommissionSettings> => {
    const response = await privateApi.patch(
      `/commission/settings/${id}/status`,
      data,
    );
    return response.data.data;
  },

  // Delete settings
  deleteSettings: async (id: string): Promise<void> => {
    await privateApi.delete(`/commission/settings/${id}`);
  },

  // Get commission stats
  getCommissionStats: async (): Promise<CommissionStats> => {
    const response = await privateApi.get("/commission/stats");
    return response.data.data;
  },

  // Recalculate pending commissions
  recalculatePendingCommissions: async (): Promise<{
    totalProcessed: number;
    successful: number;
    failed: number;
    results: Array<{
      roomId: string;
      success: boolean;
      transactionId?: string;
      error?: string;
    }>;
  }> => {
    const response = await privateApi.post("/commission/recalculate");
    return response.data.data;
  },
};
