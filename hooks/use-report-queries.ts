import { useQuery } from "@tanstack/react-query";
import { reportService } from "@/http/services/report.service";
import type { ReportFilters } from "@/types/report.types";

export const REPORT_QUERY_KEYS = {
  LIST_ME: "reports-me",
  CREATE: "create-report",
  UPDATE_STATUS: "update-report-status",
};

export const useMyReportsQuery = (
  filters: ReportFilters = {},
  enabled: boolean = true,
) => {
  return useQuery({
    queryKey: [REPORT_QUERY_KEYS.LIST_ME, filters],
    queryFn: () => reportService.getMyReports(filters),
    enabled,
  });
};
