"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  Building2,
  MapPin,
  Users,
  Bath,
  Bed,
  DollarSign,
  CheckCircle,
  Clock,
  XCircle,
  Eye,
  Edit,
  Trash2,
  Plus,
  Search,
  Filter,
  Phone,
  Mail,
  Wifi,
  Car,
  Snowflake,
  Tv,
  Utensils,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  X,
  Loader2,
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
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { RoomDrawer } from "./RoomDrawer";
import { formatPrice, formatDate } from "@/lib/utils";
import {
  RoomStatus,
  RoomCategory,
  RoomFilters,
  Room,
} from "@/types/room.types";
import { roomService } from "@/http/services/room.service";
import {
  useDeleteRoomMutation,
  useUpdateRoomStatusMutation,
} from "@/http/mutations/room.mutation";
import { Label } from "@/components/ui/label";
import { PAGE_SIZE_OPTIONS } from "@/lib/constants/app.constants";
import Link from "next/link";

const getStatusBadge = (status: RoomStatus) => {
  switch (status) {
    case RoomStatus.AVAILABLE:
      return (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200 gap-1 cursor-default">
          <CheckCircle className="h-3 w-3" />
          Available
        </Badge>
      );
    case RoomStatus.PENDING:
      return (
        <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-200 gap-1 cursor-default">
          <Clock className="h-3 w-3" />
          Pending
        </Badge>
      );
    case RoomStatus.OCCUPIED:
      return (
        <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200 gap-1 cursor-default">
          <Users className="h-3 w-3" />
          Occupied
        </Badge>
      );
    case RoomStatus.RENTED:
      return (
        <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100 border-purple-200 gap-1 cursor-default">
          <CheckCircle className="h-3 w-3" />
          Rented
        </Badge>
      );
    case RoomStatus.REJECTED:
      return (
        <Badge className="bg-red-100 text-red-800 hover:bg-red-100 border-red-200 gap-1 cursor-default">
          <XCircle className="h-3 w-3" />
          Rejected
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="cursor-default">
          {status}
        </Badge>
      );
  }
};

const getCategoryIcon = (category: RoomCategory) => {
  switch (category) {
    case RoomCategory.APARTMENT:
      return <Building2 className="h-4 w-4" />;
    case RoomCategory.STUDIO:
      return <Building2 className="h-4 w-4" />;
    case RoomCategory.HOSTEL:
      return <Users className="h-4 w-4" />;
    case RoomCategory.PG:
      return <Users className="h-4 w-4" />;
    case RoomCategory.SINGLE:
      return <Bed className="h-4 w-4" />;
    case RoomCategory.SHARED:
      return <Users className="h-4 w-4" />;
    default:
      return <Building2 className="h-4 w-4" />;
  }
};

const getAmenityIcon = (amenity: string) => {
  switch (amenity.toLowerCase()) {
    case "wifi":
      return <Wifi className="h-3 w-3" />;
    case "ac":
      return <Snowflake className="h-3 w-3" />;
    case "parking":
      return <Car className="h-3 w-3" />;
    case "tv":
      return <Tv className="h-3 w-3" />;
    case "kitchen":
      return <Utensils className="h-3 w-3" />;
    default:
      return null;
  }
};

interface RoomListProps {
  initialFilters?: RoomFilters;
}

