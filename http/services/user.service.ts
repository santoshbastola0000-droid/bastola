import { privateApi } from "@/http/api/privateApi";
import { PaginatedUserResponse, UserRole } from "@/types/user.types";

export interface UserFilters {
  page?: number;
  take?: number;
  search?: string;
  role?: UserRole;
}

export const userService = {
  getUsers: async (
    filters: UserFilters = {},
  ): Promise<PaginatedUserResponse> => {
    const params = new URLSearchParams();

    if (filters.page !== undefined)
      params.append("page", filters.page.toString());
    if (filters.take !== undefined)
      params.append("take", filters.take.toString());
    if (filters.search) params.append("search", filters.search);
    if (filters.role) params.append("role", filters.role);

    const response = await privateApi.get<PaginatedUserResponse>(
      `/user?${params.toString()}`,
    );
    return response.data;
  },

  deleteUser: async (id: string): Promise<void> => {
    await privateApi.delete(`/user/${id}`);
  },
};
