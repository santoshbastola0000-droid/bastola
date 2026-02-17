// src/components/auth/VerifyOTPForm.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import {
  useVerifyMutation,
  useResendVerificationMutation,
} from "@/http/mutations/auth.mutations";
import { routes } from "@/lib/constants/routes";

const VerifyOTPForm = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email =
    searchParams.get("email") ||
    (typeof window !== "undefined"
      ? localStorage.getItem("verificationEmail")
      : null);

  const [otp, setOtp] = useState("");
  const [hasAttempted, setHasAttempted] = useState(false);

  const {
    mutate: verify,
    isPending: isVerifying,
    error: verifyError,
  } = useVerifyMutation();
  const { mutate: resend, isPending: isResending } =
    useResendVerificationMutation();

  useEffect(() => {
    if (!email) {
      router.push(routes.LOGIN);
    }
  }, [email, router]);

  const handleVerify = (value: string) => {
    setOtp(value);
    if (value.length === 5) {
      setHasAttempted(true);
      verify({ email: email!, otp: value });
    }
  };

  const handleResend = () => {
    resend(email!, {
      onSuccess: () => {
        toast.success("Code resent successfully", {
          description: "Please check your email for the new code.",
          style: {
            background: "#10b981",
            color: "#fff",
            border: "none",
          },
        });
      },
    });
    setOtp("");
    setHasAttempted(false);
  };

  if (!email) return null;

  const isError = hasAttempted && !isVerifying && otp.length === 5;

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">Verify your email</h2>
        <p className="mt-2 text-sm text-gray-600">
          We've sent a 5-digit code to{" "}
          <span className="font-medium text-primary">{email}</span>
        </p>
      </div>

      <div className="flex justify-center">
        <InputOTP
          maxLength={5}
          value={otp}
          onChange={handleVerify}
          disabled={isVerifying}
          autoFocus
        >
          <InputOTPGroup>
            {[0, 1, 2, 3, 4].map((index) => (
              <InputOTPSlot
                key={index}
                index={index}
                className={`w-14 h-14 text-lg font-semibold border-2 rounded-xl transition-all ${
                  isError
                    ? "border-red-500 bg-red-50"
                    : "border-gray-200 focus:border-primary"
                }`}
              />
            ))}
          </InputOTPGroup>
        </InputOTP>
      </div>

      <div className="text-center">
        <p className="text-sm text-gray-600 mb-4">Didn't receive the code?</p>
        <Button
          variant="outline"
          onClick={handleResend}
          disabled={isResending || isVerifying}
          isLoading={isResending}
          className="border-primary text-primary hover:bg-primary hover:text-white transition-all duration-200"
        >
          Resend Code
        </Button>
      </div>

      {isError && (
        <p className="text-sm text-center text-red-500">
          Invalid code. Please try again.
        </p>
      )}
    </div>
  );
};

export default VerifyOTPForm;
