"use client";

import { useEffect, useState } from "react";

export function RoomKhojStartupSplash() {
  const [visible, setVisible] = useState(true);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    let hideTimer: number | undefined;
    let removeTimer: number | undefined;
    const startedAt = Date.now();

    const hide = () => {
      const elapsed = Date.now() - startedAt;
      const remaining = Math.max(0, 450 - elapsed);

      hideTimer = window.setTimeout(() => {
        setLeaving(true);
        removeTimer = window.setTimeout(() => setVisible(false), 260);
      }, remaining);
    };

    if (document.readyState === "complete") {
      hide();
    } else {
      window.addEventListener("load", hide, { once: true });
      // Never leave the splash stuck if a third-party resource hangs.
      hideTimer = window.setTimeout(hide, 1800);
    }

    return () => {
      window.removeEventListener("load", hide);
      if (hideTimer) window.clearTimeout(hideTimer);
      if (removeTimer) window.clearTimeout(removeTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-white transition-opacity duration-300 ${
        leaving ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
      aria-label="RoomKhoj loading"
      role="status"
    >
      <div className="flex flex-col items-center px-6 text-center">
        <div className="relative">
          <div className="absolute inset-2 rounded-full bg-red-100 blur-2xl" />
          <img
            src="/roomkhoj-logo.png"
            alt="RoomKhoj"
            width={112}
            height={112}
            className="relative h-24 w-24 rounded-3xl object-contain drop-shadow-sm sm:h-28 sm:w-28"
          />
        </div>

        <div className="mt-4 text-[30px] font-black tracking-[-0.055em] text-slate-950 sm:text-[34px]">
          Room<span className="text-red-600">Khoj</span>
        </div>

        <div className="mt-4 flex items-center gap-1.5" aria-hidden>
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-red-600 [animation-delay:-0.3s]" />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-red-600 [animation-delay:-0.15s]" />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-red-600" />
        </div>
      </div>
    </div>
  );
}
