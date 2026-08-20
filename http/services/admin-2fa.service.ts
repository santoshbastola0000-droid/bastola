import { privateApi } from "@/http/api/privateApi";

export interface TwoFactorStatus {
  twoFactorEnabled: boolean;
  twoFactorVerified: boolean;
}

export interface TwoFactorSetup {
  qrCodeDataUrl: string;
  manualKey: string;
  otpauthUrl: string;
}

export const adminTwoFactorService = {
  getStatus: async (): Promise<TwoFactorStatus> => {
    const response = await privateApi.get(
      "/user/2fa/status",
    );

    return response.data;
  },

  setup: async (): Promise<TwoFactorSetup> => {
    const response = await privateApi.post(
      "/user/2fa/setup",
    );

    return response.data;
  },

  enable: async (code: string) => {
    const response = await privateApi.post(
      "/user/2fa/enable",
      { code },
    );

    return response.data;
  },

  verifySession: async (code: string) => {
    const response = await privateApi.post(
      "/user/2fa/session/verify",
      { code },
    );

    return response.data as {
      accessToken: string;
    };
  },
};
