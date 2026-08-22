"use client";

import { useEffect } from "react";
import { useUserRole } from "@/stores/user-store";
import useTokenStore from "@/store";
import { isTokenExpired } from "@/lib/utils";
import { toast } from "sonner";

const MANUAL_LOGOUT_KEY = "roomkhoj_manual_logout_at";
let hasHandledExpiredSession = false;

export function SessionChecker() {
  const { clearUser } = useUserRole();
  const token = useTokenStore((state) => state.token);

  useEffect(() => {
    // नयाँ valid login आएपछि भविष्यको expiry का लागि reset गर्ने।
    if (token && !isTokenExpired(token)) {
      hasHandledExpiredSession = false;
    }

    const checkTokenExpiry = () => {
      if (!token || !isTokenExpired(token) || hasHandledExpiredSession) {
        return;
      }

      const manualLogoutAt = Number(
        sessionStorage.getItem(MANUAL_LOGOUT_KEY),
      );

      const isManualLogout =
        Number.isFinite(manualLogoutAt) &&
        Date.now() - manualLogoutAt < 10_000;

      if (isManualLogout) {
        sessionStorage.removeItem(MANUAL_LOGOUT_KEY);
        return;
      }

      hasHandledExpiredSession = true;

      toast.error("Session Expired", {
        description: "Your session has expired. Please log in again to continue.",
        duration: 4000,
      });

      clearUser();
      useTokenStore.getState().clearToken();

      const currentPath = window.location.pathname;

      if (!currentPath.startsWith("/auth/")) {
        window.location.href =
          currentPath === "/"
            ? "/auth/login"
            : `/auth/login?redirect=${encodeURIComponent(currentPath)}`;
      }
    };

    checkTokenExpiry();

    const interval = window.setInterval(checkTokenExpiry, 60_000);
    return () => window.clearInterval(interval);
  }, [token, clearUser]);

  return null;
}
