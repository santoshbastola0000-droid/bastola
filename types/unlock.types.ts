export enum TopUpStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
}

export interface UnlockStatus {
  isUnlocked: boolean;
  serviceCharge: number;
  walletBalance: number;
  adminQrCodeUrl: string | null;
  adminPaymentLabel: string | null;
}

export interface UnlockResult {
  success: boolean;
  room: {
    id: string;
    contactPhone: string | null;
    location: {
      latitude: number;
      longitude: number;
      formattedAddress: string;
    } | null;
    user: {
      name: string;
      email: string;
      phoneNumber?: string;
    } | null;
  };
}

export interface TopUpRequest {
  id: string;
  userId: string;
  amount: number;
  status: TopUpStatus;
  screenshot: string;
  adminRemarks: string | null;
  processedAt: string | null;
  processedById: string | null;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
    phoneNumber: string;
  };
}

export interface CommissionSettings {
  id: string;
  serviceCharge: number;
  adminQrCodeUrl: string | null;
  adminPaymentLabel: string | null;
}
