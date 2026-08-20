import { api } from "@/http/api/api";
import { privateApi } from "@/http/api/privateApi";

export interface PublicCandidateProfileInput {
  profile: {
    userId?: string | null;
    fullName: string;
    phone: string;
    currentLocation?: string | null;
    preferredJobLocation?: string | null;
    education?: string | null;
    employmentType?: string | null;
    joiningAvailability?: string | null;
    isStudying?: boolean;
    studyDetails?: string | null;
    availabilityFlexible?: boolean;
    consentToEmployerSearch: boolean;
  };

  job: {
    jobTitle: string;
    category?: string | null;
    isFresher?: boolean;
    experienceMonths?: number | null;
    previousCompany?: string | null;
    previousRole?: string | null;
    responsibilities?: string | null;
    expectedSalary?: number | null;
    salaryNegotiable?: boolean;
    shiftPreference?: string | null;
    preferredShifts?: string[] | null;
    shiftFlexible?: boolean;
    skills?: string[] | null;
    jobSpecificAnswers?: Record<string, unknown> | null;

    interviewCompleted?: boolean;
    isActive?: boolean;
  };
}

export const candidateProfileService = {
  createPublic: async (
    data: PublicCandidateProfileInput,
  ) => {
    const response = await api.post(
      "/candidate-profile/public",
      data,
    );

    return response.data;
  },

  getPublic: async (params?: {
    category?: string;
    location?: string;
    jobTitle?: string;
  }) => {
    const response = await api.get(
      "/candidate-profile/public",
      { params },
    );

    return response.data || [];
  },

  getPublicOne: async (id: string) => {
    const response = await api.get(
      `/candidate-profile/public/${id}`,
    );

    return response.data;
  },



  getAdminCandidates: async () => {
    const response = await privateApi.get(
      "/candidate-profile/admin/all",
    );

    return response.data || [];
  },

  getAdminContactAccess: async () => {
    const response = await privateApi.get(
      "/candidate-profile/admin/contact-access",
    );

    return response.data || [];
  },

  revealContact: async (
    id: string,
    data: {
      action?:
        | "VIEW_CONTACT"
        | "CALL"
        | "WHATSAPP"
        | "INVITE";
      jobPostingId?: string | null;
    },
  ) => {
    const response = await privateApi.post(
      `/candidate-profile/public/${id}/contact`,
      data,
    );

    return response.data;
  },
};
