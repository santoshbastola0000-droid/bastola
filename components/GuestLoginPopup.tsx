"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogIn, Sparkles, UserPlus, X } from "lucide-react";
import useTokenStore from "@/store";
import { Button } from "@/components/ui/button";

const POPUP_DELAYS_MS = [5_000, 30_000, 60_000];

export function GuestLoginPopup() {
  const pathname = usePathname();
  const token = useTokenStore((state) => state.token);
  const [open, setOpen] = useState(false);
  const showCountRef = useRef(0);

  const isAuthPage = pathname.startsWith("/auth");

  useEffect(() => {
    if (token || isAuthPage || open) {
      return;
    }

    const delay =
      POPUP_DELAYS_MS[
        Math.min(
          showCountRef.current,
          POPUP_DELAYS_MS.length - 1,
        )
      ];

    const timer = window.setTimeout(() => {
      showCountRef.current += 1;
      setOpen(true);
    }, delay);

    return () => window.clearTimeout(timer);
  }, [token, isAuthPage, open]);

  if (!open || token || isAuthPage) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/45 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="absolute right-4 top-4 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Sparkles className="h-6 w-6" />
        </div>

        <h2 className="pr-8 text-xl font-bold text-slate-900">
          RoomKhoj मा आफ्नो सही कोठा छिटो भेट्नुहोस्
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-600">
          Login गरेपछि saved rooms, contact unlock history र तपाईंका लागि मिल्ने नयाँ room alerts पाउनुहुन्छ।
        </p>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <Button asChild className="h-11 rounded-xl">
            <Link href="/auth/login">
              <LogIn className="h-4 w-4" />
              Login
            </Link>
          </Button>

          <Button asChild variant="outline" className="h-11 rounded-xl">
            <Link href="/auth/register">
              <UserPlus className="h-4 w-4" />
              Sign up
            </Link>
          </Button>
        </div>

        <button
          type="button"
          onClick={() => setOpen(false)}
          className="mt-4 w-full text-center text-sm text-slate-500 hover:text-slate-800"
        >
          अहिले होइन
        </button>
      </div>
    </div>
  );
}
