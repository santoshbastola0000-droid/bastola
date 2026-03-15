import { privateApi } from "../api/privateApi";

export interface DashboardStats {
  totalEarned: number;
  walletBalance: number;
  pendingBalance: number;
  totalWithdrawn: number;
  total: number;
  approved: number;
  pending: number;
  rejected: number;
  available: number;
  rented: number;
  pendingPayout: number;
  recentTransactions: Array<{
    id: string;
    type: string;
    status: string;
    amount: number;
    commissionAmount: number;
    netAmount: number;
    description: string;
    createdAt: string;
    completedAt?: string;
    roomTitle?: string;
  }>;
  recentRooms: Array<{
    id: string;
    title: string;
    price: number;
    address: string;
    status: string;
    listingStatus: string;
    createdAt: string;
    images: string[];
  }>;
}

export interface EarningsData {
  month: string;
  earnings: number;
  bookings: number;
}

export interface ActivityItem {
  id: string;
  type: "payment" | "room" | "booking" | "review";
  title: string;
  description: string;
  time: string;
  status?: "success" | "pending" | "info";
}

class DashboardService {
  private readonly baseUrl = "/dashboard";

  async getStats(): Promise<DashboardStats> {
    const response = await privateApi.get(`${this.baseUrl}/user/stats`);
    return response.data.data;
  }

  async getEarningsData(
    period: "week" | "month" | "year" = "month",
  ): Promise<EarningsData[]> {
    const response = await privateApi.get(`${this.baseUrl}/user/earnings`, {
      params: { period },
    });
    return response.data.data;
  }

  async getRecentActivity(): Promise<ActivityItem[]> {
    const response = await privateApi.get(`${this.baseUrl}/user/activity`);
    return response.data.data;
  }
}

export const dashboardService = new DashboardService();
