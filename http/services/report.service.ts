import { privateApi } from "@/http/api/privateApi";
import { apiV1Path } from "@/http/api/versioned-path";
import type {
  CreateReportDTO,
  Report,
  ReportFilters,
  ReportsResponse,
  ReportStatus,
} from "@/types/report.types";

const toQueryString = (filters: ReportFilters = {}) => {
  const params = new URLSearchParams();

  if (filters.page !== undefined) params.append("page", String(filters.page));
  if (filters.take !== undefined) params.append("take", String(filters.take));
  if (filters.status) params.append("status", filters.status);

  const query = params.toString();
  return query ? `?${query}` : "";
};

export const reportService = {
  getMyReports: async (
    filters: ReportFilters = {},
  ): Promise<ReportsResponse> => {
    const response = await privateApi.get<ReportsResponse>(
      `${apiV1Path("/reports/me")}${toQueryString(filters)}`,
    );
    return response.data;
  },

  createReport: async (payload: CreateReportDTO): Promise<{ data: Report }> => {
    const response = await privateApi.post<{ data: Report }>(
      apiV1Path("/reports"),
      payload,
    );
    return response.data;
  },

  updateStatus: async (
    id: string,
    status: ReportStatus,
  ): Promise<{ data: Report }> => {
    const response = await privateApi.patch<{ data: Report }>(
      apiV1Path(`/reports/${id}/status`),
      { status },
    );
    return response.data;
  },
};
