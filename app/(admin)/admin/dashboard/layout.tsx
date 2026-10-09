"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AdminWorkspace } from "@/components/admin/Workspace";
import { useUserRole } from "@/stores/user-store";
import { Loader2 } from "lucide-react";
import useTokenStore from "@/store";
import { isTokenExpired } from "@/lib/utils";
import { toast } from "sonner";
import { FAILURETOAST } from "@/lib/constants/app.constants";
import { ThemeProvider } from "@/components/theme-provider";

export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const router = useRouter();
  const { isAdmin, isLoaded, user, clearUser } = useUserRole();
  const token = useTokenStore((state) => state.token);

  useEffect(() => {
    const checkAuth = () => {
      if (token && isTokenExpired(token)) {
        const manualLogoutAt = Number(
          sessionStorage.getItem("roomkhoj_manual_logout_at"),
        );
        const isManualLogout =
          Number.isFinite(manualLogoutAt) &&
          Date.now() - manualLogoutAt < 10_000;

        if (isManualLogout) {
          sessionStorage.removeItem("roomkhoj_manual_logout_at");
          clearUser();
          useTokenStore.getState().clearToken();
          return;
        }

        toast.error("Session Expired", {
          description: "Your session has expired. Please log in again.",
          style: { background: FAILURETOAST, color: "#ffff" },
        });
        clearUser();
        useTokenStore.getState().clearToken();
        router.push("/auth/login");
        return;
      }

      // If no user and not loaded, redirect
      if (isLoaded && !user) {
        router.push("/auth/login");
        return;
      }

      // Check role-based access
      if (isLoaded && user && !isAdmin) {
        router.push(
          user.role?.toLowerCase() === "user" ? "/user/dashboard" : "/",
        );
        return;
      }
    };

    checkAuth();
  }, [isLoaded, isAdmin, user, token, router, clearUser]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-white">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-3" />
          <p className="text-sm text-gray-500">Loading…</p>
        </div>
      </div>
    );
  }

  if (!isAdmin || !user) return null;

  return (
    <ThemeProvider>
      <AdminWorkspace>{children}</AdminWorkspace>
    </ThemeProvider>
  );
}
