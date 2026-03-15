"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { recordService } from "@/http/services/record.service";
import {
  UpdateRecordDTO,
  PaymentStatus,
  PayMode,
  Record,
} from "@/types/record.types";
import { FAILURETOAST, SUCCESSTOAST } from "@/lib/constants/app.constants";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Calendar,
  CreditCard,
  DollarSign,
  FileText,
  Phone,
  User,
  Wallet,
  CheckCircle,
  AlertCircle,
  Building,
  MapPin,
  Eye,
  Loader2,
  Save,
  Pencil,
  X,
  Receipt,
  Home,
} from "lucide-react";
import { privateApi } from "@/http/api/privateApi";

export default function EditRecordPage() {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const recordId = params.recordId as string;

  const [formData, setFormData] = useState<UpdateRecordDTO | null>(null);
  const [inputValues, setInputValues] = useState({
    formCharge: "0",
    customerNumber: "",
    roomPlaceNumber: "",
  });
  const [originalData, setOriginalData] = useState<Record | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // Fetch record data
  const { data: record, isLoading } = useQuery({
    queryKey: ["record", recordId],
    queryFn: async () => {
      try {
        const response = await privateApi.get(`/record/${recordId}`);
        return response.data.data;
      } catch (error) {
        console.error("Error fetching record:", error);
        throw error;
      }
    },
    enabled: !!recordId,
  });

  // Initialize form when record is fetched
  useEffect(() => {
    if (record && !formData) {
      const initialFormData: UpdateRecordDTO = {
        name: record.name || "",
        customerNumber: record.customerNumber || "",
        roomPlaceNumber: record.roomPlaceNumber || "",
        roomPlaceAddress: record.roomPlaceAddress || "",
        payMode: (record.payMode as PayMode) || PayMode.CASH,
        paymentStatus:
          (record.paymentStatus as PaymentStatus) || PaymentStatus.DUE,
        formCharge: record.formCharge || 0,
        remarks: record.remarks || "",
        recordYearId: record.recordYearId || "",
      };

      setFormData(initialFormData);
      setOriginalData(record);

      setInputValues({
        formCharge: (record.formCharge || 0).toString(),
        customerNumber: record.customerNumber || "",
        roomPlaceNumber: record.roomPlaceNumber || "",
      });
    }
  }, [record, formData]);

  const updateMutation = useMutation({
    mutationFn: (data: UpdateRecordDTO) =>
      recordService.updateRecord(recordId, data),
    onSuccess: (updatedRecord) => {
      queryClient.invalidateQueries({ queryKey: ["record", recordId] });
      queryClient.invalidateQueries({ queryKey: ["records"] });
      queryClient.invalidateQueries({
        queryKey: ["recordYear", updatedRecord.data?.recordYearId],
      });

      toast.success("Record updated successfully!", {
        style: { background: SUCCESSTOAST, color: "#fff" },
        icon: "✅",
      });

      if (
        formData?.paymentStatus === PaymentStatus.PAID &&
        originalData?.paymentStatus !== PaymentStatus.PAID &&
        formData.formCharge &&
        formData.formCharge > 0
      ) {
        toast.info("Payment confirmation SMS sent to customer", {
          style: { background: "#ea580c", color: "#fff" },
        });
      }

      router.push(`/admin/dashboard/records`);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to update record", {
        style: { background: FAILURETOAST, color: "#fff" },
        icon: "❌",
      });
    },
  });

  const handleTextChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    if (!formData) return;

    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev!, [name]: value }));

    if (name === "customerNumber" || name === "roomPlaceNumber") {
      setInputValues((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleNumberInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!formData) return;

    const { name, value } = e.target;
    const numericValue = value.replace(/[^0-9.]/g, "");

    setInputValues((prev) => ({ ...prev, [name]: numericValue }));

    const numValue =
      numericValue === "" || numericValue === "."
        ? 0
        : parseFloat(numericValue) || 0;
    setFormData((prev) => ({ ...prev!, [name]: numValue }));
  };

  const handleNumberBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (value === "" || value === ".") {
      setInputValues((prev) => ({ ...prev, [name]: "0" }));
      setFormData((prev) => ({ ...prev!, [name]: 0 }));
    }
  };

  const handleSelectChange =
    (name: keyof UpdateRecordDTO) => (value: string) => {
      if (!formData) return;

      if (name === "paymentStatus") {
        setFormData((prev) => ({ ...prev!, [name]: value as PaymentStatus }));
      } else if (name === "payMode") {
        setFormData((prev) => ({ ...prev!, [name]: value as PayMode }));
      }
    };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData || !originalData) return;

    if (!formData.name?.trim()) {
      toast.error("Customer name is required", {
        style: { background: FAILURETOAST, color: "#fff" },
        icon: "⚠️",
      });
      return;
    }

    if (!formData.customerNumber?.trim()) {
      toast.error("Customer number is required", {
        style: { background: FAILURETOAST, color: "#fff" },
        icon: "⚠️",
      });
      return;
    }

    const phoneRegex = /^[0-9+\-\s()]{7,15}$/;
    if (formData.customerNumber && !phoneRegex.test(formData.customerNumber)) {
      toast.error("Please enter a valid phone number", {
        style: { background: FAILURETOAST, color: "#fff" },
        icon: "⚠️",
      });
      return;
    }

    if (
      formData.paymentStatus === PaymentStatus.PAID &&
      (!formData.formCharge || formData.formCharge <= 0)
    ) {
      toast.error("Form charge is required when payment status is PAID", {
        style: { background: FAILURETOAST, color: "#fff" },
        icon: "⚠️",
      });
      return;
    }

    const updateData: UpdateRecordDTO = {};

    if (formData.name !== originalData.name) updateData.name = formData.name;
    if (formData.customerNumber !== originalData.customerNumber)
      updateData.customerNumber = formData.customerNumber;
    if (formData.roomPlaceNumber !== originalData.roomPlaceNumber)
      updateData.roomPlaceNumber = formData.roomPlaceNumber;
    if (formData.roomPlaceAddress !== originalData.roomPlaceAddress)
      updateData.roomPlaceAddress = formData.roomPlaceAddress;
    if (formData.payMode !== originalData.payMode)
      updateData.payMode = formData.payMode;
    if (formData.paymentStatus !== originalData.paymentStatus)
      updateData.paymentStatus = formData.paymentStatus;
    if (formData.formCharge !== originalData.formCharge)
      updateData.formCharge = formData.formCharge;
    if (formData.remarks !== originalData.remarks)
      updateData.remarks = formData.remarks;
    if (formData.recordYearId !== originalData.recordYearId)
      updateData.recordYearId = formData.recordYearId;

    if (Object.keys(updateData).length > 0) {
      updateMutation.mutate(updateData);
    } else {
      toast.info("No changes detected", {
        style: {
          background: "hsl(var(--muted))",
          color: "hsl(var(--muted-foreground))",
        },
      });
    }
  };

  const handleCancel = () => router.push(`/admin/dashboard/records`);
  const isPending = updateMutation.isPending;

  if (isLoading || !formData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="mt-2 text-gray-600">Loading record details...</p>
        </div>
      </div>
    );
  }

  const resetToOriginal = () => {
    if (originalData) {
      setFormData({
        name: originalData.name || "",
        customerNumber: originalData.customerNumber || "",
        roomPlaceNumber: originalData.roomPlaceNumber || "",
        roomPlaceAddress: originalData.roomPlaceAddress || "",
        payMode: (originalData.payMode as PayMode) || PayMode.CASH,
        paymentStatus:
          (originalData.paymentStatus as PaymentStatus) || PaymentStatus.DUE,
        formCharge: originalData.formCharge || 0,
        remarks: originalData.remarks || "",
        recordYearId: originalData.recordYearId || "",
      });

      setInputValues({
        formCharge: (originalData.formCharge || 0).toString(),
        customerNumber: originalData.customerNumber || "",
        roomPlaceNumber: originalData.roomPlaceNumber || "",
      });

      toast.info("Form reset to original values", {
        style: {
          background: "hsl(var(--muted))",
          color: "hsl(var(--muted-foreground))",
        },
      });
    }
  };

  const getPaymentStatusIcon = (status: PaymentStatus) => {
    return status === PaymentStatus.PAID ? (
      <CheckCircle className="h-4 w-4 text-green-600" />
    ) : (
      <AlertCircle className="h-4 w-4 text-red-600" />
    );
  };

  const getPaymentStatusColor = (status: PaymentStatus) => {
    return status === PaymentStatus.PAID
      ? "border-green-200 bg-green-50 text-green-700"
      : "border-red-200 bg-red-50 text-red-700";
  };

  const getPayModeIcon = (mode: PayMode) => {
    return mode === PayMode.DIGITAL ? (
      <CreditCard className="h-4 w-4" />
    ) : (
      <Wallet className="h-4 w-4" />
    );
  };

  const calculateTotalAmount = () => {
    return formData.formCharge || 0;
  };

  const isFormModified = () => {
    if (!originalData) return false;

    return (
      formData.name !== originalData.name ||
      formData.customerNumber !== originalData.customerNumber ||
      formData.roomPlaceNumber !== originalData.roomPlaceNumber ||
      formData.roomPlaceAddress !== originalData.roomPlaceAddress ||
      formData.payMode !== originalData.payMode ||
      formData.paymentStatus !== originalData.paymentStatus ||
      formData.formCharge !== originalData.formCharge ||
      formData.remarks !== originalData.remarks ||
      formData.recordYearId !== originalData.recordYearId
    );
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (!record) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Record Not Found
          </h2>
          <p className="text-gray-600 mb-4">
            The record you're trying to edit doesn't exist.
          </p>
          <Button onClick={handleCancel} className="cursor-pointer">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Records
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                disabled={isPending}
                className="cursor-pointer"
              >
                <ArrowLeft className="h-5 w-5 mr-2" /> Back
              </Button>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                  Edit Record
                </h1>
                <p className="text-base md:text-lg text-gray-600">
                  Update customer record details
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
              className="cursor-pointer border-primary/20 hover:bg-primary/5"
            >
              {showPreview ? (
                <>
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit Mode
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4 mr-2" />
                  Preview Mode
                </>
              )}
            </Button>
          </div>

          {/* Record Info Card */}
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-primary/70">Created On</p>
                  <p className="font-medium">{formatDate(record.createdAt)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-primary/70">Last Updated</p>
                  <p className="font-medium">{formatDate(record.updatedAt)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-primary/70">Record Year</p>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span className="font-medium">
                      {record.recordYear?.nepaliYear || "N/A"}/
                      {record.recordYear?.nepaliMonth
                        ?.toString()
                        .padStart(2, "0") || "00"}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Information */}
              <Card className="border border-gray-200 shadow-sm">
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-center gap-3 mb-4 md:mb-6">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-lg md:text-xl font-semibold text-gray-900">
                        Customer Information
                      </h2>
                      <p className="text-sm text-gray-500">Personal details</p>
                    </div>
                  </div>

                  <div className="space-y-4 md:space-y-5">
                    <div className="space-y-2">
                      <Label
                        htmlFor="name"
                        className="text-gray-700 font-medium"
                      >
                        Full Name <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <Input
                          id="name"
                          name="name"
                          value={formData.name || ""}
                          onChange={handleTextChange}
                          placeholder="John Doe"
                          className="pl-10 h-11"
                          required
                          disabled={isPending || showPreview}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="customerNumber"
                        className="text-gray-700 font-medium"
                      >
                        Contact Number <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <Input
                          id="customerNumber"
                          name="customerNumber"
                          value={inputValues.customerNumber}
                          onChange={handleTextChange}
                          placeholder="+977 9800000000"
                          className="pl-10 h-11"
                          required
                          disabled={isPending || showPreview}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Room Information */}
              <Card className="border border-gray-200 shadow-sm">
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-center gap-3 mb-4 md:mb-6">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Home className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-lg md:text-xl font-semibold text-gray-900">
                        Room Information
                      </h2>
                      <p className="text-sm text-gray-500">
                        Room/Property details
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4 md:space-y-5">
                    <div className="space-y-2">
                      <Label
                        htmlFor="roomPlaceNumber"
                        className="text-gray-700 font-medium"
                      >
                        Room/Place Number
                      </Label>
                      <div className="relative">
                        <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <Input
                          id="roomPlaceNumber"
                          name="roomPlaceNumber"
                          value={inputValues.roomPlaceNumber}
                          onChange={handleTextChange}
                          placeholder="Room 101, Block A"
                          className="pl-10 h-11"
                          disabled={isPending || showPreview}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="roomPlaceAddress"
                        className="text-gray-700 font-medium"
                      >
                        Room/Place Address
                      </Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                        <Textarea
                          id="roomPlaceAddress"
                          name="roomPlaceAddress"
                          value={formData.roomPlaceAddress || ""}
                          onChange={handleTextChange}
                          placeholder="Enter complete room address..."
                          className="pl-10 min-h-[80px] resize-none"
                          rows={3}
                          disabled={isPending || showPreview}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Information */}
              <Card className="border border-gray-200 shadow-sm">
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-center gap-3 mb-4 md:mb-6">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <DollarSign className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-lg md:text-xl font-semibold text-gray-900">
                        Payment Information
                      </h2>
                      <p className="text-sm text-gray-500">
                        Payment details and charges
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
                    <div className="space-y-2">
                      <Label
                        htmlFor="payMode"
                        className="text-gray-700 font-medium"
                      >
                        Payment Mode <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={formData.payMode || PayMode.CASH}
                        onValueChange={handleSelectChange("payMode")}
                        disabled={isPending || showPreview}
                      >
                        <SelectTrigger className="h-11">
                          <div className="flex items-center">
                            {getPayModeIcon(formData.payMode || PayMode.CASH)}
                            <span className="ml-2">
                              {formData.payMode || PayMode.CASH}
                            </span>
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          {Object.values(PayMode).map((mode) => (
                            <SelectItem key={mode} value={mode}>
                              <div className="flex items-center">
                                {getPayModeIcon(mode)}
                                <span className="ml-2">{mode}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="paymentStatus"
                        className="text-gray-700 font-medium"
                      >
                        Payment Status <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={formData.paymentStatus || PaymentStatus.DUE}
                        onValueChange={handleSelectChange("paymentStatus")}
                        disabled={isPending || showPreview}
                      >
                        <SelectTrigger
                          className={cn(
                            "h-11",
                            getPaymentStatusColor(
                              formData.paymentStatus || PaymentStatus.DUE,
                            ),
                          )}
                        >
                          <div className="flex items-center">
                            {getPaymentStatusIcon(
                              formData.paymentStatus || PaymentStatus.DUE,
                            )}
                            <span className="ml-2">
                              {formData.paymentStatus || PaymentStatus.DUE}
                            </span>
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          {Object.values(PaymentStatus).map((status) => (
                            <SelectItem key={status} value={status}>
                              <div className="flex items-center">
                                {getPaymentStatusIcon(status)}
                                <span className="ml-2">{status}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label
                        htmlFor="formCharge"
                        className="text-gray-700 font-medium"
                      >
                        Form Charge (NPR)
                      </Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <Input
                          id="formCharge"
                          name="formCharge"
                          value={inputValues.formCharge}
                          onChange={handleNumberInputChange}
                          onBlur={handleNumberBlur}
                          placeholder="0.00"
                          className="pl-10 h-11 text-right"
                          type="text"
                          inputMode="decimal"
                          disabled={isPending || showPreview}
                        />
                      </div>
                      {formData.paymentStatus === PaymentStatus.PAID &&
                        (!formData.formCharge || formData.formCharge <= 0) && (
                          <p className="text-sm text-red-500">
                            Form charge is required when status is PAID
                          </p>
                        )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Remarks */}
              <Card className="border border-gray-200 shadow-sm">
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-center gap-3 mb-4 md:mb-6">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-lg md:text-xl font-semibold text-gray-900">
                        Additional Information
                      </h2>
                      <p className="text-sm text-gray-500">Notes and remarks</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="remarks"
                      className="text-gray-700 font-medium"
                    >
                      Remarks (Optional)
                    </Label>
                    <Textarea
                      id="remarks"
                      name="remarks"
                      value={formData.remarks || ""}
                      onChange={handleTextChange}
                      placeholder="Enter any additional notes or remarks..."
                      className="min-h-[100px] resize-none"
                      rows={4}
                      disabled={isPending || showPreview}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Form Actions */}
              {!showPreview && (
                <div className="flex flex-col sm:flex-row justify-end gap-4 pt-6 border-t border-gray-200">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                    disabled={isPending}
                    className="cursor-pointer"
                  >
                    Cancel
                  </Button>

                  {originalData && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={resetToOriginal}
                      disabled={isPending || !isFormModified()}
                      className="cursor-pointer"
                    >
                      <X className="h-4 w-4 mr-2" /> Reset
                    </Button>
                  )}

                  <Button
                    type="submit"
                    disabled={isPending || !isFormModified()}
                    className="cursor-pointer bg-primary hover:bg-primary-dark text-white"
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="animate-spin h-4 w-4 mr-3" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Update Record
                      </>
                    )}
                  </Button>
                </div>
              )}
            </form>
          </div>

          {/* Preview Sidebar */}
          <div className="lg:col-span-1">
            <Card className="border border-gray-200 shadow-sm lg:sticky lg:top-6">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center gap-3 mb-4 md:mb-6">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Eye className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg md:text-xl font-semibold text-gray-900">
                      Preview
                    </h2>
                    <p className="text-sm text-gray-500">Record summary</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Customer Info */}
                  <div className="space-y-3">
                    <h3 className="font-medium text-gray-900">Customer</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Name:</span>
                        <span className="text-sm font-medium">
                          {formData.name || "Not provided"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Contact:</span>
                        <span className="text-sm font-medium">
                          {formData.customerNumber || "Not provided"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Room Info */}
                  <div className="space-y-3 pt-4 border-t border-gray-200">
                    <h3 className="font-medium text-gray-900">Room</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">
                          Room Number:
                        </span>
                        <span className="text-sm font-medium">
                          {formData.roomPlaceNumber || "Not provided"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Address:</span>
                        <span className="text-sm font-medium text-right">
                          {formData.roomPlaceAddress || "Not provided"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Payment Info */}
                  <div className="space-y-3 pt-4 border-t border-gray-200">
                    <h3 className="font-medium text-gray-900">Payment</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Mode:</span>
                        <Badge
                          variant="outline"
                          className="text-xs flex items-center gap-1"
                        >
                          {getPayModeIcon(formData.payMode || PayMode.CASH)}
                          {formData.payMode || PayMode.CASH}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Status:</span>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs flex items-center gap-1",
                            getPaymentStatusColor(
                              formData.paymentStatus || PaymentStatus.DUE,
                            ),
                          )}
                        >
                          {getPaymentStatusIcon(
                            formData.paymentStatus || PaymentStatus.DUE,
                          )}
                          {formData.paymentStatus || PaymentStatus.DUE}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Charges */}
                  <div className="space-y-3 pt-4 border-t border-gray-200">
                    <h3 className="font-medium text-gray-900">Charges</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">
                          Form Charge:
                        </span>
                        <span className="text-sm font-medium">
                          Rs. {(formData.formCharge || 0).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-gray-200">
                        <span className="text-sm font-medium text-gray-900">
                          Total:
                        </span>
                        <span className="text-sm font-bold text-primary">
                          Rs. {calculateTotalAmount().toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* SMS Notification */}
                  {formData.paymentStatus === PaymentStatus.PAID &&
                    formData.formCharge &&
                    formData.formCharge > 0 &&
                    originalData?.paymentStatus !== PaymentStatus.PAID && (
                      <div className="pt-4 border-t border-gray-200">
                        <div className="p-3 bg-green-50 rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <Receipt className="h-4 w-4 text-green-600" />
                            <p className="text-sm font-medium text-green-700">
                              Payment Confirmation SMS
                            </p>
                          </div>
                          <p className="text-xs text-green-600">
                            Will be sent to customer upon update
                          </p>
                        </div>
                      </div>
                    )}

                  {/* Form Status */}
                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Changes:</span>
                      <Badge
                        variant={isFormModified() ? "default" : "outline"}
                        className={
                          isFormModified()
                            ? "bg-primary/10 text-primary border-primary/20"
                            : ""
                        }
                      >
                        {isFormModified() ? "Modified" : "No Changes"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
