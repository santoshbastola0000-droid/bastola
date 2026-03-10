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
    const response = await privateApi.put(
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
