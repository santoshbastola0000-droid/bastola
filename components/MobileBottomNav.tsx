"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { messageService } from "@/http/services/message.service";
import { useUserStore } from "@/stores/user-store";
import {
  Home,
  BriefcaseBusiness,
  MessageCircle,
  UserRound,
} from "lucide-react";

export function MobileBottomNav() {
  const pathname = usePathname();
  const user = useUserStore((state) => state.user);
  const [unreadCount, setUnreadCount] = useState(0);
  const [messageComposerFocused, setMessageComposerFocused] = useState(false);

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

  useEffect(() => {
    if (!isMessages) {
      setMessageComposerFocused(false);
      return;
    }

    let blurTimer: number | null = null;

    const syncComposerFocus = () => {
      const active = document.activeElement;
      setMessageComposerFocused(
        active instanceof HTMLElement &&
          active.dataset.messageComposer === "true",
      );
    };

    const handleFocusIn = () => {
      if (blurTimer !== null) {
        window.clearTimeout(blurTimer);
        blurTimer = null;
      }
      syncComposerFocus();
    };

    const handleFocusOut = () => {
      blurTimer = window.setTimeout(syncComposerFocus, 30);
    };

    document.addEventListener("focusin", handleFocusIn);
    document.addEventListener("focusout", handleFocusOut);
    syncComposerFocus();

    return () => {
      document.removeEventListener("focusin", handleFocusIn);
      document.removeEventListener("focusout", handleFocusOut);
      if (blurTimer !== null) {
        window.clearTimeout(blurTimer);
      }
    };
  }, [isMessages]);

  if (isMessages && messageComposerFocused) {
    return null;
  }

  const itemClass = (active: boolean) =>
    `relative flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-[22px] py-2 text-[9px] font-semibold transition-all duration-200 ${
      active
        ? "bg-white/16 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]"
        : "text-white/75 active:bg-white/10"
    }`;

  return (
    <nav className="pointer-events-none fixed bottom-0 left-0 right-0 z-40 md:hidden">
      <div className="px-3 pb-[calc(0.55rem+env(safe-area-inset-bottom))]">
        <div className="pointer-events-auto mx-auto flex h-[66px] max-w-[430px] items-center gap-1 rounded-[28px] border border-white/15 bg-slate-950/88 p-1.5 shadow-[0_12px_35px_rgba(0,0,0,0.32)] backdrop-blur-xl">
          <Link
            href={feedHref}
            className={itemClass(isFeed)}
            aria-label="Feed"
          >
            <Home className="h-6 w-6" strokeWidth={isFeed ? 2.6 : 2.1} />
            <span>Feed</span>
          </Link>

          <Link
            href="/jobs"
            className={itemClass(isJobs)}
            aria-label="Jobs"
          >
            <BriefcaseBusiness className="h-6 w-6" strokeWidth={isJobs ? 2.6 : 2.1} />
            <span>Jobs</span>
          </Link>

          <Link
            href="/messages"
            className={itemClass(isMessages)}
            aria-label="Messages"
          >
            <div className="relative">
              <MessageCircle className="h-6 w-6" strokeWidth={isMessages ? 2.6 : 2.1} />
              {unreadCount > 0 && (
                <span className="absolute -right-3 -top-2 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-slate-950 bg-red-500 px-1 text-[9px] font-black text-white">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </div>
            <span>Messages</span>
          </Link>

          <Link
            href="/user/dashboard/profile"
            className={itemClass(isProfile)}
            aria-label="Profile"
          >
            <UserRound className="h-6 w-6" strokeWidth={isProfile ? 2.6 : 2.1} />
            <span>Profile</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}
