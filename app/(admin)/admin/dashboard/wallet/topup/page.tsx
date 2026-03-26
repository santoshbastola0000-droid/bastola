"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Wallet,
  IndianRupee,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  Eye,
  Filter,
  Loader2,
  Upload,
  QrCode,
  Settings,
  ImageIcon,
  User,
} from "lucide-react";
import { unlockService } from "@/http/services/unlock.service";
import { TopUpStatus } from "@/types/unlock.types";
import type { TopUpRequest } from "@/types/unlock.types";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate, formatDateTime, formatNepaliCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import {
  SUCCESSTOAST,
  FAILURETOAST,
  PAGE_SIZE_OPTIONS,
} from "@/lib/constants/app.constants";
import { api } from "@/http/api/api";

// ─── Status Badge ─────────────────────────────────────────────────────────────

const getStatusBadge = (status: TopUpStatus) => {
  switch (status) {
    case TopUpStatus.PENDING:
      return (
        <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
          <Clock className="h-3 w-3 mr-1" />
          Pending
        </Badge>
      );
    case TopUpStatus.APPROVED:
      return (
        <Badge className="bg-green-100 text-green-800 border-green-200">
          <CheckCircle className="h-3 w-3 mr-1" />
          Approved
        </Badge>
      );
    case TopUpStatus.REJECTED:
      return (
        <Badge className="bg-red-100 text-red-800 border-red-200">
          <XCircle className="h-3 w-3 mr-1" />
          Rejected
        </Badge>
      );
    default:
      return <Badge>{status}</Badge>;
  }
};

// ─── Admin Top-Up Page ────────────────────────────────────────────────────────

