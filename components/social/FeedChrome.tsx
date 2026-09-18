"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Menu, MessageCircle, Plus, Search } from "lucide-react";
import { FeedNetworkOptimizer } from "@/components/social/FeedNetworkOptimizer";
import { SocialFeedScreen } from "@/components/social/SocialFeedScreen";
import { messageService } from "@/http/services/message.service";
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

export function FeedChrome() {
  const user = useUserStore((state) => state.user);
  const [menuOpen, setMenuOpen] = useState(false);
  const [messageUnreadCount, setMessageUnreadCount] = useState(0);
  const [feedVersion, setFeedVersion] = useState(0);
  const [networkProfile, setNetworkProfile] = useState(() => getNetworkProfile());
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
      const data = await messageService.getUnreadCount().catch(() => ({ count: 0 }));
      if (active) setMessageUnreadCount(Number(data?.count || 0));
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



  return (
    <div
      data-roomkhoj-feed-root="true"
      data-lite-mode={networkProfile.liteMode ? "true" : "false"}
      className={`${styles.primaryTheme} min-h-screen bg-[#f0f2f5]`}
    >
      <FeedNetworkOptimizer />

      <header className="sticky top-0 z-[120] border-b border-slate-200 bg-white shadow-[0_1px_0_rgba(15,23,42,0.05)]">
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
            className="min-w-0 flex-1 truncate text-[30px] font-black leading-none tracking-[-0.055em] text-[#1877f2]"
          >
            roomkhoj
          </Link>

          <button
            type="button"
            aria-label="Create post"
            onClick={() =>
              document
                .getElementById("feed-composer")
                ?.scrollIntoView({ behavior: "smooth", block: "center" })
            }
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-950 transition active:scale-95"
          >
            <Plus className="h-6 w-6" strokeWidth={2.5} />
          </button>

          <Link
            href="/rooms"
            aria-label="Search rooms"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-950 transition active:scale-95"
          >
            <Search className="h-6 w-6" strokeWidth={2.4} />
          </Link>

          <Link
            href="/messages"
            aria-label={`Messages${messageUnreadCount ? `, ${messageUnreadCount} unread` : ""}`}
            className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-950 transition active:scale-95"
          >
            <MessageCircle className="h-6 w-6" fill="currentColor" strokeWidth={1.7} />
            {messageUnreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-extrabold leading-none text-white ring-2 ring-white">
                {messageUnreadCount > 99 ? "99+" : messageUnreadCount}
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
        <SocialFeedScreen key={feedVersion} />
      </div>
    </div>
  );
}
