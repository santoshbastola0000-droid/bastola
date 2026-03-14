"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  Building2,
  MapPin,
  Users,
  IndianRupee,
  CheckCircle,
  Clock,
  XCircle,
  Eye,
  Edit,
  Plus,
  Search,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  X,
  Loader2,
  Archive,
  AlertCircle,
  Home,
  Grid,
  List,
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
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { RoomDrawer } from "@/components/admin/RoomDrawer";
import { RoomCard } from "@/components/user/rooms/RoomCard";
import { formatNepaliCurrency } from "@/lib/utils";
import {
  RoomStatus,
  RoomCategory,
  RoomFilters,
  Room,
} from "@/types/room.types";
import { roomService } from "@/http/services/room.service";
import {
  useDeleteRoomMutation,
  useUpdateListingStatusMutation,
} from "@/http/mutations/room.mutation";
import Link from "next/link";
import { toast } from "sonner";
import { SUCCESSTOAST, FAILURETOAST } from "@/lib/constants/app.constants";

interface UserRoomListProps {
  initialFilters?: RoomFilters;
}

export function UserRoomList({ initialFilters = {} }: UserRoomListProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  // Search and filters
  const [searchTerm, setSearchTerm] = useState(initialFilters.search || "");
  const [appliedSearchTerm, setAppliedSearchTerm] = useState(
    initialFilters.search || "",
  );
  const [approvalStatusFilter, setApprovalStatusFilter] =
    useState<string>("all");
  const [listingStatusFilter, setListingStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>(
    initialFilters.category || "all",
  );
  const [priceRange, setPriceRange] = useState<{ min?: string; max?: string }>({
    min: initialFilters.minPrice?.toString() || "",
    max: initialFilters.maxPrice?.toString() || "",
  });

  // Pagination
  const [page, setPage] = useState(initialFilters.page || 0);
  const [take, setTake] = useState(initialFilters.take || 12);

  // Room selection
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState<string | null>(null);
  const [showListingDialog, setShowListingDialog] = useState(false);
  const [actionRoom, setActionRoom] = useState<Room | null>(null);
  const [actionStatus, setActionStatus] = useState<RoomStatus | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Active tab for quick filtering
  const [activeTab, setActiveTab] = useState<string>("all");

  const buildFilters = (): RoomFilters => {
    const filters: RoomFilters = {
      page,
      take,
      search: appliedSearchTerm || undefined,
    };

    if (approvalStatusFilter !== "all") {
      filters.approvalStatus = approvalStatusFilter as RoomStatus;
    }

    if (listingStatusFilter !== "all") {
      filters.listingStatus = listingStatusFilter as RoomStatus;
    }

    if (categoryFilter !== "all") {
      filters.category = categoryFilter as RoomCategory;
    }

    if (priceRange.min) {
      filters.minPrice = parseInt(priceRange.min);
    }

    if (priceRange.max) {
      filters.maxPrice = parseInt(priceRange.max);
    }

    return filters;
  };

  // Queries
  const {
    data: roomsResponse,
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ["user-rooms", buildFilters()],
    queryFn: () => roomService.getMyRooms(buildFilters()),
  });

  // Mutations
  const deleteRoomMutation = useDeleteRoomMutation();
  const updateListingMutation = useUpdateListingStatusMutation();

  const handleSearch = () => {
    setAppliedSearchTerm(searchTerm);
    setPage(0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setAppliedSearchTerm("");
    setApprovalStatusFilter("all");
    setListingStatusFilter("all");
    setCategoryFilter("all");
    setPriceRange({ min: "", max: "" });
    setActiveTab("all");
    setPage(0);
  };

  const handleViewRoom = (room: Room) => {
    setSelectedRoom(room);
    setIsDrawerOpen(true);
  };

  const rooms = roomsResponse?.data || [];
  const pagination = roomsResponse?.pagination || {
    page: 0,
    take: 12,
    total: 0,
    count: 0,
    previousPage: null,
    nextPage: null,
  };

  const totalItems = pagination.total || 0;
  const showingFrom = totalItems > 0 ? page * take + 1 : 0;
  const showingTo = Math.min((page + 1) * take, totalItems);
  const totalPages = Math.max(1, Math.ceil(totalItems / take));

  // Stats calculation
  const stats = {
    total: totalItems,
    pending: rooms.filter((r) => r.approvalStatus === RoomStatus.PENDING)
      .length,
    approved: rooms.filter((r) => r.approvalStatus === RoomStatus.APPROVED)
      .length,
    rejected: rooms.filter((r) => r.approvalStatus === RoomStatus.REJECTED)
      .length,
    available: rooms.filter(
      (r) =>
        r.listingStatus === RoomStatus.AVAILABLE &&
        r.approvalStatus === RoomStatus.APPROVED,
    ).length,
    rented: rooms.filter(
      (r) =>
        r.listingStatus === RoomStatus.RENTED &&
        r.approvalStatus === RoomStatus.APPROVED,
    ).length,
    archived: rooms.filter((r) => r.listingStatus === RoomStatus.ARCHIVED)
      .length,
  };

  const renderPageNumbers = () => {
    const pages = [];

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

    const maxVisible = 5;
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

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="h-48 w-full" />
              <CardContent className="p-4 space-y-3">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <div className="grid grid-cols-2 gap-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="p-4 md:p-6 space-y-6 pb-20">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Building2 className="h-7 w-7 text-primary" />
              My Rooms
            </h1>
            <p className="text-gray-600 mt-1">
              Manage all your room listings in one place
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => refetch()}
              disabled={isFetching}
              className="cursor-pointer border-gray-300"
            >
              <RefreshCw
                className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
              />
            </Button>
            <Button
              asChild
              className="bg-primary hover:bg-primary/90 cursor-pointer"
            >
              <Link href="/user/dashboard/rooms/create">
                <Plus className="h-4 w-4 mr-2" />
                List New Room
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3">
          <Card className="border border-gray-200">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">
                    Total
                  </p>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900">
                    {stats.total}
                  </p>
                </div>
                <Building2 className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="border border-yellow-200 bg-yellow-50">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-yellow-700">
                    Pending
                  </p>
                  <p className="text-lg sm:text-2xl font-bold text-yellow-900">
                    {stats.pending}
                  </p>
                </div>
                <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border border-green-200 bg-green-50">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-green-700">
                    Approved
                  </p>
                  <p className="text-lg sm:text-2xl font-bold text-green-900">
                    {stats.approved}
                  </p>
                </div>
                <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border border-red-200 bg-red-50">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-red-700">
                    Rejected
                  </p>
                  <p className="text-lg sm:text-2xl font-bold text-red-900">
                    {stats.rejected}
                  </p>
                </div>
                <XCircle className="h-6 w-6 sm:h-8 sm:w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border border-green-200 bg-green-50">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-green-700">
                    Available
                  </p>
                  <p className="text-lg sm:text-2xl font-bold text-green-900">
                    {stats.available}
                  </p>
                </div>
                <Home className="h-6 w-6 sm:h-8 sm:w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border border-blue-200 bg-blue-50">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-blue-700">
                    Rented
                  </p>
                  <p className="text-lg sm:text-2xl font-bold text-blue-900">
                    {stats.rented}
                  </p>
                </div>
                <Users className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border border-gray-200 bg-gray-50">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">
                    Archived
                  </p>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900">
                    {stats.archived}
                  </p>
                </div>
                <Archive className="h-6 w-6 sm:h-8 sm:w-8 text-gray-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="border border-gray-200">
          <CardContent className="p-4">
            <div className="space-y-4">
              {/* Search Row */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                  <Input
                    placeholder="Search your rooms by title or address..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="pl-9 cursor-text"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => {
                        setSearchTerm("");
                        setAppliedSearchTerm("");
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 cursor-pointer"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleSearch}
                    className="cursor-pointer bg-primary hover:bg-primary/90"
                  >
                    Search
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowFilters(!showFilters)}
                    className="cursor-pointer border-gray-300"
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Filters
                  </Button>
                  <div className="border-l pl-2 flex gap-1">
                    <Button
                      variant={viewMode === "grid" ? "default" : "outline"}
                      size="icon"
                      onClick={() => setViewMode("grid")}
                      className="cursor-pointer"
                    >
                      <Grid className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === "table" ? "default" : "outline"}
                      size="icon"
                      onClick={() => setViewMode("table")}
                      className="cursor-pointer"
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Advanced Filters */}
              {showFilters && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Approval Status
                    </Label>
                    <Select
                      value={approvalStatusFilter}
                      onValueChange={setApprovalStatusFilter}
                    >
                      <SelectTrigger className="cursor-pointer border-gray-300">
                        <SelectValue placeholder="All" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value={RoomStatus.PENDING}>
                          Pending
                        </SelectItem>
                        <SelectItem value={RoomStatus.APPROVED}>
                          Approved
                        </SelectItem>
                        <SelectItem value={RoomStatus.REJECTED}>
                          Rejected
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Listing Status
                    </Label>
                    <Select
                      value={listingStatusFilter}
                      onValueChange={setListingStatusFilter}
                    >
                      <SelectTrigger className="cursor-pointer border-gray-300">
                        <SelectValue placeholder="All" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value={RoomStatus.AVAILABLE}>
                          Available
                        </SelectItem>
                        <SelectItem value={RoomStatus.RENTED}>
                          Rented
                        </SelectItem>
                        <SelectItem value={RoomStatus.ARCHIVED}>
                          Archived
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Category</Label>
                    <Select
                      value={categoryFilter}
                      onValueChange={setCategoryFilter}
                    >
                      <SelectTrigger className="cursor-pointer border-gray-300">
                        <SelectValue placeholder="All" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {Object.values(RoomCategory).map((cat) => (
                          <SelectItem
                            key={cat}
                            value={cat}
                            className="capitalize"
                          >
                            {cat.replace("_", " ")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Price Range (₹)
                    </Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        placeholder="Min"
                        value={priceRange.min}
                        onChange={(e) =>
                          setPriceRange({ ...priceRange, min: e.target.value })
                        }
                        className="cursor-text"
                      />
                      <span>-</span>
                      <Input
                        type="number"
                        placeholder="Max"
                        value={priceRange.max}
                        onChange={(e) =>
                          setPriceRange({ ...priceRange, max: e.target.value })
                        }
                        className="cursor-text"
                      />
                    </div>
                  </div>

                  <div className="flex items-end md:col-span-2 lg:col-span-4">
                    <Button
                      variant="outline"
                      onClick={handleClearFilters}
                      className="cursor-pointer border-gray-300"
                    >
                      Clear All Filters
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Results Summary */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {totalItems > 0 ? (
              <>
                Showing{" "}
                <span className="font-semibold text-gray-900">
                  {showingFrom}
                </span>{" "}
                to{" "}
                <span className="font-semibold text-gray-900">{showingTo}</span>{" "}
                of{" "}
                <span className="font-semibold text-gray-900">
                  {totalItems}
                </span>{" "}
                rooms
              </>
            ) : (
              "No rooms found"
            )}
            {isFetching && (
              <Loader2 className="inline ml-2 h-3 w-3 animate-spin" />
            )}
          </div>
          <div className="flex items-center gap-2">
            <Label
              htmlFor="items-per-page"
              className="text-sm text-gray-600 hidden sm:block"
            >
              Show
            </Label>
            <Select
              value={take.toString()}
              onValueChange={(value) => {
                setTake(parseInt(value));
                setPage(0);
              }}
            >
              <SelectTrigger
                id="items-per-page"
                className="h-8 w-20 cursor-pointer border-gray-300"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[12, 24, 36, 48].map((size) => (
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

        {/* Rooms Display */}
        {rooms.length > 0 ? (
          viewMode === "grid" ? (
            // Grid View
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {rooms.map((room) => (
                <RoomCard
                  key={room.id}
                  room={room}
                  onViewDetails={handleViewRoom}
                />
              ))}
            </div>
          ) : (
            // Table View
            <Card className="border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="font-semibold">Room</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="font-semibold">Price</TableHead>
                      <TableHead className="font-semibold">Category</TableHead>
                      <TableHead className="font-semibold">Location</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rooms.map((room) => (
                      <TableRow key={room.id} className="hover:bg-gray-50">
                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-medium text-gray-900">
                              {room.title}
                            </p>
                            <p className="text-xs text-gray-500">
                              ID: {room.id.slice(0, 8)}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <Badge
                              className={
                                room.approvalStatus === RoomStatus.APPROVED
                                  ? "bg-green-100 text-green-800"
                                  : room.approvalStatus === RoomStatus.PENDING
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-red-100 text-red-800"
                              }
                            >
                              {room.approvalStatus}
                            </Badge>
                            <Badge
                              variant="outline"
                              className={
                                room.listingStatus === RoomStatus.AVAILABLE
                                  ? "border-green-200 text-green-700"
                                  : room.listingStatus === RoomStatus.RENTED
                                    ? "border-blue-200 text-blue-700"
                                    : "border-gray-200 text-gray-700"
                              }
                            >
                              {room.listingStatus}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold flex items-center">
                            <IndianRupee className="h-3 w-3 mr-1" />
                            {formatNepaliCurrency(room.price)}
                          </span>
                        </TableCell>
                        <TableCell className="capitalize">
                          {room.category.replace("_", " ")}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <MapPin className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate max-w-[150px]">
                              {room.address}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 hover:bg-blue-50 hover:text-blue-600"
                              onClick={() => handleViewRoom(room)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 hover:bg-green-50 hover:text-green-600"
                              asChild
                            >
                              <Link
                                href={`/user/dashboard/rooms/${room.id}/edit`}
                              >
                                <Edit className="h-4 w-4" />
                              </Link>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          )
        ) : (
          <Card className="bg-white">
            <CardContent className="py-16 text-center">
              <div className="inline-flex p-4 bg-primary/10 rounded-full mb-4">
                <Building2 className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Rooms Found
              </h3>
              <p className="text-gray-600 max-w-sm mx-auto">
                {appliedSearchTerm ||
                approvalStatusFilter !== "all" ||
                listingStatusFilter !== "all" ||
                categoryFilter !== "all" ||
                priceRange.min ||
                priceRange.max
                  ? "No rooms match your filters. Try adjusting your search criteria."
                  : "You haven't listed any rooms yet. Start by listing your first room!"}
              </p>
              <Button
                asChild
                className="mt-6 bg-primary hover:bg-primary/90 cursor-pointer"
              >
                <Link href="/user/dashboard/rooms/add">
                  <Plus className="h-4 w-4 mr-2" />
                  List Your First Room
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Pagination */}
        {totalItems > 0 && (
          <nav className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-600">
              Page {page + 1} of {totalPages}
            </div>
            <div className="flex items-center gap-2" aria-label="Pagination">
              {renderPageNumbers()}
            </div>
          </nav>
        )}
      </div>

      {/* Room Details Drawer */}
      {selectedRoom && (
        <RoomDrawer
          room={selectedRoom}
          open={isDrawerOpen}
          onOpenChange={setIsDrawerOpen}
        />
      )}

      {/* Listing Action Dialog */}
      <Dialog open={showListingDialog} onOpenChange={setShowListingDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Listing Status</DialogTitle>
            <DialogDescription>
              Are you sure you want to change the listing status?
            </DialogDescription>
          </DialogHeader>

          {actionRoom && actionStatus && (
            <div className="py-4">
              <p className="text-sm">
                Room: <span className="font-medium">{actionRoom.title}</span>
              </p>
              <p className="text-sm mt-2">
                New status:{" "}
                {actionStatus === RoomStatus.AVAILABLE && (
                  <Badge className="bg-green-100 text-green-800 ml-2">
                    Available
                  </Badge>
                )}
                {actionStatus === RoomStatus.RENTED && (
                  <Badge className="bg-blue-100 text-blue-800 ml-2">
                    Rented
                  </Badge>
                )}
                {actionStatus === RoomStatus.ARCHIVED && (
                  <Badge className="bg-gray-100 text-gray-800 ml-2">
                    Archived
                  </Badge>
                )}
              </p>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowListingDialog(false);
                setActionRoom(null);
                setActionStatus(null);
              }}
            >
              Cancel
            </Button>
            <Button disabled={updateListingMutation.isPending}>
              {updateListingMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Confirm"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
