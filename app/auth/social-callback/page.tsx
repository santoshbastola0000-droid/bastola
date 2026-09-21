"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/http/api/api";
import { privateApi } from "@/http/api/privateApi";
import useTokenStore from "@/store";
import { useUserStore } from "@/stores/user-store";

function safeSavedRedirect() {
  const raw = String(
    sessionStorage.getItem("roomkhoj_post_auth_redirect") || "",
  ).trim();
  sessionStorage.removeItem("roomkhoj_post_auth_redirect");

  return raw.startsWith("/") &&
    !raw.startsWith("//") &&
    !raw.startsWith("/auth/")
    ? raw
    : null;
}

const SocialCallbackPage = () => {
  const router = useRouter();
  const params = useSearchParams();
  const { setToken } = useTokenStore();
  const { setUser } = useUserStore();
  const [message, setMessage] = useState("Signing you in...");
  const [showPromoStep, setShowPromoStep] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [promoApplying, setPromoApplying] = useState(false);
  const [promoError, setPromoError] = useState("");
  const [pendingRedirect, setPendingRedirect] = useState("/feed");

  useEffect(() => {
    const error = params.get("error");
    if (error) {
      setMessage("Social login failed. Please try again.");
      return;
    }

    const ticket = params.get("ticket");
    if (!ticket) {
      setMessage("Social login session is missing.");
      return;
    }

    let cancelled = false;

    const finishLogin = async () => {
      try {
        const response = await api.post("/user/oauth/session", { ticket });
        const accessToken = response.data?.data?.accessToken;

        if (!accessToken) {
          throw new Error("Missing access token");
        }

        setToken(accessToken);
        privateApi.defaults.headers.common["Authorization"] =
          `Bearer ${accessToken}`;

        const userResponse = await privateApi.get("/user/active");
        const user = userResponse.data?.data;

        if (!user) {
          throw new Error("Missing active user");
        }

        setUser(user);

        try {
          const key = "roomkhoj_known_accounts";
          const stored = JSON.parse(
            localStorage.getItem(key) || "[]",
          ) as Array<{ id: string; name: string; email: string }>;
          const accounts = Array.isArray(stored) ? stored : [];
          const nextAccounts = [
            {
              id: String(user.id || user.email),
              name: String(user.name || "RoomKhoj user"),
              email: String(user.email || "").toLowerCase(),
            },
            ...accounts.filter(
              (account) =>
                account?.email?.toLowerCase() !==
                String(user.email || "").toLowerCase(),
            ),
          ]
            .filter((account) => account.email)
            .slice(0, 5);
          localStorage.setItem(key, JSON.stringify(nextAccounts));
        } catch {
          // Account history is optional; login must still complete.
        }

        const savedRedirect = safeSavedRedirect();
        const redirect =
          user.role === "User" && !user.accountPurpose
            ? "/auth/complete-profile"
            : savedRedirect ||
              (user.role === "Admin"
                ? "/admin/dashboard"
                : user.role === "User"
                  ? "/feed"
                  : "/");

        if (!cancelled) {
          const provider = params.get("provider");
          const isNewSocialUser = params.get("new") === "1";

          if (
            provider === "google" &&
            isNewSocialUser &&
            user.role === "User"
          ) {
            setPendingRedirect(redirect);
            setShowPromoStep(true);
            setMessage("Google login successful");
            return;
          }

          router.replace(redirect);
          router.refresh();
        }
      } catch {
        if (!cancelled) {
          setMessage("Social login session could not be completed.");
        }
      }
    };

    finishLogin();

    return () => {
      cancelled = true;
    };
  }, [params, router, setToken, setUser]);

  const continueAfterPromo = () => {
    router.replace(pendingRedirect);
    router.refresh();
  };

  const applyPromoAndContinue = async () => {
    const code = promoCode.trim().toUpperCase();

    if (!/^[A-Z0-9]{5}$/.test(code)) {
      setPromoError("5-character promo code हाल्नुहोस्।");
      return;
    }

    try {
      setPromoApplying(true);
      setPromoError("");
      const response = await privateApi.post("/referral/apply-promo", {
        promoCode: code,
      });

      const result = response.data?.data;
      if (result?.alreadyApplied) {
        setMessage("Promo code already linked. Continuing...");
      } else {
        setMessage("Promo applied — दुवैलाई Rs. 5/5 wallet reward credit भयो।");
      }

      continueAfterPromo();
    } catch (error: any) {
      setPromoError(
        String(
          error?.response?.data?.message ||
            "Promo code apply गर्न सकिएन। Skip गरेर पनि continue गर्न सक्नुहुन्छ।",
        ),
      );
    } finally {
      setPromoApplying(false);
    }
  };

  return (
    <main className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-center text-lg font-semibold text-slate-900">RoomKhoj</h1>

        {!showPromoStep ? (
          <p className="mt-2 text-center text-sm text-slate-600">{message}</p>
        ) : (
          <div className="mt-4">
            <p className="text-center text-sm font-bold text-slate-900">
              Google login successful
            </p>
            <p className="mt-1 text-center text-xs leading-5 text-slate-500">
              Promo code optional हो। Valid 5-character code हाल्दा तपाईं र
              refer गर्ने user दुवैको wallet मा Rs. 5/5 एकपटक credit हुन्छ।
            </p>

            <label className="mt-5 block text-left text-sm font-bold text-slate-900">
              Promo Code <span className="font-medium text-slate-400">(optional)</span>
            </label>
            <input
              value={promoCode}
              onChange={(event) => {
                setPromoCode(
                  event.target.value
                    .toUpperCase()
                    .replace(/[^A-Z0-9]/g, "")
                    .slice(0, 5),
                );
                setPromoError("");
              }}
              placeholder="ABCDE"
              maxLength={5}
              autoComplete="off"
              disabled={promoApplying}
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-center font-mono text-lg font-black uppercase tracking-[0.25em] outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 disabled:opacity-60"
            />

            {promoError && (
              <p className="mt-2 text-left text-xs font-semibold text-red-600">
                {promoError}
              </p>
            )}

            <button
              type="button"
              onClick={() => void applyPromoAndContinue()}
              disabled={promoApplying || promoCode.length !== 5}
              className="mt-4 w-full rounded-xl bg-red-600 px-4 py-3 font-black text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {promoApplying ? "Applying..." : "Apply Promo & Continue"}
            </button>

            <button
              type="button"
              onClick={continueAfterPromo}
              disabled={promoApplying}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Skip
            </button>

            <p className="mt-3 text-center text-[11px] leading-5 text-slate-400">
              Promo code skip गर्दा Google login सामान्य रूपमा continue हुन्छ।
            </p>
          </div>
        )}
      </div>
    </main>
  );
};

export default SocialCallbackPage;
