\
import * as z from "zod";

import { sizeConstants } from "@/lib/constants/app.constants";

export const loginSchema = z.object({
  email: z
    .string()
    .email({ message: "Enter a valid email address" })
    .min(sizeConstants.email.minLength, {
      message: sizeConstants.email.message,
    }),
});

export type TLogin = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email address"),
    phoneNumber: z.string().min(10, "Phone Number must be at least 10 characters"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const verifySchema = z.object({
  otp: z.string().length(5, "OTP must be 5 digits"),
});

export type TRegister = z.infer<typeof registerSchema>;
export type TVerify = z.infer<typeof verifySchema>;
