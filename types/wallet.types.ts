export enum PaymentMethod {
  BANK_TRANSFER = "BANK_TRANSFER",
  ESEWA = "ESEWA",
  KHALTI = "KHALTI",
  QR_CODE = "QR_CODE",
  CASH = "CASH",
}

export enum WithdrawalStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
}

export enum TransactionType {
  COMMISSION = "COMMISSION",
  WITHDRAWAL = "WITHDRAWAL",
  TOP_UP = "TOP_UP",
  SERVICE_CHARGE = "SERVICE_CHARGE",
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
