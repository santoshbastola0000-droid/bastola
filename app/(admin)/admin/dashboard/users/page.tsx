"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  GitFork,
  Users as UsersIcon,
  Search,
  Filter,
  User,
  Shield,
  XCircle,
  Mail,
  Phone,
  Trash2,
  MoreVertical,
  Loader2,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Wallet,
  Radio,
  Clock,
  Mic,
  Camera,
  Bell,
  SendHorizontal,
  Activity,
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
  userService,
  type UserFilters,
  type UserEngagementSummary,
} from "@/http/services/user.service";
import { UserRole, type BrowserPermissionState } from "@/types/user.types";
import {
  SUCCESSTOAST,
  FAILURETOAST,
  PAGE_SIZE_OPTIONS,
} from "@/lib/constants/app.constants";
import {
  getRoleBadge,
  getVerificationBadge,
  getRoleOptions,
} from "@/lib/user-utils";
import { UsersListSkeleton } from "@/components/user/UsersListSkeleton";
import { formatPriceNPR, timeAgo } from "@/lib/utils";

export default function UsersList() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole | "all">("all");
  const [purposeFilter, setPurposeFilter] = useState<
    "all" | "FIND_ROOM" | "POST_ROOM" | "FIND_JOB" | "POST_JOB"
  >("all");
  const [onlineFilter, setOnlineFilter] = useState<
    "all" | "online" | "offline"
  >("all");
  const [locationPermissionFilter, setLocationPermissionFilter] = useState<
    BrowserPermissionState | "all"
  >("all");
  const [notificationPermissionFilter, setNotificationPermissionFilter] = useState<
    BrowserPermissionState | "all"
  >("all");
  const [microphonePermissionFilter, setMicrophonePermissionFilter] = useState<
    BrowserPermissionState | "all"
  >("all");
  const [cameraPermissionFilter, setCameraPermissionFilter] = useState<
    BrowserPermissionState | "all"
  >("all");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [selectedUser, setSelectedUser] = useState<{
    id: string;
    name: string;
    role: UserRole;
    isVerified: boolean;
  } | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [creditDialogUser, setCreditDialogUser] = useState<any | null>(null);
  const [creditAmount, setCreditAmount] = useState("");
  const [creditRemarks, setCreditRemarks] = useState(
    "Manual balance credit by admin",
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(0);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const filters: UserFilters = {
    page,
    take: pageSize,
    search: debouncedSearch || undefined,
    role: roleFilter !== "all" ? roleFilter : undefined,
    accountPurpose:
      purposeFilter !== "all" ? purposeFilter : undefined,
    onlineStatus:
      onlineFilter !== "all" ? onlineFilter : undefined,
    locationPermission:
      locationPermissionFilter !== "all" ? locationPermissionFilter : undefined,
    notificationPermission:
      notificationPermissionFilter !== "all" ? notificationPermissionFilter : undefined,
    microphonePermission:
      microphonePermissionFilter !== "all" ? microphonePermissionFilter : undefined,
    cameraPermission:
      cameraPermissionFilter !== "all" ? cameraPermissionFilter : undefined,
  };

  const getPurposeLabel = (purpose?: string | null) => {
    const labels: Record<string, string> = {
      FIND_ROOM: "कोठा खोज्न",
      POST_ROOM: "कोठा पोस्ट गर्न",
      FIND_JOB: "जागिर खोज्न",
      POST_JOB: "Vacancy पोस्ट गर्न",
    };

    return labels[purpose || ""] || "छानेको छैन";
  };

  const {
    data: usersResponse,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: ["users", filters],
    queryFn: async () => await userService.getUsers(filters),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });

  console.log("users", usersResponse);

  // Delete user mutation
  const adminCreditMutation = useMutation({
    mutationFn: ({
      userId,
      amount,
      remarks,
    }: {
      userId: string;
      amount: number;
      remarks: string;
    }) => userService.adminCreditWallet(userId, amount, remarks),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-wallet-stats"] });
      toast.success(`Rs. ${result.amount} added to wallet`, {
        style: { background: SUCCESSTOAST, color: "#fff" },
      });
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Could not add balance",
        { style: { background: FAILURETOAST, color: "#fff" } },
      );
    },
  });

  const handleAddBalance = (user: any) => {
    setCreditDialogUser(user);
    setCreditAmount("");
    setCreditRemarks("Manual balance credit by admin");
  };

  const confirmAddBalance = () => {
    if (!creditDialogUser) return;

    const amount = Number(creditAmount);

    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Please enter a valid amount.");
      return;
    }

    adminCreditMutation.mutate(
      {
        userId: creditDialogUser.id,
        amount,
        remarks:
          creditRemarks.trim() || "Manual balance credit by admin",
      },
      {
        onSuccess: () => {
          setCreditDialogUser(null);
          setCreditAmount("");
        },
      },
    );
  };


  const releasePendingMutation = useMutation({
    mutationFn: (userId: string) => userService.releasePendingBalance(userId),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-wallet-stats"] });
      toast.success(`Rs. ${result.releasedAmount} released to seller wallet`, {
        style: { background: SUCCESSTOAST, color: "#fff" },
      });
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Failed to release pending balance",
        { style: { background: FAILURETOAST, color: "#fff" } },
      );
    },
  });

  const handleReleasePending = (user: {
    id: string;
    name: string;
    pendingBalance?: number;
  }) => {
    const amount = Number(user.pendingBalance ?? 0);

    if (amount <= 0) {
      return;
    }

    const confirmed = window.confirm(
      `Release Rs. ${amount} from pending balance to ${user.name}'s wallet?`,
    );

    if (confirmed) {
      releasePendingMutation.mutate(user.id);
    }
  };

  const deleteUserMutation = useMutation({
    mutationFn: (id: string) => userService.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("User deleted successfully", {
        style: { background: SUCCESSTOAST, color: "#fff" },
      });
      setDeleteDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to delete user", {
        style: { background: FAILURETOAST, color: "#fff" },
      });
    },
  });

  const handleDeleteClick = (user: {
    id: string;
    name: string;
    role: UserRole;
    isVerified: boolean;
  }) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  const handleDeleteUser = () => {
    if (selectedUser) {
      deleteUserMutation.mutate(selectedUser.id);
    }
  };

  const users = usersResponse?.data || [];
  const engagementUserIds = users.map((user) => user.id);

  const { data: engagementByUserId = {} } =
    useQuery({
      queryKey: ["admin-user-engagement", engagementUserIds],
      queryFn: () => userService.getEngagementSummary(engagementUserIds),
      enabled: engagementUserIds.length > 0,
      staleTime: 30_000,
    });

  const getEngagement = (userId: string): UserEngagementSummary =>
    engagementByUserId[userId] || {
      emailSent: 0,
      emailClicked: 0,
      pushSent: 0,
      pushDeliveredDevices: 0,
      pushClicked: 0,
      inAppNotifications: 0,
      totalOutbound: 0,
      lastSource: null,
      lastVisitAt: null,
      lastClickedAt: null,
    };

  const getSourceLabel = (source?: string | null) => {
    const value = String(source || "").toUpperCase();
    if (value === "EMAIL") return "Email";
    if (value === "PUSH") return "Web Push";
    if (value === "REFERRAL") return "Referral";
    if (value === "DIRECT") return "Direct";
    return "Unknown";
  };

  const pagination = usersResponse?.pagination || {
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

  const getOnlineBadge = (isOnline?: boolean, lastActiveAt?: string) => {
    if (isOnline) {
      return (
        <Badge
          variant="outline"
          className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs"
        >
          <Radio className="h-3 w-3 mr-1 fill-emerald-500 text-emerald-500" />
          Online
        </Badge>
      );
    }
    if (lastActiveAt) {
      return (
        <Badge
          variant="outline"
          className="bg-slate-50 text-slate-600 border-slate-200 text-xs"
        >
          <Clock className="h-3 w-3 mr-1" />
          {timeAgo(lastActiveAt)}
        </Badge>
      );
    }
    return (
      <Badge
        variant="outline"
        className="bg-slate-50 text-slate-500 border-slate-200 text-xs"
      >
        Offline
      </Badge>
    );
  };

  const getLocationText = (user: any) => {
    const loc = user.location;
    if (!loc) return null;
    return (
      <span className="inline-flex items-center gap-1 text-xs text-slate-500">
        <MapPin className="h-3 w-3 flex-shrink-0" />
        <span className="truncate">
          {loc.city || `${loc.latitude.toFixed(4)}, ${loc.longitude.toFixed(4)}`}
        </span>
      </span>
    );
  };

  const permissionOptions: Array<{ value: BrowserPermissionState | "all"; label: string }> = [
    { value: "all", label: "All" },
    { value: "granted", label: "Allowed" },
    { value: "denied", label: "Blocked" },
    { value: "prompt", label: "Not decided" },
    { value: "unsupported", label: "Unsupported" },
    { value: "unknown", label: "Unknown" },
  ];

  const getPermissionBadge = (
    label: string,
    state: BrowserPermissionState | undefined,
    icon: React.ReactNode,
  ) => {
    const value = state ?? "unknown";
    const styles =
      value === "granted"
        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
        : value === "denied"
          ? "border-rose-200 bg-rose-50 text-rose-700"
          : value === "prompt"
            ? "border-amber-200 bg-amber-50 text-amber-700"
            : "border-slate-200 bg-slate-50 text-slate-500";

    return (
      <Badge variant="outline" className={`gap-1 text-[10px] ${styles}`}>
        {icon}
        {label}: {value}
      </Badge>
    );
  };

  const MobileUserCard = ({ user }: { user: any }) => (
    <div className="bg-white rounded-lg border p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 flex-shrink-0">
            <User className="h-6 w-6 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-foreground truncate">
              {user.name}
            </h3>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Mail className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{user.email}</span>
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
            {user.role !== UserRole.ADMIN && (
              <>
                <DropdownMenuItem
                  onClick={() => handleDeleteClick(user)}
                  className="text-destructive cursor-pointer focus:text-destructive"
                  disabled={deleteUserMutation.isPending}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete User
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="flex items-center gap-2">
          <Phone className="h-3 w-3 text-primary" />
          <span className="truncate">{user.phone || "Not provided"}</span>
        </div>
        <div className="flex justify-end">{getRoleBadge(user.role)}</div>
        <div className="col-span-2 flex items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground">Account purpose</span>
          <Badge variant="secondary" className="whitespace-nowrap">
            {getPurposeLabel(user.accountPurpose)}
          </Badge>
        </div>
        <div className="col-span-2 flex items-center justify-between gap-2">
          {getLocationText(user)}
          {getOnlineBadge(user.isOnline, user.lastActiveAt)}
        </div>
        <div className="col-span-2 rounded-lg border bg-slate-50 p-2">
          <p className="mb-2 text-xs font-semibold text-slate-600">RoomKhoj access</p>
          <div className="flex flex-wrap gap-1.5">
            {getPermissionBadge("Location", user.permissions?.location, <MapPin className="h-3 w-3" />)}
            {getPermissionBadge("Notification", user.permissions?.notification, <Bell className="h-3 w-3" />)}
            {getPermissionBadge("Audio", user.permissions?.microphone, <Mic className="h-3 w-3" />)}
            {getPermissionBadge("Video", user.permissions?.camera, <Camera className="h-3 w-3" />)}
          </div>
        </div>
        <div className="col-span-2 rounded-lg border bg-white p-2.5">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-xs font-semibold text-slate-700">Engagement</p>
            <Badge variant="outline" className="text-[10px]">
              Came via {getSourceLabel(getEngagement(user.id).lastSource)}
            </Badge>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-md bg-slate-50 p-2">
              <div className="flex items-center gap-1 text-slate-500">
                <Mail className="h-3 w-3" /> Email
              </div>
              <p className="mt-1 font-semibold">
                {getEngagement(user.id).emailSent} sent · {getEngagement(user.id).emailClicked} clicked
              </p>
            </div>
            <div className="rounded-md bg-slate-50 p-2">
              <div className="flex items-center gap-1 text-slate-500">
                <Bell className="h-3 w-3" /> Web push
              </div>
              <p className="mt-1 font-semibold">
                {getEngagement(user.id).pushSent} sent · {getEngagement(user.id).pushClicked} clicked
              </p>
            </div>
            <div className="rounded-md bg-slate-50 p-2">
              <div className="flex items-center gap-1 text-slate-500">
                <Activity className="h-3 w-3" /> In-app
              </div>
              <p className="mt-1 font-semibold">
                {getEngagement(user.id).inAppNotifications} notifications
              </p>
            </div>
            <div className="rounded-md bg-slate-50 p-2">
              <div className="flex items-center gap-1 text-slate-500">
                <SendHorizontal className="h-3 w-3" /> Total outbound
              </div>
              <p className="mt-1 font-semibold">
                {getEngagement(user.id).totalOutbound}
              </p>
            </div>
          </div>
          {getEngagement(user.id).lastVisitAt && (
            <p className="mt-2 text-[10px] text-slate-400">
              Last visit {timeAgo(getEngagement(user.id).lastVisitAt!)}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Wallet className="h-3 w-3 text-primary" />
          <span>{formatPriceNPR(user.balance ?? 0)}</span>
        </div>
        <div className="col-span-2 flex justify-between items-center pt-2 border-t">
          <div>{getVerificationBadge(user.isVerified)}</div>
          <div className="flex items-center gap-2">
            {(
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAddBalance(user)}
                disabled={adminCreditMutation.isPending}
                className="cursor-pointer border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100"
              >
                <Wallet className="mr-1 h-4 w-4" />
                Add Balance
              </Button>
            )}
            {Number(user.pendingBalance ?? 0) > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleReleasePending(user)}
                className="cursor-pointer border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                disabled={releasePendingMutation.isPending}
              >
                Release Pending
              </Button>
            )}
            {user.role !== UserRole.ADMIN && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleDeleteClick(user)}
                className="cursor-pointer"
                disabled={deleteUserMutation.isPending}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  if (isLoading && !usersResponse) {
    return <UsersListSkeleton />;
  }

  if (error) {
    return (
      <Card className="m-6">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center gap-2">
            <XCircle className="h-5 w-5" />
            Error Loading Users
          </CardTitle>
          <CardDescription>
            We couldn't load the users list. Please try again.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            {(error as Error).message}
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              onClick={() => refetch()}
              className="cursor-pointer"
              variant="default"
            >
              Retry
            </Button>
            <Button
              onClick={() => {
                setSearchTerm("");
                setRoleFilter("all");
                setPurposeFilter("all");
                setOnlineFilter("all");
                setLocationPermissionFilter("all");
                setNotificationPermissionFilter("all");
                setMicrophonePermissionFilter("all");
                setCameraPermissionFilter("all");
                setPage(0);
                refetch();
              }}
              className="cursor-pointer"
              variant="outline"
            >
              Reset Filters
            </Button>
          </div>
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
            <UsersIcon className="h-6 w-6 md:h-8 md:w-8 text-primary" />
            <span>User Management</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage and monitor all registered users
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => refetch()}
          disabled={isFetching}
          className="cursor-pointer w-full sm:w-auto"
        >
          {isFetching ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Refreshing...
            </>
          ) : (
            "Refresh"
          )}
        </Button>
      </div>

      {/* Filters Card */}
      <Card className="shadow-sm">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row sm:flex-wrap gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or phone..."
                className="pl-9 cursor-text w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleKeyDown}
              />
            </div>

            {/* Role Filter */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <Select
                value={roleFilter}
                onValueChange={(value: UserRole | "all") =>
                  setRoleFilter(value)
                }
              >
                <SelectTrigger className="w-full sm:w-[160px] cursor-pointer">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  {getRoleOptions().map((option) => (
                    <SelectItem
                      key={option.value}
                      value={option.value}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        {option.value === UserRole.ADMIN && (
                          <Shield className="h-3 w-3 text-purple-600" />
                        )}
                        {option.value === UserRole.USER && (
                          <User className="h-3 w-3 text-green-600" />
                        )}
                        {option.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Account Purpose Filter */}
            <Select
              value={purposeFilter}
              onValueChange={(value) => {
                setPurposeFilter(
                  value as
                    | "all"
                    | "FIND_ROOM"
                    | "POST_ROOM"
                    | "FIND_JOB"
                    | "POST_JOB",
                );
                setPage(0);
              }}
            >
              <SelectTrigger className="w-full sm:w-[190px] cursor-pointer">
                <SelectValue placeholder="Account purpose" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="cursor-pointer">
                  सबै उद्देश्य
                </SelectItem>
                <SelectItem value="FIND_ROOM" className="cursor-pointer">
                  कोठा खोज्न
                </SelectItem>
                <SelectItem value="POST_ROOM" className="cursor-pointer">
                  कोठा पोस्ट गर्न
                </SelectItem>
                <SelectItem value="FIND_JOB" className="cursor-pointer">
                  जागिर खोज्न
                </SelectItem>
                <SelectItem value="POST_JOB" className="cursor-pointer">
                  Vacancy पोस्ट गर्न
                </SelectItem>
              </SelectContent>
            </Select>

            {/* Online Status Filter */}
            <Select
              value={onlineFilter}
              onValueChange={(value) => {
                setOnlineFilter(
                  value as "all" | "online" | "offline",
                );
                setPage(0);
              }}
            >
              <SelectTrigger
                className="w-full sm:w-[160px] cursor-pointer"
                aria-label="Filter by online status"
              >
                <SelectValue placeholder="Online status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="cursor-pointer">
                  All status
                </SelectItem>
                <SelectItem value="online" className="cursor-pointer">
                  ● Online
                </SelectItem>
                <SelectItem value="offline" className="cursor-pointer">
                  ○ Offline
                </SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={locationPermissionFilter}
              onValueChange={(value) => {
                setLocationPermissionFilter(value as BrowserPermissionState | "all");
                setPage(0);
              }}
            >
              <SelectTrigger className="w-full sm:w-[170px] cursor-pointer">
                <MapPin className="mr-1 h-4 w-4" />
                <SelectValue placeholder="Location access" />
              </SelectTrigger>
              <SelectContent>
                {permissionOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    Location: {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={notificationPermissionFilter}
              onValueChange={(value) => {
                setNotificationPermissionFilter(value as BrowserPermissionState | "all");
                setPage(0);
              }}
            >
              <SelectTrigger className="w-full sm:w-[185px] cursor-pointer">
                <Bell className="mr-1 h-4 w-4" />
                <SelectValue placeholder="Notification access" />
              </SelectTrigger>
              <SelectContent>
                {permissionOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    Notification: {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={microphonePermissionFilter}
              onValueChange={(value) => {
                setMicrophonePermissionFilter(value as BrowserPermissionState | "all");
                setPage(0);
              }}
            >
              <SelectTrigger className="w-full sm:w-[165px] cursor-pointer">
                <Mic className="mr-1 h-4 w-4" />
                <SelectValue placeholder="Audio access" />
              </SelectTrigger>
              <SelectContent>
                {permissionOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    Audio: {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={cameraPermissionFilter}
              onValueChange={(value) => {
                setCameraPermissionFilter(value as BrowserPermissionState | "all");
                setPage(0);
              }}
            >
              <SelectTrigger className="w-full sm:w-[165px] cursor-pointer">
                <Camera className="mr-1 h-4 w-4" />
                <SelectValue placeholder="Video access" />
              </SelectTrigger>
              <SelectContent>
                {permissionOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    Video: {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              onClick={() => {
                setSearchTerm("");
                setRoleFilter("all");
                setPurposeFilter("all");
                setOnlineFilter("all");
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

      {/* Users Table/Grid Card */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <CardTitle>Users</CardTitle>
              <CardDescription className="flex items-center gap-2">
                <span>{pagination.total} users found</span>
                {isFetching && (
                  <span className="flex items-center gap-1 text-xs">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>Updating...</span>
                  </span>
                )}
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="text-xs">
                <Shield className="h-3 w-3 mr-1 text-purple-600" />
                {users.filter((u) => u.role === UserRole.ADMIN).length} Admin
              </Badge>
              <Badge variant="outline" className="text-xs">
                <User className="h-3 w-3 mr-1 text-green-600" />
                {users.filter((u) => u.role === UserRole.USER).length} User
              </Badge>
              <Badge
                variant="outline"
                className="text-xs border-emerald-200 bg-emerald-50 text-emerald-700"
              >
                <Radio className="h-3 w-3 mr-1 fill-emerald-500 text-emerald-500" />
                {users.filter((u) => u.isOnline).length} Online now
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Desktop Table View - Hidden on mobile */}
          <div className="hidden md:block rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[260px]">User Details</TableHead>
                  <TableHead className="w-[180px]">Contact</TableHead>
                  <TableHead className="w-[140px]">Balance</TableHead>
                  <TableHead className="w-[160px]">Location</TableHead>
                  <TableHead className="w-[320px]">RoomKhoj Access</TableHead>
                  <TableHead className="w-[280px]">Engagement</TableHead>
                  <TableHead className="w-[120px]">Role</TableHead>
                  <TableHead className="w-[170px]">Account Purpose</TableHead>
                  <TableHead className="w-[120px]">Status</TableHead>
                  <TableHead className="text-right w-[100px]">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length > 0 ? (
                  users.map((user) => (
                    <TableRow
                      key={user.id}
                      className="transition-colors"
                    >
                      <TableCell>
                        <div className="flex items-start gap-3 min-w-[220px]">
                          <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10 flex-shrink-0">
                            <User className="h-5 w-5 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-semibold text-foreground truncate">
                              {user.name}
                            </h3>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Mail className="h-3 w-3 flex-shrink-0" />
                              <span className="truncate max-w-[180px]">
                                {user.email}
                              </span>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1 text-sm min-w-[150px]">
                          <div className="flex items-center gap-2">
                            <Phone className="h-3 w-3 text-primary flex-shrink-0" />
                            <span className="truncate">
                              {user.phone || "Not provided"}
                            </span>
                          </div>
                          {getOnlineBadge(user.isOnline, user.lastActiveAt)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm min-w-[100px]">
                          <Wallet className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                          <span className="font-medium">
                            {formatPriceNPR(user.balance ?? 0)}
                          </span>
                        </div>
                        {user.pendingBalance ? (
                          <p className="text-[10px] text-slate-500 ml-5">
                            Pending {formatPriceNPR(user.pendingBalance)}
                          </p>
                        ) : null}
                      </TableCell>
                      <TableCell>
                        <div className="min-w-[120px]">
                          {getLocationText(user) ?? (
                            <span className="text-xs text-slate-400">
                              Not shared
                            </span>
                          )}
                          {user.location?.updatedAt && (
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              {timeAgo(user.location.updatedAt)}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex min-w-[300px] flex-wrap gap-1.5">
                          {getPermissionBadge("Location", user.permissions?.location, <MapPin className="h-3 w-3" />)}
                          {getPermissionBadge("Notification", user.permissions?.notification, <Bell className="h-3 w-3" />)}
                          {getPermissionBadge("Audio", user.permissions?.microphone, <Mic className="h-3 w-3" />)}
                          {getPermissionBadge("Video", user.permissions?.camera, <Camera className="h-3 w-3" />)}
                        </div>
                        {user.permissions?.updatedAt && (
                          <p className="mt-1 text-[10px] text-slate-400">
                            Checked {timeAgo(user.permissions.updatedAt)}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="min-w-[250px] space-y-1.5 text-xs">
                          <div className="flex flex-wrap gap-1.5">
                            <Badge variant="outline" className="gap-1 border-blue-200 bg-blue-50 text-blue-700">
                              <Mail className="h-3 w-3" />
                              {getEngagement(user.id).emailSent} sent / {getEngagement(user.id).emailClicked} click
                            </Badge>
                            <Badge variant="outline" className="gap-1 border-violet-200 bg-violet-50 text-violet-700">
                              <Bell className="h-3 w-3" />
                              {getEngagement(user.id).pushSent} push / {getEngagement(user.id).pushClicked} click
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-slate-500">
                            <Activity className="h-3 w-3" />
                            <span>Online via {getSourceLabel(getEngagement(user.id).lastSource)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-slate-500">
                            <SendHorizontal className="h-3 w-3" />
                            <span>
                              Total sent {getEngagement(user.id).totalOutbound} · In-app {getEngagement(user.id).inAppNotifications}
                            </span>
                          </div>
                          {getEngagement(user.id).lastVisitAt && (
                            <p className="text-[10px] text-slate-400">
                              Last visit {timeAgo(getEngagement(user.id).lastVisitAt!)}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="min-w-[100px]">
                          {getRoleBadge(user.role)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="whitespace-nowrap">
                          {getPurposeLabel(user.accountPurpose)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="min-w-[100px]">
                          {getVerificationBadge(user.isVerified)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Link
                            href={`/admin/dashboard/referrals?userId=${user.id}`}
                          >
                            <Button
                              variant="outline"
                              size="sm"
                              className="cursor-pointer border-violet-300 bg-violet-50 text-violet-700 hover:bg-violet-100"
                            >
                              <GitFork className="mr-1 h-4 w-4" />
                              Chain
                            </Button>
                          </Link>
                          {(
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAddBalance(user)}
                disabled={adminCreditMutation.isPending}
                className="cursor-pointer border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100"
              >
                <Wallet className="mr-1 h-4 w-4" />
                Add Balance
              </Button>
            )}
            {Number(user.pendingBalance ?? 0) > 0 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleReleasePending(user)}
                              disabled={releasePendingMutation.isPending}
                              className="cursor-pointer border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                            >
                              Release Pending
                            </Button>
                          )}
                          {user.role !== UserRole.ADMIN && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteClick(user)}
                              disabled={deleteUserMutation.isPending}
                              className="cursor-pointer"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={10} className="h-32 text-center">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <UsersIcon className="h-12 w-12 text-muted-foreground opacity-50" />
                        <div>
                          <p className="font-medium">No users found</p>
                          <p className="text-sm text-muted-foreground">
                            {debouncedSearch ||
                              roleFilter !== "all" ||
                              purposeFilter !== "all" ||
                              onlineFilter !== "all" ||
                              locationPermissionFilter !== "all" ||
                              notificationPermissionFilter !== "all" ||
                              microphonePermissionFilter !== "all" ||
                              cameraPermissionFilter !== "all"
                              ? "Try adjusting your search or filters"
                              : "No users registered yet"}
                          </p>
                        </div>
                        {(debouncedSearch ||
                              roleFilter !== "all" ||
                              purposeFilter !== "all" ||
                              onlineFilter !== "all" ||
                              locationPermissionFilter !== "all" ||
                              notificationPermissionFilter !== "all" ||
                              microphonePermissionFilter !== "all" ||
                              cameraPermissionFilter !== "all") && (
                          <Button
                            onClick={() => {
                              setSearchTerm("");
                              setRoleFilter("all");
                              setPurposeFilter("all");
                              setOnlineFilter("all");
                              setLocationPermissionFilter("all");
                              setNotificationPermissionFilter("all");
                              setMicrophonePermissionFilter("all");
                              setCameraPermissionFilter("all");
                            }}
                            variant="outline"
                            className="mt-2 cursor-pointer"
                          >
                            Clear Filters
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {users.length > 0 ? (
              users.map((user) => <MobileUserCard key={user.id} user={user} />)
            ) : (
              <div className="text-center py-8">
                <UsersIcon className="h-12 w-12 text-muted-foreground opacity-50 mx-auto mb-3" />
                <p className="font-medium">No users found</p>
                <p className="text-sm text-muted-foreground">
                  {debouncedSearch ||
                              roleFilter !== "all" ||
                              purposeFilter !== "all" ||
                              onlineFilter !== "all" ||
                              locationPermissionFilter !== "all" ||
                              notificationPermissionFilter !== "all" ||
                              microphonePermissionFilter !== "all" ||
                              cameraPermissionFilter !== "all"
                    ? "Try adjusting your search or filters"
                    : "No users registered yet"}
                </p>
                {(debouncedSearch ||
                              roleFilter !== "all" ||
                              purposeFilter !== "all" ||
                              onlineFilter !== "all" ||
                              locationPermissionFilter !== "all" ||
                              notificationPermissionFilter !== "all" ||
                              microphonePermissionFilter !== "all" ||
                              cameraPermissionFilter !== "all") && (
                  <Button
                    onClick={() => {
                      setSearchTerm("");
                      setRoleFilter("all");
                      setPurposeFilter("all");
                      setOnlineFilter("all");
                      setLocationPermissionFilter("all");
                      setNotificationPermissionFilter("all");
                      setMicrophonePermissionFilter("all");
                      setCameraPermissionFilter("all");
                    }}
                    variant="outline"
                    className="mt-4 cursor-pointer"
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination.total > 0 && (
        <Card className="shadow-sm">
          <CardContent className="pt-6">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
              {/* Page size selector and info */}
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
                  users
                </span>
              </div>

              {/* Page navigation */}
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

                {/* Page numbers - Hidden on mobile */}
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

                {/* Mobile page indicator */}
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

      {/* Add Balance Dialog */}
      <AlertDialog
        open={Boolean(creditDialogUser)}
        onOpenChange={(open) => {
          if (!open) setCreditDialogUser(null);
        }}
      >
        <AlertDialogContent className="w-[95vw] max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Add Wallet Balance</AlertDialogTitle>
            <AlertDialogDescription>
              Add balance to{" "}
              <span className="font-semibold text-foreground">
                {creditDialogUser?.name}
              </span>
              &apos;s wallet. This creates a permanent wallet transaction.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Amount (Rs.)</label>
              <Input
                type="number"
                min="1"
                placeholder="e.g. 500"
                value={creditAmount}
                onChange={(event) => setCreditAmount(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Remarks</label>
              <Input
                placeholder="Reason for wallet credit"
                value={creditRemarks}
                onChange={(event) => setCreditRemarks(event.target.value)}
              />
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                confirmAddBalance();
              }}
              disabled={adminCreditMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {adminCreditMutation.isPending
                ? "Adding..."
                : "Add Balance"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete User Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="w-[95vw] max-w-md mx-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">
              Delete User Account
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                This action cannot be undone. This will permanently delete{" "}
                <span className="font-semibold text-foreground">
                  {selectedUser?.name}
                </span>
                &apos;s account and remove all associated data from our servers.
              </p>
              {selectedUser?.role === UserRole.ADMIN && (
                <p className="text-destructive font-semibold">
                  Warning: This is an admin account. Dele it may affect system
                  operations.
                </p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel
              onClick={() => setDeleteDialogOpen(false)}
              className="cursor-pointer w-full sm:w-auto"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 cursor-pointer w-full sm:w-auto"
              disabled={deleteUserMutation.isPending}
            >
              {deleteUserMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete User
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
