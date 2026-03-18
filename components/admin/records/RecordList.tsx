"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Trash2,
  Edit,
  Plus,
  Eye,
  Search,
  Phone,
  MapPin,
  DollarSign,
  FileText,
  Calendar,
  User,
  Building,
  CreditCard,
  Wallet,
  CheckCircle,
  AlertCircle,
  ChevronLeft,
  Hash,
  X,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import Link from "next/link";
import { DeleteConfirmationDialog } from "@/components/DeleteConfirmationDialog";
import { SUCCESSTOAST, FAILURETOAST } from "@/lib/constants/app.constants";
import {
  RecordsResponse,
  PaymentStatus,
  PayMode,
  RecordsFilter,
} from "@/types/record.types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { recordService } from "@/http/services/record.service";

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;

interface RecordListProps {
  recordYearId: string;
  title?: string;
  showBackButton?: boolean;
  onBack?: () => void;
}

export default function RecordList({
  recordYearId,
  title = "Records",
  showBackButton = false,
  onBack,
}: RecordListProps) {
  const queryClient = useQueryClient();
  const [viewRecordId, setViewRecordId] = useState<string | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [appliedSearchTerm, setAppliedSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [isManualSearch, setIsManualSearch] = useState(false);

  const handleSearch = () => {
    setAppliedSearchTerm(searchTerm.trim());
    setPage(0);
    setIsManualSearch(true);
  };

  const handleClearSearch = () => {
    setSearchTerm("");
    setAppliedSearchTerm("");
    setPage(0);
    setIsManualSearch(false);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
    if (e.key === "Escape") {
      handleClearSearch();
    }
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setPage(0);
  };

  const filters: RecordsFilter = {
    page,
    take: pageSize,
    search: appliedSearchTerm || undefined,
  };

  const {
    data: recordsResponse,
    isLoading,
    isFetching,
    error,
  } = useQuery<RecordsResponse>({
    queryKey: ["records", recordYearId, filters],
    queryFn: () => recordService.getRecordsByYear(recordYearId, filters),
    enabled: !!recordYearId,
    staleTime: 1000 * 60, // 1 minute cache
  });

  const deleteMutation = useMutation({
    mutationFn: recordService.deleteRecord,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["records", recordYearId] });
      toast.success("Record deleted successfully", {
        style: {
          background: SUCCESSTOAST,
          color: "#fff",
        },
      });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to delete record", {
        style: {
          background: FAILURETOAST,
          color: "#fff",
        },
      });
    },
  });

  const handleViewRecord = (recordId: string) => {
    setViewRecordId(recordId);
    setIsViewDialogOpen(true);
  };

  const selectedRecord = recordsResponse?.data?.find(
    (record) => record.id === viewRecordId,
  );

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM dd, yyyy HH:mm");
    } catch {
      return "Invalid Date";
    }
  };

  const getStatusBadge = (status: PaymentStatus) => {
    switch (status) {
      case PaymentStatus.PAID:
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200 gap-1">
            <CheckCircle className="h-3 w-3" />
            Paid
          </Badge>
        );
      case PaymentStatus.DUE:
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100 border-red-200 gap-1">
            <AlertCircle className="h-3 w-3" />
            Due
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPayModeBadge = (payMode: PayMode) => {
    switch (payMode) {
      case PayMode.DIGITAL:
        return (
          <Badge
            variant="outline"
            className="bg-blue-50 text-blue-700 border-blue-200"
          >
            <CreditCard className="h-3 w-3" />
            Digital
          </Badge>
        );
      case PayMode.CASH:
        return (
          <Badge
            variant="outline"
            className="bg-purple-50 text-purple-700 border-purple-200"
          >
            <Wallet className="h-3 w-3" />
            Cash
          </Badge>
        );
      default:
        return <Badge variant="outline">{payMode}</Badge>;
    }
  };

  const calculateTotalAmount = (formCharge: number) => {
    return formCharge;
  };

  // Generate pagination numbers
  const renderPageNumbers = () => {
    if (!recordsResponse?.pagination.total) return [];

    const totalPages = Math.ceil(recordsResponse.pagination.total / pageSize);
    const currentPage = page;
    const pages = [];

    // Always show first page
    pages.push(
      <Button
        key={0}
        variant={currentPage === 0 ? "default" : "outline"}
        size="sm"
        onClick={() => handlePageChange(0)}
        className="min-w-[40px]"
      >
        1
      </Button>,
    );

    // Show ellipsis if needed
    if (currentPage > 2) {
      pages.push(
        <span key="start-ellipsis" className="px-1 text-muted-foreground">
          ...
        </span>,
      );
    }

    // Show pages around current page
    const start = Math.max(1, currentPage - 1);
    const end = Math.min(totalPages - 2, currentPage + 1);

    for (let i = start; i <= end; i++) {
      if (i > 0 && i < totalPages - 1) {
        pages.push(
          <Button
            key={i}
            variant={currentPage === i ? "default" : "outline"}
            size="sm"
            onClick={() => handlePageChange(i)}
            className="min-w-[40px]"
          >
            {i + 1}
          </Button>,
        );
      }
    }

    // Show ellipsis if needed
    if (currentPage < totalPages - 3) {
      pages.push(
        <span key="end-ellipsis" className="px-1 text-muted-foreground">
          ...
        </span>,
      );
    }

    // Always show last page if there is more than one page
    if (totalPages > 1) {
      pages.push(
        <Button
          key={totalPages - 1}
          variant={currentPage === totalPages - 1 ? "default" : "outline"}
          size="sm"
          onClick={() => handlePageChange(totalPages - 1)}
          className="min-w-[40px]"
        >
          {totalPages}
        </Button>,
      );
    }

    return pages;
  };

  // Loading skeleton
  if (isLoading && !recordsResponse) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 md:p-6 text-center">
        <Card className="inline-flex flex-col items-center gap-4 p-8 border-destructive/20 bg-destructive/5 max-w-md mx-auto">
          <DollarSign className="h-12 w-12 text-destructive" />
          <div>
            <h3 className="font-semibold text-destructive text-lg">
              Error Loading Records
            </h3>
            <p className="text-muted-foreground mt-1">
              {error?.message || "Failed to load records"}
            </p>
          </div>
          <Button
            onClick={() =>
              queryClient.invalidateQueries({
                queryKey: ["records", recordYearId],
              })
            }
            className="mt-2"
          >
            Try Again
          </Button>
        </Card>
      </div>
    );
  }

  const records = recordsResponse?.data || [];
  const paginationData = recordsResponse?.pagination || {
    page: 0,
    take: pageSize,
    total: 0,
    count: 0,
    previousPage: null,
    nextPage: null,
  };

  const showingFrom = page * pageSize + 1;
  const showingTo = Math.min((page + 1) * pageSize, paginationData.total);
  const hasRecords = paginationData.total > 0;

  return (
    <>
      <div className="p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            {showBackButton && onBack && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="h-8 w-8 p-0 cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            )}
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Calendar className="h-7 w-7 text-blue-900" />
                {title}
              </h1>
              <p className="text-gray-600 mt-1">
                Manage customer records for this fiscal period
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button asChild className="bg-primary hover:bg-red-700">
              <Link
                href={`/admin/dashboard/records/year/${recordYearId}/create`}
                className="flex items-center gap-2 cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                Add Record
              </Link>
            </Button>
          </div>
        </div>

        {/* Search Section */}
        <Card className="border border-gray-200 shadow-sm">
          <CardContent className="p-4 md:p-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2 ">
                  <Search className="h-4 w-4 text-gray-500" />
                  Search Records
                </label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input
                      placeholder="Search by name, phone number"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyDown={handleSearchKeyDown}
                      className="h-10 pl-9"
                    />
                    {searchTerm && (
                      <button
                        onClick={handleClearSearch}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        aria-label="Clear search"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleSearch}
                      className="h-10 px-6 bg-primary hover:bg-red-700 cursor-pointer"
                    >
                      <Search className="h-4 w-4 mr-2" />
                      Search
                    </Button>
                    {appliedSearchTerm && (
                      <Button
                        onClick={handleClearSearch}
                        variant="outline"
                        className="h-10 cursor-pointer"
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Active Filters */}
              {(appliedSearchTerm || page > 0 || pageSize !== 10) && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    Active filters:
                  </span>
                  {appliedSearchTerm && (
                    <Badge variant="secondary" className="px-3 py-1">
                      Search: "{appliedSearchTerm}"
                      <button
                        onClick={handleClearSearch}
                        className="ml-2 text-muted-foreground hover:text-foreground"
                        aria-label="Remove search filter"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Records Summary */}
        {hasRecords && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border border-blue-200 bg-blue-50">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700">
                    Total Records
                  </p>
                  <p className="text-2xl font-bold text-blue-900">
                    {paginationData.total}
                  </p>
                </div>
                <Hash className="h-8 w-8 text-blue-600" />
              </CardContent>
            </Card>
            <Card className="border border-green-200 bg-green-50">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700">Paid</p>
                  <p className="text-2xl font-bold text-green-900">
                    {
                      records.filter(
                        (r) => r.paymentStatus === PaymentStatus.PAID,
                      ).length
                    }
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </CardContent>
            </Card>
            <Card className="border border-red-200 bg-red-50">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-700">Due</p>
                  <p className="text-2xl font-bold text-red-900">
                    {
                      records.filter(
                        (r) => r.paymentStatus === PaymentStatus.DUE,
                      ).length
                    }
                  </p>
                </div>
                <AlertCircle className="h-8 w-8 text-red-600" />
              </CardContent>
            </Card>
          </div>
        )}

        {/* Results Summary */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {hasRecords ? (
              <>
                Showing{" "}
                <span className="font-semibold text-foreground">
                  {showingFrom}-{showingTo}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-foreground">
                  {paginationData.total}
                </span>{" "}
                records
              </>
            ) : (
              "No records found"
            )}
            {isFetching && <span className="ml-2 animate-pulse">•</span>}
          </div>
          {hasRecords && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Show:</span>
              <Select
                value={pageSize.toString()}
                onValueChange={(value) => handlePageSizeChange(Number(value))}
              >
                <SelectTrigger className="h-8 w-[70px] cursor-pointer">
                  <SelectValue />
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
          )}
        </div>

        {/* Table */}
        <Card className="border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 hover:bg-gray-50">
                  <TableHead className="whitespace-nowrap text-gray-700 font-semibold">
                    Customer Details
                  </TableHead>
                  <TableHead className="whitespace-nowrap text-gray-700 font-semibold">
                    Document & Workplace
                  </TableHead>
                  <TableHead className="whitespace-nowrap text-gray-700 font-semibold">
                    Payment Details
                  </TableHead>
                  <TableHead className="whitespace-nowrap text-gray-700 font-semibold">
                    Created
                  </TableHead>
                  <TableHead className="text-right whitespace-nowrap text-gray-700 font-semibold">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isFetching && records.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                        <p className="text-sm text-gray-500">
                          Loading records...
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : records.length > 0 ? (
                  records.map((record, index) => (
                    <TableRow
                      key={record.id}
                      className="hover:bg-gray-50 transition-colors duration-150"
                    >
                      <TableCell>
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-500">
                              #{showingFrom + index}
                            </span>
                          </div>
                          <p className="font-semibold text-gray-900">
                            {record.name}
                          </p>
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-3 w-3 text-gray-500" />
                            <span className="font-medium">
                              {record.customerNumber}
                            </span>
                          </div>
                          {record.remarks && (
                            <p className="text-xs text-gray-500 line-clamp-1">
                              {record.remarks}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1.5">
                          {record.roomPlaceNumber && (
                            <div className="flex items-center gap-2 text-sm">
                              <Building className="h-3 w-3 text-gray-500" />
                              <span>{record.roomPlaceNumber}</span>
                            </div>
                          )}
                          {record.roomPlaceAddress && (
                            <div className="flex items-start gap-2 text-sm text-gray-500">
                              <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
                              <span className="line-clamp-1">
                                {record.roomPlaceAddress}
                              </span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-2">
                          <div>{getStatusBadge(record.paymentStatus)}</div>
                          <div>{getPayModeBadge(record.payMode)}</div>
                          <div className="text-sm space-y-0.5">
                            <div className="flex justify-between">
                              <span className="text-gray-500">
                                Form Charge:
                              </span>
                              <span className="font-medium">
                                Rs. {record.formCharge.toFixed(2)}
                              </span>
                            </div>
                            <div className="flex justify-between border-t pt-0.5">
                              <span className="font-medium">Total:</span>
                              <span className="font-bold text-blue-600">
                                Rs.{" "}
                                {calculateTotalAmount(
                                  record.formCharge,
                                ).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="text-sm">
                            {formatDate(record.createdAt)}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-blue-50 hover:text-primary cursor-pointer"
                            onClick={() => handleViewRecord(record.id)}
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-green-50 hover:text-green-600 cursor-pointer"
                            asChild
                            title="Edit"
                          >
                            <Link
                              href={`/admin/dashboard/records/${record.id}/edit`}
                            >
                              <Edit className="h-4 w-4" />
                            </Link>
                          </Button>
                          <DeleteConfirmationDialog
                            onConfirm={() => deleteMutation.mutate(record.id)}
                            title="Delete Record"
                            description="Are you sure you want to delete this record? This action cannot be undone."
                          >
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 hover:bg-red-50 hover:text-red-600 cursor-pointer"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </DeleteConfirmationDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-64 text-center">
                      <div className="flex flex-col items-center justify-center gap-4">
                        <User className="h-16 w-16 text-gray-300" />
                        <div>
                          <h3 className="font-semibold text-lg text-gray-700">
                            No Records Found
                          </h3>
                          <p className="text-gray-500 mt-1">
                            {appliedSearchTerm
                              ? `No records found for "${appliedSearchTerm}"`
                              : "Start by adding your first record"}
                          </p>
                        </div>
                        <Button
                          asChild
                          className="mt-2 bg-primary hover:bg-blue-800"
                        >
                          <Link
                            href={`/admin/dashboard/records/year/${recordYearId}/create`}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Record
                          </Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>

        {/* Pagination */}
        {hasRecords && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-muted-foreground">
              Page {page + 1} of {Math.ceil(paginationData.total / pageSize)}
            </div>

            <nav className="flex flex-wrap items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 0}
                className="cursor-pointer"
              >
                Previous
              </Button>

              <div className="flex items-center gap-1">
                {renderPageNumbers()}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(page + 1)}
                disabled={
                  page >= Math.ceil(paginationData.total / pageSize) - 1
                }
                className="cursor-pointer"
              >
                Next
              </Button>
            </nav>
          </div>
        )}
      </div>

      {/* View Record Dialog */}
      {selectedRecord && (
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-blue-600" />
                Record Details
              </DialogTitle>
              <DialogDescription>
                Complete information for this customer record
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Serial No & Status */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500">
                  Record #{selectedRecord.id.slice(0, 8)}
                </span>
                {getStatusBadge(selectedRecord.paymentStatus)}
              </div>

              {/* Customer Information */}
              <Card className="border border-gray-200">
                <CardContent className="p-4 space-y-3">
                  <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Customer Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Full Name
                      </p>
                      <p className="font-medium">{selectedRecord.name}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Contact Number
                      </p>
                      <p className="font-medium">
                        {selectedRecord.customerNumber}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Workplace Information */}
              {(selectedRecord.roomPlaceNumber ||
                selectedRecord.roomPlaceAddress) && (
                <Card className="border border-gray-200">
                  <CardContent className="p-4 space-y-3">
                    <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      Room Information
                    </h3>
                    <div className="space-y-2">
                      {selectedRecord.roomPlaceNumber && (
                        <div>
                          <p className="text-sm font-medium text-gray-500">
                            Workplace Number
                          </p>
                          <p className="font-medium">
                            {selectedRecord.roomPlaceNumber}
                          </p>
                        </div>
                      )}
                      {selectedRecord.roomPlaceAddress && (
                        <div>
                          <p className="text-sm font-medium text-gray-500">
                            Room Address
                          </p>
                          <p className="text-sm bg-gray-50 p-3 rounded-md">
                            {selectedRecord.roomPlaceAddress}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Payment Information */}
              <Card className="border border-gray-200">
                <CardContent className="p-4 space-y-3">
                  <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Payment Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Payment Mode
                      </p>
                      <div className="mt-1">
                        {getPayModeBadge(selectedRecord.payMode)}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Payment Status
                      </p>
                      <div className="mt-1">
                        {getStatusBadge(selectedRecord.paymentStatus)}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Form Charge
                      </p>
                      <p className="font-medium text-green-600">
                        Rs. {selectedRecord.formCharge.toFixed(2)}
                      </p>
                    </div>
                    <div className="md:col-span-2 border-t pt-4">
                      <div className="flex justify-between items-center">
                        <p className="text-sm font-medium text-gray-500">
                          Total Amount
                        </p>
                        <p className="text-lg font-bold text-blue-600">
                          Rs.{" "}
                          {calculateTotalAmount(
                            selectedRecord.formCharge,
                          ).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Remarks */}
              {selectedRecord.remarks && (
                <Card className="border border-gray-200">
                  <CardContent className="p-4 space-y-3">
                    <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Remarks
                    </h3>
                    <p className="text-sm bg-gray-50 p-3 rounded-md">
                      {selectedRecord.remarks}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Timestamps */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-500">
                <div>
                  <p>Created: {formatDate(selectedRecord.createdAt)}</p>
                </div>
              </div>
            </div>

            <DialogFooter className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setIsViewDialogOpen(false)}
              >
                Close
              </Button>
              <Button asChild className="bg-blue-600 hover:bg-blue-700">
                <Link
                  href={`/admin/dashboard/records/${selectedRecord.id}/edit`}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Record
                </Link>
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
