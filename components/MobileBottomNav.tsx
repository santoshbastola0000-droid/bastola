"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  BriefcaseBusiness,
  Plus,
  Sparkles,
  UserRound,
} from "lucide-react";

export function MobileBottomNav() {
  const pathname = usePathname();

  const isHome = pathname === "/";
  const isJobs = pathname.startsWith("/jobs");
  const isProfile = pathname.startsWith("/user/dashboard/profile");

  const openChatbot = () => {
    window.dispatchEvent(
      new CustomEvent("open-roomkhoj-chatbot")
    );
  };

  return (
    <nav
      className="
        md:hidden
        fixed bottom-0 left-0 right-0
        z-[9999]
        border-t border-gray-200
        bg-white
        pb-[env(safe-area-inset-bottom)]
      "
    >
      <div className="relative flex h-[68px] items-center justify-around px-1">

        {/* HOME */}
        <Link
          href="/"
          className={`flex min-w-[58px] flex-col items-center justify-center gap-1 text-[11px] ${
            isHome
              ? "font-semibold text-black"
              : "text-gray-500"
          }`}
        >
          <Home
            className="h-6 w-6"
            strokeWidth={isHome ? 2.5 : 2}
          />

          <span>Home</span>
        </Link>

        {/* JOBS */}
        <Link
          href="/jobs"
          className={`flex min-w-[58px] flex-col items-center justify-center gap-1 text-[11px] ${
            isJobs
              ? "font-semibold text-black"
              : "text-gray-500"
          }`}
        >
          <BriefcaseBusiness
            className="h-6 w-6"
            strokeWidth={isJobs ? 2.5 : 2}
          />

          <span>Jobs</span>
        </Link>

        {/* CENTER ADD BUTTON */}
        <Link
          href="/user/dashboard/rooms/create"
          aria-label="Add room"
          className="
            relative
            -mt-5
            flex h-[44px] w-[62px]
            items-center justify-center
            rounded-xl
            bg-black
            text-white
            shadow-lg
            active:scale-95
            transition-transform
          "
        >
          <Plus
            className="h-7 w-7"
            strokeWidth={2.7}
          />
        </Link>

        {/* ROOMKHOJ AI */}
        <button
          type="button"
          onClick={openChatbot}
          aria-label="Open RoomKhoj AI"
          className="
            flex min-w-[58px]
            flex-col
            items-center
            justify-center
            gap-1
            text-[11px]
            text-gray-500
            active:scale-95
            transition-transform
          "
        >
          <div className="relative">
            <Sparkles
              className="h-6 w-6"
              strokeWidth={2.2}
            />

            <span
              className="
                absolute
                -right-1
                -top-1
                h-2
                w-2
                rounded-full
                bg-red-500
              "
            />
          </div>

          <span>AI</span>
        </button>

        {/* PROFILE */}
        <Link
          href="/user/dashboard/profile"
          className={`flex min-w-[58px] flex-col items-center justify-center gap-1 text-[11px] ${
            isProfile
              ? "font-semibold text-black"
              : "text-gray-500"
          }`}
        >
          <UserRound
            className="h-6 w-6"
            strokeWidth={isProfile ? 2.5 : 2}
          />

          <span>Profile</span>
        </Link>

      </div>
    </nav>
  );
}
