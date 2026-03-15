"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { walletService } from "@/http/services/wallet.service";
import { PaymentMethod } from "@/types/wallet.types";
import {
  IndianRupee,
  Landmark,
  Smartphone,
  QrCode,
  Wallet,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import {
  WithdrawalFormData,
  withdrawalSchema,
} from "@/schema/withdrawal.schema";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  maxAmount: number;
}

export function WithdrawalModal({ open, onOpenChange, maxAmount }: Props) {
  const [activeTab, setActiveTab] = useState<PaymentMethod>(
    PaymentMethod.BANK_TRANSFER,
  );
  const [paymentDetails, setPaymentDetails] = useState<any>(null);
  const [detailsValid, setDetailsValid] = useState(false);
  const queryClient = useQueryClient();

  const form = useForm<WithdrawalFormData>({
    resolver: zodResolver(withdrawalSchema),
    defaultValues: {
      amount: undefined,
      paymentMethod: PaymentMethod.BANK_TRANSFER,
      remarks: "",
    },
    mode: "onChange",
  });

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      form.reset();
      setPaymentDetails(null);
      setDetailsValid(false);
      setActiveTab(PaymentMethod.BANK_TRANSFER);
    }
  }, [open, form]);

  const withdrawalMutation = useMutation({
    mutationFn: (data: any) => walletService.createWithdrawalRequest(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wallet-balance"] });
      queryClient.invalidateQueries({ queryKey: ["wallet-withdrawals"] });
      toast.success("Withdrawal request submitted successfully", {
        description: "Your request is pending admin approval",
      });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to submit request");
    },
  });

  const handlePaymentMethodChange = (
    method:
      | PaymentMethod.BANK_TRANSFER
      | PaymentMethod.ESEWA
      | PaymentMethod.KHALTI
      | PaymentMethod.QR_CODE,
  ) => {
    setActiveTab(method);
    form.setValue("paymentMethod", method);
    setPaymentDetails(null);
    setDetailsValid(false);
  };

  const onSubmit = (data: WithdrawalFormData) => {
    if (!paymentDetails || !detailsValid) {
      toast.error("Please fill in valid payment details");
      return;
    }

    withdrawalMutation.mutate({
      amount: data.amount,
      paymentMethod: data.paymentMethod,
      paymentDetails: JSON.stringify(paymentDetails),
      remarks: data.remarks,
    });
  };

  const amount = form.watch("amount");
  const exceedsBalance = amount > maxAmount;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            Request Withdrawal
          </DialogTitle>
          <DialogDescription>
            Withdraw your earnings to your preferred payment method. Minimum
            withdrawal: Rs. 100
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount (NPR)</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                      <Input
                        type="number"
                        placeholder="Enter amount"
                        className={cn(
                          "pl-9",
                          exceedsBalance &&
                            "border-destructive focus-visible:ring-destructive",
                        )}
                        {...field}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value
                              ? parseFloat(e.target.value)
                              : undefined,
                          )
                        }
                        max={maxAmount}
                      />
                    </div>
                  </FormControl>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">
                      Available: Rs. {maxAmount.toLocaleString()}
                    </span>
                    {exceedsBalance && (
                      <span className="text-destructive">
                        Exceeds available balance
                      </span>
                    )}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <FormLabel>Payment Method</FormLabel>
              <Tabs
                value={activeTab}
                onValueChange={(v) =>
                  handlePaymentMethodChange(
                    v as
                      | PaymentMethod.BANK_TRANSFER
                      | PaymentMethod.ESEWA
                      | PaymentMethod.KHALTI
                      | PaymentMethod.QR_CODE,
                  )
                }
              >
                <TabsList className="grid grid-cols-4 w-full">
                  <TabsTrigger
                    value={PaymentMethod.BANK_TRANSFER}
                    className="cursor-pointer"
                  >
                    <Landmark className="h-4 w-4" />
                  </TabsTrigger>
                  <TabsTrigger
                    value={PaymentMethod.ESEWA}
                    className="cursor-pointer"
                  >
                    <Smartphone className="h-4 w-4" />
                  </TabsTrigger>
                  <TabsTrigger
                    value={PaymentMethod.KHALTI}
                    className="cursor-pointer"
                  >
                    <Smartphone className="h-4 w-4" />
                  </TabsTrigger>
                  <TabsTrigger
                    value={PaymentMethod.QR_CODE}
                    className="cursor-pointer"
                  >
                    <QrCode className="h-4 w-4" />
                  </TabsTrigger>
                </TabsList>

                <TabsContent value={PaymentMethod.BANK_TRANSFER}>
                  <BankDetailsForm
                    onChange={setPaymentDetails}
                    onValidityChange={setDetailsValid}
                  />
                </TabsContent>

                <TabsContent value={PaymentMethod.ESEWA}>
                  <EsewaDetailsForm
                    onChange={setPaymentDetails}
                    onValidityChange={setDetailsValid}
                  />
                </TabsContent>

                <TabsContent value={PaymentMethod.KHALTI}>
                  <KhaltiDetailsForm
                    onChange={setPaymentDetails}
                    onValidityChange={setDetailsValid}
                  />
                </TabsContent>

                <TabsContent value={PaymentMethod.QR_CODE}>
                  <QRDetailsForm
                    onChange={setPaymentDetails}
                    onValidityChange={setDetailsValid}
                  />
                </TabsContent>
              </Tabs>
            </div>

            <FormField
              control={form.control}
              name="remarks"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any additional information..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="cursor-pointer"
                disabled={withdrawalMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-primary hover:bg-primary/90 cursor-pointer"
                disabled={
                  withdrawalMutation.isPending ||
                  !form.formState.isValid ||
                  !detailsValid ||
                  exceedsBalance
                }
              >
                {withdrawalMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Request"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function BankDetailsForm({
  onChange,
  onValidityChange,
}: {
  onChange: (data: any) => void;
  onValidityChange: (valid: boolean) => void;
}) {
  const [formData, setFormData] = useState({
    bankName: "",
    accountNumber: "",
    accountName: "",
  });

  const [errors, setErrors] = useState({
    bankName: "",
    accountNumber: "",
    accountName: "",
  });

  const validateField = (name: string, value: string) => {
    if (!value.trim()) {
      return `${name.split(/(?=[A-Z])/).join(" ")} is required`;
    }
    return "";
  };

  const handleChange = (field: string, value: string) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);

    const error = validateField(field, value);
    setErrors((prev) => ({ ...prev, [field]: error }));

    const newErrors = { ...errors, [field]: error };
    const isValid =
      Object.values(newErrors).every((e) => !e) &&
      Object.values(newData).every((v) => v.trim() !== "");

    onValidityChange(isValid);

    if (isValid) {
      onChange(newData);
    }
  };

  return (
    <div className="space-y-4 mt-4">
      <div>
        <Label htmlFor="bankName">Bank Name</Label>
        <Input
          id="bankName"
          placeholder="e.g., Nabil Bank"
          value={formData.bankName}
          onChange={(e) => handleChange("bankName", e.target.value)}
          className={errors.bankName ? "border-destructive" : ""}
        />
        {errors.bankName && (
          <p className="text-xs text-destructive mt-1">{errors.bankName}</p>
        )}
      </div>
      <div>
        <Label htmlFor="accountNumber">Account Number</Label>
        <Input
          id="accountNumber"
          placeholder="Enter account number"
          value={formData.accountNumber}
          onChange={(e) => handleChange("accountNumber", e.target.value)}
          className={errors.accountNumber ? "border-destructive" : ""}
        />
        {errors.accountNumber && (
          <p className="text-xs text-destructive mt-1">
            {errors.accountNumber}
          </p>
        )}
      </div>
      <div>
        <Label htmlFor="accountName">Account Holder Name</Label>
        <Input
          id="accountName"
          placeholder="As per bank records"
          value={formData.accountName}
          onChange={(e) => handleChange("accountName", e.target.value)}
          className={errors.accountName ? "border-destructive" : ""}
        />
        {errors.accountName && (
          <p className="text-xs text-destructive mt-1">{errors.accountName}</p>
        )}
      </div>
    </div>
  );
}

