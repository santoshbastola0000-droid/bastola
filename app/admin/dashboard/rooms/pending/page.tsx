"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Home,
  Search,
  Filter,
  Building2,
  MapPin,
  User,
  DollarSign,
  Calendar,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  MoreVertical,
  Loader2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Phone,
  Mail,
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { roomService } from "@/http/services/room.service";
import { RoomStatus } from "@/types/room.types";
import { getStatusBadge } from "@/lib/room-utils";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  SUCCESSTOAST,
  FAILURETOAST,
  PAGE_SIZE_OPTIONS,
} from "@/lib/constants/app.constants";

interface RoomFilters {
  page: number;
  take: number;
  search?: string;
  status?: RoomStatus;
}

export default function PendingRoomsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<RoomStatus>(RoomStatus.APPROVED);
  const [rejectionReason, setRejectionReason] = useState("");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

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
    status: RoomStatus.PENDING, // Filter by pending status
  };

  const {
    data: roomsResponse,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: ["admin-pending-rooms", filters],
    queryFn: async () => await roomService.getRooms(filters), // Using the same API with status filter
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });

  // Update room status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({
      id,
      status,
      reason,
    }: {
      id: string;
      status: RoomStatus;
      reason?: string;
    }) => roomService.updateRoomStatus(id, status, reason),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-pending-rooms"] });
      queryClient.invalidateQueries({ queryKey: ["admin-approved-rooms"] });
      queryClient.invalidateQueries({ queryKey: ["room-stats"] });

      toast.success(
        newStatus === RoomStatus.APPROVED
          ? "Room approved successfully"
          : "Room rejected successfully",
        { style: { background: SUCCESSTOAST, color: "#fff" } },
      );

      setStatusDialogOpen(false);
      setSelectedRoom(null);
      setRejectionReason("");
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Failed to update room status",
        {
          style: { background: FAILURETOAST, color: "#fff" },
        },
      );
    },
  });

  const handleStatusChange = (room: any, status: RoomStatus) => {
    setSelectedRoom(room);
    setNewStatus(status);

    if (status === RoomStatus.REJECTED) {
      setStatusDialogOpen(true);
    } else {
      // Direct approval without reason
      updateStatusMutation.mutate({
        id: room.id,
        status,
      });
    }
  };

  const handleRejectConfirm = () => {
    if (!rejectionReason.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }

    updateStatusMutation.mutate({
      id: selectedRoom.id,
      status: RoomStatus.REJECTED,
      reason: rejectionReason,
    });
  };

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

  // Mobile Card View
  const MobileRoomCard = ({ room }: { room: any }) => (
    <div className="bg-white rounded-lg border p-4 space-y-3 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex-shrink-0">
            <Building2 className="h-6 w-6 text-primary" />
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 cursor-pointer"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => handleViewDetails(room.id)}
              className="cursor-pointer"
            >
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleStatusChange(room, RoomStatus.APPROVED)}
              className="cursor-pointer text-green-600"
              disabled={updateStatusMutation.isPending}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Approve
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleStatusChange(room, RoomStatus.REJECTED)}
              className="cursor-pointer text-red-600"
              disabled={updateStatusMutation.isPending}
            >
              <XCircle className="mr-2 h-4 w-4" />
              Reject
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="flex items-center gap-2">
          <DollarSign className="h-3 w-3 text-primary" />
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
        <div className="flex justify-end">{getStatusBadge(room.status)}</div>
      </div>

      <div className="flex gap-2 pt-2 border-t">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => handleViewDetails(room.id)}
              >
                <Eye className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>View Details</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="default"
                size="sm"
                className="flex-1 bg-green-600 hover:bg-green-700"
                onClick={() => handleStatusChange(room, RoomStatus.APPROVED)}
                disabled={updateStatusMutation.isPending}
              >
                <CheckCircle className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Approve Room</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="destructive"
                size="sm"
                className="flex-1"
                onClick={() => handleStatusChange(room, RoomStatus.REJECTED)}
                disabled={updateStatusMutation.isPending}
              >
                <XCircle className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Reject Room</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );

  if (isLoading && !roomsResponse) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-yellow-500/20 animate-ping"></div>
            <Loader2 className="h-12 w-12 animate-spin text-yellow-500 mx-auto mb-4 relative" />
          </div>
          <p className="text-sm text-muted-foreground">
            Loading pending rooms...
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
            We couldn't load the pending rooms. Please try again.
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
            <Clock className="h-6 w-6 md:h-8 md:w-8 text-yellow-500" />
            <span>Pending Room Approvals</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Review and approve rooms listed by users
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

      {/* Rooms Count Card */}
      <Card className="shadow-sm bg-yellow-50/50 border-yellow-200">
        <CardContent className="py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <span className="font-medium text-yellow-700">
                {pagination.total} room{pagination.total !== 1 ? "s" : ""}{" "}
                pending approval
              </span>
            </div>
            {isFetching && (
              <span className="flex items-center gap-1 text-xs text-yellow-600">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>Refreshing...</span>
              </span>
            )}
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
                    <TableHead className="w-[200px]">
                      Owner Information
                    </TableHead>
                    <TableHead className="w-[120px]">Price</TableHead>
                    <TableHead className="w-[120px]">Listed Date</TableHead>
                    <TableHead className="w-[100px]">Status</TableHead>
                    <TableHead className="text-right w-[200px]">
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
                            <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex-shrink-0">
                              <Building2 className="h-5 w-5 text-primary" />
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
                              {room.category && (
                                <Badge
                                  variant="outline"
                                  className="mt-1 text-xs"
                                >
                                  {room.category}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8 ring-2 ring-primary/20">
                              <AvatarFallback className="bg-primary/10 text-primary">
                                {room.user?.name?.charAt(0) || "U"}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium">
                                {room.user?.name || "Unknown"}
                              </p>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Phone className="h-3 w-3" />
                                <span>{room.user?.phoneNumber || "N/A"}</span>
                              </div>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Mail className="h-3 w-3" />
                                <span className="truncate max-w-[120px]">
                                  {room.user?.email || "N/A"}
                                </span>
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold text-primary">
                            {formatCurrency(room.price)}
                          </span>
                          <p className="text-xs text-muted-foreground">
                            per month
                          </p>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">
                              {formatDate(room.createdAt, "medium")}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(room.status)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
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

                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="default"
                                    size="sm"
                                    className="bg-green-600 hover:bg-green-700"
                                    onClick={() =>
                                      handleStatusChange(
                                        room,
                                        RoomStatus.APPROVED,
                                      )
                                    }
                                    disabled={updateStatusMutation.isPending}
                                  >
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Approve
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  Approve this room
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>

                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() =>
                                      handleStatusChange(
                                        room,
                                        RoomStatus.REJECTED,
                                      )
                                    }
                                    disabled={updateStatusMutation.isPending}
                                  >
                                    <XCircle className="h-4 w-4 mr-1" />
                                    Reject
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  Reject this room
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center">
                        <div className="flex flex-col items-center justify-center gap-3">
                          <CheckCircle className="h-12 w-12 text-green-500 opacity-50" />
                          <div>
                            <p className="font-medium">No pending rooms</p>
                            <p className="text-sm text-muted-foreground">
                              All rooms have been reviewed. Check back later.
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
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3 opacity-50" />
                <p className="font-medium">No pending rooms</p>
                <p className="text-sm text-muted-foreground">
                  All rooms have been reviewed. Check back later.
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

      {/* Rejection Dialog */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <XCircle className="h-5 w-5" />
              Reject Room
            </DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this room. This will be sent
              to the owner.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {selectedRoom && (
              <div className="bg-muted/50 p-3 rounded-lg border">
                <p className="text-sm font-medium">{selectedRoom.title}</p>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <User className="h-3 w-3" />
                  Owner: {selectedRoom.user?.name}
                </p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  {selectedRoom.user?.email}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="reason" className="text-sm font-medium">
                Rejection Reason <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="reason"
                placeholder="Explain why this room is being rejected..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                This reason will be visible to the room owner.
              </p>
            </div>
          </div>

          <DialogFooter className="sm:justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setStatusDialogOpen(false);
                setRejectionReason("");
              }}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectConfirm}
              disabled={
                updateStatusMutation.isPending || !rejectionReason.trim()
              }
              className="cursor-pointer"
            >
              {updateStatusMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Rejecting...
                </>
              ) : (
                "Confirm Rejection"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
