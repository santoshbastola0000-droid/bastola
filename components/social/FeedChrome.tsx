"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  Bell,
  BriefcaseBusiness,
  ChevronRight,
  Menu,
  MessageCircle,
  Plus,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { SocialFeedScreen } from "@/components/social/SocialFeedScreen";
import { notificationService } from "@/http/services/notification.service";
import { socialService } from "@/http/services/social.service";

function feedSignature(items: any[]) {
  try {
    // Polling should remount the feed only for structural/content changes such as
    // add/delete/edit. Reaction/comment/share state is managed locally by each
    // post and must not be overwritten by a polling request racing the mutation.
    return JSON.stringify(
      items.map((item) => {
        if (item?.type === "POST") {
          return {
            type: item.type,
            id: item.post?.id,
            content: item.post?.content,
            mediaUrls: item.post?.mediaUrls,
            visibility: item.post?.visibility,
            updatedAt: item.post?.updatedAt,
          };
        }
        if (item?.type === "ROOM") {
          return { type: item.type, id: item.id, room: item.room };
        }
        if (item?.type === "JOB") {
          return { type: item.type, id: item.id, job: item.job };
        }
        if (item?.type === "SERVICE") {
          return { type: item.type, id: item.id, service: item.service };
        }
        return { type: item?.type, id: item?.id };
      }),
    );
  } catch {
    return String(items.length);
  }
}

export function FeedChrome() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [headerVisible, setHeaderVisible] = useState(true);
  const [feedVersion, setFeedVersion] = useState(0);
  const lastScrollY = useRef(0);
  const feedSnapshotRef = useRef<string | null>(null);
  const feedPollBusyRef = useRef(false);
  const restoreScrollRef = useRef<number | null>(null);

  useEffect(() => {
    let active = true;
    const refresh = async () => {
      const count = await notificationService.unreadCount().catch(() => 0);
      if (active) setUnreadCount(count);
    };
    void refresh();
    const timer = window.setInterval(refresh, 15000);
    const onFocus = () => void refresh();
    window.addEventListener("focus", onFocus);
    return () => {
      active = false;
      window.clearInterval(timer);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  useEffect(() => {
    let active = true;

    const checkFeed = async () => {
      if (
        !active ||
        feedPollBusyRef.current ||
        document.visibilityState !== "visible" ||
        !navigator.onLine
      ) {
        return;
      }

      feedPollBusyRef.current = true;
      try {
        const feed = await socialService.feed();
        if (!active) return;

        const nextSignature = feedSignature(feed.items || []);
        const previousSignature = feedSnapshotRef.current;
        feedSnapshotRef.current = nextSignature;

        if (previousSignature !== null && previousSignature !== nextSignature) {
          restoreScrollRef.current = window.scrollY;
          setFeedVersion((value) => value + 1);
        }
      } catch {
        // Feed polling is best-effort. The normal feed request still handles visible errors.
      } finally {
        feedPollBusyRef.current = false;
      }
    };

    void checkFeed();
    const timer = window.setInterval(() => void checkFeed(), 1000);
    const onFocus = () => void checkFeed();
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") void checkFeed();
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      active = false;
      window.clearInterval(timer);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  useEffect(() => {
    const y = restoreScrollRef.current;
    if (y === null) return;

    const restore = () => {
      window.scrollTo({ top: y, behavior: "auto" });
      restoreScrollRef.current = null;
    };

    const first = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(restore);
    });
    return () => window.cancelAnimationFrame(first);
  }, [feedVersion]);

  useEffect(() => {
    const onScroll = () => {
      const current = Math.max(0, window.scrollY);
      const delta = current - lastScrollY.current;

      if (current < 20) {
        setHeaderVisible(true);
      } else if (delta > 0) {
        // Keep the header visible no matter how far the user scrolls down the feed.
        setHeaderVisible(true);
      } else if (delta < -6) {
        setHeaderVisible(false);
      }

      lastScrollY.current = current;
    };

    lastScrollY.current = window.scrollY;
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#f0f2f5]">
      <header
        className={`sticky top-0 z-[120] border-b border-slate-200 bg-white/95 backdrop-blur transition-transform duration-200 ${
          headerVisible ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        <div className="mx-auto flex h-[58px] max-w-[760px] items-center justify-between gap-2 px-3">
          <div className="flex min-w-0 items-center">
            <Logo />
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/notifications"
              aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
              className="relative flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-800"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-md bg-red-600 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-white">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </Link>

            <button
              type="button"
              aria-label="Menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((value) => !value)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-800"
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="absolute right-3 top-[54px] z-[130] w-64 rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl">
            <MenuLink href="/feed" label="Feed" icon={<UsersRound className="h-5 w-5" />} onClick={() => setMenuOpen(false)} />
            <MenuLink href="/rooms" label="Rooms" icon={<Plus className="h-5 w-5" />} onClick={() => setMenuOpen(false)} />
            <MenuLink href="/jobs" label="Jobs" icon={<BriefcaseBusiness className="h-5 w-5" />} onClick={() => setMenuOpen(false)} />
            <MenuLink href="/messages" label="Messages" icon={<MessageCircle className="h-5 w-5" />} onClick={() => setMenuOpen(false)} />
            <MenuLink href="/user/dashboard/profile" label="Profile" icon={<UserRound className="h-5 w-5" />} onClick={() => setMenuOpen(false)} />
            <MenuLink href="/notifications" label={`Notifications${unreadCount ? ` (${unreadCount})` : ""}`} icon={<Bell className="h-5 w-5" />} onClick={() => setMenuOpen(false)} />
            <MenuLink href="/user/dashboard/rooms/create" label="List Room & Earn" icon={<Plus className="h-5 w-5" />} onClick={() => setMenuOpen(false)} />
          </div>
        )}
      </header>

      <div className="[&>div>header]:hidden">
        <SocialFeedScreen key={feedVersion} />
      </div>
    </div>
  );
}

function MenuLink({
  href,
  label,
  icon,
  onClick,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-3 rounded-xl px-3 py-3 font-semibold text-slate-800 hover:bg-slate-100"
    >
      {icon}
      <span>{label}</span>
      <ChevronRight className="ml-auto h-4 w-4 text-slate-400" />
    </Link>
  );
}
