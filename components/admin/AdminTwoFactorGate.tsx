"use client";

import {
  type ReactNode,
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  CheckCircle2,
  Copy,
  KeyRound,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

import useTokenStore from "@/store";
import {
  adminTwoFactorService,
  type TwoFactorSetup,
} from "@/http/services/admin-2fa.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Stage =
  | "loading"
  | "setup"
  | "verify"
  | "verified"
  | "error";

export function AdminTwoFactorGate({
  children,
}: {
  children: ReactNode;
}) {
  const token = useTokenStore(
    (state) => state.token,
  );

  const setToken = useTokenStore(
    (state) => state.setToken,
  );

  const [stage, setStage] =
    useState<Stage>("loading");

  const [setupData, setSetupData] =
    useState<TwoFactorSetup | null>(null);

  const [code, setCode] = useState("");
  const [submitting, setSubmitting] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  const cleanCode = code.replace(/\D/g, "").slice(0, 6);

  const loadStatus = useCallback(async () => {
    if (!token) return;

    setStage("loading");
    setErrorMessage("");

    try {
      const status =
        await adminTwoFactorService.getStatus();

      if (status.twoFactorVerified) {
        setStage("verified");
        return;
      }

      if (status.twoFactorEnabled) {
        setStage("verify");
        return;
      }

      const setup =
        await adminTwoFactorService.setup();

      setSetupData(setup);
      setStage("setup");
    } catch (error: any) {
      setErrorMessage(
        error?.response?.data?.message ||
          "Two-factor authentication load गर्न सकिएन.",
      );
      setStage("error");
    }
  }, [token]);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  const verifyCurrentSession =
    async () => {
      if (cleanCode.length !== 6) {
        toast.error(
          "6-digit authenticator code राख्नुहोस्.",
        );
        return;
      }

      setSubmitting(true);

      try {
        const result =
          await adminTwoFactorService.verifySession(
            cleanCode,
          );

        if (!result?.accessToken) {
          throw new Error(
            "Access token missing",
          );
        }

        setToken(result.accessToken);
        setCode("");
        setStage("verified");

        toast.success(
          "Two-factor authentication verified",
        );
      } catch (error: any) {
        toast.error(
          error?.response?.data?.message ||
            "Authenticator code invalid छ.",
        );
      } finally {
        setSubmitting(false);
      }
    };

  const enableTwoFactor =
    async () => {
      if (cleanCode.length !== 6) {
        toast.error(
          "Authenticator app को 6-digit code राख्नुहोस्.",
        );
        return;
      }

      setSubmitting(true);

      try {
        await adminTwoFactorService.enable(
          cleanCode,
        );

        /*
         * 2FA enable भएपछि यही valid code प्रयोग गरेर
         * current old admin session लाई verified JWT मा upgrade गर्छौँ।
         */
        const result =
          await adminTwoFactorService.verifySession(
            cleanCode,
          );

        if (!result?.accessToken) {
          throw new Error(
            "Verified token missing",
          );
        }

        setToken(result.accessToken);
        setCode("");
        setStage("verified");

        toast.success(
          "Admin 2FA successfully enabled",
        );
      } catch (error: any) {
        toast.error(
          error?.response?.data?.message ||
            "2FA enable गर्न सकिएन.",
        );
      } finally {
        setSubmitting(false);
      }
    };

  if (stage === "verified") {
    return <>{children}</>;
  }

  if (stage === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin" />
          <p className="mt-3 text-sm text-muted-foreground">
            Verifying admin security…
          </p>
        </div>
      </div>
    );
  }

  if (stage === "error") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
        <div className="w-full max-w-md rounded-2xl border bg-background p-6 shadow-sm">
          <ShieldCheck className="mb-4 h-10 w-10" />

          <h1 className="text-xl font-bold">
            Admin security check failed
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            {errorMessage}
          </p>

          <Button
            className="mt-5 w-full"
            onClick={loadStatus}
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (stage === "setup") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
        <div className="w-full max-w-md rounded-2xl border bg-background p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-xl bg-muted p-3">
              <ShieldCheck className="h-6 w-6" />
            </div>

            <div>
              <h1 className="text-xl font-bold">
                Secure Admin Account
              </h1>

              <p className="text-sm text-muted-foreground">
                Authenticator app setup गर्नुहोस्।
              </p>
            </div>
          </div>

          {setupData?.qrCodeDataUrl && (
            <div className="mb-5 flex justify-center">
              <div className="rounded-xl border bg-white p-3">
                <img
                  src={setupData.qrCodeDataUrl}
                  alt="RoomKhoj Admin 2FA QR Code"
                  className="h-52 w-52"
                />
              </div>
            </div>
          )}

          <div className="space-y-3 text-sm">
            <p className="text-muted-foreground">
              Google Authenticator, Microsoft Authenticator
              वा Authy बाट QR scan गर्नुहोस्।
            </p>

            {setupData?.manualKey && (
              <div className="rounded-lg border bg-muted/40 p-3">
                <p className="mb-1 text-xs text-muted-foreground">
                  Manual setup key
                </p>

                <div className="flex items-center gap-2">
                  <code className="min-w-0 flex-1 break-all text-xs">
                    {setupData.manualKey}
                  </code>

                  <button
                    type="button"
                    onClick={async () => {
                      await navigator.clipboard.writeText(
                        setupData.manualKey,
                      );
                      toast.success(
                        "Setup key copied",
                      );
                    }}
                    className="rounded-md border p-2"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="mt-5">
            <label className="mb-2 block text-sm font-medium">
              6-digit code
            </label>

            <Input
              value={cleanCode}
              onChange={(e) =>
                setCode(e.target.value)
              }
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="000000"
              className="h-12 text-center text-xl tracking-[0.35em]"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  enableTwoFactor();
                }
              }}
            />
          </div>

          <Button
            className="mt-4 w-full"
            disabled={
              submitting ||
              cleanCode.length !== 6
            }
            onClick={enableTwoFactor}
          >
            {submitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="mr-2 h-4 w-4" />
            )}

            Enable 2FA
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md rounded-2xl border bg-background p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-3">
          <div className="rounded-xl bg-muted p-3">
            <KeyRound className="h-6 w-6" />
          </div>

          <div>
            <h1 className="text-xl font-bold">
              Two-Factor Authentication
            </h1>

            <p className="text-sm text-muted-foreground">
              Admin dashboard खोल्न authenticator code आवश्यक छ।
            </p>
          </div>
        </div>

        <Input
          value={cleanCode}
          onChange={(e) =>
            setCode(e.target.value)
          }
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          autoFocus
          placeholder="000000"
          className="h-14 text-center text-2xl tracking-[0.4em]"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              verifyCurrentSession();
            }
          }}
        />

        <Button
          className="mt-4 w-full"
          disabled={
            submitting ||
            cleanCode.length !== 6
          }
          onClick={verifyCurrentSession}
        >
          {submitting && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}

          Verify & Continue
        </Button>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          तपाईं logout हुनु भएको छैन। Code verify भएपछि यही
          admin session continue हुन्छ।
        </p>
      </div>
    </div>
  );
}
