"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/http/api/api";
import { privateApi } from "@/http/api/privateApi";
import useTokenStore from "@/store";
import { useUserStore } from "@/stores/user-store";

const SocialCallbackPage = () => {
  const router = useRouter();
  const params = useSearchParams();
  const { setToken } = useTokenStore();
  const { setUser } = useUserStore();
  const [message, setMessage] = useState("Signing you in...");

  useEffect(() => {
    const error = params.get("error");
    if (error) {
      setMessage("Social login failed. Please try again.");
      return;
    }

    const ticket = params.get("ticket");
    if (!ticket) {
      setMessage("Social login session is missing.");
      return;
    }

    let cancelled = false;

    const finishLogin = async () => {
      try {
        const response = await api.post("/user/oauth/session", { ticket });
        const accessToken = response.data?.data?.accessToken;

        if (!accessToken) {
          throw new Error("Missing access token");
        }

        setToken(accessToken);
        privateApi.defaults.headers.common["Authorization"] =
          `Bearer ${accessToken}`;

        const userResponse = await privateApi.get("/user/active");
        const user = userResponse.data?.data;

        if (!user) {
          throw new Error("Missing active user");
        }

        setUser(user);

        try {
          const key = "roomkhoj_known_accounts";
          const stored = JSON.parse(
            localStorage.getItem(key) || "[]",
          ) as Array<{ id: string; name: string; email: string }>;
          const accounts = Array.isArray(stored) ? stored : [];
          const nextAccounts = [
            {
              id: String(user.id || user.email),
              name: String(user.name || "RoomKhoj user"),
              email: String(user.email || "").toLowerCase(),
            },
            ...accounts.filter(
              (account) =>
                account?.email?.toLowerCase() !==
                String(user.email || "").toLowerCase(),
            ),
          ]
            .filter((account) => account.email)
            .slice(0, 5);
          localStorage.setItem(key, JSON.stringify(nextAccounts));
        } catch {
          // Account history is optional; login must still complete.
        }

        const savedRedirect = sessionStorage.getItem(
          "roomkhoj_post_auth_redirect",
        );
        sessionStorage.removeItem("roomkhoj_post_auth_redirect");

        const redirect =
          savedRedirect ||
          (user.role === "Admin"
            ? "/admin/dashboard"
            : user.role === "User"
              ? "/user/dashboard"
              : "/");

        if (!cancelled) {
          router.replace(redirect);
          router.refresh();
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
  }, [params, router, setToken, setUser]);

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
