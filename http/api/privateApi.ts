import axios from "axios";
import useTokenStore from "@/store";

export const privateApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL,
});

privateApi.interceptors.request.use((config) => {
  const token = useTokenStore.getState().token;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});
