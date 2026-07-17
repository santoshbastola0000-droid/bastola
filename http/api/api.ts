import axios from "axios";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL || "https://api.roomkhoj.com",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});
