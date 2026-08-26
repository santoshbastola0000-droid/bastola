import type { AxiosError, InternalAxiosRequestConfig } from "axios";
import useTokenStore from "@/store";
import { toast } from "sonner";
import { useUserStore } from "@/stores/user-store";
import { api, browserApiBaseUrl } from "@/http/api/api";

const MANUAL_LOGOUT_KEY = "roomkhoj_manual_logout_at";

type RetriableRequest = InternalAxiosRequestConfig & {
  _retry?: boolean;
  _hadAuthToken?: boolean;
};

export const privateApi = api.create({
  baseURL: browserApiBaseUrl,
  withCredentials: true,
});

let refreshPromise: Promise<string | null> | null = null;
let isRedirecting = false;

privateApi.interceptors.request.use((config) => {
  const token = useTokenStore.getState().token;

  (config as RetriableRequest)._hadAuthToken = Boolean(token);

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

async function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = api
      .post("/user/session/refresh")
      .then((response) => {
        const payload = response.data?.data ?? response.data;
        const accessToken =
          payload?.accessToken ?? payload?.token ?? payload?.access_token ?? null;

        if (accessToken) {
          useTokenStore.getState().setToken(accessToken);
        }

        return accessToken;
      })
      .catch(() => null)
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

function wasManualLogout() {
  if (typeof window === "undefined") return false;

  const manualLogoutAt = Number(
    sessionStorage.getItem(MANUAL_LOGOUT_KEY),
  );

  return (
    Number.isFinite(manualLogoutAt) &&
    Date.now() - manualLogoutAt < 10_000
  );
}

function redirectToLogin() {
  if (typeof window === "undefined" || isRedirecting) return;

  const currentPath = window.location.pathname;
  if (currentPath.startsWith("/auth/")) return;

  isRedirecting = true;

  const redirect = `/auth/login?redirect=${encodeURIComponent(
    `${currentPath}${window.location.search}`,
  )}`;

  window.location.assign(redirect);
}

privateApi.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetriableRequest | undefined;
    const isUnauthorized = error.response?.status === 401;

    if (
      !isUnauthorized ||
      !originalRequest ||
      !originalRequest._hadAuthToken ||
      originalRequest._retry ||
      wasManualLogout()
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    const accessToken = await refreshAccessToken();

    if (accessToken) {
      return privateApi(originalRequest);
    }

    useTokenStore.getState().clearToken();
    useUserStore.getState().clearUser();

    toast.error("Session expired", {
      description: "Please log in again to continue.",
      duration: 4000,
    });

    redirectToLogin();

    return Promise.reject(error);
  },
);
