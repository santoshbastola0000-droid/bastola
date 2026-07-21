import { z } from "zod";
import { ReportStatus, ReportType } from "@/types/report.types";

export const createReportSchema = z.object({
  targetId: z.string().min(1, "Target is required"),
  type: z.nativeEnum(ReportType),
  description: z
    .string()
    .trim()
    .min(10, "Please describe the issue in at least 10 characters")
    .max(1000, "Description must be 1000 characters or less"),
});

export const updateReportStatusSchema = z.object({
  status: z.nativeEnum(ReportStatus),
});

export type CreateReportValues = z.infer<typeof createReportSchema>;
export type UpdateReportStatusValues = z.infer<typeof updateReportStatusSchema>;
