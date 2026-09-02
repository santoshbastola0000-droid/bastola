import {
  WalletBalanceType,
  WalletStats,
  TransactionType,
  TransactionStatus,
  WithdrawalStatus,
  PaymentMethod,
} from "@/types/wallet.types";
import { privateApi } from "../api/privateApi";

export interface TransactionsQueryParams {
  page?: number;
  take?: number;
  search?: string;
  type?: TransactionType;
  status?: TransactionStatus;
  fromDate?: string;
  toDate?: string;
}

export interface WithdrawalsQueryParams {
  page?: number;
  take?: number;
  search?: string;
  status?: WithdrawalStatus;
  paymentMethod?: PaymentMethod;
}

class WalletService {
  private readonly baseUrl = "/wallet";

  async getBalance(): Promise<WalletBalanceType> {
    const response = await privateApi.get(`${this.baseUrl}/balance`);
    return response.data.data;
  }

  async getMonetizationStatus(): Promise<{
    isMonetized: boolean;
    monetizedAt: string | null;
    monetizationFeePaid: number;
    monetizationFee: number;
    canEarnFromRooms: boolean;
    currentPlan: "FREE" | "STARTER";
    totalEarned: number;
    freeEarningLimit: number;
    freeEarningRemaining: number;
  }> {
    const response = await privateApi.get(`${this.baseUrl}/monetization`);
    return response.data.data;
  }

  async getMonetizationKyc(): Promise<{
    status: "NOT_SUBMITTED" | "PENDING" | "APPROVED" | "REJECTED";
    fullName: string | null;
    phoneNumber: string | null;
    address: string | null;
    documentType: string | null;
    submittedAt: string | null;
    reviewedAt: string | null;
    adminRemarks: string | null;
  }> {
    const response = await privateApi.get(`${this.baseUrl}/monetization/kyc`);
    return response.data.data;
  }

  async submitMonetizationKyc(data: {
    fullName: string;
    phoneNumber: string;
    address: string;
    documentType: string;
    documentNumber: string;
    document: File;
  }) {
    const form = new FormData();
    form.append("fullName", data.fullName);
    form.append("phoneNumber", data.phoneNumber);
    form.append("address", data.address);
    form.append("documentType", data.documentType);
    form.append("documentNumber", data.documentNumber);
    form.append("document", data.document);

    const response = await privateApi.post(
      `${this.baseUrl}/monetization/kyc`,
      form,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return response.data.data;
  }

  async activateMonetization() {
    const response = await privateApi.post(
      `${this.baseUrl}/monetization/activate`,
    );
    return response.data.data as {
      isMonetized: boolean;
      monetizedAt: string | null;
      monetizationFeePaid: number;
      balance?: number;
      alreadyActive: boolean;
    };
  }

  async getTransactions(params?: TransactionsQueryParams) {
    const response = await privateApi.get(`${this.baseUrl}/transactions`, {
      params,
    });
    return response.data;
  }

  async getWithdrawals(params?: WithdrawalsQueryParams) {
    const response = await privateApi.get(`${this.baseUrl}/withdrawals`, {
      params,
    });
    return response.data;
  }

  async createWithdrawalRequest(data: {
    amount: number;
    paymentMethod: PaymentMethod;
    paymentDetails: string;
    remarks?: string;
  }) {
    const response = await privateApi.post(`${this.baseUrl}/withdrawals`, data);
    return response.data;
  }

  async getAdminMonetizationKyc(status?: string) {
    const response = await privateApi.get(
      `${this.baseUrl}/admin/monetization/kyc`,
      { params: status ? { status } : undefined },
    );
    return response.data.data as Array<any>;
  }

  async reviewMonetizationKyc(
    id: string,
    data: { status: "APPROVED" | "REJECTED"; adminRemarks?: string },
  ) {
    const response = await privateApi.patch(
      `${this.baseUrl}/admin/monetization/kyc/${id}`,
      data,
    );
    return response.data.data;
  }

  getMonetizationKycDocumentUrl(id: string) {
    return `/api/wallet/admin/monetization/kyc/${id}/document`;
  }

  async getAllWithdrawals(params?: WithdrawalsQueryParams) {
    const response = await privateApi.get(`${this.baseUrl}/admin/withdrawals`, {
      params,
    });
    return response.data;
  }

  async processWithdrawalRequest(
    id: string,
    data: {
      status: WithdrawalStatus.APPROVED | WithdrawalStatus.REJECTED;
      adminRemarks?: string;
      transactionReference?: string;
    },
  ) {
    const response = await privateApi.patch(
      `${this.baseUrl}/admin/withdrawals/${id}/process`,
      data,
    );
    return response.data;
  }

  async addRoomCommission(data: {
    roomId: string;
    serviceCharge: number;
    notes?: string;
  }) {
    const response = await privateApi.post(
      `${this.baseUrl}/admin/commission`,
      data,
    );
    return response.data;
  }

  async updateCommissionRate(userId: string, commissionRate: number) {
    const response = await privateApi.put(
      `${this.baseUrl}/admin/commission-rate/${userId}`,
      {
        commissionRate,
      },
    );
    return response.data;
  }

  async getWalletStats(): Promise<WalletStats> {
    const response = await privateApi.get(`${this.baseUrl}/admin/stats`);
    return response.data.data;
  }
}

export const walletService = new WalletService();
