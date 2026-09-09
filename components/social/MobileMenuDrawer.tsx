"use client";

import Link from "next/link";
import {
  Bell,
  BriefcaseBusiness,
  CircleDollarSign,
  Home,
  LogOut,
  MessageCircle,
  Settings2,
  Share2,
  UserRound,
  UsersRound,
  WalletCards,
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

  return (
    <div className="fixed inset-0 z-[260] bg-black/40" onClick={onClose}>
      <aside
        className="ml-auto h-full w-[88%] max-w-[390px] overflow-y-auto bg-[#f0f2f5] shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-4 py-3">
          <div>
            <div className="text-[20px] font-bold leading-tight">Menu</div>
            <div className="text-[12px] text-slate-500">RoomKhoj</div>
          </div>
          <button onClick={onClose} className="rounded-full bg-slate-100 p-2.5">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-3 p-3">
          <section className="rounded-2xl bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-200 text-lg font-bold text-slate-600">
                {String(userName || "R").slice(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="truncate text-[16px] font-semibold">{userName || "RoomKhoj User"}</div>
                <Link href="/user/dashboard/profile" onClick={onClose} className="text-[12px] font-medium text-blue-600">
                  View profile
                </Link>
              </div>
            </div>
          </section>

          <MenuBox title="Quick actions">
            <MenuItem href="/feed" icon={<Home />} label="Feed" onClick={onClose} />
            <MenuItem href="/rooms" icon={<Home />} label="Browse Rooms" onClick={onClose} />
            <MenuItem href="/jobs" icon={<BriefcaseBusiness />} label="Jobs" onClick={onClose} />
            <MenuItem href="/messages" icon={<MessageCircle />} label="Messages" onClick={onClose} />
            <MenuItem href="/notifications" icon={<Bell />} label="Notifications" onClick={onClose} />
            <MenuItem href="/user/dashboard/profile" icon={<UserRound />} label="Profile" onClick={onClose} />
          </MenuBox>

          <MenuBox title="Community">
            <MenuItem href="/user/dashboard/profile" icon={<UsersRound />} label="Friends & People" onClick={onClose} />
            <MenuItem href="/feed" icon={<Share2 />} label="Stories & Groups" onClick={onClose} />
          </MenuBox>

          <MenuBox title="RoomKhoj services">
            <MenuItem href="/user/dashboard/rooms/create" icon={<CircleDollarSign />} label="List Room & Earn" onClick={onClose} />
            <MenuItem href="/jobs" icon={<BriefcaseBusiness />} label="Post / Manage Vacancy" onClick={onClose} />
            <MenuItem href="/user/dashboard/wallet" icon={<WalletCards />} label="Wallet" onClick={onClose} />
            <MenuItem href="/user/dashboard/referrals" icon={<Share2 />} label="Invite & Earn" onClick={onClose} />
            <MenuItem href="/typing" icon={<Settings2 />} label="Typing & Learning" onClick={onClose} />
            <MenuItem href="/notice" icon={<Bell />} label="Notice Board" onClick={onClose} />
          </MenuBox>

          <MenuBox title="Settings">
            <MenuItem href="/user/dashboard/profile" icon={<Settings2 />} label="Privacy & Preferences" onClick={onClose} />
            <MenuItem href="/auth/logout" icon={<LogOut />} label="Logout" onClick={onClose} danger />
          </MenuBox>
        </div>
      </aside>
    </div>
  );
}

function MenuBox({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl bg-white p-2 shadow-sm">
      <div className="px-2 pb-1 pt-1 text-[13px] font-semibold text-slate-500">{title}</div>
      <div className="grid grid-cols-2 gap-1">{children}</div>
    </section>
  );
}

function MenuItem({
  href,
  icon,
  label,
  onClick,
  danger = false,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex min-h-[62px] items-center gap-2 rounded-xl px-3 py-2 text-[13px] font-semibold hover:bg-slate-50 ${danger ? "text-red-600" : "text-slate-800"}`}
    >
      <span className="[&>svg]:h-5 [&>svg]:w-5">{icon}</span>
      <span>{label}</span>
    </Link>
  );
}
