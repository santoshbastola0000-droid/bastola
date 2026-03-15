"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Wallet,
  ArrowUpRight,
  Plus,
  History,
  Receipt,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { walletService } from "@/http/services/wallet.service";
import { WalletBalance } from "@/components/user/wallet/WalletBalance";
import { TransactionList } from "@/components/user/wallet/TransactionList";
import { WithdrawalHistory } from "@/components/user/wallet/WithdrawalHistory";
import { WithdrawalModal } from "@/components/user/wallet/WithdrawalModal";
import { Skeleton } from "@/components/ui/skeleton";

export default function UserWalletPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [withdrawalModalOpen, setWithdrawalModalOpen] = useState(false);

  // Fetch balance with proper loading states
  const {
    data: balance,
    isLoading: balanceLoading,
    error: balanceError,
  } = useQuery({
    queryKey: ["wallet-balance"],
    queryFn: () => walletService.getBalance(),
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
  });

  // Fetch recent transactions
  const { data: transactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ["wallet-transactions", "recent"],
    queryFn: () => walletService.getTransactions({ take: 5 }),
    staleTime: 1000 * 60 * 2, // 2 minutes
    enabled: !!balance, // Only fetch if balance is loaded
  });

  // Fetch recent withdrawals
  const { data: withdrawals, isLoading: withdrawalsLoading } = useQuery({
    queryKey: ["wallet-withdrawals", "recent"],
    queryFn: () => walletService.getWithdrawals({ take: 5 }),
    staleTime: 1000 * 60 * 2, // 2 minutes
    enabled: !!balance,
  });

  if (balanceLoading) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (balanceError) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <Wallet className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Failed to load wallet
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Please try refreshing the page
            </p>
            <Button onClick={() => window.location.reload()} variant="outline">
              Refresh
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const canWithdraw = balance && balance.balance >= 100;

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-3">
            <Wallet className="h-6 w-6 md:h-8 md:w-8 text-primary" />
            <span>My Wallet</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your earnings and withdrawals
          </p>
        </div>
        <Button
          onClick={() => setWithdrawalModalOpen(true)}
          className="bg-primary hover:bg-primary/90 cursor-pointer w-full sm:w-auto"
          disabled={!canWithdraw}
        >
          <Plus className="h-4 w-4 mr-2" />
          Request Withdrawal
        </Button>
      </div>

      {/* Balance Cards */}
      {balance && <WalletBalance balance={balance} />}

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
          <TabsTrigger value="overview" className="cursor-pointer">
            Overview
          </TabsTrigger>
          <TabsTrigger value="transactions" className="cursor-pointer">
            Transactions
          </TabsTrigger>
          <TabsTrigger value="withdrawals" className="cursor-pointer">
            Withdrawals
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Recent Transactions */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <History className="h-5 w-5 text-primary" />
                Recent Transactions
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveTab("transactions")}
                className="cursor-pointer"
              >
                View All
                <ArrowUpRight className="h-4 w-4 ml-2" />
              </Button>
            </CardHeader>
            <CardContent>
              {transactionsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : (
                <TransactionList
                  transactions={transactions?.data || []}
                  limit={5}
                />
              )}
            </CardContent>
          </Card>

          {/* Recent Withdrawals */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Receipt className="h-5 w-5 text-primary" />
                Recent Withdrawals
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveTab("withdrawals")}
                className="cursor-pointer"
              >
                View All
                <ArrowUpRight className="h-4 w-4 ml-2" />
              </Button>
            </CardHeader>
            <CardContent>
              {withdrawalsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : (
                <WithdrawalHistory
                  withdrawals={withdrawals?.data || []}
                  limit={5}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle>All Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <TransactionList
                transactions={transactions?.data || []}
                showAll
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="withdrawals">
          <Card>
            <CardHeader>
              <CardTitle>Withdrawal History</CardTitle>
            </CardHeader>
            <CardContent>
              <WithdrawalHistory
                withdrawals={withdrawals?.data || []}
                showAll
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Withdrawal Modal */}
      <WithdrawalModal
        open={withdrawalModalOpen}
        onOpenChange={setWithdrawalModalOpen}
        maxAmount={balance?.balance || 0}
      />
    </div>
  );
}
