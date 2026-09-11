"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { usePathname } from "next/navigation";
import useTokenStore from "@/store";
import LoginForm from "@/components/auth/LoginForm";
import RegisterForm from "@/components/auth/RegisterForm";

const POPUP_DELAYS_MS = [5_000, 30_000, 60_000];

// These destinations require an authenticated RoomKhoj account. Guests should
// stay on the page they are browsing and get the login popup immediately,
// instead of navigating into a protected screen and seeing a loader/redirect.
const PROTECTED_PATH_PREFIXES = [
  "/feed",
  "/messages",
  "/notifications",
  "/user/dashboard",
  "/jobs/post",
  "/property/",
];

type AuthView = "LOGIN" | "REGISTER";

function isProtectedPath(pathname: string) {
  return PROTECTED_PATH_PREFIXES.some((prefix) =>
    prefix.endsWith("/")
      ? pathname.startsWith(prefix)
      : pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function GuestLoginPopup() {
  const pathname = usePathname();
  const token = useTokenStore((state) => state.token);
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<AuthView>("LOGIN");
  const showCountRef = useRef(0);

  const isAuthPage = pathname.startsWith("/auth");

  useEffect(() => {
    if (token || isAuthPage) return;

    const openLogin = () => {
      setView("LOGIN");
      setOpen(true);
    };

    const handleOpenLogin = () => openLogin();

    const handleProtectedLinkClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const target = event.target;
      if (!(target instanceof Element)) return;

      const anchor = target.closest("a[href]") as HTMLAnchorElement | null;
      if (!anchor) return;
      if (anchor.hasAttribute("download")) return;

      const rawHref = anchor.getAttribute("href");
      if (!rawHref || rawHref.startsWith("#")) return;
      if (/^(mailto:|tel:|sms:|javascript:)/i.test(rawHref)) return;

      let url: URL;
      try {
        url = new URL(anchor.href, window.location.href);
      } catch {
        return;
      }

      if (url.origin !== window.location.origin || !isProtectedPath(url.pathname)) return;

      event.preventDefault();
      event.stopPropagation();
      openLogin();
    };

    window.addEventListener("roomkhoj:open-login", handleOpenLogin);
    document.addEventListener("click", handleProtectedLinkClick, true);

    return () => {
      window.removeEventListener("roomkhoj:open-login", handleOpenLogin);
      document.removeEventListener("click", handleProtectedLinkClick, true);
    };
  }, [token, isAuthPage]);

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
      className="fixed inset-0 z-[100000] flex items-end justify-center bg-slate-950/55 p-3 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Login required"
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
          <p className="mt-2 text-center text-sm font-medium text-slate-500">
            Log in to continue
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
