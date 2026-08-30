"use client";

import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Building2,
  MapPin,
  Users,
  Bath,
  Bed,
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
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  X,
  Loader2,
  Archive,
  AlertCircle,
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
  DropdownMenuSeparator,
  DropdownMenuLabel,
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
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/utils";
import {
  RoomStatus,
  RoomCategory,
  RoomFilters,
  Room,
} from "@/types/room.types";
import { roomService } from "@/http/services/room.service";
import {
  useDeleteRoomMutation,
  useUpdateApprovalStatusMutation,
  useUpdateListingStatusMutation,
} from "@/http/mutations/room.mutation";
import Link from "next/link";
import {
  ApprovalStatusBadge,
  getAmenityIcon,
  getCategoryIcon,
  ListingStatusBadge,
} from "./StatusBadge";

const formatNPR = (amount: number) => `रु. ${amount.toLocaleString("ne-NP")}`;

const getAllowedListingTransitions = (
  approvalStatus: RoomStatus,
  listingStatus: RoomStatus,
): RoomStatus[] => {
  if (approvalStatus !== RoomStatus.APPROVED) return [];
  const transitions: Record<string, RoomStatus[]> = {
    [RoomStatus.AVAILABLE]: [RoomStatus.RENTED, RoomStatus.ARCHIVED],
    [RoomStatus.RENTED]: [RoomStatus.AVAILABLE, RoomStatus.ARCHIVED],
    [RoomStatus.ARCHIVED]: [RoomStatus.AVAILABLE],
  };
  return transitions[listingStatus] ?? [];
};

interface RoomListProps {
  initialFilters?: RoomFilters;
}

