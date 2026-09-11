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
          <div className="absolute right-3 top-[54px] z-[130] max-h-[calc(100dvh-72px)] w-[min(92vw,360px)] overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50 p-2.5 shadow-2xl">
            <div className="px-1 pb-2 pt-1">
              <div className="text-[16px] font-black text-slate-950">Quick menu</div>
              <div className="mt-0.5 text-[12px] font-medium text-slate-500">Choose where you want to go</div>
            </div>
            <div className="space-y-2">
              <MenuLink
                href="/feed"
                label="Feed"
                description="See posts, rooms and updates"
                icon={<UsersRound className="h-5 w-5" />}
                onClick={() => setMenuOpen(false)}
              />
              <MenuLink
                href="/rooms"
                label="Browse Rooms"
                description="See all available room cards"
                icon={<Plus className="h-5 w-5" />}
                onClick={() => setMenuOpen(false)}
              />
              <MenuLink
                href="/jobs"
                label="Jobs"
                description="Browse available job vacancies"
                icon={<BriefcaseBusiness className="h-5 w-5" />}
                onClick={() => setMenuOpen(false)}
              />
              <MenuLink
                href="/messages"
                label="Messages"
                description="Open your chats and conversations"
                icon={<MessageCircle className="h-5 w-5" />}
                onClick={() => setMenuOpen(false)}
              />
              <MenuLink
                href="/user/dashboard/profile"
                label="Profile"
                description="View and manage your profile"
                icon={<UserRound className="h-5 w-5" />}
                onClick={() => setMenuOpen(false)}
              />
              <MenuLink
                href="/notifications"
                label={`Notifications${unreadCount ? ` (${unreadCount})` : ""}`}
                description="See your latest alerts"
                icon={<Bell className="h-5 w-5" />}
                onClick={() => setMenuOpen(false)}
              />
              <MenuLink
                href="/user/dashboard/rooms/create"
                label="List Room & Earn"
                description="Post your room and reach tenants"
                icon={<Plus className="h-5 w-5" />}
                onClick={() => setMenuOpen(false)}
                highlight
              />
            </div>
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
  description,
  icon,
  onClick,
  highlight = false,
}: {
  href: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
  highlight?: boolean;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center gap-3 rounded-xl border px-3 py-3 shadow-sm transition-colors ${
        highlight
          ? "border-red-200 bg-red-50 hover:bg-red-100/70"
          : "border-slate-200 bg-white hover:border-red-100 hover:bg-red-50/60"
      }`}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[14px] font-bold text-slate-950">{label}</div>
        <div className="mt-0.5 line-clamp-2 text-[11px] font-medium leading-4 text-slate-500">
          {description}
        </div>
      </div>
      <ChevronRight className="h-5 w-5 shrink-0 text-red-600" />
    </Link>
  );
}