export default function AdminTopUpPage() {
  const queryClient = useQueryClient();

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(0);
  const [take, setTake] = useState(10);

  // Dialogs
  const [selectedRequest, setSelectedRequest] = useState<TopUpRequest | null>(
    null,
  );
  const [showProcessDialog, setShowProcessDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [processAction, setProcessAction] = useState<"approve" | "reject">(
    "approve",
  );
  const [adminRemarks, setAdminRemarks] = useState("");

  // Settings tab
  const [qrFile, setQrFile] = useState<File | null>(null);
  const [qrPreview, setQrPreview] = useState<string | null>(null);
  const [adminLabel, setAdminLabel] = useState("");
  const [serviceCharge, setServiceCharge] = useState("");
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [uploadingQr, setUploadingQr] = useState(false);

  // Debounce
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(0);
    }, 500);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // ── Fetch settings ──
  const { data: settings, refetch: refetchSettings } = useQuery({
    queryKey: ["unlock-settings"],
    queryFn: () => unlockService.getSettings(),
  });

  useEffect(() => {
    if (settings) {
      setAdminLabel(settings.adminPaymentLabel ?? "");
      setServiceCharge(String(settings.serviceCharge ?? 2000));
      if (settings.adminQrCodeUrl) setQrPreview(settings.adminQrCodeUrl);
    }
  }, [settings]);

  // ── Fetch top-up requests ──
  const {
    data: requestsResponse,
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: [
      "admin-topup-requests",
      page,
      take,
      debouncedSearch,
      statusFilter,
    ],
    queryFn: () =>
      unlockService.getAllTopUpRequests({
        page,
        take,
        search: debouncedSearch || undefined,
        status:
          statusFilter !== "all" ? (statusFilter as TopUpStatus) : undefined,
      }),
  });

  // ── Process mutation ──
  const processMutation = useMutation({
    mutationFn: ({
      id,
      status,
      adminRemarks,
    }: {
      id: string;
      status: TopUpStatus.APPROVED | TopUpStatus.REJECTED;
      adminRemarks?: string;
    }) => unlockService.processTopUpRequest(id, { status, adminRemarks }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-topup-requests"] });
      toast.success("Request processed successfully", {
        style: { background: SUCCESSTOAST, color: "#fff" },
      });
      setShowProcessDialog(false);
      setSelectedRequest(null);
      setAdminRemarks("");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to process request", {
        style: { background: FAILURETOAST, color: "#fff" },
      });
    },
  });

  // ── Settings update ──
  const handleSaveSettings = async () => {
    setSettingsLoading(true);
    try {
      let qrCodeUrl = settings?.adminQrCodeUrl ?? null;

      await unlockService.updateSettings({
        serviceCharge: Number(serviceCharge),
        adminQrCodeUrl: qrCodeUrl ?? undefined,
        adminPaymentLabel: adminLabel || undefined,
      });

      await refetchSettings();
      toast.success("Settings updated successfully", {
        style: { background: SUCCESSTOAST, color: "#fff" },
      });
      setQrFile(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to update settings", {
        style: { background: FAILURETOAST, color: "#fff" },
      });
    } finally {
      setSettingsLoading(false);
      setUploadingQr(false);
    }
  };

  const handleQrFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File must be under 5MB");
      return;
    }
    setQrFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setQrPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleProcessClick = (
    request: TopUpRequest,
    action: "approve" | "reject",
  ) => {
    setSelectedRequest(request);
    setProcessAction(action);
    setAdminRemarks("");
    setShowProcessDialog(true);
  };

  const handleProcess = () => {
    if (!selectedRequest) return;
    processMutation.mutate({
      id: selectedRequest.id,
      status:
        processAction === "approve"
          ? TopUpStatus.APPROVED
          : TopUpStatus.REJECTED,
      adminRemarks: adminRemarks || undefined,
    });
  };

  const requests = requestsResponse?.data ?? [];
  const pagination = requestsResponse?.pagination ?? { total: 0 };
  const totalItems = pagination.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / take));
  const showingFrom = totalItems > 0 ? page * take + 1 : 0;
  const showingTo = Math.min((page + 1) * take, totalItems);

  const pendingCount = requests.filter(
    (r) => r.status === TopUpStatus.PENDING,
  ).length;

  return (
    <div className="p-4 md:p-6 space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-3">
            <Wallet className="h-6 w-6 md:h-8 md:w-8 text-primary" />
            <span>Wallet Top-Up Requests</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Review user payment screenshots and credit wallets
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => refetch()}
          disabled={isFetching}
          className="cursor-pointer"
        >
          <RefreshCw
            className={cn("h-4 w-4 mr-2", isFetching && "animate-spin")}
          />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="requests" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 lg:w-[300px]">
          <TabsTrigger value="requests" className="cursor-pointer relative">
            Requests
            {pendingCount > 0 && (
              <span className="ml-1.5 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                {pendingCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="settings" className="cursor-pointer">
            <Settings className="h-3.5 w-3.5 mr-1.5" />
            Settings
          </TabsTrigger>
        </TabsList>

        {/* ── REQUESTS TAB ── */}
        <TabsContent value="requests" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col lg:flex-row gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search by user name, email, or phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
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
                <div className="flex gap-2">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[140px] cursor-pointer">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value={TopUpStatus.PENDING}>
                        Pending
                      </SelectItem>
                      <SelectItem value={TopUpStatus.APPROVED}>
                        Approved
                      </SelectItem>
                      <SelectItem value={TopUpStatus.REJECTED}>
                        Rejected
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={take.toString()}
                    onValueChange={(v) => {
                      setTake(Number(v));
                      setPage(0);
                    }}
                  >
                    <SelectTrigger className="w-[100px] cursor-pointer">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAGE_SIZE_OPTIONS.map((s) => (
                        <SelectItem
                          key={s}
                          value={s.toString()}
                          className="cursor-pointer"
                        >
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Mobile Cards */}
          <div className="block lg:hidden space-y-3">
            {isLoading ? (
              <div className="text-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
              </div>
            ) : requests.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <Wallet className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                  <p className="font-medium text-sm">
                    No top-up requests found
                  </p>
                </CardContent>
              </Card>
            ) : (
              requests.map((req) => (
                <Card key={req.id} className="overflow-hidden">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {req.user?.name || "Unknown"}
                        </span>
                        {getStatusBadge(req.status)}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(req.createdAt)}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                      <div>
                        <p className="text-muted-foreground">Amount</p>
                        <p className="font-medium flex items-center gap-1">
                          <IndianRupee className="h-3 w-3" />
                          {formatNepaliCurrency(req.amount)}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Phone</p>
                        <p className="font-medium">
                          {req.user?.phoneNumber || "N/A"}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 pt-2 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 h-7 text-xs cursor-pointer"
                        onClick={() => {
                          setSelectedRequest(req);
                          setShowDetailsDialog(true);
                        }}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Screenshot
                      </Button>
                      {req.status === TopUpStatus.PENDING && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleProcessClick(req, "approve")}
                            className="flex-1 h-7 text-xs bg-green-50 text-green-700 hover:bg-green-100 cursor-pointer"
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Approve
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleProcessClick(req, "reject")}
                            className="flex-1 h-7 text-xs bg-red-50 text-red-700 hover:bg-red-100 cursor-pointer"
                          >
                            <XCircle className="h-3 w-3 mr-1" />
                            Reject
                          </Button>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Desktop Table */}
          <div className="hidden lg:block">
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Screenshot</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Requested</TableHead>
                        <TableHead>Processed</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                          </TableCell>
                        </TableRow>
                      ) : requests.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8">
                            <Wallet className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No top-up requests found</p>
                          </TableCell>
                        </TableRow>
                      ) : (
                        requests.map((req) => (
                          <TableRow key={req.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">
                                  {req.user?.name || "Unknown"}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {req.user?.email}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {req.user?.phoneNumber}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-1">
                                <IndianRupee className="h-3 w-3" />
                                {formatNepaliCurrency(req.amount)}
                              </div>
                            </TableCell>
                            <TableCell>
                              <button
                                onClick={() => {
                                  setSelectedRequest(req);
                                  setShowDetailsDialog(true);
                                }}
                                className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
                              >
                                <ImageIcon className="h-3.5 w-3.5" />
                                View Screenshot
                              </button>
                            </TableCell>
                            <TableCell>{getStatusBadge(req.status)}</TableCell>
                            <TableCell className="text-sm">
                              {formatDate(req.createdAt)}
                            </TableCell>
                            <TableCell className="text-sm">
                              {req.processedAt
                                ? formatDate(req.processedAt)
                                : "—"}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    setSelectedRequest(req);
                                    setShowDetailsDialog(true);
                                  }}
                                  className="h-8 w-8 cursor-pointer"
                                  title="View Details"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                {req.status === TopUpStatus.PENDING && (
                                  <>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() =>
                                        handleProcessClick(req, "approve")
                                      }
                                      className="h-8 w-8 text-green-600 hover:text-green-700 cursor-pointer"
                                      title="Approve"
                                    >
                                      <CheckCircle className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() =>
                                        handleProcessClick(req, "reject")
                                      }
                                      className="h-8 w-8 text-red-600 hover:text-red-700 cursor-pointer"
                                      title="Reject"
                                    >
                                      <XCircle className="h-4 w-4" />
                                    </Button>
                                  </>
                                )}
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
                  <div className="text-xs text-muted-foreground">
                    Showing {showingFrom} to {showingTo} of {totalItems} entries
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(Math.max(0, page - 1))}
                      disabled={page === 0}
                      className="h-8 w-8 p-0 cursor-pointer"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    {Array.from({ length: Math.min(5, totalPages) }).map(
                      (_, i) => {
                        let start = Math.max(0, page - 2);
                        const end = Math.min(totalPages - 1, start + 4);
                        if (end - start < 4) start = Math.max(0, end - 4);
                        const pageNum = start + i;
                        if (pageNum > end) return null;
                        return (
                          <Button
                            key={pageNum}
                            variant={page === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => setPage(pageNum)}
                            className="h-8 w-8 p-0 cursor-pointer"
                          >
                            {pageNum + 1}
                          </Button>
                        );
                      },
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setPage(Math.min(totalPages - 1, page + 1))
                      }
                      disabled={page >= totalPages - 1}
                      className="h-8 w-8 p-0 cursor-pointer"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ── SETTINGS TAB ── */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Payment & Unlock Settings
              </CardTitle>
              <CardDescription>
                Configure the QR code users scan to pay, and set the service
                charge for unlocking room details.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Service charge */}
              <div className="space-y-2">
                <Label htmlFor="serviceCharge" className="font-semibold">
                  Room Unlock Service Charge (रू)
                </Label>
                <div className="relative max-w-xs">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                    रू
                  </span>
                  <Input
                    id="serviceCharge"
                    type="number"
                    value={serviceCharge}
                    onChange={(e) => setServiceCharge(e.target.value)}
                    className="pl-8"
                    placeholder="2000"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  This amount is deducted from the user's wallet when they
                  unlock a room's details.
                </p>
              </div>

              <Separator />

              {/* Admin payment label */}
              <div className="space-y-2">
                <Label htmlFor="adminLabel" className="font-semibold">
                  Payment Account Label
                </Label>
                <Input
                  id="adminLabel"
                  value={adminLabel}
                  onChange={(e) => setAdminLabel(e.target.value)}
                  placeholder="e.g. eSewa: 9876543210 | Khalti: RentalService"
                  className="max-w-md"
                />
                <p className="text-xs text-muted-foreground">
                  Shown to users alongside the QR code so they know where to
                  pay.
                </p>
              </div>

              <Separator />

              {/* QR Code upload */}
              <div className="space-y-3">
                <Label className="font-semibold">Admin Payment QR Code</Label>
                <p className="text-xs text-muted-foreground">
                  Upload your eSewa / Khalti / bank QR code. Users will scan
                  this to pay and then upload a screenshot.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 items-start">
                  {/* Preview */}
                  <div className="flex-shrink-0">
                    {qrPreview ? (
                      <div className="relative">
                        <div className="w-40 h-40 rounded-xl border-2 border-primary/20 overflow-hidden bg-white p-2 shadow-md">
                          <img
                            src={qrPreview}
                            alt="QR Code"
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <button
                          onClick={() => {
                            setQrFile(null);
                            setQrPreview(settings?.adminQrCodeUrl ?? null);
                          }}
                          className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center text-xs hover:bg-red-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-40 h-40 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center">
                        <QrCode className="w-10 h-10 text-slate-300 mb-1" />
                        <p className="text-xs text-slate-400">No QR Code</p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <label
                      htmlFor="qr-upload"
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-slate-300 hover:border-primary hover:bg-primary/5 cursor-pointer transition-all text-sm font-medium text-slate-600 hover:text-primary"
                    >
                      <Upload className="w-4 h-4" />
                      {qrFile ? "Change QR Image" : "Upload QR Image"}
                      <input
                        id="qr-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleQrFileChange}
                      />
                    </label>
                    {qrFile && (
                      <p className="text-xs text-emerald-600 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        {qrFile.name} — ready to save
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      JPG, PNG up to 5MB
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  onClick={handleSaveSettings}
                  disabled={settingsLoading}
                  className="cursor-pointer"
                >
                  {settingsLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {uploadingQr ? "Uploading QR..." : "Saving..."}
                    </>
                  ) : (
                    "Save Settings"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── Process Dialog ── */}
      <Dialog open={showProcessDialog} onOpenChange={setShowProcessDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {processAction === "approve" ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Approve Top-Up
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-red-600" />
                  Reject Top-Up
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {processAction === "approve"
                ? "This will credit the amount to the user's wallet."
                : "This will reject the top-up request. No amount will be credited."}
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4 py-4">
              <div className="bg-muted p-3 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">User</span>
                  <span className="font-medium">
                    {selectedRequest.user?.name}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="font-medium flex items-center gap-1">
                    <IndianRupee className="h-3 w-3" />
                    {formatNepaliCurrency(selectedRequest.amount)}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="adminRemarks">
                  {processAction === "approve"
                    ? "Admin Notes (Optional)"
                    : "Rejection Reason"}
                </Label>
                <Textarea
                  id="adminRemarks"
                  placeholder={
                    processAction === "approve"
                      ? "Any notes..."
                      : "Reason for rejection"
                  }
                  value={adminRemarks}
                  onChange={(e) => setAdminRemarks(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowProcessDialog(false);
                setAdminRemarks("");
              }}
              disabled={processMutation.isPending}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              onClick={handleProcess}
              className={cn(
                "cursor-pointer",
                processAction === "approve"
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-red-600 hover:bg-red-700",
              )}
              disabled={processMutation.isPending}
            >
              {processMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : processAction === "approve" ? (
                "Approve & Credit Wallet"
              ) : (
                "Reject Request"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Details / Screenshot Dialog ── */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Top-Up Request Details</DialogTitle>
            <DialogDescription>
              Review the payment screenshot submitted by the user
            </DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4 py-2">
              {/* Status */}
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Status</span>
                {getStatusBadge(selectedRequest.status)}
              </div>

              {/* User Info */}
              <div className="bg-muted p-3 rounded-lg space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" />
                  User Information
                </h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-muted-foreground">Name</span>
                  <span className="font-medium">
                    {selectedRequest.user?.name || "N/A"}
                  </span>
                  <span className="text-muted-foreground">Email</span>
                  <span className="font-medium break-all">
                    {selectedRequest.user?.email || "N/A"}
                  </span>
                  <span className="text-muted-foreground">Phone</span>
                  <span className="font-medium">
                    {selectedRequest.user?.phoneNumber || "N/A"}
                  </span>
                </div>
              </div>

              {/* Request Info */}
              <div className="bg-muted p-3 rounded-lg space-y-2">
                <h4 className="text-sm font-medium">Request Information</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="font-medium flex items-center gap-1">
                    <IndianRupee className="h-3 w-3" />
                    {formatNepaliCurrency(selectedRequest.amount)}
                  </span>
                  <span className="text-muted-foreground">Requested</span>
                  <span className="font-medium">
                    {formatDateTime(selectedRequest.createdAt)}
                  </span>
                  {selectedRequest.processedAt && (
                    <>
                      <span className="text-muted-foreground">Processed</span>
                      <span className="font-medium">
                        {formatDateTime(selectedRequest.processedAt)}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Screenshot */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-1.5">
                  <ImageIcon className="h-3.5 w-3.5" />
                  Payment Screenshot
                </h4>
                {selectedRequest.screenshot ? (
                  <div className="rounded-xl overflow-hidden border border-slate-200">
                    <img
                      src={
                        selectedRequest.screenshot.startsWith("http")
                          ? selectedRequest.screenshot
                          : `${api.defaults.baseURL}/${selectedRequest.screenshot.replace(/^\//, "")}`
                      }
                      alt="Payment Screenshot"
                      className="w-full object-contain max-h-80"
                    />
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-muted-foreground text-sm">
                    No screenshot attached
                  </div>
                )}
              </div>

              {/* Admin remarks */}
              {selectedRequest.adminRemarks && (
                <div className="bg-muted p-3 rounded-lg">
                  <h4 className="text-sm font-medium mb-1">Admin Remarks</h4>
                  <p className="text-sm">{selectedRequest.adminRemarks}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter className="gap-2">
            {selectedRequest?.status === TopUpStatus.PENDING && (
              <>
                <Button
                  variant="outline"
                  onClick={() => handleProcessClick(selectedRequest, "reject")}
                  className="cursor-pointer text-red-600 border-red-200 hover:bg-red-50"
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Reject
                </Button>
                <Button
                  onClick={() => handleProcessClick(selectedRequest, "approve")}
                  className="cursor-pointer bg-green-600 hover:bg-green-700 text-white"
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Approve
                </Button>
              </>
            )}
            <Button
              variant="outline"
              onClick={() => setShowDetailsDialog(false)}
              className="cursor-pointer"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
