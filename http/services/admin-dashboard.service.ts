import { privateApi } from "../api/privateApi";
import { WithdrawalStatus, PaymentMethod } from "@/types/wallet.types";

export interface AdminDashboardStats {
  totalUsers: number;
  newUsersToday: number;
  activeUsers: number;
  totalRooms: number;
  approvedRooms: number;
  pendingRooms: number;
  rejectedRooms: number;
  availableRooms: number;
  rentedRooms: number;
  archivedRooms: number;
  roomsAddedToday: number;
  roomsAddedThisWeek: number;
  roomsAddedThisMonth: number;
  totalWalletBalance: number;
  totalPendingBalance: number;
  totalWithdrawn: number;
  totalCommissionEarned: number;
  pendingWithdrawals: number;
  approvedWithdrawals: number;
  rejectedWithdrawals: number;
  totalWithdrawalAmount: number;
  pendingWithdrawalAmount: number;
  totalCommissionPaid: number;
  pendingCommission: number;
  averageCommissionPerRoom: number;
}

export interface ChartData {
  name: string;
  value: number;
}

export interface RoomCategoryDistribution {
  category: string;
  count: number;
}

export interface RecentActivity {
  id: string;
  type: "room" | "user" | "withdrawal" | "commission";
  title: string;
  description: string;
  time: string;
  status?: string;
}

export interface RecentWithdrawal {
  id: string;
  userName: string;
  userEmail: string;
  amount: number;
  status: WithdrawalStatus;
  paymentMethod: PaymentMethod;
  createdAt: string;
}

export interface RecentRoom {
  id: string;
  title: string;
  userName: string;
  price: number;
  status: string;
  approvalStatus: string;
  createdAt: string;
}

export interface TikTokConnectedAccount {
  id: string;
  account: string;
  openId: string | null;
  scopes: string[];
  connectionMode: "oauth" | "legacy_token";
}

export interface TikTokPublishingStatus {
  enabled: boolean;
  configured: boolean;
  connected: boolean;
  connectedCount: number;
  accounts: TikTokConnectedAccount[];
  connectionMode: "oauth" | "legacy_token" | "none";
  account: string | null;
  openId: string | null;
  scopes: string[];
  autoMusic: boolean;
  privacyLevel: string;
  name: string;
}

class AdminDashboardService {
  private readonly baseUrl = "/admin/dashboard";

  async getStats(): Promise<AdminDashboardStats> {
    const response = await privateApi.get(`${this.baseUrl}/stats`);
    return response.data.data;
  }

  async getRoomChartData(
    period: "week" | "month" | "year" = "month",
  ): Promise<ChartData[]> {
    const response = await privateApi.get(`${this.baseUrl}/rooms/chart`, {
      params: { period },
    });
    return response.data.data;
  }

  async getCategoryDistribution(): Promise<RoomCategoryDistribution[]> {
    const response = await privateApi.get(`${this.baseUrl}/rooms/categories`);
    return response.data.data;
  }

  async getRecentActivity(): Promise<RecentActivity[]> {
    const response = await privateApi.get(`${this.baseUrl}/activity`);
    return response.data.data;
  }

  async getRecentWithdrawals(limit: number = 5): Promise<RecentWithdrawal[]> {
    const response = await privateApi.get(
      `${this.baseUrl}/withdrawals/recent`,
      { params: { limit } },
    );
    return response.data.data;
  }

  async getRecentRooms(limit: number = 5): Promise<RecentRoom[]> {
    const response = await privateApi.get(`${this.baseUrl}/rooms/recent`, {
      params: { limit },
    });
    return response.data.data;
  }

  async getInterCallStatus(): Promise<{
    enabled: boolean;
    provider: "twilio";
    name: "Inter Call";
  }> {
    const response = await privateApi.get("/admin/inter-call");
    return response.data.data;
  }

  async setInterCallEnabled(enabled: boolean): Promise<{
    enabled: boolean;
    provider: "twilio";
    name: "Inter Call";
  }> {
    const response = await privateApi.patch("/admin/inter-call", { enabled });
    return response.data.data;
  }

  async getTikTokPublishingStatus(): Promise<TikTokPublishingStatus> {
    const response = await privateApi.get("/admin/tiktok-publishing");
    return response.data.data;
  }

  async setTikTokPublishingEnabled(
    enabled: boolean,
  ): Promise<TikTokPublishingStatus> {
    const response = await privateApi.patch("/admin/tiktok-publishing", {
      enabled,
    });
    return response.data.data;
  }

  async getTikTokConnectUrl(): Promise<{ url: string; redirectUri: string }> {
    const response = await privateApi.get("/admin/tiktok-publishing/connect");
    return response.data.data;
  }

  async disconnectTikTokAccount(accountId: string): Promise<TikTokPublishingStatus> {
    const response = await privateApi.patch(
      `/admin/tiktok-publishing/accounts/${encodeURIComponent(accountId)}/disconnect`,
    );
    return response.data.data;
  }

  async disconnectTikTok(): Promise<TikTokPublishingStatus> {
    const response = await privateApi.patch("/admin/tiktok-publishing/disconnect");
    return response.data.data;
  }
}

export const adminDashboardService = new AdminDashboardService();