export function RoomList({ initialFilters = {} }: RoomListProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Filter states
  const [searchTerm, setSearchTerm] = useState(initialFilters.search || "");
  const [appliedSearchTerm, setAppliedSearchTerm] = useState(
    initialFilters.search || "",
  );
  const [statusFilter, setStatusFilter] = useState<string>(
    initialFilters.status || "all",
  );
  const [categoryFilter, setCategoryFilter] = useState<string>(
    initialFilters.category || "all",
  );
  const [priceRange, setPriceRange] = useState<{ min?: number; max?: number }>({
    min: initialFilters.minPrice,
    max: initialFilters.maxPrice,
  });
  const [allowsWomen, setAllowsWomen] = useState<string>(
    initialFilters.allowsWomen !== undefined
      ? initialFilters.allowsWomen.toString()
      : "all",
  );
  const [ownerLivesInHouse, setOwnerLivesInHouse] = useState<string>(
    initialFilters.ownerLivesInHouse !== undefined
      ? initialFilters.ownerLivesInHouse.toString()
      : "all",
  );

  // Pagination states
  const [page, setPage] = useState(initialFilters.page || 0);
  const [take, setTake] = useState(initialFilters.take || 10);

  // UI states
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Build filters for API
  const buildFilters = (): RoomFilters => {
    const filters: RoomFilters = {
      page,
      take,
      search: appliedSearchTerm || undefined,
    };

    if (statusFilter !== "all") {
      filters.status = statusFilter as RoomStatus;
    }

    if (categoryFilter !== "all") {
      filters.category = categoryFilter as RoomCategory;
    }

    if (priceRange.min !== undefined) {
      filters.minPrice = priceRange.min;
    }

    if (priceRange.max !== undefined) {
      filters.maxPrice = priceRange.max;
    }

    if (allowsWomen !== "all") {
      filters.allowsWomen = allowsWomen === "true";
    }

    if (ownerLivesInHouse !== "all") {
      filters.ownerLivesInHouse = ownerLivesInHouse === "true";
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
    queryKey: ["rooms", buildFilters()],
    queryFn: () => roomService.getRooms(buildFilters()),
  });

  // Mutations
  const deleteRoomMutation = useDeleteRoomMutation();
  const updateStatusMutation = useUpdateRoomStatusMutation();

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
    setStatusFilter("all");
    setCategoryFilter("all");
    setPriceRange({});
    setAllowsWomen("all");
    setOwnerLivesInHouse("all");
    setPage(0);
  };

  const handleViewRoom = (room: Room) => {
    setSelectedRoom(room);
    setIsDrawerOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setRoomToDelete(id);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!roomToDelete) return;
    await deleteRoomMutation.mutateAsync(roomToDelete);
    setShowDeleteDialog(false);
    setRoomToDelete(null);
  };

  const handleStatusChange = async (id: string, status: RoomStatus) => {
    await updateStatusMutation.mutateAsync({ id, status });
  };

  const rooms = roomsResponse?.data || [];
  const pagination = roomsResponse?.pagination || {
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

  // Stats calculation
  const stats = {
    total: totalItems,
    available: rooms.filter((r) => r.status === RoomStatus.AVAILABLE).length,
    occupied: rooms.filter((r) => r.status === RoomStatus.OCCUPIED).length,
    pending: rooms.filter((r) => r.status === RoomStatus.PENDING).length,
    rented: rooms.filter((r) => r.status === RoomStatus.RENTED).length,
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
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Building2 className="h-7 w-7 text-primary" />
              Rooms Management
            </h1>
            <p className="text-gray-600 mt-1">
              Manage all room listings and approvals
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
              <Link href="/admin/dashboard/rooms/create">
                <Plus className="h-4 w-4 mr-2" />
                Add New Room
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="border border-gray-200">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">Total Rooms</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.total}
                </p>
              </div>
              <Building2 className="h-8 w-8 text-gray-400" />
            </CardContent>
          </Card>
          <Card className="border border-green-200 bg-green-50">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">Available</p>
                <p className="text-2xl font-bold text-green-900">
                  {stats.available}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </CardContent>
          </Card>
          <Card className="border border-blue-200 bg-blue-50">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">Occupied</p>
                <p className="text-2xl font-bold text-blue-900">
                  {stats.occupied}
                </p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </CardContent>
          </Card>
          <Card className="border border-yellow-200 bg-yellow-50">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-700">Pending</p>
                <p className="text-2xl font-bold text-yellow-900">
                  {stats.pending}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </CardContent>
          </Card>
          <Card className="border border-purple-200 bg-purple-50">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700">Rented</p>
                <p className="text-2xl font-bold text-purple-900">
                  {stats.rented}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-purple-500" />
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="border border-gray-200">
          <CardContent className="p-4 md:p-6">
            <div className="space-y-4">
              {/* Search Row */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                  <Input
                    placeholder="Search rooms by title or address..."
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
                </div>
              </div>

              {/* Advanced Filters */}
              {showFilters && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Status</Label>
                    <Select
                      value={statusFilter}
                      onValueChange={setStatusFilter}
                    >
                      <SelectTrigger className="cursor-pointer border-gray-300">
                        <SelectValue placeholder="All Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all" className="cursor-pointer">
                          All Status
                        </SelectItem>
                        <SelectItem
                          value={RoomStatus.AVAILABLE}
                          className="cursor-pointer"
                        >
                          Available
                        </SelectItem>
                        <SelectItem
                          value={RoomStatus.PENDING}
                          className="cursor-pointer"
                        >
                          Pending
                        </SelectItem>
                        <SelectItem
                          value={RoomStatus.OCCUPIED}
                          className="cursor-pointer"
                        >
                          Occupied
                        </SelectItem>
                        <SelectItem
                          value={RoomStatus.RENTED}
                          className="cursor-pointer"
                        >
                          Rented
                        </SelectItem>
                        <SelectItem
                          value={RoomStatus.REJECTED}
                          className="cursor-pointer"
                        >
                          Rejected
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
                        <SelectValue placeholder="All Categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all" className="cursor-pointer">
                          All Categories
                        </SelectItem>
                        {Object.values(RoomCategory).map((cat) => (
                          <SelectItem
                            key={cat}
                            value={cat}
                            className="cursor-pointer capitalize"
                          >
                            {cat.replace("_", " ")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Price Range</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        placeholder="Min"
                        value={priceRange.min || ""}
                        onChange={(e) =>
                          setPriceRange({
                            ...priceRange,
                            min: e.target.value
                              ? Number(e.target.value)
                              : undefined,
                          })
                        }
                        className="cursor-text"
                      />
                      <span>-</span>
                      <Input
                        type="number"
                        placeholder="Max"
                        value={priceRange.max || ""}
                        onChange={(e) =>
                          setPriceRange({
                            ...priceRange,
                            max: e.target.value
                              ? Number(e.target.value)
                              : undefined,
                          })
                        }
                        className="cursor-text"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Women Allowed</Label>
                    <Select value={allowsWomen} onValueChange={setAllowsWomen}>
                      <SelectTrigger className="cursor-pointer border-gray-300">
                        <SelectValue placeholder="All" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all" className="cursor-pointer">
                          All
                        </SelectItem>
                        <SelectItem value="true" className="cursor-pointer">
                          Yes
                        </SelectItem>
                        <SelectItem value="false" className="cursor-pointer">
                          No
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Owner Lives In House
                    </Label>
                    <Select
                      value={ownerLivesInHouse}
                      onValueChange={setOwnerLivesInHouse}
                    >
                      <SelectTrigger className="cursor-pointer border-gray-300">
                        <SelectValue placeholder="All" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all" className="cursor-pointer">
                          All
                        </SelectItem>
                        <SelectItem value="true" className="cursor-pointer">
                          Yes
                        </SelectItem>
                        <SelectItem value="false" className="cursor-pointer">
                          No
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-end">
                    <Button
                      variant="outline"
                      onClick={handleClearFilters}
                      className="cursor-pointer border-gray-300"
                    >
                      Clear Filters
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
            <Label htmlFor="items-per-page" className="text-sm text-gray-600">
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

        {/* Table */}
        <Card className="border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-semibold text-gray-700">
                    Room Details
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700">
                    Capacity & Facilities
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700">
                    Location & Contact
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700">
                    Status & Price
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700 text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isFetching && rooms.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                    </TableCell>
                  </TableRow>
                ) : rooms.length > 0 ? (
                  rooms.map((room) => (
                    <TableRow key={room.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            {getCategoryIcon(room.category)}
                            <span className="text-sm font-medium text-gray-500 capitalize">
                              {room.category.replace("_", " ")}
                            </span>
                          </div>
                          <h3 className="font-semibold text-gray-900">
                            {room.title}
                          </h3>
                          <p className="text-sm text-gray-500 line-clamp-2">
                            {room.description}
                          </p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {room.amenities?.slice(0, 3).map((amenity) => (
                              <Badge
                                key={amenity}
                                variant="outline"
                                className="text-xs gap-1 cursor-default"
                              >
                                {getAmenityIcon(amenity)}
                                {amenity}
                              </Badge>
                            ))}
                            {room.amenities?.length > 3 && (
                              <Badge
                                variant="outline"
                                className="text-xs cursor-default"
                              >
                                +{room.amenities.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-2">
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-gray-500" />
                              <span>{room.roomCapacity} persons</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Bath className="h-4 w-4 text-gray-500" />
                              <span>{room.bathroomCapacity} bath</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Bed className="h-4 w-4 text-gray-500" />
                              <span>{room.floorNumber} floor</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-gray-500" />
                              <span>{room.roomArea} m²</span>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs text-gray-500">
                              House capacity: {room.totalHouseCapacity}
                            </p>
                            <p className="text-xs text-gray-500">
                              Occupied: {room.currentOccupants} /{" "}
                              {room.roomCapacity}
                            </p>
                            <Badge
                              variant={room.allowsWomen ? "default" : "outline"}
                              className={
                                room.allowsWomen
                                  ? "bg-green-100 text-green-800 border-green-200 cursor-default"
                                  : "cursor-default"
                              }
                            >
                              {room.allowsWomen
                                ? "Women Allowed"
                                : "Women Not Allowed"}
                            </Badge>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-2">
                          <div className="flex items-start gap-2 text-sm">
                            <MapPin className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                            <span className="line-clamp-2">{room.address}</span>
                          </div>
                          {room.contactPerson && (
                            <div className="flex items-center gap-2 text-sm">
                              <Users className="h-3 w-3 text-gray-500" />
                              <span>{room.contactPerson}</span>
                            </div>
                          )}
                          {room.contactPhone && (
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="h-3 w-3 text-gray-500" />
                              <a
                                href={`tel:${room.contactPhone}`}
                                className="text-blue-600 hover:underline cursor-pointer"
                              >
                                {room.contactPhone}
                              </a>
                            </div>
                          )}
                          {room.contactEmail && (
                            <div className="flex items-center gap-2 text-sm">
                              <Mail className="h-3 w-3 text-gray-500" />
                              <a
                                href={`mailto:${room.contactEmail}`}
                                className="text-blue-600 hover:underline cursor-pointer"
                              >
                                {room.contactEmail}
                              </a>
                            </div>
                          )}
                          {room.location?.city && (
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <MapPin className="h-3 w-3" />
                              {room.location.city}, {room.location.country}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-3">
                          <div>{getStatusBadge(room.status)}</div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-4 w-4 text-gray-500" />
                              <span className="font-bold text-lg text-gray-900">
                                {formatPrice(room.price)}
                              </span>
                              <span className="text-sm text-gray-500">
                                /month
                              </span>
                            </div>
                            <p className="text-xs text-gray-500">
                              Added: {formatDate(room.createdAt)}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-blue-50 hover:text-blue-600 cursor-pointer"
                            onClick={() => handleViewRoom(room)}
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
                              href={`/admin/dashboard/rooms/${room.id}/edit`}
                            >
                              <Edit className="h-4 w-4" />
                            </Link>
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 hover:bg-red-50 hover:text-red-600 cursor-pointer"
                                title="More actions"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                className="text-red-600 cursor-pointer"
                                onClick={() => handleDeleteClick(room.id)}
                              >
                                Delete Room
                              </DropdownMenuItem>
                              {room.status === RoomStatus.PENDING && (
                                <>
                                  <DropdownMenuItem
                                    className="text-green-600 cursor-pointer"
                                    onClick={() =>
                                      handleStatusChange(
                                        room.id,
                                        RoomStatus.AVAILABLE,
                                      )
                                    }
                                  >
                                    Approve Room
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="text-red-600 cursor-pointer"
                                    onClick={() =>
                                      handleStatusChange(
                                        room.id,
                                        RoomStatus.REJECTED,
                                      )
                                    }
                                  >
                                    Reject Room
                                  </DropdownMenuItem>
                                </>
                              )}
                              {room.status === RoomStatus.AVAILABLE && (
                                <DropdownMenuItem
                                  className="text-blue-600 cursor-pointer"
                                  onClick={() =>
                                    handleStatusChange(
                                      room.id,
                                      RoomStatus.OCCUPIED,
                                    )
                                  }
                                >
                                  Mark as Occupied
                                </DropdownMenuItem>
                              )}
                              {room.status === RoomStatus.OCCUPIED && (
                                <DropdownMenuItem
                                  className="text-purple-600 cursor-pointer"
                                  onClick={() =>
                                    handleStatusChange(
                                      room.id,
                                      RoomStatus.RENTED,
                                    )
                                  }
                                >
                                  Mark as Rented
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-64 text-center">
                      <div className="flex flex-col items-center justify-center gap-4">
                        <Building2 className="h-16 w-16 text-gray-300" />
                        <div>
                          <h3 className="font-semibold text-lg text-gray-700">
                            No Rooms Found
                          </h3>
                          <p className="text-gray-500 mt-1">
                            {appliedSearchTerm ||
                            statusFilter !== "all" ||
                            categoryFilter !== "all"
                              ? "No rooms match your filters"
                              : "Start by adding your first room"}
                          </p>
                        </div>
                        <Button
                          asChild
                          className="mt-2 bg-primary hover:bg-primary/90 cursor-pointer"
                        >
                          <Link href="/admin/dashboard/rooms/create">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Room
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              room and remove it from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setShowDeleteDialog(false);
                setRoomToDelete(null);
              }}
              className="cursor-pointer"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="cursor-pointer bg-red-600 hover:bg-red-700 text-white"
              disabled={deleteRoomMutation.isPending}
            >
              {deleteRoomMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Room"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
