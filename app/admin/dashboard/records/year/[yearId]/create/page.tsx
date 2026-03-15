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
import { CreateRecordDTO, PaymentStatus, PayMode } from "@/types/record.types";
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
} from "lucide-react";
import { privateApi } from "@/http/api/privateApi";

export default function CreateRecordPage() {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const yearId = params.yearId as string;

  const [formData, setFormData] = useState<CreateRecordDTO>({
    name: "",
    customerNumber: "",
    roomPlaceNumber: "",
    roomPlaceAddress: "",
    payMode: PayMode.CASH,
    paymentStatus: PaymentStatus.DUE,
    formCharge: 0,
    remarks: "",
    recordYearId: yearId,
  });

  const [inputValues, setInputValues] = useState({
    formCharge: "0",
    customerNumber: "",
    roomPlaceNumber: "",
  });

  // Fetch record year details
  const { data: yearData, isLoading: isLoadingYear } = useQuery({
    queryKey: ["recordYear", yearId],
    queryFn: async () => {
      try {
        const response = await privateApi.get(`/recordYear/${yearId}`);
        return response.data.data;
      } catch (error) {
        console.error("Error fetching year:", error);
        throw error;
      }
    },
    enabled: !!yearId,
  });

  useEffect(() => {
    if (yearId) {
      setFormData((prev) => ({
        ...prev,
        recordYearId: yearId,
      }));
    }
  }, [yearId]);

  const createMutation = useMutation({
    mutationFn: (data: CreateRecordDTO) => recordService.createRecord(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["records", yearId] });
      queryClient.invalidateQueries({ queryKey: ["recordYear", yearId] });

      toast.success("Record created successfully! SMS sent to customer.", {
        style: {
          background: SUCCESSTOAST,
          color: "#fff",
        },
        icon: "✅",
      });
      router.push(`/admin/dashboard/records`);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to create record", {
        style: {
          background: FAILURETOAST,
          color: "#fff",
        },
        icon: "❌",
      });
    },
  });

  const handleTextChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (name === "customerNumber" || name === "roomPlaceNumber") {
      setInputValues((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleNumberInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numericValue = value.replace(/[^0-9.]/g, "");

    setInputValues((prev) => ({
      ...prev,
      [name]: numericValue,
    }));

    if (numericValue === "" || numericValue === ".") {
      setFormData((prev) => ({
        ...prev,
        [name]: 0,
      }));
    } else {
      const numValue = parseFloat(numericValue) || 0;
      setFormData((prev) => ({
        ...prev,
        [name]: numValue,
      }));
    }
  };

  const handleNumberBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (value === "" || value === ".") {
      setInputValues((prev) => ({
        ...prev,
        [name]: "0",
      }));
      setFormData((prev) => ({
        ...prev,
        [name]: 0,
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.name.trim()) {
      toast.error("Customer name is required", {
        style: { background: FAILURETOAST, color: "#fff" },
        icon: "⚠️",
      });
      return;
    }

    if (!formData.customerNumber.trim()) {
      toast.error("Customer number is required", {
        style: { background: FAILURETOAST, color: "#fff" },
        icon: "⚠️",
      });
      return;
    }

    // Validate phone number format
    const phoneRegex = /^[0-9+\-\s()]{7,15}$/;
    if (!phoneRegex.test(formData.customerNumber)) {
      toast.error("Please enter a valid phone number", {
        style: { background: FAILURETOAST, color: "#fff" },
        icon: "⚠️",
      });
      return;
    }

    // Format final data
    const finalData: CreateRecordDTO = {
      ...formData,
      formCharge: formData.formCharge || 0,
      remarks: formData.remarks || "",
      recordYearId: yearId,
      paymentStatus: PaymentStatus.DUE,
    };

    createMutation.mutate(finalData);
  };

  const handleCancel = () => {
    router.push(`/admin/dashboard/records`);
  };

  const isPending = createMutation.isPending;

  const getPaymentStatusIcon = (status: PaymentStatus) => {
    switch (status) {
      case PaymentStatus.PAID:
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case PaymentStatus.DUE:
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getPayModeIcon = (mode: PayMode) => {
    switch (mode) {
      case PayMode.DIGITAL:
        return <CreditCard className="h-4 w-4" />;
      case PayMode.CASH:
        return <Wallet className="h-4 w-4" />;
      default:
        return null;
    }
  };

  if (isLoadingYear) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
          <p className="mt-2 text-gray-600">Loading record year details...</p>
        </div>
      </div>
    );
  }

  const handleSelectChange =
    (name: keyof CreateRecordDTO) => (value: string) => {
      if (name === "payMode") {
        setFormData((prev) => ({
          ...prev,
          [name]: value as PayMode,
        }));
      }
    };

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              className="h-10 px-3 rounded-lg cursor-pointer transition-colors duration-200 hover:bg-gray-100"
              disabled={isPending}
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                Create New Record
              </h1>
              {yearData && !isLoadingYear && (
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant="secondary"
                    className="px-3 py-1 text-sm font-medium bg-blue-50 text-blue-700 border-blue-200"
                  >
                    <span className="flex gap-2 text-sm font-medium text-blue-700">
                      {yearData?.nepaliYear || "Loading..."}
                      <span>{yearData?.nepaliMonthName || "Loading..."}</span>
                    </span>
                  </Badge>
                  {yearData.description && (
                    <span className="text-sm text-gray-500">
                      {yearData.description}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
          <p className="text-base md:text-lg text-gray-600">
            Fill in the customer details to create a new record for{" "}
            {yearData?.year || "this year"}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Information Card */}
              <Card className="border border-gray-200 shadow-sm">
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-center gap-3 mb-4 md:mb-6">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <User className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h2 className="text-lg md:text-xl font-semibold text-gray-900">
                        Personal Information
                      </h2>
                      <p className="text-sm text-gray-500">Customer details</p>
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
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <Input
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleTextChange}
                          placeholder="John Doe"
                          className="pl-10 h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                          required
                          disabled={isPending}
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
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <Input
                          id="customerNumber"
                          name="customerNumber"
                          value={inputValues.customerNumber}
                          onChange={(e) => {
                            setInputValues((prev) => ({
                              ...prev,
                              customerNumber: e.target.value,
                            }));
                            setFormData((prev) => ({
                              ...prev,
                              customerNumber: e.target.value,
                            }));
                          }}
                          placeholder="+977 9800000000"
                          className="pl-10 h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                          required
                          disabled={isPending}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Workplace Information Card */}
              <Card className="border border-gray-200 shadow-sm">
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-center gap-3 mb-4 md:mb-6">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Building className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <h2 className="text-lg md:text-xl font-semibold text-gray-900">
                        Room Information
                      </h2>
                      <p className="text-sm text-gray-500">
                        Room/Office details
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4 md:space-y-5">
                    <div className="space-y-2">
                      <Label
                        htmlFor="workPlaceNumber"
                        className="text-gray-700 font-medium"
                      >
                        Room Owner Number
                      </Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <Input
                          id="roomPlaceNumber"
                          name="roomPlaceNumber"
                          value={inputValues.roomPlaceNumber}
                          onChange={(e) => {
                            setInputValues((prev) => ({
                              ...prev,
                              roomPlaceNumber: e.target.value,
                            }));
                            setFormData((prev) => ({
                              ...prev,
                              roomPlaceNumber: e.target.value,
                            }));
                          }}
                          placeholder="+977 1 4000000"
                          className="pl-10 h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                          disabled={isPending}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="workPlaceAddress"
                        className="text-gray-700 font-medium"
                      >
                        Room Address
                      </Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                        <Textarea
                          id="roomPlaceAddress"
                          name="roomPlaceAddress"
                          value={formData.roomPlaceAddress}
                          onChange={handleTextChange}
                          placeholder="Enter complete room address..."
                          className="pl-10 min-h-[80px] border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg resize-none"
                          rows={3}
                          disabled={isPending}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Information Card */}
              <Card className="border border-gray-200 shadow-sm">
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-center gap-3 mb-4 md:mb-6">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <DollarSign className="h-5 w-5 text-purple-600" />
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
                        value={formData.payMode}
                        onValueChange={handleSelectChange("payMode")}
                        disabled={isPending}
                      >
                        <SelectTrigger className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg">
                          <div className="flex items-center">
                            {getPayModeIcon(formData.payMode)}
                            <span className="ml-2">{formData.payMode}</span>
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          {Object.values(PayMode).map((mode) => (
                            <SelectItem
                              key={mode}
                              value={mode}
                              className="flex items-center py-2"
                            >
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
                        htmlFor="formCharge"
                        className="text-gray-700 font-medium"
                      >
                        Form Charge
                      </Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <Input
                          id="formCharge"
                          name="formCharge"
                          value={inputValues.formCharge}
                          onChange={handleNumberInputChange}
                          onBlur={handleNumberBlur}
                          placeholder="0.00"
                          className="pl-10 h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg text-right"
                          type="text"
                          inputMode="decimal"
                          disabled={isPending}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Remarks Card */}
              <Card className="border border-gray-200 shadow-sm">
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-center gap-3 mb-4 md:mb-6">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <FileText className="h-5 w-5 text-yellow-600" />
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
                      value={formData.remarks}
                      onChange={handleTextChange}
                      placeholder="Enter any additional notes or remarks..."
                      className="min-h-[100px] border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg resize-none"
                      rows={4}
                      disabled={isPending}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Form Actions */}
              <div className="flex flex-col sm:flex-row justify-end gap-4 pt-6 border-t border-gray-200">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isPending}
                  className="h-12 px-6 md:px-8 rounded-lg border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors duration-200 cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isPending}
                  className="h-12 px-6 md:px-8 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer"
                >
                  {isPending ? (
                    <div className="flex items-center">
                      <Loader2 className="animate-spin h-4 w-4 mr-3" />
                      Creating...
                    </div>
                  ) : (
                    "Create Record"
                  )}
                </Button>
              </div>
            </form>
          </div>

          {/* Preview Sidebar */}
          <div className="lg:col-span-1">
            <Card className="border border-gray-200 shadow-sm lg:sticky lg:top-6">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center gap-3 mb-4 md:mb-6">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <Eye className="h-5 w-5 text-indigo-600" />
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
                        <span className="text-sm font-medium text-gray-900">
                          {formData.name || "Not provided"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Contact:</span>
                        <span className="text-sm font-medium text-gray-900">
                          {formData.customerNumber || "Not provided"}
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
                          {getPayModeIcon(formData.payMode)}
                          {formData.payMode}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Status:</span>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs flex items-center gap-1 border-red-200 bg-red-50 text-red-700",
                          )}
                        >
                          {getPaymentStatusIcon(PaymentStatus.DUE)}
                          {PaymentStatus.DUE}
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
                        <span className="text-sm font-medium text-gray-900">
                          Rs. {formData.formCharge.toFixed(2)}
                        </span>
                      </div>
                      <div className="pt-2 border-t border-gray-200">
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-900">
                            Total:
                          </span>
                          <span className="text-sm font-bold text-blue-600">
                            Rs. {formData.formCharge.toFixed(2)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          *Percentage amount can be added later when payment is
                          made
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Year Info */}
                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <div>
                        <p className="text-xs text-blue-600">Recording Year</p>
                        <div className="flex gap-2 text-sm font-medium text-blue-700">
                          <span>{yearData?.nepaliYear || "Loading..."}</span>
                          <span>
                            {yearData?.nepaliMonthName || "Loading..."}
                          </span>
                        </div>
                      </div>
                      <Calendar className="h-5 w-5 text-blue-600" />
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
