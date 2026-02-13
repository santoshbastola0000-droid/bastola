export interface SingleUserDetail {
  id: string;
  createdAt: string;
  updatedAt: string;
  name: string;
  email: string;
  isEmailVerified: boolean;
  image: string;
  role: UserRole;
}

export enum UserRole {
  ADMIN = "Admin",
  USER = "User",
  ORGANIZATION = "Organization",
}

export enum OrganizationType {
  INSTITUTE = "Institute",
  INDIVIDUAL = "Individual",
}
