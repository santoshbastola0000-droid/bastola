"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Home,
  Search,
  Building2,
  MapPin,
  User,
  DollarSign,
  Calendar,
  Eye,
  CheckCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  TrendingUp,
  Star,
  Phone,
  Mail,
  Filter,
  XCircle,
} from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { roomService } from "@/http/services/room.service";
import { RoomStatus } from "@/types/room.types";
import { getStatusBadge } from "@/lib/room-utils";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PAGE_SIZE_OPTIONS } from "@/lib/constants/app.constants";

interface RoomFilters {
  page: number;
  take: number;
  search?: string;
  status?: RoomStatus;
}

export default function ApprovedRoomsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [sortBy, setSortBy] = useState<"newest" | "price-high" | "price-low">(
    "newest",
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(0);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const filters: RoomFilters = {
    page,
    take: pageSize,
    search: debouncedSearch || undefined,
    status: RoomStatus.APPROVED, // Filter by approved status
  };

  const {
    data: roomsResponse,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: ["admin-approved-rooms", filters, sortBy],
    queryFn: async () => {
      const response = await roomService.getRooms(filters);

      // Client-side sorting based on selection
      if (sortBy === "price-high") {
        response.data.sort((a: any, b: any) => b.price - a.price);
      } else if (sortBy === "price-low") {
        response.data.sort((a: any, b: any) => a.price - b.price);
      }
      // "newest" is default from API

      return response;
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });

  const handleViewDetails = (roomId: string) => {
    router.push(`/admin/dashboard/rooms/${roomId}`);
  };

  const rooms = roomsResponse?.data || [];
  const pagination = roomsResponse?.pagination || {
    page: 0,
    take: pageSize,
    total: 0,
    count: 0,
    previousPage: null,
    nextPage: null,
  };

  const totalPages = Math.ceil(pagination.total / pageSize);
  const showingFrom = page * pageSize + 1;
  const showingTo = Math.min((page + 1) * pageSize, pagination.total);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      setDebouncedSearch(searchTerm);
      setPage(0);
    }
  };

  // Calculate stats
  const totalRevenue = rooms.reduce((sum, room) => sum + (room.price || 0), 0);
  const avgPrice = rooms.length > 0 ? totalRevenue / rooms.length : 0;

  // Mobile Card View
  const MobileRoomCard = ({ room }: { room: any }) => (
    <div className="bg-white rounded-lg border p-4 space-y-3 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-gradient-to-br from-green-500/20 to-green-500/10 flex-shrink-0">
            <Building2 className="h-6 w-6 text-green-600" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-foreground truncate">
              {room.title}
            </h3>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{room.address}</span>
            </div>
          </div>
        </div>
        <Badge className="bg-green-100 text-green-700 border-0">
          <CheckCircle className="h-3 w-3 mr-1" />
          Approved
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="flex items-center gap-2">
          <DollarSign className="h-3 w-3 text-green-600" />
          <span className="font-medium">{formatCurrency(room.price)}</span>
        </div>
        <div className="flex items-center gap-2">
          <User className="h-3 w-3 text-primary" />
          <span className="truncate">{room.user?.name || "N/A"}</span>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-3 w-3 text-primary" />
          <span>{formatDate(room.createdAt, "short")}</span>
        </div>
        <div className="flex items-center gap-2">
          <Star className="h-3 w-3 text-yellow-500" />
          <span>4.8 (24 reviews)</span>
        </div>
      </div>

      <div className="flex gap-2 pt-2 border-t">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={() => handleViewDetails(room.id)}
        >
          <Eye className="h-4 w-4 mr-1" />
          View Details
        </Button>
        <Button
          variant="default"
          size="sm"
          className="flex-1 bg-primary hover:bg-primary-dark"
          onClick={() =>
            router.push(`/admin/dashboard/wallet?roomId=${room.id}`)
          }
        >
          <TrendingUp className="h-4 w-4 mr-1" />
          Earnings
        </Button>
      </div>
    </div>
  );

  if (isLoading && !roomsResponse) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-green-500/20 animate-ping"></div>
            <Loader2 className="h-12 w-12 animate-spin text-green-500 mx-auto mb-4 relative" />
          </div>
          <p className="text-sm text-muted-foreground">
            Loading approved rooms...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="m-6">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center gap-2">
            <XCircle className="h-5 w-5" />
            Error Loading Rooms
          </CardTitle>
          <CardDescription>
            We couldn't load the approved rooms. Please try again.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            {(error as Error).message}
          </p>
          <Button onClick={() => refetch()} className="cursor-pointer">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-3">
            <CheckCircle className="h-6 w-6 md:h-8 md:w-8 text-green-500" />
            <span>Approved Rooms</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage and monitor all approved room listings
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Tabs value={viewMode} onValueChange={(v: any) => setViewMode(v)}>
            <TabsList className="grid w-[120px] grid-cols-2">
              <TabsTrigger value="table" className="cursor-pointer">
                Table
              </TabsTrigger>
              <TabsTrigger value="grid" className="cursor-pointer">
                Grid
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <Button
            variant="outline"
            onClick={() => refetch()}
            disabled={isFetching}
            className="cursor-pointer"
          >
            {isFetching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Total Rooms</p>
                <h3 className="text-2xl font-bold mt-1">{pagination.total}</h3>
              </div>
              <Building2 className="h-8 w-8 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Value</p>
                <h3 className="text-2xl font-bold mt-1">
                  {formatCurrency(totalRevenue)}
                </h3>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Average Price</p>
                <h3 className="text-2xl font-bold mt-1">
                  {formatCurrency(avgPrice)}
                </h3>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Owners</p>
                <h3 className="text-2xl font-bold mt-1">
                  {new Set(rooms.map((r: any) => r.user?.id)).size}
                </h3>
              </div>
              <User className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters Card */}
      <Card className="shadow-sm">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by title, address, or owner name..."
                className="pl-9 cursor-text w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleKeyDown}
              />
            </div>

            {/* Sort */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                <SelectTrigger className="w-[160px] cursor-pointer">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest" className="cursor-pointer">
                    Newest First
                  </SelectItem>
                  <SelectItem value="price-high" className="cursor-pointer">
                    Price: High to Low
                  </SelectItem>
                  <SelectItem value="price-low" className="cursor-pointer">
                    Price: Low to High
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={() => {
                setSearchTerm("");
                setPage(0);
              }}
              variant="outline"
              className="cursor-pointer w-full sm:w-auto"
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table/Grid View */}
      {viewMode === "table" ? (
        <Card className="shadow-sm">
          <CardContent className="p-0">
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-[300px]">Room Details</TableHead>
                    <TableHead className="w-[200px]">Owner</TableHead>
                    <TableHead className="w-[120px]">Price</TableHead>
                    <TableHead className="w-[100px]">Bookings</TableHead>
                    <TableHead className="w-[100px]">Rating</TableHead>
                    <TableHead className="w-[120px]">Listed Date</TableHead>
                    <TableHead className="w-[100px]">Status</TableHead>
                    <TableHead className="text-right w-[100px]">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rooms.length > 0 ? (
                    rooms.map((room: any) => (
                      <TableRow
                        key={room.id}
                        className="hover:bg-accent/50 transition-colors"
                      >
                        <TableCell>
                          <div className="flex items-start gap-3 min-w-[250px]">
                            <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-gradient-to-br from-green-500/20 to-green-500/10 flex-shrink-0">
                              <Building2 className="h-5 w-5 text-green-600" />
                            </div>
                            <div className="min-w-0">
                              <h3 className="font-semibold text-foreground truncate">
                                {room.title}
                              </h3>
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <MapPin className="h-3 w-3 flex-shrink-0" />
                                <span className="truncate max-w-[200px]">
                                  {room.address}
                                </span>
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-primary/10 text-primary">
                                {room.user?.name?.charAt(0) || "U"}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium">
                                {room.user?.name || "Unknown"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {room.user?.phoneNumber || "N/A"}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold text-primary">
                            {formatCurrency(room.price)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-blue-50">
                            24
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            <span>4.8</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">
                            {formatDate(room.createdAt, "medium")}
                          </span>
                        </TableCell>
                        <TableCell>{getStatusBadge(room.status)}</TableCell>
                        <TableCell className="text-right">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleViewDetails(room.id)}
                                  className="cursor-pointer hover:bg-primary/10"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>View Details</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="h-32 text-center">
                        <div className="flex flex-col items-center justify-center gap-3">
                          <Building2 className="h-12 w-12 text-muted-foreground opacity-50" />
                          <div>
                            <p className="font-medium">No approved rooms</p>
                            <p className="text-sm text-muted-foreground">
                              Rooms that are approved will appear here
                            </p>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ) : (
        // Grid View
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {rooms.length > 0 ? (
            rooms.map((room: any) => (
              <MobileRoomCard key={room.id} room={room} />
            ))
          ) : (
            <Card className="col-span-full">
              <CardContent className="py-12 text-center">
                <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="font-medium">No approved rooms</p>
                <p className="text-sm text-muted-foreground">
                  Rooms that are approved will appear here
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Pagination */}
      {pagination.total > 0 && (
        <Card className="shadow-sm">
          <CardContent className="pt-6">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
              <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground whitespace-nowrap">
                    Show
                  </span>
                  <Select
                    value={pageSize.toString()}
                    onValueChange={(value) => {
                      setPageSize(Number(value));
                      setPage(0);
                    }}
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
                  <span className="text-sm text-muted-foreground whitespace-nowrap">
                    entries
                  </span>
                </div>
                <span className="text-sm text-muted-foreground text-center sm:text-left">
                  Showing {showingFrom} to {showingTo} of {pagination.total}{" "}
                  rooms
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 0}
                  className="cursor-pointer"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="hidden sm:inline ml-1">Previous</span>
                </Button>

                <div className="hidden sm:flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }).map(
                    (_, index) => {
                      const pageNumber =
                        page < 3
                          ? index
                          : page > totalPages - 3
                            ? totalPages - 5 + index
                            : page - 2 + index;

                      if (pageNumber >= 0 && pageNumber < totalPages) {
                        return (
                          <Button
                            key={pageNumber}
                            variant={
                              page === pageNumber ? "default" : "outline"
                            }
                            size="sm"
                            onClick={() => setPage(pageNumber)}
                            className="min-w-[40px] cursor-pointer"
                          >
                            {pageNumber + 1}
                          </Button>
                        );
                      }
                      return null;
                    },
                  )}
                </div>

                <span className="sm:hidden text-sm">
                  Page {page + 1} of {totalPages}
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page >= totalPages - 1}
                  className="cursor-pointer"
                >
                  <span className="hidden sm:inline mr-1">Next</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
