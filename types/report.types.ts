import type { Room } from "./room.types";
import type { UserDetail } from "./user.types";

export enum ReportType {
  FAKE_ROOM = "FAKE_ROOM",
  WRONG_INFORMATION = "WRONG_INFORMATION",
  FRAUD_OWNER = "FRAUD_OWNER",
  SPAM = "SPAM",
}

export enum ReportStatus {
  PENDING = "PENDING",
  UNDER_REVIEW = "UNDER_REVIEW",
  RESOLVED = "RESOLVED",
  REJECTED = "REJECTED",
}

export interface Report {
  id: string;
  reporterId: string;
  targetId: string;
  type: ReportType;
  description: string;
  status: ReportStatus;
  createdAt: string;
  updatedAt?: string;
  room?: Pick<Room, "id" | "title" | "address">;
  reporter?: Pick<UserDetail, "id" | "name" | "email">;
}

export interface ReportFilters {
  page?: number;
  take?: number;
  status?: ReportStatus;
}

export interface CreateReportDTO {
  targetId: string;
  type: ReportType;
  description: string;
}

export interface UpdateReportStatusDTO {
  status: ReportStatus;
}

export interface ReportsResponse {
  data: Report[];
  pagination: {
    page: number;
    take: number;
    total: number;
    count: number;
    previousPage: number | null;
    nextPage: number | null;
  };
}
