import { Record } from "@/types/record.types";

export interface RecordYear {
  id: string;
  title: string;
  nepaliYear: number;
  nepaliMonth: number;
  nepaliMonthName: string;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
  records: Record[];
}

export interface RecordYearsResponse {
  data: RecordYear[];
  pagination: {
    page: number;
    take: number;
    total: number;
    count: number;
    previousPage: number | null;
    nextPage: number | null;
  };
}

export interface ListRecordYearsQuery {
  page?: number;
  take?: number;
  search?: string;
  nepaliYear?: number;
  nepaliMonth?: number;
}

export interface CreateRecordYearDTO {
  title: string;
  nepaliYear: number;
  nepaliMonth: number;
  nepaliMonthName: string;
  startDate: Date;
  endDate: Date;
}

export interface UpdateRecordYearDTO extends Partial<CreateRecordYearDTO> {}
