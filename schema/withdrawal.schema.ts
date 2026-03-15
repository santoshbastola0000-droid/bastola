import { PaymentMethod } from "@/types/wallet.types";
import z from "zod";

export const withdrawalSchema = z.object({
  amount: z
    .number({ invalid_type_error: "Amount must be a number" })
    .min(100, "Minimum withdrawal amount is Rs. 100")
    .max(100000, "Maximum withdrawal amount is Rs. 100,000"),
  paymentMethod: z.enum([
    PaymentMethod.BANK_TRANSFER,
    PaymentMethod.ESEWA,
    PaymentMethod.KHALTI,
    PaymentMethod.QR_CODE,
  ]),
  remarks: z.string().optional(),
});

export const bankDetailsSchema = z.object({
  bankName: z.string().min(1, "Bank name is required"),
  accountNumber: z.string().min(1, "Account number is required"),
  accountName: z.string().min(1, "Account holder name is required"),
});

export const esewaDetailsSchema = z.object({
  esewaNumber: z.string().min(10, "Valid eSewa number is required").max(10),
  accountName: z.string().min(1, "Account name is required"),
});

export const khaltiDetailsSchema = z.object({
  khaltiNumber: z.string().min(10, "Valid Khalti number is required").max(10),
  accountName: z.string().min(1, "Account name is required"),
});

export const qrDetailsSchema = z.object({
  qrCodeUrl: z.string().url("Valid QR code URL is required"),
  description: z.string().optional(),
});

export type WithdrawalFormData = z.infer<typeof withdrawalSchema>;
