"use client";

import Link from "next/link";
import { useState } from "react";
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
import { SocialFeedScreen } from "@/components/social/SocialFeedScreen";

export function FeedChrome() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f0f2f5]">
      <header className="sticky top-0 z-[120] border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-[58px] max-w-[760px] items-center justify-end gap-2 px-3">
          <Link
            href="/notifications"
            aria-label="Notifications"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-800"
          >
            <Bell className="h-5 w-5" />
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

        {menuOpen && (
          <div className="absolute right-3 top-[54px] z-[130] w-64 rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl">
            <MenuLink href="/feed" label="Feed" icon={<UsersRound className="h-5 w-5" />} onClick={() => setMenuOpen(false)} />
            <MenuLink href="/rooms" label="Rooms" icon={<Plus className="h-5 w-5" />} onClick={() => setMenuOpen(false)} />
            <MenuLink href="/jobs" label="Jobs" icon={<BriefcaseBusiness className="h-5 w-5" />} onClick={() => setMenuOpen(false)} />
            <MenuLink href="/messages" label="Messages" icon={<MessageCircle className="h-5 w-5" />} onClick={() => setMenuOpen(false)} />
            <MenuLink href="/user/dashboard/profile" label="Profile" icon={<UserRound className="h-5 w-5" />} onClick={() => setMenuOpen(false)} />
            <MenuLink href="/user/dashboard/rooms/create" label="List Room & Earn" icon={<Plus className="h-5 w-5" />} onClick={() => setMenuOpen(false)} />
          </div>
        )}
      </header>

      <div className="[&>div>header]:hidden">
        <SocialFeedScreen />
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
