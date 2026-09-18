"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { messageService } from "@/http/services/message.service";
import { notificationService } from "@/http/services/notification.service";
import { useUserStore } from "@/stores/user-store";
import {
  Bell,
  BedDouble,
  BriefcaseBusiness,
  Home,
  MessageCircle,
  Plus,
  UserRound,
} from "lucide-react";

const backendUrl = String(
  process.env.NEXT_PUBLIC_BACKEND_URL || "https://api.roomkhoj.com",
).replace(/\/$/, "");

function profilePhotoUrl(value?: string | null) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (/^(https?:)?\/\//i.test(raw)) {
    return raw.startsWith("//") ? `https:${raw}` : raw;
  }
  if (/^(data:|blob:)/i.test(raw)) return raw;
  return `${backendUrl}${raw.startsWith("/") ? raw : `/${raw}`}`;
}

export function MobileBottomNav() {
  const pathname = usePathname();
  const user = useUserStore((state) => state.user);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationCount, setNotificationCount] = useState(0);

  useEffect(() => {
    let active = true;

    const loadUnread = async () => {
      const [messages, notifications] = await Promise.all([
        messageService.getUnreadCount().catch(() => ({ count: 0 })),
        notificationService.unreadCount().catch(() => 0),
      ]);

      if (!active) return;
      setUnreadCount(Number(messages?.count || 0));
      setNotificationCount(Number(notifications || 0));
    };

    void loadUnread();
    const handleUnreadRefresh = () => void loadUnread();
    window.addEventListener("roomkhoj:unread-refresh", handleUnreadRefresh);
    const timer = window.setInterval(loadUnread, 15000);

    return () => {
      active = false;
      window.clearInterval(timer);
      window.removeEventListener("roomkhoj:unread-refresh", handleUnreadRefresh);
    };
  }, []);

  const feedHref = user ? "/feed" : "/rooms";
  const isFeed = user
    ? pathname === "/" || pathname.startsWith("/feed")
    : pathname.startsWith("/rooms");
  const isRooms = pathname.startsWith("/rooms") || pathname.startsWith("/property/");
  const isJobs = pathname.startsWith("/jobs") || pathname.startsWith("/job/");
  const isMessages = pathname.startsWith("/messages");
  const isNotifications = pathname.startsWith("/notifications");
  const isProfile = pathname.startsWith("/user/dashboard/profile");

  const socialHome = Boolean(user && (pathname === "/" || pathname.startsWith("/feed")));

  if (socialHome) {
    const photo = profilePhotoUrl((user as any)?.profilePhotoUrl);

    const tabs = [
      {
        href: "/feed",
        label: "Home",
        active: isFeed,
        icon: <Home className="h-[25px] w-[25px]" strokeWidth={isFeed ? 2.7 : 2.1} />,
      },
      {
        href: "/rooms",
        label: "Rooms",
        active: isRooms,
        icon: <BedDouble className="h-[25px] w-[25px]" strokeWidth={2.1} />,
      },
      {
        href: "/jobs",
        label: "Jobs",
        active: isJobs,
        icon: <BriefcaseBusiness className="h-[25px] w-[25px]" strokeWidth={2.1} />,
      },
      {
        href: "/messages",
        label: "Messages",
        active: isMessages,
        badge: unreadCount,
        icon: <MessageCircle className="h-[25px] w-[25px]" strokeWidth={2.1} />,
      },
      {
        href: "/notifications",
        label: "Alerts",
        active: isNotifications,
        badge: notificationCount,
        icon: <Bell className="h-[25px] w-[25px]" strokeWidth={2.1} />,
      },
    ];

    return (
      <nav
        aria-label="RoomKhoj mobile navigation"
        className="fixed bottom-0 left-0 right-0 z-[99999] border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        <div className="mx-auto flex h-[70px] max-w-[760px] items-stretch justify-around">
          {tabs.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              aria-label={tab.label}
              className={`relative flex min-w-0 flex-1 flex-col items-center justify-center gap-1 text-[10px] font-bold transition-colors ${
                tab.active ? "text-[#1877f2]" : "text-slate-950"
              }`}
            >
              {tab.active && (
                <span className="absolute left-2 right-2 top-0 h-[3px] rounded-b-full bg-[#1877f2]" />
              )}
              <span className="relative">
                {tab.icon}
                {Boolean(tab.badge) && (
                  <span className="absolute -right-3 -top-2 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-600 px-1 text-[9px] font-extrabold leading-none text-white ring-2 ring-white">
                    {(tab.badge || 0) > 99 ? "99+" : tab.badge}
                  </span>
                )}
              </span>
              <span className="max-w-full truncate px-0.5">{tab.label}</span>
            </Link>
          ))}

          <Link
            href="/user/dashboard/profile"
            aria-label="Profile"
            className={`relative flex min-w-0 flex-1 flex-col items-center justify-center gap-1 text-[10px] font-bold transition-colors ${
              isProfile ? "text-[#1877f2]" : "text-slate-950"
            }`}
          >
            {isProfile && (
              <span className="absolute left-2 right-2 top-0 h-[3px] rounded-b-full bg-[#1877f2]" />
            )}
            {photo ? (
              <img
                src={photo}
                alt={user?.name || "Profile"}
                className="h-[26px] w-[26px] rounded-full border border-slate-300 object-cover"
              />
            ) : (
              <UserRound className="h-[25px] w-[25px]" strokeWidth={2.1} />
            )}
            <span>Profile</span>
          </Link>
        </div>
      </nav>
    );
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[99999] border-t border-gray-200 bg-white pb-[env(safe-area-inset-bottom)] md:hidden">
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
