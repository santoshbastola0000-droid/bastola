import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { REPORT_QUERY_KEYS } from "@/hooks/use-report-queries";
import { reportService } from "@/http/services/report.service";
import type { CreateReportDTO, ReportStatus } from "@/types/report.types";

export const useCreateReportMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [REPORT_QUERY_KEYS.CREATE],
    mutationFn: async (payload: CreateReportDTO) => {
      return reportService.createReport(payload);
    },
    onSuccess: () => {
      toast.success("Report submitted", {
        description: "Our team will review this safety report.",
      });
      queryClient.invalidateQueries({
        queryKey: [REPORT_QUERY_KEYS.LIST_ME],
      });
    },
    onError: (error: any) => {
      toast.error("Failed to submit report", {
        description:
          error?.response?.data?.message || "Please try again in a moment.",
      });
    },
  });
};

export const useUpdateReportStatusMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [REPORT_QUERY_KEYS.UPDATE_STATUS],
    mutationFn: async ({ id, status }: { id: string; status: ReportStatus }) => {
      return reportService.updateStatus(id, status);
    },
    onSuccess: (_, variables) => {
      toast.success("Report updated", {
        description: `Status changed to ${variables.status.toLowerCase()}.`,
      });
      queryClient.invalidateQueries({
        queryKey: [REPORT_QUERY_KEYS.LIST_ME],
      });
    },
    onError: (error: any) => {
      toast.error("Failed to update report", {
        description:
          error?.response?.data?.message || "Please try again in a moment.",
      });
    },
  });
};
