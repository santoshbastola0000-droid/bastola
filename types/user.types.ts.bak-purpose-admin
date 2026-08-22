export interface UserLocation {
  latitude: number;
  longitude: number;
  city?: string;
  address?: string;
  updatedAt: string;
}

export interface UserDetail {
  id: string;
  createdAt: string;
  updatedAt: string;
  name: string;
  email: string;
  isVerified: boolean;
  role: UserRole;
  phone: string;
  balance?: number;
  pendingBalance?: number;
  location?: UserLocation | null;
  isOnline?: boolean;
  lastActiveAt?: string;
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