function EsewaDetailsForm({
  onChange,
  onValidityChange,
}: {
  onChange: (data: any) => void;
  onValidityChange: (valid: boolean) => void;
}) {
  const [formData, setFormData] = useState({
    esewaNumber: "",
    accountName: "",
  });

  const [errors, setErrors] = useState({
    esewaNumber: "",
    accountName: "",
  });

  const validateEsewaNumber = (value: string) => {
    if (!value) return "eSewa number is required";
    if (!/^\d{10}$/.test(value)) return "eSewa number must be 10 digits";
    return "";
  };

  const handleChange = (field: string, value: string) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);

    let error = "";
    if (field === "esewaNumber") {
      error = validateEsewaNumber(value);
    } else {
      error = !value.trim() ? "Account name is required" : "";
    }

    setErrors((prev) => ({ ...prev, [field]: error }));

    const newErrors = { ...errors, [field]: error };
    const isValid =
      Object.values(newErrors).every((e) => !e) &&
      Object.values(newData).every((v) => v.trim() !== "");

    onValidityChange(isValid);

    if (isValid) {
      onChange(newData);
    }
  };

  return (
    <div className="space-y-4 mt-4">
      <div>
        <Label htmlFor="esewaNumber">eSewa Number</Label>
        <Input
          id="esewaNumber"
          placeholder="98XXXXXXXX"
          value={formData.esewaNumber}
          onChange={(e) => handleChange("esewaNumber", e.target.value)}
          className={errors.esewaNumber ? "border-destructive" : ""}
          maxLength={10}
        />
        {errors.esewaNumber && (
          <p className="text-xs text-destructive mt-1">{errors.esewaNumber}</p>
        )}
      </div>
      <div>
        <Label htmlFor="accountName">Account Name</Label>
        <Input
          id="accountName"
          placeholder="Name on eSewa account"
          value={formData.accountName}
          onChange={(e) => handleChange("accountName", e.target.value)}
          className={errors.accountName ? "border-destructive" : ""}
        />
        {errors.accountName && (
          <p className="text-xs text-destructive mt-1">{errors.accountName}</p>
        )}
      </div>
    </div>
  );
}

