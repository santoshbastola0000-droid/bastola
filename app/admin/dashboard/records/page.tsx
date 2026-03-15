"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Trash2,
  Edit,
  Plus,
  Calendar,
  Filter,
  CalendarDays,
  Hash,
  ChevronRight,
  Eye,
  FileText,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { RecordYearsResponse } from "@/types/record-year.types";
import { NEPALI_MONTHS, getNepaliYearOptions } from "@/lib/nepali-date.utils";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { DeleteConfirmationDialog } from "@/components/DeleteConfirmationDialog";
import { recordYearService } from "@/http/services/record-year.service";
import { usePagination } from "@/hooks/usePagination";
import { FAILURETOAST, SUCCESSTOAST } from "@/lib/constants/app.constants";
import RecordList from "@/components/admin/records/RecordList";

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;

const RecordYearList = () => {
  const queryClient = useQueryClient();

  const {
    setSearchTerm,
    appliedSearchTerm,
    pagination,
    handleSearch,
    handlePageChange,
    handlePageSizeChange,
  } = usePagination();

  const [nepaliYearFilter, setNepaliYearFilter] = useState<string>("all-year");
  const [nepaliMonthFilter, setNepaliMonthFilter] =
    useState<string>("all-months");
  const [selectedYearId, setSelectedYearId] = useState<string | null>(null);
  const [selectedYearTitle, setSelectedYearTitle] = useState<string>("");

  const {
    data: recordYearsResponse,
    isLoading,
    isFetching,
    error,
  } = useQuery<RecordYearsResponse>({
    queryKey: [
      "recordYears",
      {
        ...pagination,
        search: appliedSearchTerm,
        nepaliYear:
          nepaliYearFilter !== "all-year"
            ? parseInt(nepaliYearFilter)
            : undefined,
        nepaliMonth:
          nepaliMonthFilter !== "all-months"
            ? parseInt(nepaliMonthFilter)
            : undefined,
      },
    ],
    queryFn: () =>
      recordYearService.getRecordYears({
        ...pagination,
        search: appliedSearchTerm,
        nepaliYear:
          nepaliYearFilter !== "all-year"
            ? parseInt(nepaliYearFilter)
            : undefined,
        nepaliMonth:
          nepaliMonthFilter !== "all-months"
            ? parseInt(nepaliMonthFilter)
            : undefined,
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: recordYearService.deleteRecordYear,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recordYears"] });
      toast.success("Record year deleted successfully", {
        style: {
          background: SUCCESSTOAST,
          color: "#fff",
        },
      });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete record year", {
        style: {
          background: FAILURETOAST,
          color: "#fff",
        },
      });
    },
  });

  const handleApplyFilters = () => {
    handleSearch();
  };

  const handleClearFilters = () => {
    setNepaliYearFilter("all-year");
    setNepaliMonthFilter("all-months");
    setSearchTerm("");
    handleSearch();
  };

  const renderPageNumbers = () => {
    if (!recordYearsResponse?.pagination.total) return [];

    const totalPages = Math.ceil(
      recordYearsResponse.pagination.total / pagination.take,
    );
    const currentPage = pagination.page;
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

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM dd, yyyy");
    } catch {
      return "Invalid Date";
    }
  };

  const handleRowClick = (
    recordYearId: string,
    recordYearTitle: string,
    e: React.MouseEvent,
  ) => {
    const target = e.target as HTMLElement;
    if (!target.closest("button") && !target.closest("a")) {
      setSelectedYearId(recordYearId);
      setSelectedYearTitle(recordYearTitle);
    }
  };

  const handleViewRecords = (recordYearId: string, recordYearTitle: string) => {
    setSelectedYearId(recordYearId);
    setSelectedYearTitle(recordYearTitle);
  };

  // If a year is selected, show its records
  if (selectedYearId) {
    return (
      <div className="p-4 md:p-6">
        <RecordList
          recordYearId={selectedYearId}
          title={`${selectedYearTitle} - Records`}
          showBackButton={true}
          onBack={() => {
            setSelectedYearId(null);
            setSelectedYearTitle("");
          }}
        />
      </div>
    );
  }

  // Loading skeleton
  if (isLoading && !recordYearsResponse) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-40" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
        </div>

        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>

        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-8 w-48" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <div className="inline-flex flex-col items-center gap-4 p-8 rounded-lg border border-destructive/20 bg-destructive/5">
          <Calendar className="h-12 w-12 text-destructive" />
          <div>
            <h3 className="font-semibold text-destructive text-lg">
              Error Loading Record Years
            </h3>
            <p className="text-muted-foreground mt-1">
              {(error as Error).message}
            </p>
          </div>
          <Button
            onClick={() =>
              queryClient.invalidateQueries({ queryKey: ["recordYears"] })
            }
            className="mt-2"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  const recordYears = recordYearsResponse?.data || [];
  const paginationData = recordYearsResponse?.pagination || {
    previousPage: null,
    nextPage: null,
    total: 0,
    count: 0,
  };

  const showingFrom = pagination.page * pagination.take + 1;
  const showingTo = Math.min(
    (pagination.page + 1) * pagination.take,
    paginationData.total,
  );

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-3">
            <Calendar className="h-7 w-7 text-primary" />
            Record Years
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage Nepali fiscal years and months for record keeping
          </p>
        </div>
        <Button asChild className="bg-primary hover:bg-primary/90">
          <Link
            href="/admin/dashboard/records/create"
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Create Record Year
          </Link>
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="bg-card rounded-lg border p-4 md:p-6">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Hash className="h-3 w-3" />
                Nepali Year
              </label>
              <Select
                value={nepaliYearFilter}
                onValueChange={(value) => setNepaliYearFilter(value)}
              >
                <SelectTrigger className="cursor-pointer">
                  <SelectValue placeholder="All Years" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem className="cursor-pointer" value="all-years">
                    All Years
                  </SelectItem>
                  {getNepaliYearOptions().map((year) => (
                    <SelectItem
                      className="cursor-pointer"
                      key={year}
                      value={year.toString()}
                    >
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <CalendarDays className="h-3 w-3" />
                Nepali Month
              </label>
              <Select
                value={nepaliMonthFilter}
                onValueChange={(value) => setNepaliMonthFilter(value)}
              >
                <SelectTrigger className="cursor-pointer">
                  <SelectValue placeholder="All Months" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem className="cursor-pointer" value="all-months">
                    All Months
                  </SelectItem>
                  {NEPALI_MONTHS.map((month) => (
                    <SelectItem
                      className="cursor-pointer"
                      key={month.month}
                      value={month.month.toString()}
                    >
                      {month.english} ({month.name})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end gap-2">
              <Button
                onClick={handleApplyFilters}
                className="flex-1 bg-primary hover:bg-primary/90 cursor-pointer"
              >
                <Filter className="h-4 w-4 mr-2" />
                Apply Filters
              </Button>
              <Button
                onClick={handleClearFilters}
                variant="outline"
                className="flex-1 cursor-pointer"
              >
                Clear
              </Button>
            </div>
          </div>

          {(nepaliYearFilter !== "all-year" ||
            nepaliMonthFilter !== "all-months") && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Active filters:</span>
              {nepaliYearFilter !== "all-year" && (
                <Badge variant="secondary" className="gap-1">
                  <Hash className="h-3 w-3" />
                  Year: {nepaliYearFilter}
                </Badge>
              )}
              {nepaliMonthFilter !== "all-months" && (
                <Badge variant="secondary" className="gap-1">
                  <CalendarDays className="h-3 w-3" />
                  Month:{" "}
                  {
                    NEPALI_MONTHS.find(
                      (m) => m.month.toString() === nepaliMonthFilter,
                    )?.english
                  }
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Nepali Year/Month</TableHead>
              <TableHead>Records</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isFetching && recordYears.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"></div>
                    <p className="text-sm text-muted-foreground">
                      Loading record years...
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : recordYears.length > 0 ? (
              recordYears.map((recordYear) => (
                <TableRow
                  key={recordYear.id}
                  className="hover:bg-muted/50 cursor-pointer group"
                  onClick={(e) =>
                    handleRowClick(recordYear.id, recordYear.title, e)
                  }
                >
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-semibold group-hover:text-primary transition-colors">
                          {recordYear.title}
                          <ChevronRight className="h-3 w-3 ml-2 inline opacity-0 group-hover:opacity-100 transition-opacity" />
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {recordYear.nepaliMonthName}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="gap-1">
                          <Hash className="h-3 w-3" />
                          {recordYear.nepaliYear}
                        </Badge>
                        <Badge variant="outline" className="gap-1">
                          <CalendarDays className="h-3 w-3" />
                          {recordYear.nepaliMonth}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {recordYear.nepaliMonthName} ({recordYear.nepaliYear})
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="secondary"
                        className="gap-1 hover:bg-primary/10 transition-colors"
                      >
                        <FileText className="h-3 w-3" />
                        {recordYear.records?.length || 0}
                      </Badge>
                      {recordYear.records && recordYear.records.length > 0 && (
                        <span className="text-xs text-muted-foreground">
                          records
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm">
                      {formatDate(recordYear.createdAt)}
                    </p>
                  </TableCell>
                  <TableCell className="text-right">
                    <div
                      className="flex justify-end gap-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 cursor-pointer"
                        onClick={() =>
                          handleViewRecords(recordYear.id, recordYear.title)
                        }
                        title="View Records"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        asChild
                        title="Edit Year"
                      >
                        <Link
                          href={`/admin/dashboard/records/year/${recordYear.id}/edit`}
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>
                      <DeleteConfirmationDialog
                        onConfirm={() => deleteMutation.mutate(recordYear.id)}
                        title="Delete Record Year"
                        description="Are you sure you want to delete this record year? This action cannot be undone."
                      >
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 cursor-pointer"
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
                    <Calendar className="h-16 w-16 text-muted-foreground opacity-50" />
                    <div>
                      <h3 className="font-semibold text-lg">
                        No Record Years Found
                      </h3>
                      <p className="text-muted-foreground mt-1">
                        {appliedSearchTerm ||
                        nepaliYearFilter !== "all-year" ||
                        nepaliMonthFilter !== "all-months"
                          ? "Try adjusting your search or filters"
                          : "Create your first record year to get started"}
                      </p>
                    </div>
                    {!appliedSearchTerm &&
                      nepaliYearFilter === "all-year" &&
                      nepaliMonthFilter === "all-months" && (
                        <Button asChild className="mt-2">
                          <Link href="/admin/dashboard/records/create">
                            <Plus className="h-4 w-4 mr-2" />
                            Create Record Year
                          </Link>
                        </Button>
                      )}
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {paginationData.total > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium">Show</p>
              <Select
                value={pagination.take.toString()}
                onValueChange={(value) => handlePageSizeChange(Number(value))}
              >
                <SelectTrigger className="h-8 w-[70px]">
                  <SelectValue placeholder={pagination.take} />
                </SelectTrigger>
                <SelectContent side="top">
                  {PAGE_SIZE_OPTIONS.map((size) => (
                    <SelectItem key={size} value={size.toString()}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm font-medium">entries</p>
            </div>
            <p className="text-sm text-muted-foreground">
              Showing {showingFrom} to {showingTo} of {paginationData.total}{" "}
              record years
            </p>
          </div>

          <nav className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(paginationData.previousPage ?? 0)}
              disabled={paginationData.previousPage === null}
            >
              Previous
            </Button>

            {renderPageNumbers()}

            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(paginationData.nextPage ?? 0)}
              disabled={paginationData.nextPage === null}
            >
              Next
            </Button>
          </nav>
        </div>
      )}
    </div>
  );
};

export default RecordYearList;
