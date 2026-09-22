import { privateApi } from "../api/privateApi";

export interface SecurityScanInput {
  url: string;
  confirmOwnership: boolean;
  maxPages?: number;
  scanAll?: boolean;
}

export const securityScannerService = {
  async start(input: SecurityScanInput) {
    const response = await privateApi.post(
      "/admin/security-scanner/start",
      input,
    );
    return response.data.data;
  },

  async status(jobId: string) {
    const response = await privateApi.get(
      `/admin/security-scanner/status/${encodeURIComponent(jobId)}`,
    );
    return response.data.data;
  },

  // Keep this helper for older callers. Backend also keeps /scan as a
  // compatibility route, so cached/admin clients do not fail during rollout.
  async scan(input: SecurityScanInput) {
    const response = await privateApi.post(
      "/admin/security-scanner/scan",
      input,
    );
    return response.data.data;
  },
};
