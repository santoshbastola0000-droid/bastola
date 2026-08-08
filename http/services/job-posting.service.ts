import { privateApi } from "@/http/api/privateApi";
import { api } from "@/http/api/api";

export type JobStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface JobPosting {
  id: string;
  userId: string;
  companyName?: string | null;
  jobTitle: string;
  category?: string | null;
  location: string;
  salary?: number | null;
  experience?: string | null;
  contactPhone: string;
  description?: string | null;
  status: JobStatus | string;
  createdAt: string;
  updatedAt: string;
}

export interface JobPostingInput {
  userId: string;
  companyName?: string;
  jobTitle: string;
  category?: string;
  location: string;
  salary?: number | null;
  experience?: string;
  contactPhone: string;
  description?: string;
  status?: JobStatus;
}

export const jobPostingService = {
  getAll: async (): Promise<JobPosting[]> => {
    const response = await api.get("/job-posting");
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
};
