import { privateApi } from "../api/privateApi";

export interface SecurityScanInput {
  url: string;
  confirmOwnership: boolean;
  maxPages?: number;
}

export const securityScannerService = {
  async scan(input: SecurityScanInput) {
    const response = await privateApi.post("/admin/security-scanner/scan", input);
    return response.data.data;
  },
};
