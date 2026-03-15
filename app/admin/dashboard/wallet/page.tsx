"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Wallet,
  IndianRupee,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  Eye,
  Filter,
  Download,
  ArrowUpRight,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { walletService } from "@/http/services/wallet.service";
import { WithdrawalStatus, PaymentMethod } from "@/types/wallet.types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { formatNepaliCurrency, formatDate, formatDateTime } from "@/lib/utils";
import { cn } from "@/lib/utils";
import {
  SUCCESSTOAST,
  FAILURETOAST,
  PAGE_SIZE_OPTIONS,
} from "@/lib/constants/app.constants";

export default function AdminWalletPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("withdrawals");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [methodFilter, setMethodFilter] = useState<string>("all");
  const [page, setPage] = useState(0);
  const [take, setTake] = useState(10);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<any>(null);
  const [showProcessDialog, setShowProcessDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [processAction, setProcessAction] = useState<"approve" | "reject">(
    "approve",
  );
  const [adminRemarks, setAdminRemarks] = useState("");
  const [transactionReference, setTransactionReference] = useState("");

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(0);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch wallet stats
  const {
    data: statsData,
    isLoading: statsLoading,
    refetch: refetchStats,
  } = useQuery({
    queryKey: ["admin-wallet-stats"],
    queryFn: () => walletService.getWalletStats(),
  });

  // Fetch all withdrawals
  const {
    data: withdrawalsResponse,
    isLoading: withdrawalsLoading,
    isFetching: withdrawalsFetching,
    refetch: refetchWithdrawals,
  } = useQuery({
    queryKey: [
      "admin-withdrawals",
      page,
      take,
      debouncedSearch,
      statusFilter,
      methodFilter,
    ],
    queryFn: () =>
      walletService.getAllWithdrawals({
        page,
        take,
        search: debouncedSearch || undefined,
        status:
          statusFilter !== "all"
            ? (statusFilter as WithdrawalStatus)
            : undefined,
        paymentMethod:
          methodFilter !== "all" ? (methodFilter as PaymentMethod) : undefined,
      }),
  });

  // Process withdrawal mutation
  const processMutation = useMutation({
    mutationFn: ({
      id,
      status,
      adminRemarks,
      transactionReference,
    }: {
      id: string;
      status: WithdrawalStatus.APPROVED | WithdrawalStatus.REJECTED;
      adminRemarks?: string;
      transactionReference?: string;
    }) =>
      walletService.processWithdrawalRequest(id, {
        status,
        adminRemarks,
        transactionReference,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-withdrawals"] });
      queryClient.invalidateQueries({ queryKey: ["admin-wallet-stats"] });
      toast.success("Withdrawal request processed successfully", {
        style: { background: SUCCESSTOAST, color: "#fff" },
      });
      setShowProcessDialog(false);
      setSelectedWithdrawal(null);
      setAdminRemarks("");
      setTransactionReference("");
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Failed to process request",
        {
          style: { background: FAILURETOAST, color: "#fff" },
        },
      );
    },
  });

  const handleProcess = () => {
    if (!selectedWithdrawal) return;

    if (processAction === "approve" && !transactionReference.trim()) {
      toast.error("Transaction reference is required for approval");
      return;
    }

    processMutation.mutate({
      id: selectedWithdrawal.id,
      status:
        processAction === "approve"
          ? WithdrawalStatus.APPROVED
          : WithdrawalStatus.REJECTED,
      adminRemarks: adminRemarks || undefined,
      transactionReference: transactionReference || undefined,
    });
  };

  const handleViewDetails = (withdrawal: any) => {
    setSelectedWithdrawal(withdrawal);
    setShowDetailsDialog(true);
  };

  const handleProcessClick = (
    withdrawal: any,
    action: "approve" | "reject",
  ) => {
    setSelectedWithdrawal(withdrawal);
    setProcessAction(action);
    setAdminRemarks("");
    setTransactionReference("");
    setShowProcessDialog(true);
  };

  const getStatusBadge = (status: WithdrawalStatus) => {
    switch (status) {
      case WithdrawalStatus.PENDING:
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case WithdrawalStatus.APPROVED:
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        );
      case WithdrawalStatus.REJECTED:
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getPaymentMethodIcon = (method: PaymentMethod) => {
    switch (method) {
      case PaymentMethod.BANK_TRANSFER:
        return "🏦";
      case PaymentMethod.ESEWA:
        return "📱";
      case PaymentMethod.KHALTI:
        return "📱";
      case PaymentMethod.QR_CODE:
        return "📷";
      default:
        return "💰";
    }
  };

  const withdrawals = withdrawalsResponse?.data || [];
  const pagination = withdrawalsResponse?.pagination || {
    page: 0,
    take: 10,
    total: 0,
    count: 0,
    previousPage: null,
    nextPage: null,
  };

  const totalItems = pagination.total || 0;
  const showingFrom = totalItems > 0 ? page * take + 1 : 0;
  const showingTo = Math.min((page + 1) * take, totalItems);
  const totalPages = Math.max(1, Math.ceil(totalItems / take));

  const renderPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    pages.push(
      <Button
        key="prev"
        variant="outline"
        size="sm"
        onClick={() => setPage(Math.max(0, page - 1))}
        disabled={page === 0}
        className="h-8 w-8 p-0 cursor-pointer"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>,
    );

    let start = Math.max(0, page - Math.floor(maxVisible / 2));
    const end = Math.min(totalPages - 1, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(0, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(
        <Button
          key={i}
          variant={page === i ? "default" : "outline"}
          size="sm"
          onClick={() => setPage(i)}
          className="h-8 w-8 p-0 cursor-pointer"
        >
          {i + 1}
        </Button>,
      );
    }

    pages.push(
      <Button
        key="next"
        variant="outline"
        size="sm"
        onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
        disabled={page >= totalPages - 1}
        className="h-8 w-8 p-0 cursor-pointer"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>,
    );

    return pages;
  };

  if (statsLoading && !statsData) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">
            Loading wallet data...
          </p>
        </div>
      </div>
    );
  }

  const stats = statsData || {
    totalWallets: 0,
    totalBalance: 0,
    totalPending: 0,
    totalWithdrawn: 0,
    pendingWithdrawals: 0,
    totalCommissionEarned: 0,
  };

  return (
    <div className="p-4 md:p-6 space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-3">
            <Wallet className="h-6 w-6 md:h-8 md:w-8 text-primary" />
            <span>Wallet Management</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage user withdrawals and wallet balances
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => {
              refetchStats();
              refetchWithdrawals();
            }}
            disabled={statsLoading || withdrawalsFetching}
            className="cursor-pointer"
          >
            <RefreshCw
              className={cn(
                "h-4 w-4 mr-2",
                (statsLoading || withdrawalsFetching) && "animate-spin",
              )}
            />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-3">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Wallets</p>
                <h3 className="text-xl font-bold mt-1">{stats.totalWallets}</h3>
              </div>
              <div className="p-2 bg-blue-100 rounded-full">
                <Users className="h-4 w-4 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Balance</p>
                <h3 className="text-xl font-bold mt-1 flex items-center gap-1">
                  <IndianRupee className="h-3 w-3" />
                  {formatNepaliCurrency(stats.totalBalance)}
                </h3>
              </div>
              <div className="p-2 bg-green-100 rounded-full">
                <Wallet className="h-4 w-4 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">
                  Pending Withdrawals
                </p>
                <h3 className="text-xl font-bold mt-1">
                  {stats.pendingWithdrawals}
                </h3>
              </div>
              <div className="p-2 bg-yellow-100 rounded-full">
                <Clock className="h-4 w-4 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Withdrawn</p>
                <h3 className="text-xl font-bold mt-1 flex items-center gap-1">
                  <IndianRupee className="h-3 w-3" />
                  {formatNepaliCurrency(stats.totalWithdrawn)}
                </h3>
              </div>
              <div className="p-2 bg-purple-100 rounded-full">
                <ArrowUpRight className="h-4 w-4 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">
                  Commission Earned
                </p>
                <h3 className="text-xl font-bold mt-1 flex items-center gap-1">
                  <IndianRupee className="h-3 w-3" />
                  {formatNepaliCurrency(stats.totalCommissionEarned)}
                </h3>
              </div>
              <div className="p-2 bg-orange-100 rounded-full">
                <Wallet className="h-4 w-4 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList className="grid w-full grid-cols-2 lg:w-[300px]">
          <TabsTrigger value="withdrawals" className="cursor-pointer">
            Withdrawals
          </TabsTrigger>
          <TabsTrigger value="overview" className="cursor-pointer">
            Overview
          </TabsTrigger>
        </TabsList>

        <TabsContent value="withdrawals" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col lg:flex-row gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search by user name, email, or phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 text-sm"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => {
                        setSearchTerm("");
                        setDebouncedSearch("");
                        setPage(0);
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-[140px] cursor-pointer">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value={WithdrawalStatus.PENDING}>
                        Pending
                      </SelectItem>
                      <SelectItem value={WithdrawalStatus.APPROVED}>
                        Approved
                      </SelectItem>
                      <SelectItem value={WithdrawalStatus.REJECTED}>
                        Rejected
                      </SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={methodFilter} onValueChange={setMethodFilter}>
                    <SelectTrigger className="w-full sm:w-[140px] cursor-pointer">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Methods</SelectItem>
                      <SelectItem value={PaymentMethod.BANK_TRANSFER}>
                        Bank Transfer
                      </SelectItem>
                      <SelectItem value={PaymentMethod.ESEWA}>eSewa</SelectItem>
                      <SelectItem value={PaymentMethod.KHALTI}>
                        Khalti
                      </SelectItem>
                      <SelectItem value={PaymentMethod.QR_CODE}>
                        QR Code
                      </SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={take.toString()}
                    onValueChange={(value) => {
                      setTake(Number(value));
                      setPage(0);
                    }}
                  >
                    <SelectTrigger className="w-full sm:w-[100px] cursor-pointer">
                      <SelectValue placeholder="Per page" />
                    </SelectTrigger>
                    <SelectContent>
                      {PAGE_SIZE_OPTIONS.map((size) => (
                        <SelectItem
                          key={size}
                          value={size.toString()}
                          className="cursor-pointer"
                        >
                          {size}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Mobile View - Cards */}
          <div className="block lg:hidden space-y-3">
            {withdrawalsLoading ? (
              <div className="text-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
              </div>
            ) : withdrawals.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <Wallet className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                  <p className="font-medium text-sm">No withdrawals found</p>
                  <p className="text-xs text-muted-foreground">
                    {searchTerm ||
                    statusFilter !== "all" ||
                    methodFilter !== "all"
                      ? "Try adjusting your filters"
                      : "No withdrawal requests yet"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              withdrawals.map((withdrawal: any) => (
                <Card key={withdrawal.id} className="overflow-hidden">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {withdrawal.user?.name || "Unknown User"}
                        </span>
                        {getStatusBadge(withdrawal.status)}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(withdrawal.createdAt)}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                      <div>
                        <p className="text-muted-foreground">Amount</p>
                        <p className="font-medium flex items-center gap-1">
                          <IndianRupee className="h-3 w-3" />
                          {formatNepaliCurrency(withdrawal.amount)}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Method</p>
                        <p className="font-medium">
                          {getPaymentMethodIcon(withdrawal.paymentMethod)}{" "}
                          {withdrawal.paymentMethod}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Phone</p>
                        <p className="font-medium">
                          {withdrawal.user?.phoneNumber || "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Email</p>
                        <p className="font-medium truncate">
                          {withdrawal.user?.email || "N/A"}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 h-7 text-xs cursor-pointer"
                        onClick={() => handleViewDetails(withdrawal)}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Details
                      </Button>
                      {withdrawal.status === WithdrawalStatus.PENDING && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 h-7 text-xs bg-green-50 text-green-700 hover:bg-green-100 cursor-pointer"
                            onClick={() =>
                              handleProcessClick(withdrawal, "approve")
                            }
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Approve
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 h-7 text-xs bg-red-50 text-red-700 hover:bg-red-100 cursor-pointer"
                            onClick={() =>
                              handleProcessClick(withdrawal, "reject")
                            }
                          >
                            <XCircle className="h-3 w-3 mr-1" />
                            Reject
                          </Button>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden lg:block">
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Requested</TableHead>
                        <TableHead>Processed</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {withdrawalsLoading ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                          </TableCell>
                        </TableRow>
                      ) : withdrawals.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8">
                            <Wallet className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No withdrawals found</p>
                          </TableCell>
                        </TableRow>
                      ) : (
                        withdrawals.map((withdrawal: any) => (
                          <TableRow key={withdrawal.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">
                                  {withdrawal.user?.name || "Unknown"}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {withdrawal.user?.email}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-1">
                                <IndianRupee className="h-3 w-3" />
                                {formatNepaliCurrency(withdrawal.amount)}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="font-normal">
                                {getPaymentMethodIcon(withdrawal.paymentMethod)}{" "}
                                {withdrawal.paymentMethod}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(withdrawal.status)}
                            </TableCell>
                            <TableCell>
                              {formatDate(withdrawal.createdAt)}
                            </TableCell>
                            <TableCell>
                              {withdrawal.processedAt
                                ? formatDate(withdrawal.processedAt)
                                : "—"}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleViewDetails(withdrawal)}
                                  className="h-8 w-8 cursor-pointer"
                                  title="View Details"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                {withdrawal.status ===
                                  WithdrawalStatus.PENDING && (
                                  <>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() =>
                                        handleProcessClick(
                                          withdrawal,
                                          "approve",
                                        )
                                      }
                                      className="h-8 w-8 text-green-600 hover:text-green-700 cursor-pointer"
                                      title="Approve"
                                    >
                                      <CheckCircle className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() =>
                                        handleProcessClick(withdrawal, "reject")
                                      }
                                      className="h-8 w-8 text-red-600 hover:text-red-700 cursor-pointer"
                                      title="Reject"
                                    >
                                      <XCircle className="h-4 w-4" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Pagination */}
          {totalItems > 0 && (
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
                  <div className="text-xs text-muted-foreground">
                    Showing {showingFrom} to {showingTo} of {totalItems} entries
                  </div>
                  <div className="flex items-center gap-2">
                    {renderPageNumbers()}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Wallet Statistics</CardTitle>
              <CardDescription>Overview of all user wallets</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium mb-2">
                      Balance Distribution
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Total Balance</span>
                        <span className="font-medium">
                          ₹{formatNepaliCurrency(stats.totalBalance)}
                        </span>
                      </div>
                      <Progress value={75} className="h-2" />
                      <div className="flex justify-between text-sm">
                        <span>Pending Balance</span>
                        <span className="font-medium">
                          ₹{formatNepaliCurrency(stats.totalPending)}
                        </span>
                      </div>
                      <Progress value={25} className="h-2" />
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <h3 className="text-sm font-medium mb-2">
                      Withdrawal Stats
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Total Withdrawn</span>
                        <span className="font-medium">
                          ₹{formatNepaliCurrency(stats.totalWithdrawn)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Pending Withdrawals</span>
                        <span className="font-medium">
                          {stats.pendingWithdrawals}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Commission Earned</span>
                        <span className="font-medium">
                          ₹{formatNepaliCurrency(stats.totalCommissionEarned)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-primary/5 rounded-lg p-4">
                    <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-primary" />
                      Quick Actions
                    </h3>
                    <div className="space-y-2">
                      <Button
                        variant="outline"
                        className="w-full justify-start cursor-pointer"
                        onClick={() => setActiveTab("withdrawals")}
                      >
                        View Pending Withdrawals ({stats.pendingWithdrawals})
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-start cursor-pointer"
                        onClick={() => {
                          // Export functionality
                        }}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Export Report
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Process Withdrawal Dialog */}
      <Dialog open={showProcessDialog} onOpenChange={setShowProcessDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {processAction === "approve" ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Approve Withdrawal
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-red-600" />
                  Reject Withdrawal
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {processAction === "approve"
                ? "This will mark the withdrawal as approved and update user's wallet"
                : "This will reject the withdrawal request and return funds to user's wallet"}
            </DialogDescription>
          </DialogHeader>

          {selectedWithdrawal && (
            <div className="space-y-4 py-4">
              <div className="bg-muted p-3 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">User</span>
                  <span className="text-sm font-medium">
                    {selectedWithdrawal.user?.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Amount</span>
                  <span className="text-sm font-medium flex items-center gap-1">
                    <IndianRupee className="h-3 w-3" />
                    {formatNepaliCurrency(selectedWithdrawal.amount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Method</span>
                  <span className="text-sm font-medium">
                    {selectedWithdrawal.paymentMethod}
                  </span>
                </div>
              </div>

              {processAction === "approve" && (
                <div className="space-y-2">
                  <Label htmlFor="transactionRef">Transaction Reference</Label>
                  <Input
                    id="transactionRef"
                    placeholder="e.g., BANK12345, ESEWA98765"
                    value={transactionReference}
                    onChange={(e) => setTransactionReference(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter the transaction ID or reference number
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="adminRemarks">
                  {processAction === "approve"
                    ? "Admin Notes (Optional)"
                    : "Rejection Reason"}
                </Label>
                <Textarea
                  id="adminRemarks"
                  placeholder={
                    processAction === "approve"
                      ? "Any additional notes..."
                      : "Please provide reason for rejection"
                  }
                  value={adminRemarks}
                  onChange={(e) => setAdminRemarks(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowProcessDialog(false);
                setSelectedWithdrawal(null);
                setAdminRemarks("");
                setTransactionReference("");
              }}
              className="cursor-pointer"
              disabled={processMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleProcess}
              className={
                processAction === "approve"
                  ? "bg-green-600 hover:bg-green-700 cursor-pointer"
                  : "bg-red-600 hover:bg-red-700 cursor-pointer"
              }
              disabled={
                processMutation.isPending ||
                (processAction === "approve" && !transactionReference.trim())
              }
            >
              {processMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : processAction === "approve" ? (
                "Approve Withdrawal"
              ) : (
                "Reject Withdrawal"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Withdrawal Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Withdrawal Details</DialogTitle>
            <DialogDescription>
              Complete information about the withdrawal request
            </DialogDescription>
          </DialogHeader>

          {selectedWithdrawal && (
            <div className="space-y-4 py-4">
              {/* Status */}
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Status</span>
                {getStatusBadge(selectedWithdrawal.status)}
              </div>

              {/* User Info */}
              <div className="bg-muted p-3 rounded-lg space-y-2">
                <h4 className="text-sm font-medium">User Information</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-muted-foreground">Name</span>
                  <span className="font-medium">
                    {selectedWithdrawal.user?.name || "N/A"}
                  </span>
                  <span className="text-muted-foreground">Email</span>
                  <span className="font-medium">
                    {selectedWithdrawal.user?.email || "N/A"}
                  </span>
                  <span className="text-muted-foreground">Phone</span>
                  <span className="font-medium">
                    {selectedWithdrawal.user?.phoneNumber || "N/A"}
                  </span>
                </div>
              </div>

              {/* Withdrawal Info */}
              <div className="bg-muted p-3 rounded-lg space-y-2">
                <h4 className="text-sm font-medium">Withdrawal Information</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="font-medium flex items-center gap-1">
                    <IndianRupee className="h-3 w-3" />
                    {formatNepaliCurrency(selectedWithdrawal.amount)}
                  </span>
                  <span className="text-muted-foreground">Method</span>
                  <span className="font-medium">
                    {selectedWithdrawal.paymentMethod}
                  </span>
                  <span className="text-muted-foreground">Requested</span>
                  <span className="font-medium">
                    {formatDateTime(selectedWithdrawal.createdAt)}
                  </span>
                  {selectedWithdrawal.processedAt && (
                    <>
                      <span className="text-muted-foreground">Processed</span>
                      <span className="font-medium">
                        {formatDateTime(selectedWithdrawal.processedAt)}
                      </span>
                    </>
                  )}
                  {selectedWithdrawal.transactionReference && (
                    <>
                      <span className="text-muted-foreground">Reference</span>
                      <span className="font-medium">
                        {selectedWithdrawal.transactionReference}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Payment Details */}
              {selectedWithdrawal.paymentDetails && (
                <div className="bg-muted p-3 rounded-lg space-y-2">
                  <h4 className="text-sm font-medium">Payment Details</h4>
                  <pre className="text-xs whitespace-pre-wrap font-mono bg-background p-2 rounded">
                    {JSON.stringify(
                      JSON.parse(selectedWithdrawal.paymentDetails),
                      null,
                      2,
                    )}
                  </pre>
                </div>
              )}

              {/* Remarks */}
              {selectedWithdrawal.remarks && (
                <div className="bg-muted p-3 rounded-lg">
                  <h4 className="text-sm font-medium mb-1">User Remarks</h4>
                  <p className="text-sm">{selectedWithdrawal.remarks}</p>
                </div>
              )}

              {selectedWithdrawal.adminRemarks && (
                <div className="bg-muted p-3 rounded-lg">
                  <h4 className="text-sm font-medium mb-1">Admin Remarks</h4>
                  <p className="text-sm">{selectedWithdrawal.adminRemarks}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDetailsDialog(false)}
              className="cursor-pointer"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
