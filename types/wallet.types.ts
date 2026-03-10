export enum TransactionType {
  CREDIT = "credit",
  DEBIT = "debit",
  COMMISSION = "commission",
  WITHDRAWAL = "withdrawal",
  REFUND = "refund",
  ADJUSTMENT = "adjustment",
}

export enum TransactionStatus {
  PENDING = "pending",
  COMPLETED = "completed",
  FAILED = "failed",
  CANCELLED = "cancelled",
}

export enum WithdrawalStatus {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
  PROCESSING = "processing",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
}

export enum PaymentMethod {
  ESEWA = "esewa",
  KHALTI = "khalti",
  BANK_TRANSFER = "bank_transfer",
  QR_CODE = "qr_code",
  CASH = "cash",
}

export interface WalletBalanceType {
  balance: number;
  pendingBalance: number;
  totalEarned: number;
  totalWithdrawn: number;
  commissionRate: number;
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
  roomTitle?: string;
}

export interface WithdrawalRequest {
  id: string;
  amount: number;
  status: WithdrawalStatus;
  paymentMethod: PaymentMethod;
  remarks: string;
  adminRemarks: string;
  createdAt: string;
  processedAt: string;
  transactionReference: string;
  user?: {
    id: string;
    name: string;
    email: string;
    phoneNumber: string;
  };
  metadata?: {
    bankName?: string;
    accountNumber?: string;
    accountName?: string;
    qrCodeUrl?: string;
    esewaNumber?: string;
    khaltiNumber?: string;
  };
}

export interface WalletStats {
  totalWallets: number;
  totalBalance: number;
  totalPending: number;
  totalWithdrawn: number;
  pendingWithdrawals: number;
}
