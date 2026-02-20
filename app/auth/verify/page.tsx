"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  useVerifyEmailMutation,
  useResendVerificationMutation,
} from "@/http/mutations/auth.mutations";
import { useTokenStore } from "@/store";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

import {
  Mail,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  ArrowRight,
  AlertTriangle,
  Shield,
} from "lucide-react";

type StatusConfig = {
  icon: React.ReactNode;
  title: string;
  description: string;
  actions: ("resend" | "continue" | "signup")[];
  color: string;
};

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setToken } = useTokenStore();

  // State
  const [email, setEmail] = useState<string>("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [verificationAttempted, setVerificationAttempted] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Refs
  const cooldownTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Get token from URL
  const token = searchParams.get("token");
  const urlEmail = searchParams.get("email");

  // Mutations
  const verifyMutation = useVerifyEmailMutation();
  const resendMutation = useResendVerificationMutation();

  // Initialize email
  useEffect(() => {
    const getEmail = () => {
      if (urlEmail) {
        localStorage.setItem("verificationEmail", urlEmail);
        return urlEmail;
      }

      const storedEmail = localStorage.getItem("verificationEmail");
      if (storedEmail) {
        return storedEmail;
      }

      return "";
    };

    const foundEmail = getEmail();
    setEmail(foundEmail);
    setIsInitialized(true);
  }, [urlEmail]);

  // Auto-verify when token exists
  useEffect(() => {
    if (
      token &&
      isInitialized &&
      !verifyMutation.isPending &&
      !verificationAttempted
    ) {
      setVerificationAttempted(true);
      verifyMutation.mutate(token, {
        onSuccess: (data) => {
          if (data.accessToken) {
            setToken(data.accessToken);
          }
          localStorage.removeItem("verificationEmail");
        },
      });
    }
  }, [token, isInitialized, verificationAttempted, verifyMutation, setToken]);

  // Cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      cooldownTimerRef.current = setTimeout(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (cooldownTimerRef.current) {
        clearTimeout(cooldownTimerRef.current);
      }
    };
  }, [resendCooldown]);

  const handleResendEmail = useCallback(() => {
    if (!email) {
      toast.error("Cannot resend verification", {
        description: "No email address available",
      });
      return;
    }

    setResendCooldown(30);
    resendMutation.mutate(email, {
      onSuccess: () => {
        localStorage.setItem("verificationEmail", email);
        toast.success("Verification email sent!", {
          description: `Please check your inbox at ${email}`,
        });
      },
    });
  }, [email, resendMutation]);

  const handleContinue = useCallback(() => {
    localStorage.removeItem("verificationEmail");
    router.push("/login");
  }, [router]);

  const handleReturnToSignup = useCallback(() => {
    localStorage.removeItem("verificationEmail");
    router.push("/signup");
  }, [router]);

  const getStatusConfig = (): StatusConfig => {
    if (token && verifyMutation.isPending) {
      return {
        icon: <Clock className="h-12 w-12 animate-spin text-primary" />,
        title: "Verifying your email",
        description: "Please wait while we confirm your email address...",
        actions: [],
        color: "text-primary",
      };
    }

    if (verifyMutation.isSuccess) {
      return {
        icon: <CheckCircle2 className="h-12 w-12 text-green-600" />,
        title: "Email verified!",
        description:
          "Your email has been successfully verified. You can now access all features.",
        actions: ["continue"],
        color: "text-green-600",
      };
    }

    if (verifyMutation.isError) {
      const errorMessage =
        (verifyMutation.error as any)?.response?.data?.message ||
        "The verification link has expired or is invalid.";
      return {
        icon: <XCircle className="h-12 w-12 text-destructive" />,
        title: "Verification failed",
        description: errorMessage,
        actions: ["resend", "signup"],
        color: "text-destructive",
      };
    }

    if (isInitialized && !email) {
      return {
        icon: <AlertTriangle className="h-12 w-12 text-destructive" />,
        title: "Email not found",
        description:
          "We couldn't find your email address. Please try signing up again.",
        actions: ["signup"],
        color: "text-destructive",
      };
    }

    return {
      icon: <Mail className="h-12 w-12 text-primary" />,
      title: "Check your inbox",
      description: email
        ? `We've sent a verification link to ${email}. Click the link to verify your account.`
        : "We've sent a verification link to your email address. Please check your inbox.",
      actions: ["resend"],
      color: "text-primary",
    };
  };

  const status = getStatusConfig();

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md"
      >
        <Card className="border border-border shadow-lg">
          {/* Header with primary color accent */}
          <div className="h-2 bg-primary rounded-t-lg" />

          <div className="p-8">
            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div className="p-3 bg-primary/10 rounded-full">
                {status.icon}
              </div>
            </div>

            {/* Content */}
            <div className="text-center space-y-3 mb-8">
              <h1 className="text-2xl font-bold text-foreground">
                {status.title}
              </h1>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {status.description}
              </p>
            </div>

            {/* Email Display */}
            {email && (verifyMutation.isIdle || verifyMutation.isError) && (
              <div className="mb-6">
                <div className="p-3 bg-secondary rounded-lg text-sm font-medium text-center border border-border">
                  {email}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-3">
              {status.actions.includes("resend") && (
                <Button
                  onClick={handleResendEmail}
                  disabled={resendCooldown > 0 || resendMutation.isPending}
                  className="w-full h-11 text-base font-medium cursor-pointer"
                  variant={resendCooldown > 0 ? "outline" : "default"}
                >
                  {resendMutation.isPending ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : resendCooldown > 0 ? (
                    <>
                      <Clock className="mr-2 h-4 w-4" />
                      Resend in {resendCooldown}s
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Resend verification email
                    </>
                  )}
                </Button>
              )}

              {status.actions.includes("continue") && (
                <Button
                  onClick={handleContinue}
                  className="w-full h-11 text-base font-medium cursor-pointer"
                >
                  Continue to login
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}

              {status.actions.includes("signup") && (
                <Button
                  onClick={handleReturnToSignup}
                  variant="outline"
                  className="w-full h-11 text-base font-medium cursor-pointer"
                >
                  Create new account
                </Button>
              )}
            </div>

            {/* Help text */}
            {verifyMutation.isIdle && email && (
              <div className="mt-6 pt-4 border-t border-border">
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <Shield className="h-3 w-3" />
                  <span>Didn't receive it? Check your spam folder</span>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Footer link */}
        <p className="text-center mt-4 text-xs text-muted-foreground">
          Need help?{" "}
          <Link
            href="/support"
            className="text-primary hover:underline font-medium cursor-pointer"
          >
            Contact support
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
