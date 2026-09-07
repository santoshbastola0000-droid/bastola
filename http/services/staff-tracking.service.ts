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
  name?: string;
  email?: string;
  phoneNumber?: string;
}

export const staffTrackingService = {
  getMe: async () => (await privateApi.get("/staff-tracking/me")).data,
  start: async (payload: any) => (await privateApi.post("/staff-tracking/start", payload)).data,
  pingLocation: async (payload: any) => (await privateApi.post("/staff-tracking/location", payload)).data,
  addVisit: async (payload: any) => (await privateApi.post("/staff-tracking/visit", payload)).data,
  end: async (payload: any) => (await privateApi.post("/staff-tracking/end", payload)).data,

  searchUsers: async (q: string) =>
    (await privateApi.get("/staff-tracking/admin/users", { params: { q } })).data,
  listProfiles: async (type?: StaffType | "") =>
    (await privateApi.get("/staff-tracking/admin/profiles", { params: { type: type || "" } })).data,
  saveProfile: async (payload: any) =>
    (await privateApi.post("/staff-tracking/admin/profiles", payload)).data,
  dashboard: async (type?: StaffType | "", date?: string) =>
    (await privateApi.get("/staff-tracking/admin/dashboard", { params: { type: type || "", date: date || "" } })).data,
  monthly: async (profileId: string, month?: string) =>
    (await privateApi.get(`/staff-tracking/admin/profiles/${profileId}/monthly`, { params: { month } })).data,
  route: async (sessionId: string) =>
    (await privateApi.get(`/staff-tracking/admin/sessions/${sessionId}/route`)).data,
};
