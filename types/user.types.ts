export interface UserLocation {
  latitude: number;
  longitude: number;
  city?: string;
  address?: string;
  updatedAt: string;
}

export type BrowserPermissionState =
  | "granted"
  | "denied"
  | "prompt"
  | "unsupported"
  | "unknown";

export interface UserPermissionStatus {
  location: BrowserPermissionState;
  notification: BrowserPermissionState;
  microphone: BrowserPermissionState;
  camera: BrowserPermissionState;
  updatedAt?: string | null;
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
  accountPurpose?: "FIND_ROOM" | "POST_ROOM" | "FIND_JOB" | "POST_JOB" | null;
  balance?: number;
  pendingBalance?: number;
  location?: UserLocation | null;
  isOnline?: boolean;
  lastActiveAt?: string;
  permissions?: UserPermissionStatus;
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
