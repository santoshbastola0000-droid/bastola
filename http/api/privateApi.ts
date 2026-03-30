// lib/api.ts or wherever your privateApi is defined
import axios from "axios";
import useTokenStore from "@/store";
import { toast } from "sonner";
import { useUserStore } from "@/stores/user-store";

export const privateApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL,
});

// Flag to prevent multiple redirects
let isRedirecting = false;

privateApi.interceptors.request.use((config) => {
  const token = useTokenStore.getState().token;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Add response interceptor to handle token expiration
privateApi.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Check if error is 401 (Unauthorized) - token expired or invalid
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // Show toast notification
      toast.error("Session Expired", {
        description:
          "Your session has expired. Please log in again to continue.",
        duration: 4000,
      });

      // Clear all auth data
      const tokenStore = useTokenStore.getState();
      if (tokenStore.clearToken) {
        tokenStore.clearToken();
      }

      // Clear user data
      const { clearUser } = useUserStore.getState();
      clearUser();

      // Only redirect if not already redirecting
      if (typeof window !== "undefined" && !isRedirecting) {
        isRedirecting = true;

        // Get current path to redirect back after login
        const currentPath = window.location.pathname;
        const redirectUrl = `/auth/login${currentPath !== "/" ? `?redirect=${encodeURIComponent(currentPath)}` : ""}`;

        // Small delay to ensure toast is shown
        setTimeout(() => {
          window.location.href = redirectUrl;
        }, 500);
      }

      return Promise.reject(error);
    }

    return Promise.reject(error);
  },
);
