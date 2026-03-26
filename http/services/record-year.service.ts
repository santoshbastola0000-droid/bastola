import {
  RecordYearsResponse,
  ListRecordYearsQuery,
  UpdateRecordYearDTO,
  RecordYear,
} from "@/types/record-year.types";
import { privateApi } from "@/http/api/privateApi";

export const recordYearService = {
  getRecordYears: async (
    query: ListRecordYearsQuery,
  ): Promise<RecordYearsResponse> => {
    const params = new URLSearchParams();

    if (query.page !== undefined) params.append("page", query.page.toString());
    if (query.take !== undefined) params.append("take", query.take.toString());
    if (query.search) params.append("search", query.search);
    if (query.nepaliYear)
      params.append("nepaliYear", query.nepaliYear.toString());
    if (query.nepaliMonth)
      params.append("nepaliMonth", query.nepaliMonth.toString());

    const response = await privateApi.get(`/recordYear?${params.toString()}`);
    return response.data;
  },

  getRecordYearById: async (id: string): Promise<RecordYear> => {
    const response = await privateApi.get(`/recordYear/${id}`);
    return response.data.data;
  },

  updateRecordYear: async (
    id: string,
    data: UpdateRecordYearDTO,
  ): Promise<RecordYear> => {
    const response = await privateApi.patch(`/recordYear/${id}`, data);
    return response.data;
  },

  deleteRecordYear: async (id: string): Promise<void> => {
    await privateApi.delete(`/recordYear/${id}`);
  },
};
