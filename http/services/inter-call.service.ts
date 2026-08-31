import { privateApi } from "@/http/api/privateApi";

export type InterCallStatus = {
  enabled: boolean;
  provider: "twilio";
  name: "Inter Call";
};

export const interCallService = {
  async getStatus(): Promise<InterCallStatus> {
    const response = await privateApi.get("/inter-call/status");
    return response.data.data;
  },

  async getToken(): Promise<{ token: string; identity: string; expiresIn: number }> {
    const response = await privateApi.get("/inter-call/token");
    return response.data.data;
  },

  async getAdminStatus(): Promise<InterCallStatus> {
    const response = await privateApi.get("/admin/inter-call");
    return response.data.data;
  },

  async setAdminEnabled(enabled: boolean): Promise<InterCallStatus> {
    const response = await privateApi.patch("/admin/inter-call", { enabled });
    return response.data.data;
  },
};
