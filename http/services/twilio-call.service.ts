import { privateApi } from "@/http/api/privateApi";

export const twilioCallService = {
  getConfig: async () => {
    const response = await privateApi.get("/twilio-call/config");
    return response.data as {
      configured: boolean;
      identity: string;
      phoneNumber: string | null;
    };
  },

  getToken: async () => {
    const response = await privateApi.get("/twilio-call/token");
    return response.data as {
      token: string;
      identity: string;
      expiresIn: number;
    };
  },
};
