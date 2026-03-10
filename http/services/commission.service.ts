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
  settings: {
    serviceCharge: number;
    commissionPercentage: number;
    updatedAt: string;
  };
  stats: {
    totalRooms: number;
    approvedRooms: number;
    commissionedRooms: number;
    pendingCommission: number;
    totalServiceCharge: number;
    totalCommission: number;
    totalPaidToUsers: number;
  };
}

export interface CommissionCalculation {
  serviceCharge: number;
  commissionAmount: number;
  netAmount: number;
  roomId: string;
  roomTitle: string;
  userId: string;
}

export const commissionService = {
  // Get settings
  getSettings: async (): Promise<CommissionSettings> => {
    const response = await privateApi.get("/admin/commission/settings");
    return response.data.data;
  },

  // Update settings
  updateSettings: async (data: {
    serviceCharge?: number;
    commissionPercentage?: number;
  }): Promise<CommissionSettings> => {
    const response = await privateApi.put("/admin/commission/settings", data);
    return response.data.data;
  },

  // Apply commission to a specific room
  applyCommissionToRoom: async (roomId: string) => {
    const response = await privateApi.post(`/admin/commission/apply/${roomId}`);
    return response.data;
  },

  // Apply commission to all pending rooms
  applyCommissionToAll: async () => {
    const response = await privateApi.post("/admin/commission/apply-all");
    return response.data;
  },

  // Get commission stats
  getCommissionStats: async (): Promise<CommissionStats> => {
    const response = await privateApi.get("/admin/commission/stats");
    return response.data.data;
  },

  // Calculate commission preview
  calculateCommission: async (
    roomId: string,
  ): Promise<CommissionCalculation> => {
    const response = await privateApi.get(
      `/admin/commission/calculate/${roomId}`,
    );
    return response.data.data;
  },
};
