import { formatCurrency, formatDate } from "@/lib/utils";
import { ArrowDownLeft, ArrowUpRight, IndianRupee } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Transaction,
  TransactionStatus,
  TransactionType,
} from "@/types/wallet.types";
import { log } from "console";

interface Props {
  transactions: Transaction[];
  limit?: number;
  showAll?: boolean;
}

export function TransactionList({ transactions, limit, showAll }: Props) {
  const displayTransactions = showAll
    ? transactions
    : transactions.slice(0, limit);

  const getStatusBadge = (status: TransactionStatus) => {
    const variants = {
      [TransactionStatus.COMPLETED]:
        "bg-green-100 text-green-700 hover:bg-green-200",
      [TransactionStatus.PENDING]:
        "bg-yellow-100 text-yellow-700 hover:bg-yellow-200",
      [TransactionStatus.FAILED]: "bg-red-100 text-red-700 hover:bg-red-200",
    };

    return (
      <Badge className={`${variants[status]} border-0`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (displayTransactions.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
          <IndianRupee className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="font-medium text-gray-900">No transactions yet</h3>
        <p className="text-sm text-gray-500 mt-1">
          Your transactions will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {displayTransactions.map((transaction) => (
        <div
          key={transaction.id}
          className="flex items-start justify-between p-4 rounded-lg border bg-white hover:shadow-sm transition-shadow"
        >
          <div className="flex items-start gap-3">
            <div
              className={`p-2 rounded-full ${
                transaction.type === TransactionType.COMMISSION
                  ? "bg-green-100"
                  : "bg-red-100"
              }`}
            >
              {transaction.type === TransactionType.COMMISSION ? (
                <ArrowDownLeft className={`h-4 w-4 text-green-600`} />
              ) : (
                <ArrowUpRight className={`h-4 w-4 text-red-600`} />
              )}
            </div>
            <div>
              <h4 className="font-medium text-gray-900">
                {transaction.description}
              </h4>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-gray-500">
                  {formatDate(transaction.createdAt)}
                </span>
                {transaction.roomTitle && (
                  <>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-500">
                      {transaction.roomTitle}
                    </span>
                  </>
                )}
              </div>
              <div className="mt-2">{getStatusBadge(transaction.status)}</div>
            </div>
          </div>
          <div className="text-right">
            <p
              className={`font-semibold ${
                transaction.type === TransactionType.COMMISSION ||
                transaction.type === TransactionType.TOP_UP
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {transaction.type === TransactionType.COMMISSION ||
              transaction.type === TransactionType.TOP_UP
                ? "+"
                : "-"}
              Rs. {formatCurrency(transaction.netAmount)}
            </p>
            {transaction.commissionAmount > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                Commission: Rs. {formatCurrency(transaction.commissionAmount)}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
