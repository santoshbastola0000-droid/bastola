import { privateApi } from "@/http/api/privateApi";
import {
  PaginatedUserResponse,
  UserRole,
  type UserLocation,
  type BrowserPermissionState,
  type UserPermissionStatus,
} from "@/types/user.types";

export interface UserEngagementSummary {
  emailSent: number;
  emailClicked: number;
  pushSent: number;
  pushDeliveredDevices: number;
  pushClicked: number;
  inAppNotifications: number;
  totalOutbound: number;
  lastSource: string | null;
  lastVisitAt: string | null;
  lastClickedAt: string | null;
}

export interface UserVisitHistoryItem {
  id: string;
  source: string;
  path: string;
  referrer: string;
  createdAt: string;
}

export interface UserFilters {
  page?: number;
  take?: number;
  search?: string;
  role?: UserRole;
  accountPurpose?: "FIND_ROOM" | "POST_ROOM" | "FIND_JOB" | "POST_JOB";
  onlineStatus?: "online" | "offline";
  locationPermission?: BrowserPermissionState;
  notificationPermission?: BrowserPermissionState;
  microphonePermission?: BrowserPermissionState;
  cameraPermission?: BrowserPermissionState;
}

export const userService = {
  getUsers: async (
    filters: UserFilters = {},
  ): Promise<PaginatedUserResponse> => {
    const params = new URLSearchParams();

    if (filters.page !== undefined)
      params.append("page", filters.page.toString());
    if (filters.take !== undefined)
      params.append("take", filters.take.toString());
    if (filters.search) params.append("search", filters.search);
    if (filters.role) params.append("role", filters.role);
    if (filters.accountPurpose) {
      params.append("accountPurpose", filters.accountPurpose);
    }
    if (filters.onlineStatus) {
      params.append("onlineStatus", filters.onlineStatus);
    }
    if (filters.locationPermission) {
      params.append("locationPermission", filters.locationPermission);
    }
    if (filters.notificationPermission) {
      params.append("notificationPermission", filters.notificationPermission);
    }
    if (filters.microphonePermission) {
      params.append("microphonePermission", filters.microphonePermission);
    }
    if (filters.cameraPermission) {
      params.append("cameraPermission", filters.cameraPermission);
    }

    const response = await privateApi.get<PaginatedUserResponse>(
      `/user?${params.toString()}`,
    );
    return response.data;
  },

  adminCreditWallet: async (
    userId: string,
    amount: number,
    remarks: string,
  ): Promise<{ amount: number; balance: number }> => {
    const response = await privateApi.post(
      `/unlock/admin/users/${userId}/credit-wallet`,
      { amount, remarks },
    );
    return response.data.data;
  },

  deleteUser: async (id: string): Promise<void> => {
    await privateApi.delete(`/user/${id}`);
  },

  releasePendingBalance: async (
    userId: string,
  ): Promise<{
    releasedAmount: number;
    balance: number;
    pendingBalance: number;
  }> => {
    const response = await privateApi.post(
      `/wallet/admin/users/${userId}/release-pending`,
      {},
    );
    return response.data.data;
  },

  updateLocation: async (location: Omit<UserLocation, "updatedAt">): Promise<void> => {
    await privateApi.post("/user/location", location);
  },

  updatePermissions: async (
    permissions: Partial<Omit<UserPermissionStatus, "updatedAt">>,
  ): Promise<void> => {
    await privateApi.post("/user/permissions", permissions);
  },

  getEngagementSummary: async (
    userIds: string[],
  ): Promise<Record<string, UserEngagementSummary>> => {
    if (!userIds.length) return {};
    const response = await privateApi.get(
      "/notifications/admin/engagement-summary",
      {
        params: {
          userIds: userIds.join(","),
        },
      },
    );
    return response.data || {};
  },

  getVisitHistory: async (
    userId: string,
    limit = 200,
  ): Promise<UserVisitHistoryItem[]> => {
    const response = await privateApi.get(
      `/notifications/admin/users/${userId}/visits`,
      { params: { limit } },
    );
    return response.data || [];
  },

  heartbeat: async (): Promise<void> => {
    await privateApi.post("/user/heartbeat");
  },
};
