"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Settings,
  DollarSign,
  Percent,
  Building2,
  CheckCircle,
  Clock,
  RefreshCw,
  Save,
  Wallet,
  History,
} from "lucide-react";
import { privateApi } from "@/http/api/privateApi";
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
import { formatCurrency, formatDate } from "@/lib/utils";
import { SUCCESSTOAST, FAILURETOAST } from "@/lib/constants/app.constants";

interface CommissionSettings {
  id: string;
  serviceCharge: number;
  commissionPercentage: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CommissionStats {
  totalApprovedRooms: number;
  totalCommissionedRooms: number;
  pendingCommissionRooms: number;
  totalServiceChargeCollected: number;
  totalCommissionCollected: number;
  totalPaidToUsers: number;
  currentSettings: {
    serviceCharge: number;
    commissionPercentage: number;
  };
}

export default function CommissionPage() {
  const queryClient = useQueryClient();
  const [serviceCharge, setServiceCharge] = useState<number>(2000);
  const [commissionPercentage, setCommissionPercentage] = useState<number>(20);
  const [showApplyDialog, setShowApplyDialog] = useState(false);
  const [applyToAll, setApplyToAll] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch settings
  const { data: settingsData, isLoading: settingsLoading } = useQuery({
    queryKey: ["commission-settings"],
    queryFn: async () => {
      const response = await privateApi.get("/admin/commission/settings");
      const settings = response.data.data;
      setServiceCharge(settings.serviceCharge);
      setCommissionPercentage(settings.commissionPercentage);
      return settings;
    },
  });

  // Fetch stats
  const {
    data: statsData,
    isLoading: statsLoading,
    refetch: refetchStats,
  } = useQuery({
    queryKey: ["commission-stats"],
    queryFn: async () => {
      const response = await privateApi.get("/admin/commission/stats");
      return response.data.data;
    },
  });

  // Fetch history
  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ["commission-history"],
    queryFn: async () => {
      const response = await privateApi.get("/admin/commission/", {
        params: { take: 10 },
      });
      return response.data;
    },
  });

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (data: {
      serviceCharge?: number;
      commissionPercentage?: number;
    }) => {
      const response = await privateApi.patch(
        "/admin/commission/settings",
        data,
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commission-settings"] });
      queryClient.invalidateQueries({ queryKey: ["commission-stats"] });
      toast.success("Commission settings updated successfully", {
        style: { background: SUCCESSTOAST, color: "#fff" },
      });
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

  // Apply commission to room mutation
  const applyCommissionMutation = useMutation({
    mutationFn: async (roomId: string) => {
      const response = await privateApi.post(
        `/admin/commission/apply/${roomId}`,
      );
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["commission-stats"] });
      queryClient.invalidateQueries({ queryKey: ["commission-history"] });
      queryClient.invalidateQueries({ queryKey: ["admin-approved-rooms"] });

      toast.success(
        `₹${data.data.netAmount.toLocaleString()} added to user's wallet`,
        { style: { background: SUCCESSTOAST, color: "#fff" } },
      );
      setShowApplyDialog(false);
      setSelectedRoomId(null);
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Failed to apply commission",
        {
          style: { background: FAILURETOAST, color: "#fff" },
        },
      );
    },
  });

  // Apply to all mutation
  const applyAllMutation = useMutation({
    mutationFn: async () => {
      const response = await privateApi.post("/admin/commission/apply-all");
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["commission-stats"] });
      queryClient.invalidateQueries({ queryKey: ["commission-history"] });
      queryClient.invalidateQueries({ queryKey: ["admin-approved-rooms"] });

      toast.success(data.message, {
        style: { background: SUCCESSTOAST, color: "#fff" },
      });
      setShowApplyDialog(false);
      setApplyToAll(false);
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ||
          "Failed to apply commission to all rooms",
        {
          style: { background: FAILURETOAST, color: "#fff" },
        },
      );
    },
  });

  const handleUpdateSettings = () => {
    updateSettingsMutation.mutate({
      serviceCharge,
      commissionPercentage,
    });
  };

  const handleApplyToAll = () => {
    setApplyToAll(true);
    setShowApplyDialog(true);
  };

  const handleConfirmApply = () => {
    if (applyToAll) {
      applyAllMutation.mutate();
    } else if (selectedRoomId) {
      applyCommissionMutation.mutate(selectedRoomId);
    }
  };

  const stats = statsData;
  const settings = settingsData;
  const history = historyData?.data || [];
  const historyPagination = historyData?.pagination;

  if (settingsLoading || statsLoading) {
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
            <span>Commission Management</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configure global commission settings and manage payouts
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => refetchStats()}
          className="cursor-pointer"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Approved Rooms
                  </p>
                  <h3 className="text-2xl font-bold mt-1">
                    {stats.totalApprovedRooms}
                  </h3>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <Building2 className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Commissioned</p>
                  <h3 className="text-2xl font-bold mt-1">
                    {stats.totalCommissionedRooms}
                  </h3>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <h3 className="text-2xl font-bold mt-1">
                    {stats.pendingCommissionRooms}
                  </h3>
                </div>
                <div className="p-3 bg-yellow-100 rounded-full">
                  <Clock className="h-5 w-5 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Paid</p>
                  <h3 className="text-2xl font-bold mt-1">
                    {formatCurrency(stats.totalPaidToUsers)}
                  </h3>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <Wallet className="h-5 w-5 text-purple-600" />
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
            <CardHeader>
              <CardTitle>Current Settings</CardTitle>
              <CardDescription>Global commission configuration</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-muted-foreground">
                    Service Charge
                  </Label>
                  <div className="text-2xl font-bold text-primary">
                    {formatCurrency(stats?.currentSettings.serviceCharge || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Charged per approved room
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">
                    Commission Percentage
                  </Label>
                  <div className="text-2xl font-bold text-primary">
                    {stats?.currentSettings.commissionPercentage}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Platform fee deducted
                  </p>
                </div>
              </div>

              <Separator className="my-6" />

              <div className="bg-primary/5 rounded-lg p-4">
                <h3 className="font-semibold mb-3">Calculation Example</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Service Charge:
                    </span>
                    <span className="font-medium">
                      {formatCurrency(
                        stats?.currentSettings.serviceCharge || 0,
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Commission ({stats?.currentSettings.commissionPercentage}
                      %):
                    </span>
                    <span className="font-medium text-red-600">
                      -
                      {formatCurrency(
                        ((stats?.currentSettings.serviceCharge || 0) *
                          (stats?.currentSettings.commissionPercentage || 0)) /
                          100,
                      )}
                    </span>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex justify-between">
                    <span className="font-medium">User Receives:</span>
                    <span className="font-bold text-green-600">
                      {formatCurrency(
                        (stats?.currentSettings.serviceCharge || 0) -
                          ((stats?.currentSettings.serviceCharge || 0) *
                            (stats?.currentSettings.commissionPercentage ||
                              0)) /
                            100,
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Progress Card */}
          {stats && stats.totalApprovedRooms > 0 && (
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      Commission Progress
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {stats.totalCommissionedRooms} /{" "}
                      {stats.totalApprovedRooms} rooms
                    </span>
                  </div>
                  <Progress
                    value={
                      (stats.totalCommissionedRooms /
                        stats.totalApprovedRooms) *
                      100
                    }
                    className="h-2"
                  />
                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Total Collected
                      </p>
                      <p className="text-lg font-bold">
                        {formatCurrency(stats.totalServiceChargeCollected)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Platform Commission
                      </p>
                      <p className="text-lg font-bold text-primary">
                        {formatCurrency(stats.totalCommissionCollected)}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Apply Button */}
          {stats?.pendingCommissionRooms > 0 && (
            <Button
              size="lg"
              onClick={handleApplyToAll}
              disabled={applyAllMutation.isPending}
              className="w-full cursor-pointer"
            >
              {applyAllMutation.isPending ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Applying to {stats.pendingCommissionRooms} rooms...
                </>
              ) : (
                <>
                  <Wallet className="mr-2 h-4 w-4" />
                  Apply Commission to All ({stats.pendingCommissionRooms}{" "}
                  pending)
                </>
              )}
            </Button>
          )}
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Commission Settings</CardTitle>
              <CardDescription>
                Configure global commission rates for all rooms
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="serviceCharge">Service Charge (NPR)</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="serviceCharge"
                      type="number"
                      value={serviceCharge}
                      onChange={(e) => setServiceCharge(Number(e.target.value))}
                      className="pl-9"
                      min={0}
                      step={100}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    This amount will be charged for every approved room
                  </p>
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
                      value={commissionPercentage}
                      onChange={(e) =>
                        setCommissionPercentage(Number(e.target.value))
                      }
                      className="pl-9"
                      min={0}
                      max={100}
                      step={0.5}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Percentage deducted as platform fee
                  </p>
                </div>
              </div>

              <Button
                onClick={handleUpdateSettings}
                disabled={updateSettingsMutation.isPending}
                className="w-full cursor-pointer"
              >
                {updateSettingsMutation.isPending ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Settings
                  </>
                )}
              </Button>

              {settings && (
                <div className="bg-muted/50 rounded-lg p-4 mt-4">
                  <p className="text-xs text-muted-foreground mb-2">
                    Last Updated
                  </p>
                  <p className="text-sm">{formatDate(settings.updatedAt)}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Commission History</CardTitle>
              <CardDescription>
                Track all commission payments to users
              </CardDescription>
            </CardHeader>
            <CardContent>
              {historyLoading ? (
                <div className="flex justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : history.length === 0 ? (
                <div className="text-center py-12">
                  <History className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                  <p className="font-medium">No commission history</p>
                  <p className="text-sm text-muted-foreground">
                    Commission payments will appear here
                  </p>
                </div>
              ) : (
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Room</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Service Charge</TableHead>
                        <TableHead>Commission</TableHead>
                        <TableHead>Net Amount</TableHead>
                        <TableHead>Applied Date</TableHead>
                        <TableHead>Transaction ID</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {history.map((item: any) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{item.roomTitle}</p>
                              <p className="text-xs text-muted-foreground">
                                {item.roomId}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{item.userName}</p>
                              <p className="text-xs text-muted-foreground">
                                {item.userId}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">
                            {formatCurrency(item.serviceCharge)}
                          </TableCell>
                          <TableCell className="text-red-600">
                            -{formatCurrency(item.commissionAmount)}
                          </TableCell>
                          <TableCell className="text-green-600 font-bold">
                            {formatCurrency(item.netAmount)}
                          </TableCell>
                          <TableCell>{formatDate(item.appliedAt)}</TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className="font-mono text-xs"
                            >
                              {item.transactionId?.slice(0, 8)}...
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {historyPagination && historyPagination.total > 0 && (
                <div className="mt-4 text-sm text-muted-foreground text-center">
                  Showing {history.length} of {historyPagination.total} entries
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Confirmation Dialog */}
      <AlertDialog open={showApplyDialog} onOpenChange={setShowApplyDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {applyToAll ? (
                <>
                  <Wallet className="h-5 w-5 text-primary" />
                  Apply Commission to All Rooms
                </>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Apply Commission
                </>
              )}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {applyToAll ? (
                <>
                  This will apply the current commission settings to all
                  approved rooms that haven't received commission yet.
                  <br />
                  <strong className="text-foreground mt-2 block">
                    {stats?.pendingCommissionRooms} rooms will receive{" "}
                    {formatCurrency(
                      (stats?.currentSettings.serviceCharge || 0) -
                        ((stats?.currentSettings.serviceCharge || 0) *
                          (stats?.currentSettings.commissionPercentage || 0)) /
                          100,
                    )}{" "}
                    each.
                  </strong>
                </>
              ) : (
                <>
                  This will add{" "}
                  <strong>
                    {formatCurrency(
                      (stats?.currentSettings.serviceCharge || 0) -
                        ((stats?.currentSettings.serviceCharge || 0) *
                          (stats?.currentSettings.commissionPercentage || 0)) /
                          100,
                    )}
                  </strong>{" "}
                  to the user's wallet.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmApply}
              className="bg-primary hover:bg-primary-dark cursor-pointer"
              disabled={
                applyCommissionMutation.isPending || applyAllMutation.isPending
              }
            >
              {applyCommissionMutation.isPending ||
              applyAllMutation.isPending ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Confirm"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
