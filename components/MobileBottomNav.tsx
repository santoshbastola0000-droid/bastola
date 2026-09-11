"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { messageService } from "@/http/services/message.service";
import { useUserStore } from "@/stores/user-store";
import {
  Home,
  BriefcaseBusiness,
  Plus,
  MessageCircle,
  UserRound,
} from "lucide-react";

export function MobileBottomNav() {
  const pathname = usePathname();
  const user = useUserStore((state) => state.user);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const loadUnread = async () => {
      try {
        const data = await messageService.getUnreadCount();
        setUnreadCount(data.count || 0);
      } catch {
        setUnreadCount(0);
      }
    };

    loadUnread();
    const handleUnreadRefresh = () => loadUnread();
    window.addEventListener("roomkhoj:unread-refresh", handleUnreadRefresh);
    const timer = window.setInterval(loadUnread, 15000);

    return () => {
      window.clearInterval(timer);
      window.removeEventListener("roomkhoj:unread-refresh", handleUnreadRefresh);
    };
  }, []);

  // Guests should land on the public room cards first. Once signed in,
  // the same Feed tab opens the social feed as before.
  const feedHref = user ? "/feed" : "/rooms";
  const isFeed = user
    ? pathname.startsWith("/feed")
    : pathname.startsWith("/rooms");
  const isJobs = pathname.startsWith("/jobs");
  const isMessages = pathname.startsWith("/messages");
  const isProfile = pathname.startsWith("/user/dashboard/profile");

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-[99999] border-t border-gray-200 bg-white pb-[env(safe-area-inset-bottom)]">
      <div className="relative flex h-[68px] items-center justify-around px-1">
        <Link
          href={feedHref}
          className={`flex min-w-[58px] flex-col items-center justify-center gap-1 text-[11px] ${
            isFeed ? "font-semibold text-black" : "text-gray-500"
          }`}
        >
          <Home className="h-6 w-6" strokeWidth={isFeed ? 2.5 : 2} />
          <span>Feed</span>
        </Link>

        <Link
          href="/jobs"
          className={`flex min-w-[58px] flex-col items-center justify-center gap-1 text-[11px] ${
            isJobs ? "font-semibold text-black" : "text-gray-500"
          }`}
        >
          <BriefcaseBusiness className="h-6 w-6" strokeWidth={isJobs ? 2.5 : 2} />
          <span>Jobs</span>
        </Link>

        <Link
          href="/user/dashboard/rooms/create"
          aria-label="List room"
          className="relative -mt-5 flex h-[44px] w-[62px] items-center justify-center rounded-xl bg-black text-white shadow-lg transition-transform active:scale-95"
        >
          <Plus className="h-7 w-7" strokeWidth={2.7} />
        </Link>

        <Link
          href="/messages"
          className={`flex min-w-[58px] flex-col items-center justify-center gap-1 text-[11px] ${
            isMessages ? "font-semibold text-black" : "text-gray-500"
          }`}
        >
          <div className="relative">
            <MessageCircle className="h-6 w-6" strokeWidth={isMessages ? 2.5 : 2} />
            {unreadCount > 0 && (
              <span className="absolute -right-3 -top-2 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </div>
          <span>Messages</span>
        </Link>

        <Link
          href="/user/dashboard/profile"
          className={`flex min-w-[58px] flex-col items-center justify-center gap-1 text-[11px] ${
            isProfile ? "font-semibold text-black" : "text-gray-500"
          }`}
        >
          <UserRound className="h-6 w-6" strokeWidth={isProfile ? 2.5 : 2} />
          <span>Profile</span>
        </Link>
      </div>
    </nav>
  );
}
