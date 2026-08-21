"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { messageService } from "@/http/services/message.service";
import {
  Home,
  BriefcaseBusiness,
  Plus,
  MessageCircle,
  UserRound,
} from "lucide-react";

export function MobileBottomNav() {
  const pathname = usePathname();

  const [unreadCount, setUnreadCount] =
    useState(0);

  useEffect(() => {
    const loadUnread = async () => {
      try {
        const data =
          await messageService.getUnreadCount();

        setUnreadCount(data.count || 0);
      } catch {
        setUnreadCount(0);
      }
    };

    loadUnread();

    const handleUnreadRefresh = () => {
      loadUnread();
    };

    window.addEventListener(
      "roomkhoj:unread-refresh",
      handleUnreadRefresh,
    );

    const timer = window.setInterval(
      loadUnread,
      15000,
    );

    return () => {
      window.clearInterval(timer);

      window.removeEventListener(
        "roomkhoj:unread-refresh",
        handleUnreadRefresh,
      );
    };
  }, []);


  const isHome = pathname === "/";
  const isJobs = pathname.startsWith("/jobs");
  const isMessages = pathname.startsWith("/messages");
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

        {/* MESSAGES */}
        <Link
          href="/messages"
          className={`flex min-w-[58px] flex-col items-center justify-center gap-1 text-[11px] ${
            isMessages
              ? "font-semibold text-black"
              : "text-gray-500"
          }`}
        >
          <div className="relative">
            <MessageCircle
              className="h-6 w-6"
              strokeWidth={
                isMessages ? 2.5 : 2
              }
            />

            {unreadCount > 0 && (
              <span
                className="
                  absolute
                  -right-3
                  -top-2
                  flex
                  min-w-[18px]
                  h-[18px]
                  items-center
                  justify-center
                  rounded-full
                  bg-red-500
                  px-1
                  text-[10px]
                  font-bold
                  text-white
                "
              >
                {unreadCount > 99
                  ? "99+"
                  : unreadCount}
              </span>
            )}
          </div>

          <span>Messages</span>
        </Link>

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