export function RoomList({ initialFilters = {} }: RoomListProps) {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState(initialFilters.search || "");
  const [appliedSearchTerm, setAppliedSearchTerm] = useState(initialFilters.search || "");
  const [approvalStatusFilter, setApprovalStatusFilter] = useState<string>("all");
  const [listingStatusFilter, setListingStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>(initialFilters.category || "all");
  const [priceRange, setPriceRange] = useState<{ min?: number; max?: number }>({
    min: initialFilters.minPrice,
    max: initialFilters.maxPrice,
  });
  const [allowsWomen, setAllowsWomen] = useState<string>(
    initialFilters.allowsWomen !== undefined ? initialFilters.allowsWomen.toString() : "all",
  );
  const [ownerLivesInHouse, setOwnerLivesInHouse] = useState<string>(
    initialFilters.ownerLivesInHouse !== undefined
      ? initialFilters.ownerLivesInHouse.toString()
      : "all",
  );
  const [page, setPage] = useState(initialFilters.page || 0);
  const [take] = useState(initialFilters.take || 10);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState<string | null>(null);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [showListingDialog, setShowListingDialog] = useState(false);
  const [actionRoom, setActionRoom] = useState<Room | null>(null);
  const [actionStatus, setActionStatus] = useState<RoomStatus | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const buildFilters = (): RoomFilters => {
    const filters: RoomFilters = { page, take, search: appliedSearchTerm || undefined, includeAll: true };
    if (approvalStatusFilter !== "all") filters.approvalStatus = approvalStatusFilter as RoomStatus;
    if (listingStatusFilter !== "all") filters.listingStatus = listingStatusFilter as RoomStatus;
    if (categoryFilter !== "all") filters.category = categoryFilter as RoomCategory;
    if (priceRange.min !== undefined) filters.minPrice = priceRange.min;
    if (priceRange.max !== undefined) filters.maxPrice = priceRange.max;
    if (allowsWomen !== "all") filters.allowsWomen = allowsWomen === "true";
    if (ownerLivesInHouse !== "all") filters.ownerLivesInHouse = ownerLivesInHouse === "true";
    return filters;
  };

  const currentFilters = buildFilters();

  const {
    data: roomsResponse,
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ["rooms", currentFilters],
    queryFn: () => roomService.getRooms(currentFilters),
    refetchOnWindowFocus: true,
    refetchOnMount: "always",
    staleTime: 0,
  });

  const { data: roomStatsResponse } = useQuery({
    queryKey: ["room-stats"],
    queryFn: () => roomService.getRoomStats(),
    refetchOnWindowFocus: true,
    refetchOnMount: "always",
    staleTime: 0,
  });

  const deleteRoomMutation = useDeleteRoomMutation();
  const updateApprovalMutation = useUpdateApprovalStatusMutation();
  const updateListingMutation = useUpdateListingStatusMutation();

  const invalidateRooms = () => {
    queryClient.invalidateQueries({ queryKey: ["rooms"] });
    queryClient.invalidateQueries({ queryKey: ["room-stats"] });
  };

  const handleSearch = () => {
    setAppliedSearchTerm(searchTerm);
    setPage(0);
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setAppliedSearchTerm("");
    setApprovalStatusFilter("all");
    setListingStatusFilter("all");
    setCategoryFilter("all");
    setPriceRange({});
    setAllowsWomen("all");
    setOwnerLivesInHouse("all");
    setPage(0);
  };

  const handleDeleteConfirm = async () => {
    if (!roomToDelete) return;
    await deleteRoomMutation.mutateAsync(roomToDelete);
    setShowDeleteDialog(false);
    setRoomToDelete(null);
    invalidateRooms();
  };

  const handleApprovalAction = (
    room: Room,
    status: RoomStatus.APPROVED | RoomStatus.REJECTED,
  ) => {
    setActionRoom(room);
    setActionStatus(status);
    if (status === RoomStatus.REJECTED) setShowApprovalDialog(true);
    else updateApprovalMutation.mutate({ id: room.id, status }, { onSuccess: invalidateRooms });
  };

  const confirmApprovalAction = () => {
    if (!actionRoom || !actionStatus) return;
    if (actionStatus === RoomStatus.REJECTED && !rejectionReason.trim()) return;
    updateApprovalMutation.mutate(
      {
        id: actionRoom.id,
        status: actionStatus as RoomStatus.APPROVED | RoomStatus.REJECTED,
        reason: rejectionReason,
      },
      {
        onSuccess: () => {
          invalidateRooms();
          setShowApprovalDialog(false);
          setActionRoom(null);
          setActionStatus(null);
          setRejectionReason("");
        },
      },
    );
  };

  const confirmListingAction = () => {
    if (!actionRoom || !actionStatus) return;
    updateListingMutation.mutate(
      {
        id: actionRoom.id,
        status: actionStatus as RoomStatus.AVAILABLE | RoomStatus.RENTED | RoomStatus.ARCHIVED,
      },
      {
        onSuccess: () => {
          invalidateRooms();
          setShowListingDialog(false);
          setActionRoom(null);
          setActionStatus(null);
        },
      },
    );
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
  const totalPages = Math.max(1, Math.ceil(totalItems / take));
  const stats = roomStatsResponse?.data;

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <Skeleton className="h-10 w-48" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="p-4 md:p-6 space-y-6 pb-20">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Building2 className="h-7 w-7 text-primary" />
              Rooms Management
            </h1>
            <p className="text-gray-600 mt-1">Newest rooms appear first, including pending listings.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
            </Button>
            <Button asChild>
              <Link href="/admin/dashboard/rooms/create">
                <Plus className="h-4 w-4 mr-2" /> Add New Room
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-7 gap-3">
          {[
            ["Total", stats?.total ?? totalItems, Building2],
            ["Approved", stats?.approved ?? 0, CheckCircle],
            ["Pending", stats?.pendingApproval ?? 0, Clock],
            ["Rejected", stats?.rejected ?? 0, XCircle],
            ["Available", stats?.available ?? 0, CheckCircle],
            ["Rented", stats?.rented ?? 0, Users],
            ["Archived", stats?.archived ?? 0, Archive],
          ].map(([label, value, Icon]: any) => (
            <Card key={label}>
              <CardContent className="p-3 sm:p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium">{label}</p>
                  <p className="text-lg sm:text-2xl font-bold">{value}</p>
                </div>
                <Icon className="h-6 w-6 sm:h-8 sm:w-8 text-gray-500" />
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardContent className="p-4 md:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  placeholder="Search by title or address..."
                  className="pl-9"
                />
                {searchTerm && (
                  <button
                    onClick={() => {
                      setSearchTerm("");
                      setAppliedSearchTerm("");
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <Button onClick={handleSearch}>Search</Button>
              <Button variant="outline" onClick={() => setShowFilters((v) => !v)}>
                <Filter className="h-4 w-4 mr-2" /> Filters
              </Button>
              <Button variant="ghost" onClick={handleClearFilters}>Clear</Button>
            </div>

            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                <Select value={approvalStatusFilter} onValueChange={(v) => { setApprovalStatusFilter(v); setPage(0); }}>
                  <SelectTrigger><SelectValue placeholder="Approval status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All approval statuses</SelectItem>
                    <SelectItem value={RoomStatus.PENDING}>Pending</SelectItem>
                    <SelectItem value={RoomStatus.APPROVED}>Approved</SelectItem>
                    <SelectItem value={RoomStatus.REJECTED}>Rejected</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={listingStatusFilter} onValueChange={(v) => { setListingStatusFilter(v); setPage(0); }}>
                  <SelectTrigger><SelectValue placeholder="Listing status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All listing statuses</SelectItem>
                    <SelectItem value={RoomStatus.AVAILABLE}>Available</SelectItem>
                    <SelectItem value={RoomStatus.RENTED}>Rented</SelectItem>
                    <SelectItem value={RoomStatus.ARCHIVED}>Archived</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v); setPage(0); }}>
                  <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All categories</SelectItem>
                    {Object.values(RoomCategory).map((category) => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Room</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rooms.length ? rooms.map((room) => {
                  const allowedTransitions = getAllowedListingTransitions(room.approvalStatus, room.listingStatus);
                  return (
                    <TableRow key={room.id}>
                      <TableCell>
                        <div className="font-semibold">{room.title}</div>
                        <div className="text-xs text-gray-500">Added: {formatDate(room.createdAt)}</div>
                      </TableCell>
                      <TableCell>{room.user?.name || "Unknown"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1"><MapPin className="h-3 w-3" />{room.address}</div>
                        {room.contactPhone && <div className="flex items-center gap-1 text-xs"><Phone className="h-3 w-3" />{room.contactPhone}</div>}
                      </TableCell>
                      <TableCell className="space-y-1">
                        <ApprovalStatusBadge status={room.approvalStatus} />
                        <ListingStatusBadge status={room.listingStatus} />
                      </TableCell>
                      <TableCell className="font-semibold">{formatNPR(room.price)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" asChild title="View">
                            <Link href={`/admin/dashboard/rooms/${room.id}`}><Eye className="h-4 w-4" /></Link>
                          </Button>
                          <Button variant="ghost" size="icon" asChild title="Edit">
                            <Link href={`/admin/dashboard/rooms/${room.id}/edit`}><Edit className="h-4 w-4" /></Link>
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon"><AlertCircle className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {room.approvalStatus === RoomStatus.PENDING && (
                                <>
                                  <DropdownMenuLabel>Approval</DropdownMenuLabel>
                                  <DropdownMenuItem onClick={() => handleApprovalAction(room, RoomStatus.APPROVED)}>
                                    <CheckCircle className="h-4 w-4 mr-2" />Approve
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleApprovalAction(room, RoomStatus.REJECTED)}>
                                    <XCircle className="h-4 w-4 mr-2" />Reject
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                </>
                              )}
                              {allowedTransitions.map((status) => (
                                <DropdownMenuItem
                                  key={status}
                                  onClick={() => {
                                    setActionRoom(room);
                                    setActionStatus(status);
                                    setShowListingDialog(true);
                                  }}
                                >
                                  Change to {status}
                                </DropdownMenuItem>
                              ))}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => {
                                  setRoomToDelete(room.id);
                                  setShowDeleteDialog(true);
                                }}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                }) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-48 text-center">
                      <Building2 className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                      No rooms found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {totalItems > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Page {page + 1} of {totalPages}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>
                <ChevronLeft className="h-4 w-4" /> Previous
              </Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>
                Next <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this room?</AlertDialogTitle>
            <AlertDialogDescription>This permanently removes the room.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700">
              {deleteRoomMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject room</DialogTitle>
            <DialogDescription>Provide a rejection reason.</DialogDescription>
          </DialogHeader>
          <Label htmlFor="reason">Reason</Label>
          <Textarea id="reason" value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApprovalDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmApprovalAction} disabled={!rejectionReason.trim()}>Reject</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showListingDialog} onOpenChange={setShowListingDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update listing status</DialogTitle>
            <DialogDescription>Change this room to {actionStatus}?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowListingDialog(false)}>Cancel</Button>
            <Button onClick={confirmListingAction}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
