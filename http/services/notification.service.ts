import { privateApi } from "@/http/api/privateApi";

export type UserNotification = {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  actionUrl?: string | null;
  data?: Record<string, unknown>;
  readAt?: string | null;
  createdAt: string;
};

export const notificationService = {
  async list() {
    const response = await privateApi.get("/notifications");
    return response.data as UserNotification[];
  },

  async unreadCount() {
    const response = await privateApi.get("/notifications/unread-count");
    return Number(response.data?.count || 0);
  },

  async markRead(id: string) {
    const response = await privateApi.patch(`/notifications/${id}/read`);
    return response.data as { success: boolean };
  },
};