// Khalti Details Form
function KhaltiDetailsForm({
  onChange,
  onValidityChange,
}: {
  onChange: (data: any) => void;
  onValidityChange: (valid: boolean) => void;
}) {
  const [formData, setFormData] = useState({
    khaltiNumber: "",
    accountName: "",
  });

  const [errors, setErrors] = useState({
    khaltiNumber: "",
    accountName: "",
  });

  const validateKhaltiNumber = (value: string) => {
    if (!value) return "Khalti number is required";
    if (!/^\d{10}$/.test(value)) return "Khalti number must be 10 digits";
    return "";
  };

  const handleChange = (field: string, value: string) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);

    let error = "";
    if (field === "khaltiNumber") {
      error = validateKhaltiNumber(value);
    } else {
      error = !value.trim() ? "Account name is required" : "";
    }

    setErrors((prev) => ({ ...prev, [field]: error }));

    const newErrors = { ...errors, [field]: error };
    const isValid =
      Object.values(newErrors).every((e) => !e) &&
      Object.values(newData).every((v) => v.trim() !== "");

    onValidityChange(isValid);

    if (isValid) {
      onChange(newData);
    }
  };

  return (
    <div className="space-y-4 mt-4">
      <div>
        <Label htmlFor="khaltiNumber">Khalti Number</Label>
        <Input
          id="khaltiNumber"
          placeholder="98XXXXXXXX"
          value={formData.khaltiNumber}
          onChange={(e) => handleChange("khaltiNumber", e.target.value)}
          className={errors.khaltiNumber ? "border-destructive" : ""}
          maxLength={10}
        />
        {errors.khaltiNumber && (
          <p className="text-xs text-destructive mt-1">{errors.khaltiNumber}</p>
        )}
      </div>
      <div>
        <Label htmlFor="accountName">Account Name</Label>
        <Input
          id="accountName"
          placeholder="Name on Khalti account"
          value={formData.accountName}
          onChange={(e) => handleChange("accountName", e.target.value)}
          className={errors.accountName ? "border-destructive" : ""}
        />
        {errors.accountName && (
          <p className="text-xs text-destructive mt-1">{errors.accountName}</p>
        )}
      </div>
    </div>
  );
}

// QR Details Form
function QRDetailsForm({
  onChange,
  onValidityChange,
}: {
  onChange: (data: any) => void;
  onValidityChange: (valid: boolean) => void;
}) {
  const [formData, setFormData] = useState({
    qrCodeUrl: "",
    description: "",
  });

  const [errors, setErrors] = useState({
    qrCodeUrl: "",
  });

  const validateUrl = (value: string) => {
    if (!value) return "QR code URL is required";
    try {
      new URL(value);
      return "";
    } catch {
      return "Please enter a valid URL";
    }
  };

  const handleChange = (field: string, value: string) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);

    let error = "";
    if (field === "qrCodeUrl") {
      error = validateUrl(value);
    }

    setErrors((prev) => ({ ...prev, [field]: error }));

    const isValid = !error && newData.qrCodeUrl.trim() !== "";

    onValidityChange(isValid);

    if (isValid) {
      onChange(newData);
    }
  };

  return (
    <div className="space-y-4 mt-4">
      <div>
        <Label htmlFor="qrCodeUrl">QR Code URL</Label>
        <Input
          id="qrCodeUrl"
          placeholder="https://..."
          value={formData.qrCodeUrl}
          onChange={(e) => handleChange("qrCodeUrl", e.target.value)}
          className={errors.qrCodeUrl ? "border-destructive" : ""}
        />
        {errors.qrCodeUrl && (
          <p className="text-xs text-destructive mt-1">{errors.qrCodeUrl}</p>
        )}
      </div>
      <div>
        <Label htmlFor="description">Description (Optional)</Label>
        <Textarea
          id="description"
          placeholder="Additional payment info..."
          value={formData.description}
          onChange={(e) => handleChange("description", e.target.value)}
        />
      </div>
    </div>
  );
}
