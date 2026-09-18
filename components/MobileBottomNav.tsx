"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { messageService } from "@/http/services/message.service";
import { useUserStore } from "@/stores/user-store";
import {
  Home,
  BriefcaseBusiness,
  Clapperboard,
  MessageCircle,
  UserRound,
} from "lucide-react";

function ReelsIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="4.5" width="18" height="15.5" rx="4" />
      <path d="M3.7 8.5h16.6" />
      <path d="m6.2 4.8 3 3.5M11.2 4.8l3 3.5M16.2 4.8l3 3.5" />
      <path d="m10 11.3 5 3.1-5 3.1z" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function MobileBottomNav() {
  const pathname = usePathname();
  const user = useUserStore((state) => state.user);
  const [unreadCount, setUnreadCount] = useState(0);
  const [messageComposerFocused, setMessageComposerFocused] = useState(false);
  const [compactOnScroll, setCompactOnScroll] = useState(false);
  const lastWindowScrollY = useRef(0);

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
  const isReels = pathname.startsWith("/reels");
  const isMessages = pathname.startsWith("/messages");
  const isProfile = pathname.startsWith("/user/dashboard/profile");

  useEffect(() => {
    const handleScroll = () => {
      const current = Math.max(0, window.scrollY);
      const delta = current - lastWindowScrollY.current;

      if (current < 24) {
        setCompactOnScroll(false);
      } else if (delta > 7) {
        // Finger swipes up / page moves down: keep nav visible but smaller.
        setCompactOnScroll(true);
      } else if (delta < -7) {
        // Finger swipes down / page moves up: restore the full nav.
        setCompactOnScroll(false);
      }

      lastWindowScrollY.current = current;
    };

    lastWindowScrollY.current = window.scrollY;
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
    `relative flex min-w-0 flex-1 flex-col items-center justify-center rounded-[20px] font-semibold transition-all duration-200 ${
      compactOnScroll ? "gap-0 py-1 text-[8px]" : "gap-0.5 py-2 text-[9px]"
    } ${
      active
        ? "bg-white/16 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]"
        : "text-white/75 active:bg-white/10"
    }`;

  return (
    <nav className="pointer-events-none fixed bottom-0 left-0 right-0 z-40 md:hidden">
      <div className="px-3 pb-[calc(0.55rem+env(safe-area-inset-bottom))]">
        <div
          className={`pointer-events-auto mx-auto flex max-w-[430px] items-center gap-1 border border-white/15 bg-slate-950/88 shadow-[0_12px_35px_rgba(0,0,0,0.32)] backdrop-blur-xl transition-all duration-200 ${
            compactOnScroll
              ? "h-[54px] rounded-[24px] p-1"
              : "h-[66px] rounded-[28px] p-1.5"
          }`}
        >
          <Link
            href={feedHref}
            onClick={(event) => {
              if (!isFeed) return;

              event.preventDefault();
              window.scrollTo({ top: 0, behavior: "smooth" });

              window.setTimeout(() => {
                window.location.reload();
              }, 120);
            }}
            className={itemClass(isFeed)}
            aria-label={isFeed ? "Refresh feed" : "Feed"}
          >
            <Home className={compactOnScroll ? "h-5 w-5" : "h-6 w-6"} strokeWidth={isFeed ? 2.6 : 2.1} />
            <span>Feed</span>
          </Link>

          <Link
            href="/jobs"
            className={itemClass(isJobs)}
            aria-label="Jobs"
          >
            <BriefcaseBusiness className={compactOnScroll ? "h-5 w-5" : "h-6 w-6"} strokeWidth={isJobs ? 2.6 : 2.1} />
            <span>Jobs</span>
          </Link>

          <Link
            href="/reels"
            className={itemClass(isReels)}
            aria-label="Reels"
          >
            <ReelsIcon className={compactOnScroll ? "h-5 w-5" : "h-6 w-6"} />
            <span>Reels</span>
          </Link>

          <Link
            href="/messages"
            className={itemClass(isMessages)}
            aria-label="Messages"
          >
            <div className="relative">
              <MessageCircle className={compactOnScroll ? "h-5 w-5" : "h-6 w-6"} strokeWidth={isMessages ? 2.6 : 2.1} />
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
            <UserRound className={compactOnScroll ? "h-5 w-5" : "h-6 w-6"} strokeWidth={isProfile ? 2.6 : 2.1} />
            <span>Profile</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}
