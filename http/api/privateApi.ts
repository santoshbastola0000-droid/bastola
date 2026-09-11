import type { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from "axios";
import useTokenStore from "@/store";
import { toast } from "sonner";
import { useUserStore } from "@/stores/user-store";
import { api, browserApiBaseUrl } from "@/http/api/api";
import { optimizeFormDataImages } from "@/lib/image-upload-optimizer";
import { getNetworkProfile } from "@/lib/network-quality";

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
let feedGate: Promise<void> | null = null;
let releaseFeedGate: (() => void) | null = null;

const LITE_DEFERRED_GETS = [
  "/social/stories",
  "/social/friend-requests",
  "/social/groups",
  "/social/profile-photo/me",
  "/social/preferences",
  "/social/friend-suggestions/nearby",
];

function isDeferredLiteRequest(url: string) {
  return (
    LITE_DEFERRED_GETS.includes(url) ||
    /^\/user\/profile\/[^/]+$/.test(url)
  );
}

function beginFeedGate() {
  if (feedGate) return;
  feedGate = new Promise<void>((resolve) => {
    releaseFeedGate = resolve;
  });
}

function endFeedGate() {
  releaseFeedGate?.();
  releaseFeedGate = null;
  feedGate = null;
}

privateApi.interceptors.request.use(async (config) => {
  const token = useTokenStore.getState().token;

  (config as RetriableRequest)._hadAuthToken = Boolean(token);

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  const requestUrl = String(config.url || "").split("?")[0];
  const requestMethod = String(config.method || "get").toLowerCase();
  const profile = getNetworkProfile();

  // Keep the first feed payload small. 2G/Save-Data gets 6 items, 3G gets 8,
  // and fast connections get 12. Infinite scroll still loads more on demand.
  if (requestMethod === "get" && requestUrl === "/social/feed") {
    const requested = Number((config.params as any)?.limit || profile.feedLimit);
    config.params = {
      ...(config.params || {}),
      limit: Math.min(
        profile.feedLimit,
        Number.isFinite(requested) && requested > 0 ? requested : profile.feedLimit,
      ),
    };

    // On weak connections, let the visible feed finish before lower-priority
    // stories/profile/groups requests compete for the same radio bandwidth.
    if (profile.liteMode && !(config.params as any)?.before) beginFeedGate();
  } else if (
    requestMethod === "get" &&
    profile.liteMode &&
    feedGate &&
    isDeferredLiteRequest(requestUrl)
  ) {
    await Promise.race([
      feedGate,
      new Promise<void>((resolve) => window.setTimeout(resolve, 3500)),
    ]);
  }

  if (typeof FormData !== "undefined" && config.data instanceof FormData) {
    config.data = await optimizeFormDataImages(config.data);
    delete config.headers["Content-Type"];
    delete config.headers["content-type"];
  }

  /*
   * Message Payment now has two wallet-safe actions without changing the
   * existing messages page contract:
   *   OK     -> request payment from the other user (no earning-plan limit)
   *   Cancel -> send available wallet balance now (max Rs. 25,000)
   *
   * Both paths stay connected to the backend payment/escrow audit ledger.
   */
  if (typeof window !== "undefined" && requestMethod === "post") {
    const url = String(config.url || "");
    const requestMatch = url.match(/^\/message\/conversations\/([^/]+)\/payment-requests$/);

    if (requestMatch) {
      const wantsPaymentRequest = window.confirm(
        "Payment\n\nOK = Request payment\nCancel = Send money from wallet (max Rs. 25,000)",
      );

      config.url = wantsPaymentRequest
        ? `/message/conversations/${requestMatch[1]}/direct-payment-requests`
        : `/message/conversations/${requestMatch[1]}/wallet-transfer`;
    }

    const payMatch = url.match(/^\/message\/payments\/([^/]+)\/pay$/);
    if (payMatch) {
      config.url = `/message/direct-payments/${payMatch[1]}/pay`;
    }
  }

  return config;
});

function handleSuccessfulResponse(response: AxiosResponse) {
  const url = String(response.config?.url || "").split("?")[0];
  if (url === "/social/feed") endFeedGate();
  return response;
}

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
  handleSuccessfulResponse,
  async (error: AxiosError) => {
    const errorUrl = String(error.config?.url || "").split("?")[0];
    if (errorUrl === "/social/feed") endFeedGate();

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
