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

export interface CommissionCalculation {
  serviceCharge: number;
  commissionPercentage: number;
  commissionAmount: number;
  netAmount: number;
  roomId: string;
  roomTitle: string;
  userId: string;
  userName: string;
  userPhone: string;
}

export interface CommissionHistoryItem {
  id: string;
  roomId: string;
  roomTitle: string;
  userId: string;
  userName: string;
  serviceCharge: number;
  commissionAmount: number;
  netAmount: number;
  appliedAt: string;
  transactionId: string;
}

export const commissionService = {
  // Get active settings
  getSettings: async (): Promise<CommissionSettings> => {
    const response = await privateApi.get("/commission/settings");
    return response.data.data;
  },

  // Get all settings
  getAllSettings: async (): Promise<CommissionSettings[]> => {
    const response = await privateApi.get("/commission/settings/all");
    return response.data.data;
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

  // Calculate commission for a room
  calculateCommission: async (
    roomId: string,
  ): Promise<CommissionCalculation> => {
    const response = await privateApi.get(`/commission/calculate/${roomId}`);
    return response.data.data;
  },

  // Apply commission to all pending rooms
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
