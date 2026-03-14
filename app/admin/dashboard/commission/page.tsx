"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Settings,
  IndianRupee,
  Percent,
  Building2,
  CheckCircle,
  Clock,
  RefreshCw,
  Wallet,
  TrendingUp,
  AlertCircle,
  Plus,
  X,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Search,
} from "lucide-react";
import { commissionService } from "@/http/services/commission.service";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { formatNepaliCurrency, formatDate } from "@/lib/utils";
import {
  SUCCESSTOAST,
  FAILURETOAST,
  PAGE_SIZE_OPTIONS,
} from "@/lib/constants/app.constants";
import { cn } from "@/lib/utils";

export default function CommissionPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showRecalculateDialog, setShowRecalculateDialog] = useState(false);
  const [selectedSettings, setSelectedSettings] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(0);
  const [take, setTake] = useState(10);
  const [formData, setFormData] = useState({
    serviceCharge: 2000,
    commissionPercentage: 20,
    isActive: true,
  });

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(0);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch stats
  const {
    data: statsData,
    isLoading: statsLoading,
    refetch: refetchStats,
  } = useQuery({
    queryKey: ["commission-stats"],
    queryFn: () => commissionService.getCommissionStats(),
  });

  // Fetch all settings with pagination
  const {
    data: settingsResponse,
    isLoading: settingsLoading,
    isFetching: settingsFetching,
    refetch: refetchSettings,
  } = useQuery({
    queryKey: ["commission-settings-all", page, take, debouncedSearch],
    queryFn: () =>
      commissionService.getAllSettings({
        page,
        take,
        search: debouncedSearch || undefined,
      }),
  });

  // Check if there's an active commission
  const hasActiveCommission = statsData?.activeSettings !== null;
  const activeCommissionId = statsData?.activeSettings?.id;

  // Create settings mutation
  const createMutation = useMutation({
    mutationFn: commissionService.createSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commission-stats"] });
      queryClient.invalidateQueries({ queryKey: ["commission-settings-all"] });
      toast.success("Commission settings created successfully", {
        description: "The new commission settings have been saved.",
        style: { background: SUCCESSTOAST, color: "#fff" },
      });
      setShowCreateDialog(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Failed to create settings",
        {
          description: "Please check your input and try again.",
          style: { background: FAILURETOAST, color: "#fff" },
        },
      );
    },
  });

  // Update settings mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      commissionService.updateSettings(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commission-stats"] });
      queryClient.invalidateQueries({ queryKey: ["commission-settings-all"] });
      toast.success("Commission settings updated successfully", {
        description: "The changes have been saved.",
        style: { background: SUCCESSTOAST, color: "#fff" },
      });
      setShowEditDialog(false);
      setSelectedSettings(null);
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Failed to update settings",
        {
          description: "Please check your input and try again.",
          style: { background: FAILURETOAST, color: "#fff" },
        },
      );
    },
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      commissionService.updateStatus(id, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commission-stats"] });
      queryClient.invalidateQueries({ queryKey: ["commission-settings-all"] });
      toast.success("Commission status updated successfully", {
        description: "The commission settings status has been changed.",
        style: { background: SUCCESSTOAST, color: "#fff" },
      });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to update status", {
        description: "Please try again later.",
        style: { background: FAILURETOAST, color: "#fff" },
      });
    },
  });

  // Delete settings mutation
  const deleteMutation = useMutation({
    mutationFn: commissionService.deleteSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commission-stats"] });
      queryClient.invalidateQueries({ queryKey: ["commission-settings-all"] });
      toast.success("Commission settings deleted successfully", {
        description: "The commission settings have been removed.",
        style: { background: SUCCESSTOAST, color: "#fff" },
      });
      setShowDeleteDialog(false);
      setSelectedSettings(null);
    },
    onError: (error: any) => {
      if (error?.response?.status === 400) {
        toast.error("Cannot delete active commission", {
          description:
            "Please deactivate the commission first before deleting.",
          style: { background: FAILURETOAST, color: "#fff" },
        });
      } else {
        toast.error(
          error?.response?.data?.message || "Failed to delete settings",
          {
            description: "Please try again later.",
            style: { background: FAILURETOAST, color: "#fff" },
          },
        );
      }
    },
  });

  // Recalculate mutation
  const recalculateMutation = useMutation({
    mutationFn: commissionService.recalculatePendingCommissions,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["commission-stats"] });
      const amountPerRoom =
        ((statsData?.activeSettings?.serviceCharge || 2000) *
          (statsData?.activeSettings?.commissionPercentage || 20)) /
        100;
      toast.success(
        `Processed ${data.successful} out of ${data.totalProcessed} rooms`,
        {
          description: `${formatNepaliCurrency(data.successful * amountPerRoom)} has been added to user wallets.`,
          style: { background: SUCCESSTOAST, color: "#fff" },
        },
      );
      setShowRecalculateDialog(false);
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Failed to process commissions",
        {
          description: "Please try again later.",
          style: { background: FAILURETOAST, color: "#fff" },
        },
      );
    },
  });

  const resetForm = () => {
    setFormData({
      serviceCharge: 2000,
      commissionPercentage: 20,
      isActive: true,
    });
  };

  const handleEdit = (settings: any) => {
    setSelectedSettings(settings);
    setFormData({
      serviceCharge: settings.serviceCharge,
      commissionPercentage: settings.commissionPercentage,
      isActive: settings.isActive,
    });
    setShowEditDialog(true);
  };

  const handleDelete = (settings: any) => {
    if (settings.isActive) {
      toast.error("Cannot delete active commission", {
        description: "Please deactivate the commission first before deleting.",
        style: { background: FAILURETOAST, color: "#fff" },
      });
      return;
    }
    setSelectedSettings(settings);
    setShowDeleteDialog(true);
  };

  const handleCreate = () => {
    createMutation.mutate(formData);
  };

  const handleUpdate = () => {
    if (selectedSettings) {
      updateMutation.mutate({
        id: selectedSettings.id,
        data: {
          serviceCharge: formData.serviceCharge,
          commissionPercentage: formData.commissionPercentage,
        },
      });
    }
  };

  const handleStatusToggle = (id: string, currentActive: boolean) => {
    // If trying to activate, check if there's already an active commission
    if (!currentActive && hasActiveCommission && id !== activeCommissionId) {
      toast.error("Cannot activate multiple commissions", {
        description:
          "There is already an active commission. Please deactivate it first.",
        style: { background: FAILURETOAST, color: "#fff" },
      });
      return;
    }
    updateStatusMutation.mutate({ id, isActive: !currentActive });
  };

  const handleRecalculate = () => {
    recalculateMutation.mutate();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      setDebouncedSearch(searchTerm);
      setPage(0);
    }
  };

  const stats = statsData?.stats;
  const activeSettings = statsData?.activeSettings;
  const pendingRooms = stats?.pendingCommissionRooms || 0;

  const allSettings = settingsResponse?.data || [];
  const pagination = settingsResponse?.pagination || {
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

  // Calculate example with correct values
  const calculateExample = () => {
    const serviceCharge = activeSettings?.serviceCharge || 2000;
    const percentage = activeSettings?.commissionPercentage || 20;
    const commissionAmount = (serviceCharge * percentage) / 100; // User receives this (20%)
    return { serviceCharge, percentage, commissionAmount };
  };

  const example = calculateExample();

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
            Loading commission settings...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-3">
            <Settings className="h-6 w-6 md:h-8 md:w-8 text-primary" />
            <span className="bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">
              Commission Management
            </span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configure global commission settings (applies to all rooms)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => {
              refetchStats();
              refetchSettings();
            }}
            disabled={statsLoading || settingsFetching}
            className="cursor-pointer"
          >
            <RefreshCw
              className={cn(
                "h-4 w-4 mr-2",
                (statsLoading || settingsFetching) && "animate-spin",
              )}
            />
            Refresh
          </Button>
          <Button
            onClick={() => {
              resetForm();
              setShowCreateDialog(true);
            }}
            className="bg-primary hover:bg-primary/90 cursor-pointer"
            disabled={hasActiveCommission && formData.isActive}
          >
            <Plus className="h-4 w-4 mr-2" />
            New Settings
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">
                    Approved Rooms
                  </p>
                  <h3 className="text-xl font-bold mt-1">
                    {stats.approvedRooms}
                  </h3>
                </div>
                <div className="p-2 bg-blue-100 rounded-full">
                  <Building2 className="h-4 w-4 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Commissioned</p>
                  <h3 className="text-xl font-bold mt-1">
                    {stats.commissionedRooms}
                  </h3>
                </div>
                <div className="p-2 bg-green-100 rounded-full">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Pending</p>
                  <h3 className="text-xl font-bold mt-1">
                    {stats.pendingCommissionRooms}
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
                  <p className="text-xs text-muted-foreground">Total Paid</p>
                  <h3 className="text-xl font-bold mt-1 flex items-center gap-1">
                    <IndianRupee className="h-3 w-3" />
                    {formatNepaliCurrency(stats.totalPaidToUsers)}
                  </h3>
                </div>
                <div className="p-2 bg-purple-100 rounded-full">
                  <Wallet className="h-4 w-4 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
          <TabsTrigger value="overview" className="cursor-pointer">
            Overview
          </TabsTrigger>
          <TabsTrigger value="settings" className="cursor-pointer">
            Settings History
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Current Active Settings (Global)
              </CardTitle>
              <CardDescription>
                These settings apply to all rooms automatically
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activeSettings ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">
                      Service Charge
                    </Label>
                    <div className="text-xl font-bold text-primary flex items-center gap-1">
                      <IndianRupee className="h-4 w-4" />
                      {formatNepaliCurrency(activeSettings.serviceCharge)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Total amount per room
                    </p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">
                      Commission Percentage
                    </Label>
                    <div className="text-xl font-bold text-primary flex items-center gap-1">
                      {activeSettings.commissionPercentage}%
                    </div>
                    <p className="text-xs text-muted-foreground">
                      User receives this percentage
                    </p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">
                      Last Updated
                    </Label>
                    <div className="text-sm font-medium">
                      {formatDate(activeSettings.updatedAt)}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">
                      Status
                    </Label>
                    <div>
                      <Badge
                        className={
                          activeSettings.isActive
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }
                      >
                        {activeSettings.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto mb-2 opacity-50" />
                  <p className="font-medium">No active settings</p>
                  <p className="text-xs text-muted-foreground">
                    Create a new commission setting to get started
                  </p>
                  <Button
                    onClick={() => setShowCreateDialog(true)}
                    size="sm"
                    className="mt-3 cursor-pointer"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Create Settings
                  </Button>
                </div>
              )}

              {activeSettings && (
                <>
                  <Separator className="my-4" />

                  <div className="bg-primary/5 rounded-lg p-3">
                    <h3 className="font-semibold text-sm mb-2">
                      How Commission Works
                    </h3>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Service Charge:
                        </span>
                        <span className="font-medium flex items-center gap-1">
                          <IndianRupee className="h-3 w-3" />
                          {formatNepaliCurrency(example.serviceCharge)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Commission ({example.percentage}% to user):
                        </span>
                        <span className="font-medium text-green-600 flex items-center gap-1">
                          <IndianRupee className="h-3 w-3" />
                          {formatNepaliCurrency(example.commissionAmount)}
                        </span>
                      </div>
                      <Separator className="my-1" />
                      <div className="flex justify-between font-medium">
                        <span>User receives:</span>
                        <span className="text-green-600 flex items-center gap-1">
                          <IndianRupee className="h-3 w-3" />
                          {formatNepaliCurrency(example.commissionAmount)}
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        When a room is approved, {example.percentage}% of
                        service charge (Rs. {example.commissionAmount}) is
                        automatically added to the user's wallet.
                      </p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Progress Card */}
          {stats && stats.approvedRooms > 0 && (
            <Card>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      Commission Progress
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {stats.commissionedRooms} / {stats.approvedRooms} rooms
                    </span>
                  </div>
                  <Progress
                    value={
                      (stats.commissionedRooms / stats.approvedRooms) * 100
                    }
                    className="h-2"
                  />
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Paid to Users
                      </p>
                      <p className="text-base font-bold text-green-600 flex items-center gap-1">
                        <IndianRupee className="h-3 w-3" />
                        {formatNepaliCurrency(stats.totalPaidToUsers)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Total Commission
                      </p>
                      <p className="text-base font-bold text-primary flex items-center gap-1">
                        <IndianRupee className="h-3 w-3" />
                        {formatNepaliCurrency(stats.totalCommission)}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Pending Payouts */}
          {stats && stats.pendingServiceCharge > 0 && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-2">
                    <div className="p-1.5 bg-yellow-100 rounded-full">
                      <Clock className="h-4 w-4 text-yellow-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm text-yellow-800">
                        Pending Payouts
                      </h3>
                      <p className="text-xs text-yellow-700">
                        {stats.pendingCommissionRooms} rooms waiting for
                        commission
                      </p>
                      <div className="flex items-center gap-3 mt-1">
                        <div>
                          <p className="text-[10px] text-yellow-600">
                            To be paid to users
                          </p>
                          <p className="font-bold text-xs text-yellow-800 flex items-center gap-1">
                            <IndianRupee className="h-3 w-3" />
                            {formatNepaliCurrency(stats.pendingCommission)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => setShowRecalculateDialog(true)}
                    disabled={
                      recalculateMutation.isPending || pendingRooms === 0
                    }
                    className="bg-yellow-600 hover:bg-yellow-700 text-white cursor-pointer w-full sm:w-auto text-xs"
                  >
                    {recalculateMutation.isPending ? (
                      <>
                        <RefreshCw className="mr-1 h-3 w-3 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Wallet className="mr-1 h-3 w-3" />
                        Process All
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          {/* Search and Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search by ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={handleKeyDown}
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
            </CardContent>
          </Card>

          {/* Mobile View - Cards */}
          <div className="block lg:hidden space-y-3">
            {settingsLoading ? (
              <div className="text-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin mx-auto text-primary" />
              </div>
            ) : allSettings.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <Settings className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                  <p className="font-medium text-sm">No settings found</p>
                  <p className="text-xs text-muted-foreground">
                    Create your first commission setting
                  </p>
                </CardContent>
              </Card>
            ) : (
              allSettings.map((setting) => (
                <Card key={setting.id} className="overflow-hidden">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <Badge
                        className={
                          setting.isActive
                            ? "bg-green-100 text-green-700 cursor-pointer text-[10px]"
                            : "bg-gray-100 text-gray-700 cursor-pointer text-[10px]"
                        }
                        onClick={() =>
                          !setting.isActive &&
                          handleStatusToggle(setting.id, setting.isActive)
                        }
                      >
                        {setting.isActive ? "Active" : "Inactive"}
                        {!setting.isActive && " (Click to activate)"}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">
                        ID: {setting.id.slice(0, 8)}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                      <div>
                        <p className="text-muted-foreground">Service Charge</p>
                        <p className="font-medium flex items-center gap-1">
                          <IndianRupee className="h-3 w-3" />
                          {formatNepaliCurrency(setting.serviceCharge)}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Commission</p>
                        <p className="font-medium">
                          {setting.commissionPercentage}%
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Created</p>
                        <p className="text-[10px]">
                          {formatDate(setting.createdAt)}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Updated</p>
                        <p className="text-[10px]">
                          {formatDate(setting.updatedAt)}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 h-7 text-xs cursor-pointer"
                        onClick={() => handleEdit(setting)}
                        disabled={setting.isActive}
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="flex-1 h-7 text-xs cursor-pointer"
                        onClick={() => handleDelete(setting)}
                        disabled={setting.isActive}
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete
                      </Button>
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
                        <TableHead>Service Charge</TableHead>
                        <TableHead>Commission %</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Updated</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {settingsLoading ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8">
                            <RefreshCw className="h-6 w-6 animate-spin mx-auto text-primary" />
                          </TableCell>
                        </TableRow>
                      ) : allSettings.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8">
                            <Settings className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No settings found</p>
                          </TableCell>
                        </TableRow>
                      ) : (
                        allSettings.map((setting) => (
                          <TableRow key={setting.id}>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-1">
                                <IndianRupee className="h-3 w-3" />
                                {formatNepaliCurrency(setting.serviceCharge)}
                              </div>
                            </TableCell>
                            <TableCell>
                              {setting.commissionPercentage}%
                            </TableCell>
                            <TableCell>
                              <Badge
                                className={
                                  setting.isActive
                                    ? "bg-green-100 text-green-700 cursor-pointer"
                                    : "bg-gray-100 text-gray-700 cursor-pointer"
                                }
                                onClick={() =>
                                  !setting.isActive &&
                                  handleStatusToggle(
                                    setting.id,
                                    setting.isActive,
                                  )
                                }
                              >
                                {setting.isActive ? "Active" : "Inactive"}
                                {!setting.isActive && " (Click to activate)"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {formatDate(setting.createdAt)}
                            </TableCell>
                            <TableCell>
                              {formatDate(setting.updatedAt)}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEdit(setting)}
                                  className="h-8 w-8 cursor-pointer"
                                  disabled={setting.isActive}
                                  title={
                                    setting.isActive
                                      ? "Deactivate to edit"
                                      : "Edit"
                                  }
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDelete(setting)}
                                  className="h-8 w-8 text-red-600 hover:text-red-700 cursor-pointer"
                                  disabled={setting.isActive}
                                  title={
                                    setting.isActive
                                      ? "Deactivate to delete"
                                      : "Delete"
                                  }
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
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
                  <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
                    <span className="text-xs text-muted-foreground text-center">
                      Showing {showingFrom} to {showingTo} of {totalItems}{" "}
                      entries
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {renderPageNumbers()}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create Commission Settings</DialogTitle>
            <DialogDescription>
              Set global commission rates for all rooms
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="serviceCharge">Service Charge (NPR)</Label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="serviceCharge"
                  type="number"
                  value={formData.serviceCharge}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      serviceCharge: Number(e.target.value),
                    })
                  }
                  className="pl-9"
                  min={0}
                  step={100}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="commissionPercentage">
                Commission Percentage (%)
              </Label>
              <div className="relative">
                <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="commissionPercentage"
                  type="number"
                  value={formData.commissionPercentage}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      commissionPercentage: Number(e.target.value),
                    })
                  }
                  className="pl-9"
                  min={0}
                  max={100}
                  step={0.5}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="isActive">Activate immediately</Label>
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isActive: checked })
                }
                disabled={hasActiveCommission && !formData.isActive}
              />
            </div>

            {hasActiveCommission && formData.isActive && (
              <p className="text-xs text-destructive">
                Cannot activate: There is already an active commission
              </p>
            )}

            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-xs font-medium mb-2">Preview</p>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Service Charge:</span>
                  <span className="font-medium flex items-center gap-1">
                    <IndianRupee className="h-3 w-3" />
                    {formatNepaliCurrency(formData.serviceCharge)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Commission ({formData.commissionPercentage}% to user):
                  </span>
                  <span className="font-medium text-green-600 flex items-center gap-1">
                    <IndianRupee className="h-3 w-3" />
                    {formatNepaliCurrency(
                      (formData.serviceCharge * formData.commissionPercentage) /
                        100,
                    )}
                  </span>
                </div>
                <Separator className="my-1" />
                <div className="flex justify-between font-bold">
                  <span>User receives:</span>
                  <span className="text-green-600 flex items-center gap-1">
                    <IndianRupee className="h-3 w-3" />
                    {formatNepaliCurrency(
                      (formData.serviceCharge * formData.commissionPercentage) /
                        100,
                    )}
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">
                  User gets {formData.commissionPercentage}% of service charge
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={
                createMutation.isPending ||
                (hasActiveCommission && formData.isActive)
              }
              className="bg-primary hover:bg-primary/90 cursor-pointer"
            >
              {createMutation.isPending ? (
                <>
                  <RefreshCw className="mr-2 h-3 w-3 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Settings"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Commission Settings</DialogTitle>
            <DialogDescription>Update commission rates</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {selectedSettings && (
              <div className="bg-muted/50 p-2 rounded-lg mb-2">
                <p className="text-xs text-muted-foreground">
                  Editing settings from
                </p>
                <p className="text-xs font-medium">
                  {formatDate(selectedSettings.createdAt)}
                </p>
                <p className="text-xs mt-1">
                  Current values:{" "}
                  {formatNepaliCurrency(selectedSettings.serviceCharge)} at{" "}
                  {selectedSettings.commissionPercentage}%
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="edit-serviceCharge">Service Charge (NPR)</Label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="edit-serviceCharge"
                  type="number"
                  value={formData.serviceCharge}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      serviceCharge: Number(e.target.value),
                    })
                  }
                  className="pl-9"
                  min={0}
                  step={100}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-commissionPercentage">
                Commission Percentage (%)
              </Label>
              <div className="relative">
                <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="edit-commissionPercentage"
                  type="number"
                  value={formData.commissionPercentage}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      commissionPercentage: Number(e.target.value),
                    })
                  }
                  className="pl-9"
                  min={0}
                  max={100}
                  step={0.5}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEditDialog(false)}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={updateMutation.isPending}
              className="bg-primary hover:bg-primary/90 cursor-pointer"
            >
              {updateMutation.isPending ? (
                <>
                  <RefreshCw className="mr-2 h-3 w-3 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Settings"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Commission Settings</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete these
              commission settings.
              {selectedSettings && (
                <div className="mt-2 p-2 bg-muted rounded-lg">
                  <p className="text-xs">
                    Service Charge:{" "}
                    <span className="font-medium flex items-center gap-1 inline">
                      <IndianRupee className="h-3 w-3" />
                      {formatNepaliCurrency(selectedSettings.serviceCharge)}
                    </span>
                  </p>
                  <p className="text-xs">
                    Commission:{" "}
                    <span className="font-medium">
                      {selectedSettings.commissionPercentage}%
                    </span>
                  </p>
                  <p className="text-xs">
                    Created:{" "}
                    <span className="font-medium">
                      {formatDate(selectedSettings.createdAt)}
                    </span>
                  </p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                selectedSettings && deleteMutation.mutate(selectedSettings.id)
              }
              className="bg-red-600 hover:bg-red-700 text-white cursor-pointer"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <>
                  <RefreshCw className="mr-2 h-3 w-3 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Recalculate Confirmation */}
      <AlertDialog
        open={showRecalculateDialog}
        onOpenChange={setShowRecalculateDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Process All Pending Commissions</AlertDialogTitle>
            <AlertDialogDescription>
              This will apply commission to {pendingRooms} pending room(s).
              {pendingRooms > 0 && stats && (
                <div className="mt-2 p-3 bg-yellow-50 rounded-lg">
                  <p className="font-medium text-xs text-yellow-800">
                    Total payout to users:{" "}
                    <span className="font-bold flex items-center gap-1">
                      <IndianRupee className="h-3 w-3" />
                      {formatNepaliCurrency(stats.pendingCommission)}
                    </span>
                  </p>
                  <p className="text-[10px] text-yellow-600 mt-1">
                    Each user will receive{" "}
                    {formatNepaliCurrency(
                      ((activeSettings?.serviceCharge || 2000) *
                        (activeSettings?.commissionPercentage || 20)) /
                        100,
                    )}
                  </p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRecalculate}
              className="bg-yellow-600 hover:bg-yellow-700 text-white cursor-pointer"
              disabled={recalculateMutation.isPending || pendingRooms === 0}
            >
              {recalculateMutation.isPending ? (
                <>
                  <RefreshCw className="mr-2 h-3 w-3 animate-spin" />
                  Processing...
                </>
              ) : (
                "Process Commissions"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
