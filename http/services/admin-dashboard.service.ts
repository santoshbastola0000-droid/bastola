import { privateApi } from "../api/privateApi";
import { WithdrawalStatus, PaymentMethod } from "@/types/wallet.types";

export interface AdminDashboardStats {
  // User stats
  totalUsers: number;
  newUsersToday: number;
  activeUsers: number;

  // Room stats
  totalRooms: number;
  approvedRooms: number;
  pendingRooms: number;
  rejectedRooms: number;
  availableRooms: number;
  rentedRooms: number;
  archivedRooms: number;

  // Room trends
  roomsAddedToday: number;
  roomsAddedThisWeek: number;
  roomsAddedThisMonth: number;

  // Wallet stats
  totalWalletBalance: number;
  totalPendingBalance: number;
  totalWithdrawn: number;
  totalCommissionEarned: number;

  // Withdrawal stats
  pendingWithdrawals: number;
  approvedWithdrawals: number;
  rejectedWithdrawals: number;
  totalWithdrawalAmount: number;
  pendingWithdrawalAmount: number;

  // Commission stats
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
      {
        params: { limit },
      },
    );
    return response.data.data;
  }

  async getRecentRooms(limit: number = 5): Promise<RecentRoom[]> {
    const response = await privateApi.get(`${this.baseUrl}/rooms/recent`, {
      params: { limit },
    });
    return response.data.data;
  }
}

export const adminDashboardService = new AdminDashboardService();
