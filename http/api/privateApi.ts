import axios from "axios";
import useTokenStore from "@/store";
import { toast } from "sonner";
import { useUserStore } from "@/stores/user-store";

const MANUAL_LOGOUT_KEY = "roomkhoj_manual_logout_at";
let isHandlingSessionExpiry = false;

export const privateApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL || "https://api.roomkhoj.com",
  withCredentials: true,
});

privateApi.interceptors.request.use((config) => {
  const token = useTokenStore.getState().token;

  (config as any)._hadAuthToken = Boolean(token);

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

privateApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as any;
    const isUnauthorized = error.response?.status === 401;
    const hadAuthToken = Boolean(originalRequest?._hadAuthToken);

    const manualLogoutAt =
      typeof window !== "undefined"
        ? Number(sessionStorage.getItem(MANUAL_LOGOUT_KEY))
        : 0;

    const isManualLogout =
      Number.isFinite(manualLogoutAt) &&
      Date.now() - manualLogoutAt < 10_000;

    // Logout पछिको request वा login नै नभएको request मा toast नदेखाउने।
    if (!isUnauthorized || !hadAuthToken || isManualLogout) {
      return Promise.reject(error);
    }

    // धेरै API request ले 401 दिए पनि एक पटक मात्र handle गर्ने।
    if (isHandlingSessionExpiry || originalRequest?._sessionHandled) {
      return Promise.reject(error);
    }

    isHandlingSessionExpiry = true;
    originalRequest._sessionHandled = true;

    toast.error("Session Expired", {
      description: "Your session has expired. Please log in again to continue.",
      duration: 4000,
    });

    useTokenStore.getState().clearToken();
    useUserStore.getState().clearUser();

    if (typeof window !== "undefined") {
      const currentPath = window.location.pathname;

      if (!currentPath.startsWith("/auth/")) {
        const redirect =
          currentPath === "/"
            ? "/auth/login"
            : `/auth/login?redirect=${encodeURIComponent(currentPath)}`;

        window.setTimeout(() => {
          window.location.href = redirect;
        }, 300);
      }
    }

    return Promise.reject(error);
  },
);
