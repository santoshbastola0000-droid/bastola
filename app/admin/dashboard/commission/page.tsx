// src/app/admin/dashboard/commission/page.tsx
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
  Save,
  Wallet,
  History,
  TrendingUp,
  AlertCircle,
  Plus,
  X,
  Edit,
  Trash2,
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
import { Switch } from "@/components/ui/switch";
import { formatNepaliCurrency, formatDate } from "@/lib/utils";
import { SUCCESSTOAST, FAILURETOAST } from "@/lib/constants/app.constants";
import { cn } from "@/lib/utils";

export default function CommissionPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showRecalculateDialog, setShowRecalculateDialog] = useState(false);
  const [selectedSettings, setSelectedSettings] = useState<any>(null);
  const [formData, setFormData] = useState({
    serviceCharge: 2000,
    commissionPercentage: 20,
    isActive: true,
  });

  // Fetch stats
  const {
    data: statsData,
    isLoading: statsLoading,
    refetch: refetchStats,
  } = useQuery({
    queryKey: ["commission-stats"],
    queryFn: () => commissionService.getCommissionStats(),
  });

  // Fetch all settings
  const {
    data: allSettings,
    isLoading: settingsLoading,
    refetch: refetchSettings,
  } = useQuery({
    queryKey: ["commission-settings-all"],
    queryFn: () => commissionService.getAllSettings(),
  });

  // Create settings mutation
  const createMutation = useMutation({
    mutationFn: commissionService.createSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commission-stats"] });
      queryClient.invalidateQueries({ queryKey: ["commission-settings-all"] });
      toast.success("Commission settings created successfully", {
        style: { background: SUCCESSTOAST, color: "#fff" },
      });
      setShowCreateDialog(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Failed to create settings",
        {
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
        style: { background: SUCCESSTOAST, color: "#fff" },
      });
      setShowEditDialog(false);
      setSelectedSettings(null);
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Failed to update settings",
        {
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
        style: { background: SUCCESSTOAST, color: "#fff" },
      });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to update status", {
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
        style: { background: SUCCESSTOAST, color: "#fff" },
      });
      setShowDeleteDialog(false);
      setSelectedSettings(null);
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Failed to delete settings",
        {
          style: { background: FAILURETOAST, color: "#fff" },
        },
      );
    },
  });

  // Recalculate mutation
  const recalculateMutation = useMutation({
    mutationFn: commissionService.recalculatePendingCommissions,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["commission-stats"] });
      toast.success(
        `Processed ${data.successful} out of ${data.totalProcessed} rooms`,
        {
          style: { background: SUCCESSTOAST, color: "#fff" },
        },
      );
      setShowRecalculateDialog(false);
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Failed to process commissions",
        {
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
    updateStatusMutation.mutate({ id, isActive: !currentActive });
  };

  const handleRecalculate = () => {
    recalculateMutation.mutate();
  };

  const stats = statsData?.stats;
  const activeSettings = statsData?.activeSettings;
  const pendingRooms = stats?.pendingCommissionRooms || 0;

  const calculateExample = () => {
    const serviceCharge = activeSettings?.serviceCharge || 2000;
    const percentage = activeSettings?.commissionPercentage || 20;
    const commission = (serviceCharge * percentage) / 100;
    const net = serviceCharge - commission;
    return { serviceCharge, commission, net };
  };

  const example = calculateExample();

  if (statsLoading || settingsLoading) {
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
    <div className="p-4 md:p-6 space-y-6">
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
            Configure global commission settings and manage payouts
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => {
              refetchStats();
              refetchSettings();
            }}
            disabled={statsLoading || settingsLoading}
            className="cursor-pointer"
          >
            <RefreshCw
              className={cn(
                "h-4 w-4 mr-2",
                (statsLoading || settingsLoading) && "animate-spin",
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
          >
            <Plus className="h-4 w-4 mr-2" />
            New Settings
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Approved Rooms
                  </p>
                  <h3 className="text-xl sm:text-2xl font-bold mt-1">
                    {stats.approvedRooms}
                  </h3>
                </div>
                <div className="p-2 sm:p-3 bg-blue-100 rounded-full">
                  <Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Commissioned
                  </p>
                  <h3 className="text-xl sm:text-2xl font-bold mt-1">
                    {stats.commissionedRooms}
                  </h3>
                </div>
                <div className="p-2 sm:p-3 bg-green-100 rounded-full">
                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Pending
                  </p>
                  <h3 className="text-xl sm:text-2xl font-bold mt-1">
                    {stats.pendingCommissionRooms}
                  </h3>
                </div>
                <div className="p-2 sm:p-3 bg-yellow-100 rounded-full">
                  <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Total Paid
                  </p>
                  <h3 className="text-xl sm:text-2xl font-bold mt-1">
                    {formatNepaliCurrency(stats.totalPaidToUsers)}
                  </h3>
                </div>
                <div className="p-2 sm:p-3 bg-purple-100 rounded-full">
                  <Wallet className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
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
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
          <TabsTrigger value="overview" className="cursor-pointer">
            Overview
          </TabsTrigger>
          <TabsTrigger value="settings" className="cursor-pointer">
            Settings
          </TabsTrigger>
          <TabsTrigger value="history" className="cursor-pointer">
            History
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Current Active Settings
              </CardTitle>
              <CardDescription>Global commission configuration</CardDescription>
            </CardHeader>
            <CardContent>
              {activeSettings ? (
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">
                      Service Charge
                    </Label>
                    <div className="text-2xl font-bold text-primary flex items-center gap-1">
                      <IndianRupee className="h-5 w-5" />
                      {formatNepaliCurrency(activeSettings.serviceCharge)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Charged per approved room
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">
                      Commission Percentage
                    </Label>
                    <div className="text-2xl font-bold text-primary flex items-center gap-1">
                      {activeSettings.commissionPercentage}%
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Platform fee deducted
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">
                      Last Updated
                    </Label>
                    <div className="text-sm font-medium">
                      {formatDate(activeSettings.updatedAt)}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Status</Label>
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
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                  <p className="font-medium">No active settings</p>
                  <p className="text-sm text-muted-foreground">
                    Create a new commission setting to get started
                  </p>
                  <Button
                    onClick={() => setShowCreateDialog(true)}
                    className="mt-4 cursor-pointer"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Settings
                  </Button>
                </div>
              )}

              {activeSettings && (
                <>
                  <Separator className="my-6" />

                  <div className="bg-primary/5 rounded-lg p-4">
                    <h3 className="font-semibold mb-3">Calculation Example</h3>
                    <div className="space-y-2 text-sm">
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
                          Commission ({activeSettings.commissionPercentage}%):
                        </span>
                        <span className="font-medium text-red-600 flex items-center gap-1">
                          -<IndianRupee className="h-3 w-3" />
                          {formatNepaliCurrency(example.commission)}
                        </span>
                      </div>
                      <Separator className="my-2" />
                      <div className="flex justify-between">
                        <span className="font-medium">User Receives:</span>
                        <span className="font-bold text-green-600 flex items-center gap-1">
                          <IndianRupee className="h-3 w-3" />
                          {formatNepaliCurrency(example.net)}
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Progress Card */}
          {stats && stats.approvedRooms > 0 && (
            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      Commission Progress
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {stats.commissionedRooms} / {stats.approvedRooms} rooms
                    </span>
                  </div>
                  <Progress
                    value={
                      (stats.commissionedRooms / stats.approvedRooms) * 100
                    }
                    className="h-2"
                  />
                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Platform Revenue
                      </p>
                      <p className="text-lg font-bold text-primary flex items-center gap-1">
                        <IndianRupee className="h-4 w-4" />
                        {formatNepaliCurrency(stats.totalCommission)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        User Earnings
                      </p>
                      <p className="text-lg font-bold text-green-600 flex items-center gap-1">
                        <IndianRupee className="h-4 w-4" />
                        {formatNepaliCurrency(stats.totalPaidToUsers)}
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
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-yellow-100 rounded-full">
                      <Clock className="h-5 w-5 text-yellow-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-yellow-800">
                        Pending Payouts
                      </h3>
                      <p className="text-sm text-yellow-700">
                        {stats.pendingCommissionRooms} rooms waiting for
                        commission
                      </p>
                      <div className="flex items-center gap-4 mt-2">
                        <div>
                          <p className="text-xs text-yellow-600">
                            Total to pay
                          </p>
                          <p className="font-bold text-yellow-800 flex items-center gap-1">
                            <IndianRupee className="h-4 w-4" />
                            {formatNepaliCurrency(stats.pendingPayout)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-yellow-600">
                            Platform commission
                          </p>
                          <p className="font-bold text-yellow-800 flex items-center gap-1">
                            <IndianRupee className="h-4 w-4" />
                            {formatNepaliCurrency(stats.pendingCommission)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={() => setShowRecalculateDialog(true)}
                    disabled={recalculateMutation.isPending}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white cursor-pointer w-full sm:w-auto"
                  >
                    {recalculateMutation.isPending ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Wallet className="mr-2 h-4 w-4" />
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
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Commission Settings History</CardTitle>
              <CardDescription>All commission configurations</CardDescription>
            </CardHeader>
            <CardContent>
              {allSettings && allSettings.length > 0 ? (
                <div className="rounded-md border overflow-x-auto">
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
                      {allSettings.map((setting) => (
                        <TableRow key={setting.id}>
                          <TableCell className="font-medium flex items-center gap-1">
                            <IndianRupee className="h-3 w-3" />
                            {formatNepaliCurrency(setting.serviceCharge)}
                          </TableCell>
                          <TableCell>{setting.commissionPercentage}%</TableCell>
                          <TableCell>
                            <Badge
                              className={
                                setting.isActive
                                  ? "bg-green-100 text-green-700 cursor-pointer"
                                  : "bg-gray-100 text-gray-700 cursor-pointer"
                              }
                              onClick={() =>
                                !setting.isActive &&
                                handleStatusToggle(setting.id, setting.isActive)
                              }
                            >
                              {setting.isActive ? "Active" : "Inactive"}
                              {!setting.isActive && " (Click to activate)"}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatDate(setting.createdAt)}</TableCell>
                          <TableCell>{formatDate(setting.updatedAt)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEdit(setting)}
                                className="h-8 w-8 cursor-pointer"
                                disabled={setting.isActive}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(setting)}
                                className="h-8 w-8 text-red-600 hover:text-red-700 cursor-pointer"
                                disabled={setting.isActive}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                  <p className="font-medium">No settings found</p>
                  <p className="text-sm text-muted-foreground">
                    Create your first commission setting
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Commission Payment History</CardTitle>
              <CardDescription>
                Track all commission payments to users
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <History className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="font-medium">Coming Soon</p>
                <p className="text-sm text-muted-foreground">
                  Commission payment history will be available here
                </p>
              </div>
            </CardContent>
          </Card>
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
              />
            </div>

            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-sm font-medium mb-2">Preview</p>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Service Charge:</span>
                  <span className="font-medium flex items-center gap-1">
                    <IndianRupee className="h-3 w-3" />
                    {formatNepaliCurrency(formData.serviceCharge)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Commission:</span>
                  <span className="font-medium text-red-600 flex items-center gap-1">
                    -<IndianRupee className="h-3 w-3" />
                    {formatNepaliCurrency(
                      (formData.serviceCharge * formData.commissionPercentage) /
                        100,
                    )}
                  </span>
                </div>
                <Separator className="my-1" />
                <div className="flex justify-between font-bold">
                  <span>User gets:</span>
                  <span className="text-green-600 flex items-center gap-1">
                    <IndianRupee className="h-3 w-3" />
                    {formatNepaliCurrency(
                      formData.serviceCharge -
                        (formData.serviceCharge *
                          formData.commissionPercentage) /
                          100,
                    )}
                  </span>
                </div>
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
              disabled={createMutation.isPending}
              className="bg-primary hover:bg-primary/90 cursor-pointer"
            >
              {createMutation.isPending ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
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
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
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
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              commission settings.
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
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
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
              {pendingRooms > 0 && (
                <div className="mt-2 p-3 bg-yellow-50 rounded-lg">
                  <p className="font-medium text-yellow-800">
                    Total payout:{" "}
                    <span className="font-bold flex items-center gap-1">
                      <IndianRupee className="h-4 w-4" />
                      {formatNepaliCurrency(stats?.pendingPayout || 0)}
                    </span>
                  </p>
                  <p className="text-sm text-yellow-700 mt-1">
                    Platform commission:{" "}
                    <span className="font-medium flex items-center gap-1">
                      <IndianRupee className="h-3 w-3" />
                      {formatNepaliCurrency(stats?.pendingCommission || 0)}
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
              onClick={handleRecalculate}
              className="bg-yellow-600 hover:bg-yellow-700 text-white cursor-pointer"
              disabled={recalculateMutation.isPending || pendingRooms === 0}
            >
              {recalculateMutation.isPending ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
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
