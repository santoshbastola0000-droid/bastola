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
