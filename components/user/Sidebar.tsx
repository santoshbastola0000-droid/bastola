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

function NavLink({
  item,
  collapsed,
  onClick,
}: {
  item: { title: string; href: string; icon: React.ElementType };
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
        "flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-sm",
        collapsed ? "justify-center" : "",
        isActive
          ? "bg-red-600 text-white shadow-md shadow-red-200"
          : "text-gray-300 hover:bg-gray-800 hover:text-white",
      )}
    >
      <Icon className="h-4 w-4 flex-shrink-0" />
      {!collapsed && <span className="flex-1">{item.title}</span>}
    </Link>
  );
}

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

  return (
    <>
      {/* Logo */}
      <div className="flex items-center justify-between px-4 h-16 border-b border-gray-700 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shrink-0">
            <Home className="w-4 h-4 text-white" />
          </div>
          {!collapsed && (
            <div>
              <p className="font-bold text-sm text-white leading-none">
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
            className="text-gray-400 hover:text-white p-1 rounded-md hover:bg-gray-700 transition-colors"
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
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
                <TooltipContent side="right">{item.title}</TooltipContent>
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

      {/* Footer */}
      <div className="p-3 border-t border-gray-700 shrink-0 space-y-1">
        <TooltipProvider delayDuration={0}>
          {collapsed && mounted ? (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => router.push("/")}
                    className="w-full flex justify-center p-2 rounded-lg text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
                  >
                    <Home className="w-4 h-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">View Site</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => setShowLogout(true)}
                    className="w-full flex justify-center p-2 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
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
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-gray-800 transition-colors text-sm"
              >
                <Home className="w-4 h-4 shrink-0" />
                <span>View Site</span>
              </button>
              <button
                type="button"
                onClick={() => setShowLogout(true)}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors text-sm"
              >
                <LogOut className="w-4 h-4 shrink-0" />
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
    </>
  );
}

export function UserSidebar({
  isCollapsed,
  setIsCollapsed,
  isMobile = false,
}: UserSidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  if (isMobile) {
    return (
      <>
        {/* Hamburger */}
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
          className="md:hidden fixed top-4 left-4 z-50 w-10 h-10 rounded-xl bg-gray-900 text-white flex items-center justify-center shadow-lg"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Backdrop */}
        {mobileOpen && (
          <div
            className="fixed inset-0 bg-black/60 z-40 md:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}

        {/* Drawer */}
        <aside
          className={cn(
            "fixed top-0 left-0 h-full w-72 bg-gradient-to-b from-gray-900 to-gray-800 z-50 flex flex-col transition-transform duration-300 md:hidden",
            mobileOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="absolute top-4 right-4 text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
          <SidebarBody
            collapsed={false}
            onNavClick={() => setMobileOpen(false)}
          />
        </aside>
      </>
    );
  }

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col h-screen sticky top-0 bg-gradient-to-b from-gray-900 to-gray-800 transition-all duration-300 shrink-0",
        isCollapsed ? "w-[72px]" : "w-64",
      )}
    >
      <SidebarBody
        collapsed={isCollapsed}
        onCollapse={() => setIsCollapsed(!isCollapsed)}
        showCollapseBtn
      />
    </aside>
  );
}
