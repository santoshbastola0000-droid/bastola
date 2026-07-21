import { privateApi } from "@/http/api/privateApi";
import { apiV1Path } from "@/http/api/versioned-path";
import type {
  UpsertUserPreferenceDTO,
  UserPreference,
} from "@/types/user-preference.types";

export const userPreferenceService = {
  getMyPreference: async (): Promise<{ data: UserPreference | null }> => {
    const response = await privateApi.get<{ data: UserPreference | null }>(
      apiV1Path("/user-preferences/me"),
    );
    return response.data;
  },

  upsertPreference: async (
    payload: UpsertUserPreferenceDTO,
  ): Promise<{ data: UserPreference }> => {
    const response = await privateApi.put<{ data: UserPreference }>(
      apiV1Path("/user-preferences/me"),
      payload,
    );
    return response.data;
  },
};
