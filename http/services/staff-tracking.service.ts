import { privateApi } from "@/http/api/privateApi";

export type StaffType = "MARKETING" | "RECEPTION";

export interface StaffProfile {
  id: string;
  userId: string;
  staffType: StaffType;
  monthlySalary: number | string;
  allowedStartTime: string;
  expectedEndTime: string;
  timezone: string;
  active: boolean;
  maxRadiusKm?: number | string;
  trackingIntervalHours?: number;
  startGraceMinutes?: number;
  checkoutGraceMinutes?: number;
  weeklyOffDay?: string;
  offDayBonus?: number | string;
  name?: string;
  email?: string;
  phoneNumber?: string;
}

export const staffTrackingService = {
  getMe: async () => (await privateApi.get("/staff-tracking/me")).data,
  getAccess: async () =>
    (await privateApi.get("/staff-tracking/access")).data as {
      allowed: boolean;
      staffType?: StaffType | null;
      staffProfileId?: string | null;
    },
  start: async (payload: any) =>
    (await privateApi.post("/staff-tracking/start", payload)).data,
  pingLocation: async (payload: any) =>
    (await privateApi.post("/staff-tracking/location", payload)).data,
  addVisit: async (payload: any) =>
    (await privateApi.post("/staff-tracking/visit", payload)).data,
  end: async (payload: any) =>
    (await privateApi.post("/staff-tracking/end", payload)).data,

  searchUsers: async (q: string) =>
    (await privateApi.get("/staff-tracking/admin/users", { params: { q } })).data,
  listProfiles: async (type?: StaffType | "") =>
    (
      await privateApi.get("/staff-tracking/admin/profiles", {
        params: { type: type || "" },
      })
    ).data,
  saveProfile: async (payload: any) =>
    (await privateApi.post("/staff-tracking/admin/profiles", payload)).data,
  setAccess: async (userId: string, active: boolean) =>
    (
      await privateApi.patch(
        `/staff-tracking/admin/profiles/${userId}/access`,
        { active },
      )
    ).data,
  dashboard: async (type?: StaffType | "", date?: string) =>
    (
      await privateApi.get("/staff-tracking/admin/dashboard", {
        params: { type: type || "", date: date || "" },
      })
    ).data,
  monthly: async (profileId: string, month?: string) =>
    (
      await privateApi.get(
        `/staff-tracking/admin/profiles/${profileId}/monthly`,
        { params: { month } },
      )
    ).data,
  route: async (sessionId: string) =>
    (
      await privateApi.get(
        `/staff-tracking/admin/sessions/${sessionId}/route`,
      )
    ).data,
};
