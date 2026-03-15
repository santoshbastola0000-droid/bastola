import {
  RecordsResponse,
  RecordResponse,
  CreateRecordDTO,
  UpdateRecordDTO,
  RecordsFilter,
} from "@/types/record.types";
import { privateApi } from "@/http/api/privateApi";

export const recordService = {
  getRecords: async (params: RecordsFilter = {}): Promise<RecordsResponse> => {
    const response = await privateApi.get<RecordsResponse>("/record", {
      params: {
        ...params,
      },
    });
    return response.data;
  },

  getRecord: async (id: string): Promise<RecordResponse> => {
    const response = await privateApi.get<RecordResponse>(`/record/${id}`);
    return response.data;
  },

  createRecord: async (data: CreateRecordDTO): Promise<RecordResponse> => {
    const response = await privateApi.post<RecordResponse>("/record", data);
    return response.data;
  },

  updateRecord: async (
    id: string,
    data: UpdateRecordDTO,
  ): Promise<RecordResponse> => {
    const response = await privateApi.patch<RecordResponse>(
      `/record/${id}`,
      data,
    );
    return response.data;
  },

  deleteRecord: async (id: string): Promise<void> => {
    await privateApi.delete(`/record/${id}`);
  },

  getRecordsByYear: async (
    yearId: string,
    params: RecordsFilter = {},
  ): Promise<RecordsResponse> => {
    const response = await privateApi.get<RecordsResponse>(
      `/record/year/${yearId}`,
      {
        params: {
          page: params.page || 0,
          take: params.take || 10,
          search: params.search || "",
          ...params,
        },
      },
    );
    return response.data;
  },
};
