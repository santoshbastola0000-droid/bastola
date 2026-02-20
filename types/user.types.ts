export interface UserDetail {
  id: string;
  createdAt: string;
  updatedAt: string;
  name: string;
  email: string;
  isVerified: boolean;
  role: UserRole;
  phoneNumber: string;
}

export enum UserRole {
  ADMIN = "Admin",
  USER = "User",
}

export interface PaginatedUserResponse {
  data: UserDetail[];
  pagination: {
    previousPage: number | null;
    nextPage: number | null;
    total: number;
    count: number;
    page?: number;
    take?: number;
  };
}
