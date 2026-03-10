// src/components/user/wallet/WithdrawalModal.tsx
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
} from "lucide-react";

const withdrawalSchema = z.object({
  amount: z
    .number()
    .min(100, "Minimum withdrawal amount is Rs. 100")
    .max(100000, "Maximum withdrawal amount is Rs. 100,000"),
  paymentMethod: z.enum([
    PaymentMethod.BANK_TRANSFER,
    PaymentMethod.ESEWA,
    PaymentMethod.KHALTI,
    PaymentMethod.QR_CODE,
    PaymentMethod.CASH,
  ]),
  remarks: z.string().optional(),
});

const bankDetailsSchema = z.object({
  bankName: z.string().min(1, "Bank name is required"),
  accountNumber: z.string().min(1, "Account number is required"),
  accountName: z.string().min(1, "Account holder name is required"),
});

const esewaDetailsSchema = z.object({
  esewaNumber: z.string().min(10, "Valid eSewa number is required"),
  accountName: z.string().min(1, "Account name is required"),
});

const khaltiDetailsSchema = z.object({
  khaltiNumber: z.string().min(10, "Valid Khalti number is required"),
  accountName: z.string().min(1, "Account name is required"),
});

const qrDetailsSchema = z.object({
  qrCodeUrl: z.string().url("Valid QR code URL is required"),
  description: z.string().optional(),
});

type WithdrawalFormData = z.infer<typeof withdrawalSchema>;

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
  const queryClient = useQueryClient();

  const form = useForm<WithdrawalFormData>({
    resolver: zodResolver(withdrawalSchema),
    defaultValues: {
      amount: undefined,
      paymentMethod: PaymentMethod.BANK_TRANSFER,
      remarks: "",
    },
  });

  const withdrawalMutation = useMutation({
    mutationFn: (data: any) => walletService.createWithdrawalRequest(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wallet-balance"] });
      queryClient.invalidateQueries({ queryKey: ["wallet-withdrawals"] });
      toast.success("Withdrawal request submitted successfully");
      onOpenChange(false);
      form.reset();
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to submit request");
    },
  });

  const handlePaymentMethodChange = (method: PaymentMethod) => {
    setActiveTab(method);
    form.setValue("paymentMethod", method);
  };

  const onSubmit = (data: WithdrawalFormData) => {
    if (!paymentDetails) {
      toast.error("Please fill in payment details");
      return;
    }

    withdrawalMutation.mutate({
      ...data,
      paymentDetails: JSON.stringify(paymentDetails),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
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
                        className="pl-9"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseFloat(e.target.value))
                        }
                        max={maxAmount}
                      />
                    </div>
                  </FormControl>
                  <p className="text-xs text-muted-foreground">
                    Available balance: Rs. {maxAmount.toLocaleString()}
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <FormLabel>Payment Method</FormLabel>
              <Tabs
                value={activeTab}
                onValueChange={(v) =>
                  handlePaymentMethodChange(v as PaymentMethod)
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
                  <BankDetailsForm onChange={setPaymentDetails} />
                </TabsContent>

                <TabsContent value={PaymentMethod.ESEWA}>
                  <EsewaDetailsForm onChange={setPaymentDetails} />
                </TabsContent>

                <TabsContent value={PaymentMethod.KHALTI}>
                  <KhaltiDetailsForm onChange={setPaymentDetails} />
                </TabsContent>

                <TabsContent value={PaymentMethod.QR_CODE}>
                  <QRDetailsForm onChange={setPaymentDetails} />
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
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-primary hover:bg-primary-dark cursor-pointer"
                disabled={withdrawalMutation.isPending}
              >
                {withdrawalMutation.isPending
                  ? "Submitting..."
                  : "Submit Request"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// Payment detail form components
function BankDetailsForm({ onChange }: { onChange: (data: any) => void }) {
  const form = useForm({
    resolver: zodResolver(bankDetailsSchema),
    defaultValues: {
      bankName: "",
      accountNumber: "",
      accountName: "",
    },
  });

  const values = form.watch();
  onChange(values);

  return (
    <div className="space-y-4 mt-4">
      <FormField
        control={form.control}
        name="bankName"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Bank Name</FormLabel>
            <FormControl>
              <Input placeholder="e.g., Nabil Bank" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="accountNumber"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Account Number</FormLabel>
            <FormControl>
              <Input placeholder="Enter account number" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="accountName"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Account Holder Name</FormLabel>
            <FormControl>
              <Input placeholder="As per bank records" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}

function EsewaDetailsForm({ onChange }: { onChange: (data: any) => void }) {
  const form = useForm({
    resolver: zodResolver(esewaDetailsSchema),
    defaultValues: {
      esewaNumber: "",
      accountName: "",
    },
  });

  const values = form.watch();
  onChange(values);

  return (
    <div className="space-y-4 mt-4">
      <FormField
        control={form.control}
        name="esewaNumber"
        render={({ field }) => (
          <FormItem>
            <FormLabel>eSewa Number</FormLabel>
            <FormControl>
              <Input placeholder="98XXXXXXXX" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="accountName"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Account Name</FormLabel>
            <FormControl>
              <Input placeholder="Name on eSewa account" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}

function KhaltiDetailsForm({ onChange }: { onChange: (data: any) => void }) {
  const form = useForm({
    resolver: zodResolver(khaltiDetailsSchema),
    defaultValues: {
      khaltiNumber: "",
      accountName: "",
    },
  });

  const values = form.watch();
  onChange(values);

  return (
    <div className="space-y-4 mt-4">
      <FormField
        control={form.control}
        name="khaltiNumber"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Khalti Number</FormLabel>
            <FormControl>
              <Input placeholder="98XXXXXXXX" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="accountName"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Account Name</FormLabel>
            <FormControl>
              <Input placeholder="Name on Khalti account" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}

function QRDetailsForm({ onChange }: { onChange: (data: any) => void }) {
  const form = useForm({
    resolver: zodResolver(qrDetailsSchema),
    defaultValues: {
      qrCodeUrl: "",
      description: "",
    },
  });

  const values = form.watch();
  onChange(values);

  return (
    <div className="space-y-4 mt-4">
      <FormField
        control={form.control}
        name="qrCodeUrl"
        render={({ field }) => (
          <FormItem>
            <FormLabel>QR Code URL</FormLabel>
            <FormControl>
              <Input placeholder="https://..." {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Description (Optional)</FormLabel>
            <FormControl>
              <Textarea placeholder="Additional payment info..." {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
