import { useQuery } from "@tanstack/react-query";
import { userPreferenceService } from "@/http/services/user-preference.service";

export const USER_PREFERENCE_QUERY_KEYS = {
  GET_ME: "user-preference-me",
  UPSERT: "user-preference-upsert",
};

export const useMyPreferenceQuery = (enabled: boolean = true) => {
  return useQuery({
    queryKey: [USER_PREFERENCE_QUERY_KEYS.GET_ME],
    queryFn: () => userPreferenceService.getMyPreference(),
    enabled,
  });
};
