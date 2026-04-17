import {
  WithdrawalStatus,
  PaymentMethod,
  Withdrawal,
} from "@/types/wallet.types";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  IndianRupee,
  Banknote,
  Smartphone,
  QrCode,
  Landmark,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

interface Props {
  withdrawals: Withdrawal[];
  limit?: number;
  showAll?: boolean;
}

export function WithdrawalHistory({ withdrawals, limit, showAll }: Props) {
  const [selectedWithdrawal, setSelectedWithdrawal] =
    useState<Withdrawal | null>(null);
  const displayWithdrawals = showAll
    ? withdrawals
    : withdrawals.slice(0, limit);

  const getStatusBadge = (status: WithdrawalStatus) => {
    const variants = {
      [WithdrawalStatus.APPROVED]:
        "bg-blue-100 text-blue-700 hover:bg-blue-200",
      [WithdrawalStatus.PENDING]:
        "bg-yellow-100 text-yellow-700 hover:bg-yellow-200",

      [WithdrawalStatus.REJECTED]: "bg-red-100 text-red-700 hover:bg-red-200",
    };

    return (
      <Badge className={`${variants[status]} border-0`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getPaymentIcon = (method: PaymentMethod) => {
    switch (method) {
      case PaymentMethod.BANK_TRANSFER:
        return <Landmark className="h-4 w-4" />;
      case PaymentMethod.ESEWA:
      case PaymentMethod.KHALTI:
        return <Smartphone className="h-4 w-4" />;
      case PaymentMethod.QR_CODE:
        return <QrCode className="h-4 w-4" />;
      default:
        return <Banknote className="h-4 w-4" />;
    }
  };

  if (displayWithdrawals.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
          <IndianRupee className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="font-medium text-gray-900">No withdrawal requests</h3>
        <p className="text-sm text-gray-500 mt-1">
          Your withdrawal requests will appear here
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {displayWithdrawals.map((withdrawal) => (
          <div
            key={withdrawal.id}
            className="flex items-start justify-between p-4 rounded-lg border bg-white hover:shadow-sm transition-shadow"
          >
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-full bg-primary/10">
                    {getPaymentIcon(withdrawal.paymentMethod)}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">
                      Withdrawal Request
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500">
                        {formatDate(withdrawal.createdAt)}
                      </span>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs font-medium capitalize text-gray-600">
                        {withdrawal.paymentMethod.replace("_", " ")}
                      </span>
                    </div>
                    <div className="mt-2">
                      {getStatusBadge(withdrawal.status)}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">
                    Rs. {formatCurrency(withdrawal.amount)}
                  </p>
                  {withdrawal.transactionReference && (
                    <p className="text-xs text-gray-500 mt-1">
                      Ref: {withdrawal.transactionReference}
                    </p>
                  )}
                </div>
              </div>

              {withdrawal.adminRemarks && (
                <div className="mt-3 p-2 bg-gray-50 rounded-md text-sm">
                  <p className="text-gray-600">
                    <span className="font-medium">Admin note:</span>{" "}
                    {withdrawal.adminRemarks}
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
