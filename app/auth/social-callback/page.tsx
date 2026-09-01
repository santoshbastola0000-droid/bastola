"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/http/api/api";
import useTokenStore from "@/store";

const SocialCallbackPage = () => {
  const router = useRouter();
  const params = useSearchParams();
  const { setToken } = useTokenStore();
  const [message, setMessage] = useState("Signing you in...");

  useEffect(() => {
    const error = params.get("error");
    if (error) {
      setMessage("Social login failed. Please try again.");
      return;
    }

    let cancelled = false;

    const finishLogin = async () => {
      try {
        const response = await api.post("/user/session/refresh");
        const accessToken = response.data?.data?.accessToken;

        if (!accessToken) {
          throw new Error("Missing access token");
        }

        setToken(accessToken);

        const redirect =
          sessionStorage.getItem("roomkhoj_post_auth_redirect") || "/";
        sessionStorage.removeItem("roomkhoj_post_auth_redirect");

        if (!cancelled) {
          router.replace(redirect);
        }
      } catch {
        if (!cancelled) {
          setMessage("Social login session could not be completed.");
        }
      }
    };

    finishLogin();

    return () => {
      cancelled = true;
    };
  }, [params, router, setToken]);

  return (
    <main className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
        <h1 className="text-lg font-semibold text-slate-900">RoomKhoj</h1>
        <p className="mt-2 text-sm text-slate-600">{message}</p>
      </div>
    </main>
  );
};

export default SocialCallbackPage;
