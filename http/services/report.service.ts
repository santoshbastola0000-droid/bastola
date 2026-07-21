import { privateApi } from "@/http/api/privateApi";
import { apiV1Path } from "@/http/api/versioned-path";
import { toQueryString } from "@/http/services/query-string";
import type {
  CreateReportDTO,
  Report,
  ReportFilters,
  ReportsResponse,
  ReportStatus,
} from "@/types/report.types";

export const reportService = {
  getMyReports: async (
    filters: ReportFilters = {},
  ): Promise<ReportsResponse> => {
    const response = await privateApi.get<ReportsResponse>(
      `${apiV1Path("/reports/me")}${
        toQueryString({
          page: filters.page,
          take: filters.take,
          status: filters.status,
        })
      }`,
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
