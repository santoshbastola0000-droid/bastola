"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Wallet, ArrowUpRight, Plus, History, Receipt } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { walletService } from "@/http/services/wallet.service";
import { WalletBalance } from "@/components/user/wallet/WalletBalance";
import { TransactionList } from "@/components/user/wallet/TransactionList";
import { WithdrawalHistory } from "@/components/user/wallet/WithdrawalHistory";
import { WithdrawalModal } from "@/components/user/wallet/WithdrawalModal";

export default function UserWalletPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [withdrawalModalOpen, setWithdrawalModalOpen] = useState(false);

  const { data: balance, isLoading: balanceLoading } = useQuery({
    queryKey: ["wallet-balance"],
    queryFn: () => walletService.getBalance(),
  });

  const { data: transactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ["wallet-transactions"],
    queryFn: () => walletService.getTransactions({ take: 5 }),
  });

  const { data: withdrawals, isLoading: withdrawalsLoading } = useQuery({
    queryKey: ["wallet-withdrawals"],
    queryFn: () => walletService.getWithdrawals({ take: 5 }),
  });

  if (balanceLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
          className="bg-primary hover:bg-primary-dark cursor-pointer w-full sm:w-auto"
          disabled={!balance || balance.balance < 100}
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
        <TabsList className="grid w-full grid-cols-3 lg:w-auto">
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
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
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
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
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
