import { privateApi } from "@/http/api/privateApi";

export interface AiRoomSearch {
  city?: string | null;
  budget?: number | null;
  roomType?: string | null;
  tenantType?: string | null;
  moveInDate?: string | null;
  exactLocation?: string | null;
  numberOfPeople?: number | null;
  vehicleType?: string | null;
  parkingRequired?: boolean | null;
  wifiRequired?: boolean | null;
  isFurnished?: boolean | null;
}

export interface AiJobSearch {
  userName?: string | null;
  phone?: string | null;
  contactPhone?: string | null;
  location?: string | null;
  jobLocation?: string | null;
  jobTitle?: string | null;
  jobType?: string | null;
  preferredJob?: string | null;
  category?: string | null;
  experience?: string | null;
  education?: string | null;
  expectedSalary?: number | string | null;
  joiningAvailability?: string | null;
  [key: string]: any;
}

export interface AiProfile {
  activeIntent?: string | null;
  userName?: string | null;
  roomSearch?: AiRoomSearch;
  roomPosting?: Record<string, any>;
  jobSearch?: AiJobSearch;
  jobPosting?: Record<string, any>;
}

export const aiProfileService = {
  getMine: async (): Promise<AiProfile> => {
    const response = await privateApi.get("/ai-profile/me");
    return response.data?.data ?? {};
  },

  updateMine: async (data: Partial<AiProfile>): Promise<AiProfile> => {
    const response = await privateApi.patch("/ai-profile/me", data);
    return response.data?.data ?? {};
  },

  deleteField: async (field: string): Promise<AiProfile> => {
    const response = await privateApi.delete(
      `/ai-profile/me/field/${encodeURIComponent(field)}`
    );
    return response.data?.data ?? {};
  },

  clearMine: async (): Promise<void> => {
    await privateApi.delete("/ai-profile/me");
  },

  getAllForAdmin: async (): Promise<any[]> => {
    const response = await privateApi.get("/ai-profile/admin/all");
    return response.data?.data ?? [];
  },

  getOneForAdmin: async (userId: string): Promise<any> => {
    const response = await privateApi.get(
      `/ai-profile/admin/${encodeURIComponent(userId)}`
    );
    return response.data?.data ?? null;
  },
};
