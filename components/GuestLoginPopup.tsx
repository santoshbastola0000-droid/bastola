"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { usePathname } from "next/navigation";
import useTokenStore from "@/store";
import LoginForm from "@/components/auth/LoginForm";
import RegisterForm from "@/components/auth/RegisterForm";

const POPUP_DELAYS_MS = [5_000, 30_000, 60_000];

type AuthView = "LOGIN" | "REGISTER";

export function GuestLoginPopup() {
  const pathname = usePathname();
  const token = useTokenStore((state) => state.token);
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<AuthView>("LOGIN");
  const showCountRef = useRef(0);

  const isAuthPage = pathname.startsWith("/auth");

  useEffect(() => {
    if (token || isAuthPage || open) return;

    const delay =
      POPUP_DELAYS_MS[
        Math.min(showCountRef.current, POPUP_DELAYS_MS.length - 1)
      ];

    const timer = window.setTimeout(() => {
      showCountRef.current += 1;
      setOpen(true);
    }, delay);

    return () => window.clearTimeout(timer);
  }, [token, isAuthPage, open]);

  if (!open || token || isAuthPage) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/55 p-3 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative max-h-[calc(100dvh-1.5rem)] w-full max-w-lg overflow-y-auto rounded-3xl bg-white shadow-2xl">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="absolute right-4 top-4 z-10 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="px-6 pb-2 pt-7 sm:px-8">
          <p className="text-center text-sm font-semibold text-primary">
            ROOMKHOJ
          </p>

          <div className="mt-5 grid grid-cols-2 rounded-xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setView("LOGIN")}
              className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                view === "LOGIN"
                  ? "bg-white text-primary shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => setView("REGISTER")}
              className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                view === "REGISTER"
                  ? "bg-white text-primary shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Create Account
            </button>
          </div>
        </div>

        <div className="p-6 pt-5 sm:p-8 sm:pt-5">
          {view === "LOGIN" ? <LoginForm /> : <RegisterForm />}
        </div>
      </div>
    </div>
  );
}
