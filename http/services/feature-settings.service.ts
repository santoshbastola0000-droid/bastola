import { privateApi } from "@/http/api/privateApi";

export type PeopleFeatureSetting = {
  enabled: boolean;
};

export const featureSettingsService = {
  async getPeople(): Promise<PeopleFeatureSetting> {
    const { data } = await privateApi.get("/feature-settings/people");
    return { enabled: data?.enabled === true };
  },

  async updatePeople(enabled: boolean): Promise<PeopleFeatureSetting> {
    const { data } = await privateApi.patch(
      "/feature-settings/admin/people",
      { enabled },
    );
    return { enabled: data?.enabled === true };
  },
};
