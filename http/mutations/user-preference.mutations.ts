import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { USER_PREFERENCE_QUERY_KEYS } from "@/hooks/use-user-preference-queries";
import { userPreferenceService } from "@/http/services/user-preference.service";
import type { UpsertUserPreferenceDTO } from "@/types/user-preference.types";

export const useUpsertUserPreferenceMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [USER_PREFERENCE_QUERY_KEYS.UPSERT],
    mutationFn: async (payload: UpsertUserPreferenceDTO) => {
      return userPreferenceService.upsertPreference(payload);
    },
    onSuccess: () => {
      toast.success("Preferences saved", {
        description: "Smart alerts will use your latest room preferences.",
      });
      queryClient.invalidateQueries({
        queryKey: [USER_PREFERENCE_QUERY_KEYS.GET_ME],
      });
    },
    onError: (error: any) => {
      toast.error("Failed to save preferences", {
        description:
          error?.response?.data?.message || "Please try again in a moment.",
      });
    },
  });
};
