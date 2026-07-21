"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  Building2,
  PlusCircle,
  Wallet,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  Clock,
  CheckCircle,
  X,
  Globe,
  UserCircle,
  Bell,
  MessageSquare,
  ShieldAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useUserStore } from "@/stores/user-store";
import { useLogout } from "@/hooks/useLogout";
import { LogoutConfirmDialog } from "@/components/LogoutConfirmDialog";

const navItems = [
  { title: "Dashboard", href: "/user/dashboard", icon: Home },
  { title: "Profile", href: "/user/dashboard/profile", icon: UserCircle },
  {
    title: "Alert Preferences",
    href: "/user/dashboard/preferences",
    icon: Bell,
  },
  {
    title: "Room Requests",
    href: "/user/dashboard/room-requests",
    icon: MessageSquare,
  },
  {
    title: "Safety Reports",
    href: "/user/dashboard/reports",
    icon: ShieldAlert,
  },
  { title: "My Rooms", href: "/user/dashboard/rooms", icon: Building2 },
  {
    title: "Add New Room",
    href: "/user/dashboard/rooms/create",
    icon: PlusCircle,
  },
  {
    title: "Pending Approvals",
    href: "/user/dashboard/rooms/pending",
    icon: Clock,
  },
  {
    title: "Approved Rooms",
    href: "/user/dashboard/rooms/approved",
    icon: CheckCircle,
  },
  { title: "Wallet", href: "/user/dashboard/wallet", icon: Wallet },
];

interface UserSidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (v: boolean) => void;
  isMobile?: boolean;
  onClose?: () => void;
}

// ── Single nav link ──────────────────────────────────────────────────────────
function NavLink({
  item,
  collapsed,
  onClick,
}: {
  item: (typeof navItems)[number];
  collapsed: boolean;
  onClick?: () => void;
}) {
  const pathname = usePathname();
  const isActive = pathname === item.href;
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium cursor-pointer",
        collapsed ? "justify-center" : "",
        isActive
          ? "bg-red-600 text-white shadow-md shadow-red-900/40"
          : "text-gray-300 hover:bg-white/10 hover:text-white",
      )}
    >
      <Icon className="h-[18px] w-[18px] flex-shrink-0" />
      {!collapsed && <span className="flex-1 truncate">{item.title}</span>}
      {!collapsed && isActive && (
        <span className="w-1.5 h-1.5 rounded-full bg-white/70 flex-shrink-0" />
      )}
    </Link>
  );
}

// ── Sidebar body shared between desktop + mobile ──────────────────────────────
function SidebarBody({
  collapsed,
  onNavClick,
  onCollapse,
  showCollapseBtn,
}: {
  collapsed: boolean;
  onNavClick?: () => void;
  onCollapse?: () => void;
  showCollapseBtn?: boolean;
}) {
  const router = useRouter();
  const { user } = useUserStore();
  const { logout } = useLogout();
  const [showLogout, setShowLogout] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = async () => {
    await logout();
    router.push("/auth/login");
  };

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : (user?.email?.slice(0, 2).toUpperCase() ?? "U");

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-gray-900 via-gray-900 to-gray-800">
      {/* ── Logo / brand ── */}
      <div className="flex items-center justify-between px-4 h-16 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center flex-shrink-0 shadow-lg">
            <Home className="w-4 h-4 text-white" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="font-bold text-sm text-white leading-none truncate">
                RentalService
              </p>
              <p className="text-[10px] text-gray-400 mt-0.5">User Dashboard</p>
            </div>
          )}
        </div>
        {showCollapseBtn && (
          <button
            type="button"
            onClick={onCollapse}
            className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer flex-shrink-0"
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        )}
      </div>

      {/* ── User pill (expanded only) ── */}
      {!collapsed && user && (
        <div className="mx-3 mt-3 px-3 py-2.5 bg-white/5 rounded-xl border border-white/10 flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-white truncate">
              {user.name || "User"}
            </p>
            <p className="text-[10px] text-gray-400 truncate">{user.email}</p>
          </div>
        </div>
      )}

      {/* ── Nav items ── */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-0.5 mt-2">
        <TooltipProvider delayDuration={0}>
          {navItems.map((item) =>
            collapsed && mounted ? (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>
                  <div>
                    <NavLink
                      item={item}
                      collapsed={collapsed}
                      onClick={onNavClick}
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right" className="font-medium">
                  {item.title}
                </TooltipContent>
              </Tooltip>
            ) : (
              <NavLink
                key={item.href}
                item={item}
                collapsed={collapsed}
                onClick={onNavClick}
              />
            ),
          )}
        </TooltipProvider>
      </nav>

      {/* ── Footer actions ── */}
      <div className="p-3 border-t border-white/10 shrink-0 space-y-0.5">
        <TooltipProvider delayDuration={0}>
          {collapsed && mounted ? (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => {
                      router.push("/");
                      onNavClick?.();
                    }}
                    className="w-full flex justify-center p-2.5 rounded-xl text-gray-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    <Globe className="w-[18px] h-[18px]" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">View Site</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => setShowLogout(true)}
                    className="w-full flex justify-center p-2.5 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-[18px] h-[18px]" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">Logout</TooltipContent>
              </Tooltip>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => {
                  router.push("/");
                  onNavClick?.();
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-300 hover:text-white hover:bg-white/10 transition-colors text-sm font-medium cursor-pointer"
              >
                <Globe className="w-[18px] h-[18px] flex-shrink-0" />
                <span>View Site</span>
              </button>
              <button
                type="button"
                onClick={() => setShowLogout(true)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors text-sm font-medium cursor-pointer"
              >
                <LogOut className="w-[18px] h-[18px] flex-shrink-0" />
                <span>Logout</span>
              </button>
            </>
          )}
        </TooltipProvider>
      </div>

      <LogoutConfirmDialog
        open={showLogout}
        onOpenChange={setShowLogout}
        onConfirm={handleLogout}
      />
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// ── EXPORTED SIDEBAR ────────────────────────────────────────
// ════════════════════════════════════════════════════════════
export function UserSidebar({
  isCollapsed,
  setIsCollapsed,
  isMobile = false,
  onClose,
}: UserSidebarProps) {
  // Mobile mode: the drawer open/close is controlled by the parent (UserLayout)
  // via onClose callback. The hamburger button is rendered inside UserHeader.
  if (isMobile) {
    return (
      // Full-height drawer — parent handles the translate via className
      <div className="h-full flex flex-col">
        <div className="relative flex flex-col h-full">
          {/* Close button inside drawer */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 z-10 w-8 h-8 rounded-lg bg-white/10 text-gray-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
          <SidebarBody collapsed={false} onNavClick={onClose} />
        </div>
      </div>
    );
  }

  // Desktop
  return (
    <div className="h-full flex flex-col">
      <SidebarBody
        collapsed={isCollapsed}
        onCollapse={() => setIsCollapsed(!isCollapsed)}
        showCollapseBtn
      />
    </div>
  );
}
