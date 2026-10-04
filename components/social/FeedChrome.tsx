"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Bell, Menu, Plus, Search } from "lucide-react";
import { FeedNetworkOptimizer } from "@/components/social/FeedNetworkOptimizer";
import { PublicSocialFeedScreen } from "@/components/social/PublicSocialFeedScreen";
import { SocialFeedScreen } from "@/components/social/SocialFeedScreen";
import { notificationService } from "@/http/services/notification.service";
import { socialService } from "@/http/services/social.service";
import { useUserStore } from "@/stores/user-store";
import {
  getNetworkProfile,
  onNetworkProfileChange,
} from "@/lib/network-quality";
import styles from "./FeedChrome.module.css";

const MobileMenuDrawer = dynamic(
  () =>
    import("@/components/social/MobileMenuDrawer").then(
      (module) => module.MobileMenuDrawer,
    ),
  { ssr: false },
);

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

// Guest public feed deployment marker: keep /feed accessible before login.
export function FeedChrome() {
  const user = useUserStore((state) => state.user);
  const [menuOpen, setMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [headerVisible, setHeaderVisible] = useState(true);
  const [feedVersion, setFeedVersion] = useState(0);
  const [networkProfile, setNetworkProfile] = useState(() => getNetworkProfile());
  const [pullDistance, setPullDistance] = useState(0);
  const [pullingToRefresh, setPullingToRefresh] = useState(false);
  const lastScrollY = useRef(0);
  const feedSnapshotRef = useRef<string | null>(null);
  const feedPollBusyRef = useRef(false);
  const restoreScrollRef = useRef<number | null>(null);
  const pullStartYRef = useRef<number | null>(null);
  const pullActiveRef = useRef(false);
  const pullDistanceRef = useRef(0);

  useEffect(
    () => onNetworkProfileChange(() => setNetworkProfile(getNetworkProfile())),
    [],
  );

  useEffect(() => {
    if (!user) return;

    let active = true;
    let interval: number | undefined;

    const refresh = async () => {
      const count = await notificationService.unreadCount().catch(() => 0);
      if (active) setUnreadCount(count);
    };

    // Notifications are a logged-in-only secondary feature.
    const initialDelay = window.setTimeout(() => {
      if (!active) return;
      void refresh();
      interval = window.setInterval(
        refresh,
        networkProfile.liteMode ? 45_000 : 20_000,
      );
    }, networkProfile.liteMode ? 2_000 : 1_000);

    const onFocus = () => void refresh();
    window.addEventListener("focus", onFocus);

    return () => {
      active = false;
      window.clearTimeout(initialDelay);
      if (interval !== undefined) window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [networkProfile.liteMode, user]);

  useEffect(() => {
    if (!user) return;

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
        // Feed polling is best-effort. The visible feed request handles errors.
      } finally {
        feedPollBusyRef.current = false;
      }
    };

    // Logged-out visitors use the anonymous public feed and do not poll the
    // authenticated endpoint.
    const timer = window.setInterval(
      () => void checkFeed(),
      networkProfile.pollIntervalMs,
    );
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
  }, [networkProfile.pollIntervalMs, user]);

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
      } else if (delta > 7) {
        setHeaderVisible(false);
      } else if (delta < -7) {
        setHeaderVisible(true);
      }

      lastScrollY.current = current;
    };

    lastScrollY.current = window.scrollY;
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    // Mobile pull-to-refresh: only activate when the page is already at the
    // very top, so normal feed scrolling is never interrupted.
    const onTouchStart = (event: TouchEvent) => {
      if (window.scrollY > 0 || event.touches.length !== 1) {
        pullStartYRef.current = null;
        pullActiveRef.current = false;
        return;
      }

      pullStartYRef.current = event.touches[0].clientY;
      pullActiveRef.current = true;
    };

    const onTouchMove = (event: TouchEvent) => {
      if (!pullActiveRef.current || pullStartYRef.current === null) return;

      const currentY = event.touches[0].clientY;
      const delta = currentY - pullStartYRef.current;
      if (delta <= 0) {
        pullDistanceRef.current = 0;
        setPullDistance(0);
        setPullingToRefresh(false);
        return;
      }

      // Resistance makes the gesture feel natural instead of moving 1:1.
      const distance = Math.min(110, delta * 0.5);
      pullDistanceRef.current = distance;
      setPullDistance(distance);
      setPullingToRefresh(distance >= 58);

      if (distance > 0) event.preventDefault();
    };

    const onTouchEnd = () => {
      if (!pullActiveRef.current) return;

      const shouldRefresh = pullDistanceRef.current >= 58;
      pullActiveRef.current = false;
      pullStartYRef.current = null;
      pullDistanceRef.current = 0;
      setPullDistance(0);
      setPullingToRefresh(false);

      if (shouldRefresh) {
        window.location.reload();
      }
    };

    document.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("touchmove", onTouchMove, { passive: false });
    document.addEventListener("touchend", onTouchEnd, { passive: true });
    document.addEventListener("touchcancel", onTouchEnd, { passive: true });

    return () => {
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", onTouchEnd);
      document.removeEventListener("touchcancel", onTouchEnd);
    };
  }, []);

  return (
    <div
      data-roomkhoj-feed-root="true"
      data-lite-mode={networkProfile.liteMode ? "true" : "false"}
      className={`${styles.primaryTheme} min-h-screen bg-red-50/30 overscroll-y-contain`}
    >
      <FeedNetworkOptimizer />

      {pullDistance > 0 && (
        <div
          aria-live="polite"
          className="pointer-events-none fixed left-1/2 top-[68px] z-[200] flex -translate-x-1/2 items-center gap-2 rounded-full border border-slate-200 bg-white/95 px-4 py-2 text-xs font-bold text-slate-700 shadow-lg backdrop-blur"
          style={{ transform: `translate(-50%, ${Math.min(pullDistance, 24)}px)` }}
        >
          <span
            className={`inline-flex h-5 w-5 items-center justify-center rounded-full border-2 border-red-200 text-red-600 transition-transform duration-150 ${pullingToRefresh ? "rotate-180" : ""}`}
          >
            ↓
          </span>
          {pullingToRefresh ? "Release to refresh" : "Pull to refresh"}
        </div>
      )}

      <header className={`sticky top-0 z-[120] border-b border-slate-200 bg-white shadow-[0_1px_0_rgba(15,23,42,0.05)] transition-transform duration-200 ${headerVisible ? "translate-y-0" : "-translate-y-full"}`}>
        <div className="mx-auto flex h-[64px] max-w-[760px] items-center gap-2 px-3">
          <button
            type="button"
            aria-label="Menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(true)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-slate-900 transition hover:bg-slate-100 active:bg-slate-200"
          >
            <Menu className="h-7 w-7" strokeWidth={2.2} />
          </button>

          <Link
            href="/feed"
            aria-label="RoomKhoj Home"
            className="min-w-0 flex-1 truncate text-[30px] font-black leading-none tracking-[-0.055em] text-red-600"
          >
            roomkhoj
          </Link>

          <button
            type="button"
            aria-label="Create post"
            onClick={() => {
              if (!user) {
                window.dispatchEvent(new Event("roomkhoj:open-login"));
                return;
              }
              const composer = document.getElementById("feed-composer");
              composer?.scrollIntoView({
                behavior: "smooth",
                block: "center",
              });

              window.setTimeout(() => {
                const input = composer?.querySelector<HTMLInputElement>(
                  'input[placeholder*="What"]',
                );
                input?.focus();
              }, 350);
            }}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-950 transition active:scale-95"
          >
            <Plus className="h-6 w-6" strokeWidth={2.5} />
          </button>

          <Link
            href="/search"
            aria-label="Search RoomKhoj"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-950 transition active:scale-95"
          >
            <Search className="h-6 w-6" strokeWidth={2.4} />
          </Link>

          <Link
            href="/notifications"
            aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
            className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-950 transition active:scale-95"
            onClick={(event) => {
              if (!user) {
                event.preventDefault();
                window.dispatchEvent(new Event("roomkhoj:open-login"));
              }
            }}
          >
            <Bell className="h-6 w-6" strokeWidth={2.1} />
            {user && unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-extrabold leading-none text-white ring-2 ring-white">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </Link>
        </div>
      </header>

      {menuOpen && (
        <MobileMenuDrawer
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
          userName={user?.name}
        />
      )}

      <div className="[&>div>header]:hidden">
        {user ? (
          <SocialFeedScreen key={feedVersion} />
        ) : (
          <PublicSocialFeedScreen />
        )}
      </div>
    </div>
  );
}
