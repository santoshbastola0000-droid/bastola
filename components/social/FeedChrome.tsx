"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Bell, Menu } from "lucide-react";
import { Logo } from "@/components/Logo";
import { MobileMenuDrawer } from "@/components/social/MobileMenuDrawer";
import { FeedNetworkOptimizer } from "@/components/social/FeedNetworkOptimizer";
import { notificationService } from "@/http/services/notification.service";
import { socialService } from "@/http/services/social.service";
import { useUserStore } from "@/stores/user-store";
import {
  getNetworkProfile,
  onNetworkProfileChange,
} from "@/lib/network-quality";
import styles from "./FeedChrome.module.css";

function FeedSkeleton() {
  return (
    <div className="mx-auto max-w-[720px] space-y-2 pb-24 sm:px-3" aria-label="Loading feed">
      <section className="border-y bg-white px-3 py-4 shadow-sm sm:rounded-xl sm:border">
        <div className="flex gap-3 overflow-hidden">
          {[0, 1, 2, 3].map((item) => (
            <div key={item} className="h-[150px] w-[96px] shrink-0 animate-pulse rounded-xl bg-slate-200" />
          ))}
        </div>
      </section>
      {[0, 1, 2].map((item) => (
        <section key={item} className="border-y bg-white p-3 shadow-sm sm:rounded-xl sm:border">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 animate-pulse rounded-full bg-slate-200" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-32 animate-pulse rounded bg-slate-200" />
              <div className="h-2.5 w-20 animate-pulse rounded bg-slate-100" />
            </div>
          </div>
          <div className="mt-3 h-52 animate-pulse rounded-xl bg-slate-100" />
        </section>
      ))}
    </div>
  );
}

const SocialFeedScreen = dynamic(
  () => import("@/components/social/SocialFeedScreen").then((module) => module.SocialFeedScreen),
  {
    ssr: false,
    loading: FeedSkeleton,
  },
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

export function FeedChrome() {
  const user = useUserStore((state) => state.user);
  const [menuOpen, setMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [headerVisible, setHeaderVisible] = useState(true);
  const [feedVersion, setFeedVersion] = useState(0);
  const [networkProfile, setNetworkProfile] = useState(() => getNetworkProfile());
  const lastScrollY = useRef(0);
  const feedSnapshotRef = useRef<string | null>(null);
  const feedPollBusyRef = useRef(false);
  const restoreScrollRef = useRef<number | null>(null);

  useEffect(
    () => onNetworkProfileChange(() => setNetworkProfile(getNetworkProfile())),
    [],
  );

  useEffect(() => {
    let active = true;
    const refresh = async () => {
      const count = await notificationService.unreadCount().catch(() => 0);
      if (active) setUnreadCount(count);
    };
    void refresh();
    const timer = window.setInterval(
      refresh,
      networkProfile.liteMode ? 45_000 : 20_000,
    );
    const onFocus = () => void refresh();
    window.addEventListener("focus", onFocus);
    return () => {
      active = false;
      window.clearInterval(timer);
      window.removeEventListener("focus", onFocus);
    };
  }, [networkProfile.liteMode]);

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
        // Feed polling is best-effort. The visible feed request handles errors.
      } finally {
        feedPollBusyRef.current = false;
      }
    };

    // Do not duplicate the initial feed request. Start background checks only
    // after the first interval; weak connections get a much wider interval.
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
  }, [networkProfile.pollIntervalMs]);

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
    <div
      data-roomkhoj-feed-root="true"
      data-lite-mode={networkProfile.liteMode ? "true" : "false"}
      className={`${styles.primaryTheme} min-h-screen bg-[#f0f2f5]`}
    >
      <FeedNetworkOptimizer />

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
              onClick={() => setMenuOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-800"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </header>

      <MobileMenuDrawer
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        userName={user?.name}
      />

      <div className="[&>div>header]:hidden">
        <SocialFeedScreen key={feedVersion} />
      </div>
    </div>
  );
}
