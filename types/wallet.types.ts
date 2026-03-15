export enum PaymentMethod {
  BANK_TRANSFER = "Bank Transfer",
  ESEWA = "eSewa",
  KHALTI = "Khalti",
  QR_CODE = "QR Code",
  CASH = "Cash",
}

export enum WithdrawalStatus {
  PENDING = "Pending",
  APPROVED = "Approved",
  REJECTED = "Rejected",
}

export enum TransactionType {
  COMMISSION = "Commission",
  WITHDRAWAL = "Withdrawal",
  ADJUSTMENT = "Adjustment",
}

export enum TransactionStatus {
  PENDING = "Pending",
  COMPLETED = "Completed",
  FAILED = "Failed",
}

export interface WalletBalanceType {
  balance: number;
  pendingBalance: number;
  totalEarned: number;
  totalWithdrawn: number;
  commissionRate: number;
}

export interface WalletStats {
  totalWallets: number;
  totalBalance: number;
  totalPending: number;
  totalWithdrawn: number;
  pendingWithdrawals: number;
  totalCommissionEarned: number;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  status: TransactionStatus;
  amount: number;
  commissionAmount: number;
  netAmount: number;
  description: string;
  createdAt: string;
  completedAt?: string;
  roomTitle?: string;
}

export interface Withdrawal {
  id: string;
  amount: number;
  status: WithdrawalStatus;
  paymentMethod: PaymentMethod;
  paymentDetails?: string;
  remarks?: string;
  adminRemarks?: string;
  createdAt: string;
  processedAt?: string;
  transactionReference?: string;
  user?: {
    id: string;
    name: string;
    email: string;
    phoneNumber: string;
  };
}
