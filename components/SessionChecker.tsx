"use client";

import { useEffect } from "react";
import useTokenStore from "@/store";
import { getTokenExpiration } from "@/lib/utils";
import { toast } from "sonner";

/*
 * privateApi refreshes a session after an authenticated 401 response.
 * Clearing an expired access token here would prevent that refresh and
 * interrupt users while they are opening a property.
 */
export function SessionChecker() {
  const token = useTokenStore((state) => state.token);

  useEffect(() => {
    if (!token) return;

    const expirationDate = getTokenExpiration(token);
    if (!expirationDate) return;

    const timeUntilExpiry = expirationDate.getTime() - Date.now();
    const fiveMinutes = 5 * 60 * 1000;

    if (timeUntilExpiry > 0 && timeUntilExpiry < fiveMinutes) {
      const minutesLeft = Math.ceil(timeUntilExpiry / 60000);

      toast.warning("Session Expiring Soon", {
        description: `Your session will refresh automatically. About ${minutesLeft} minute${minutesLeft !== 1 ? "s" : ""} remaining.`,
        duration: 5000,
      });
    }
  }, [token]);

  return null;
}
