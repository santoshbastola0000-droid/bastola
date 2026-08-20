"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { api } from "@/http/api/api";
import useTokenStore from "@/store";
import { useUserStore } from "@/stores/user-store";
import { privateApi } from "@/http/api/privateApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AdminTwoFactorLoginPage() {
  const router = useRouter();

  const setToken =
    useTokenStore((state) => state.setToken);

  const setUser =
    useUserStore((state) => state.setUser);

  const [code, setCode] = useState("");
  const [loading, setLoading] =
    useState(false);

  const cleanCode =
    code.replace(/\D/g, "").slice(0, 6);

  const submit = async () => {
    if (cleanCode.length !== 6) {
      toast.error(
        "6-digit authenticator code राख्नुहोस्.",
      );
      return;
    }

    const challengeToken =
      sessionStorage.getItem(
        "admin_2fa_challenge",
      );

    if (!challengeToken) {
      toast.error(
        "2FA login session expired. फेरि login गर्नुहोस्.",
      );

      router.replace("/auth/login");
      return;
    }

    setLoading(true);

    try {
      const response = await api.post(
        "/user/login/2fa/verify",
        {
          challengeToken,
          code: cleanCode,
        },
      );

      const accessToken =
        response.data?.data?.accessToken;

      if (!accessToken) {
        throw new Error(
          "Access token missing",
        );
      }

      setToken(accessToken);

      /*
       * privateApi request interceptor ले नयाँ
       * Zustand token पढ्छ।
       */
      const userResponse =
        await privateApi.get(
          "/user/active",
        );

      const user =
        userResponse.data?.data;

      setUser(user);

      sessionStorage.removeItem(
        "admin_2fa_challenge",
      );

      toast.success(
        "Two-factor authentication successful",
      );

      router.replace(
        "/admin/dashboard",
      );
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          "Authenticator code invalid छ.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md rounded-2xl border bg-background p-6 shadow-sm">
        <div className="mb-6 text-center">
          <ShieldCheck className="mx-auto mb-3 h-10 w-10" />

          <h1 className="text-xl font-bold">
            Admin Verification
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            Authenticator app मा देखिएको
            6-digit code राख्नुहोस्।
          </p>
        </div>

        <Input
          value={cleanCode}
          onChange={(e) =>
            setCode(e.target.value)
          }
          inputMode="numeric"
          autoComplete="one-time-code"
          autoFocus
          maxLength={6}
          placeholder="000000"
          className="h-14 text-center text-2xl tracking-[0.4em]"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              submit();
            }
          }}
        />

        <Button
          className="mt-4 w-full"
          disabled={
            loading ||
            cleanCode.length !== 6
          }
          onClick={submit}
        >
          {loading && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}

          Verify & Login
        </Button>
      </div>
    </main>
  );
}
