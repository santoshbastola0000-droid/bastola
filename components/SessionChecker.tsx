// components/SessionChecker.tsx
"use client";

import { useEffect } from "react";
import { useUserRole } from "@/stores/user-store";
import useTokenStore from "@/store";
import { isTokenExpired, getTokenExpiration } from "@/lib/utils";
import { toast } from "sonner";

export function SessionChecker() {
  const { user, clearUser } = useUserRole();
  const token = useTokenStore((state) => state.token);

  useEffect(() => {
    // Check token expiration immediately
    const checkTokenExpiry = () => {
      if (token) {
        if (isTokenExpired(token)) {
          // Show toast notification
          toast.error("Session Expired", {
            description:
              "Your session has expired. Please log in again to continue.",
            duration: 4000,
          });

          // Clear auth data
          clearUser();
          useTokenStore.getState().clearToken();

          // Redirect to login
          const currentPath = window.location.pathname;
          window.location.href = `/auth/login${currentPath !== "/" ? `?redirect=${encodeURIComponent(currentPath)}` : ""}`;
        } else {
          // Optional: Show warning when token is about to expire (e.g., within 5 minutes)
          const expirationDate = getTokenExpiration(token);
          if (expirationDate) {
            const timeUntilExpiry = expirationDate.getTime() - Date.now();
            const fiveMinutes = 5 * 60 * 1000;

            if (timeUntilExpiry > 0 && timeUntilExpiry < fiveMinutes) {
              const minutesLeft = Math.ceil(timeUntilExpiry / 60000);
              toast.warning("Session Expiring Soon", {
                description: `Your session will expire in ${minutesLeft} minute${minutesLeft !== 1 ? "s" : ""}. Please save your work.`,
                duration: 5000,
              });
            }
          }
        }
      }
    };

    // Check on mount
    checkTokenExpiry();

    // Set up interval to check token expiry every minute
    const interval = setInterval(checkTokenExpiry, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [token, clearUser]);

  return null;
}
