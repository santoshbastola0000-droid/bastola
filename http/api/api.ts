import axios from "axios";

// Browser requests stay same-origin; Vercel forwards /api/* to the backend.
export const browserApiBaseUrl =
  typeof window === "undefined"
    ? process.env.NEXT_PUBLIC_BACKEND_URL || "https://api.roomkhoj.com"
    : "/api";

export const api = axios.create({
  baseURL: browserApiBaseUrl,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});


api.interceptors.response.use(
  (response) => response,
  (error) => {
    const data = error?.response?.data;
    if (
      typeof window !== "undefined" &&
      error?.response?.status === 403 &&
      data?.code === "SECURITY_CHALLENGE_REQUIRED"
    ) {
      window.dispatchEvent(new CustomEvent("roomkhoj:security-challenge"));
    }
    return Promise.reject(error);
  },
);
