import { privateApi } from "@/http/api/privateApi";
import { api } from "@/http/api/api";

export type JobStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface JobPosting {
  id: string;
  // Present for authenticated admin/owner responses; omitted from public listings.
  userId?: string;
  jobCode?: number | null;
  companyName?: string | null;
  jobTitle: string;
  category?: string | null;
  location: string;

  salary?: number | null;
  salaryMin?: number | null;
  salaryMax?: number | null;
  salaryNegotiable?: boolean;

  experience?: string | null;
  requiredSkills?: string[] | null;
  requiredEducation?: string | null;

  requiresLicense?: boolean;
  licenseType?: string | null;

  contactPhone?: string;
  description?: string | null;
  applicationDeadline?: string | null;

  status: JobStatus | string;

  createdAt: string;
  updatedAt: string;
}

export interface JobShareStatus {
  shareCount: number;
  requiredShares: number;
  percentage: number;
  contactPhone?: string | null;
  isPartiallyUnlocked: boolean;
  isFullyUnlocked: boolean;
  isUnlocked: boolean;
}

export interface JobContactResult {
  jobPostingId: string;
  employerUserId: string;
  companyName?: string | null;
  jobTitle: string;
  contactPhone: string;
  isPartiallyUnlocked: boolean;
  isFullyUnlocked: boolean;
}

export interface JobPostingInput {
  // Server derives the owner from the authenticated session.
  userId?: string;
  companyName?: string;
  jobTitle: string;
  category?: string;
  location: string;

  salary?: number | null;
  salaryMin?: number | null;
  salaryMax?: number | null;
  salaryNegotiable?: boolean;

  experience?: string;
  requiredSkills?: string[];
  requiredEducation?: string;

  requiresLicense?: boolean;
  licenseType?: string;

  contactPhone: string;
  description?: string;
  applicationDeadline?: string | null;
  status?: JobStatus;

}

export const jobPostingService = {
  getAll: async (): Promise<JobPosting[]> => {
    const response = await privateApi.get("/job-posting");
    return response.data || [];
  },

  getApproved: async (): Promise<JobPosting[]> => {
    const response = await api.get("/job-posting/approved");
    return response.data || [];
  },

  getOne: async (id: string): Promise<JobPosting> => {
    const response = await api.get(`/job-posting/${id}`);
    return response.data;
  },

  create: async (data: JobPostingInput): Promise<JobPosting> => {
    const response = await privateApi.post("/job-posting", data);
    return response.data;
  },

  update: async (
    id: string,
    data: Partial<JobPostingInput>,
  ): Promise<JobPosting> => {
    const response = await privateApi.patch(
      `/job-posting/${id}`,
      data,
    );
    return response.data;
  },

  remove: async (id: string): Promise<void> => {
    await privateApi.delete(`/job-posting/${id}`);
  },

  getShareStatus: async (
    id: string,
  ): Promise<JobShareStatus> => {
    const response = await privateApi.get(
      `/job-posting/${id}/share-status`,
    );
    return response.data;
  },

  recordShare: async (
    id: string,
    shareToken: string,
  ): Promise<JobShareStatus> => {
    const response = await privateApi.post(
      `/job-posting/${id}/share`,
      { shareToken },
    );
    return response.data;
  },

  getContact: async (
    id: string,
  ): Promise<JobContactResult> => {
    const response = await privateApi.get(
      `/job-posting/${id}/contact`,
    );
    return response.data;
  },
};
