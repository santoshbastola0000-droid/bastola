"use client";

import Link from "next/link";
import {
  Bell,
  BriefcaseBusiness,
  Building2,
  ChevronRight,
  ClipboardList,
  Gift,
  Home,
  Keyboard,
  LayoutDashboard,
  MessageCircle,
  PlusCircle,
  Settings2,
  Truck,
  UserRound,
  Wallet,
  X,
} from "lucide-react";

export function MobileMenuDrawer({
  open,
  onClose,
  userName,
}: {
  open: boolean;
  onClose: () => void;
  userName?: string | null;
}) {
  if (!open) return null;

  const services = [
    { label: "Rooms", href: "/rooms", icon: Home },
    { label: "Room shifting", icon: Truck, comingSoon: true },
    { label: "Post a room", href: "/user/dashboard/rooms/create", icon: PlusCircle },
    { label: "Find jobs", href: "/jobs", icon: BriefcaseBusiness, active: true },
    { label: "Messages", href: "/messages", icon: MessageCircle },
    { label: "My rooms", href: "/user/dashboard/rooms", icon: Building2 },
    { label: "Wallet", href: "/user/dashboard/wallet", icon: Wallet },
    { label: "Dashboard", href: "/user/dashboard", icon: LayoutDashboard },
    { label: "Typing practice", href: "/typing", icon: Keyboard },
    { label: "Post a job", href: "/jobs/post", icon: BriefcaseBusiness },
    { label: "Referrals", href: "/user/dashboard/referrals", icon: Gift },
    { label: "Room requests", href: "/user/dashboard/room-requests", icon: ClipboardList },
  ];

  return (
    <div className="fixed inset-0 z-[260] bg-black/40" onClick={onClose}>
      <aside
        className="ml-auto flex h-full w-[94%] max-w-[440px] flex-col overflow-hidden border-l border-slate-200 bg-slate-50 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="shrink-0 border-b border-slate-200 bg-white px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[22px] font-black leading-tight text-slate-950">Menu</div>
              <div className="mt-2 text-[13px] font-semibold text-slate-500">
                Your home. Your services. RoomKhoj.
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label="Close menu"
              className="rounded-full p-2 text-slate-600 transition hover:bg-slate-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-8 pt-4">
          <Link
            href="/user/dashboard/profile"
            onClick={onClose}
            className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-slate-200 text-lg font-bold text-slate-600">
              {String(userName || "R").slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[19px] font-black text-slate-950">
                {userName || "RoomKhoj User"}
              </div>
              <div className="mt-1 text-[14px] font-semibold text-slate-500">View your profile</div>
            </div>
            <ChevronRight className="h-6 w-6 shrink-0 text-slate-400" />
          </Link>

          <Link
            href="/user/dashboard/wallet"
            onClick={onClose}
            className="mt-4 flex items-center gap-4 rounded-2xl border border-red-100 bg-red-50 p-4"
          >
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-red-600 text-white">
              <Wallet className="h-7 w-7" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[14px] font-bold text-slate-600">Wallet balance</div>
              <div className="mt-1 text-[15px] font-black text-slate-950">Open wallet</div>
            </div>
            <ChevronRight className="h-6 w-6 shrink-0 text-red-600" />
          </Link>

          <div className="mt-6 text-[20px] font-black text-slate-950">Your services</div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            {services.map((item) => {
              const Icon = item.icon;
              const card = (
                <div
                  className={`relative flex min-h-[132px] flex-col justify-between rounded-2xl border p-4 shadow-sm transition ${
                    item.active
                      ? "border-red-200 bg-red-50 text-red-700"
                      : "border-slate-200 bg-white text-slate-950"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <Icon className="h-7 w-7" />
                    {item.comingSoon && (
                      <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-extrabold text-amber-700">
                        Coming soon
                      </span>
                    )}
                  </div>
                  <div className="text-[17px] font-black leading-tight">{item.label}</div>
                </div>
              );

              if (!item.href || item.comingSoon) {
                return <div key={item.label}>{card}</div>;
              }

              return (
                <Link key={item.label} href={item.href} onClick={onClose}>
                  {card}
                </Link>
              );
            })}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <Link
              href="/notifications"
              onClick={onClose}
              className="flex min-h-[76px] items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 font-bold shadow-sm"
            >
              <Bell className="h-5 w-5" /> Notifications
            </Link>
            <Link
              href="/user/dashboard/profile"
              onClick={onClose}
              className="flex min-h-[76px] items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 font-bold shadow-sm"
            >
              <Settings2 className="h-5 w-5" /> Settings
            </Link>
          </div>
        </div>
      </aside>
    </div>
  );
}
