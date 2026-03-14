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
  CreditCard,
  Download,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useUserStore } from "@/stores/user-store";
import { useLogout } from "@/hooks/useLogout";
import { LogoutConfirmDialog } from "@/components/LogoutConfirmDialog";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import Image from "next/image";
import { useTheme } from "next-themes";

interface UserSidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  isMobile?: boolean;
  onClose?: () => void;
}

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  badge?: number | string;
}

const mainNavItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/user/dashboard",
    icon: Home,
  },
  {
    title: "My Rooms",
    href: "/user/dashboard/rooms",
    icon: Building2,
    badge: 5,
  },
  {
    title: "Add New Room",
    href: "/user/dashboard/rooms/create",
    icon: PlusCircle,
  },
  {
    title: "Pending Approvals",
    href: "/user/dashboard/rooms/pending",
    icon: Clock,
    badge: 2,
  },
  {
    title: "Approved Rooms",
    href: "/user/dashboard/rooms/approved",
    icon: CheckCircle,
    badge: 3,
  },
  {
    title: "Wallet",
    href: "/user/dashboard/wallet",
    icon: Wallet,
    badge: "₹12.5k",
  },

  {
    title: "Withdrawals",
    href: "/user/dashboard/wallet/withdrawals",
    icon: Download,
  },
];

export function UserSidebar({
  isCollapsed,
  setIsCollapsed,
  isMobile = false,
  onClose,
}: UserSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useUserStore();
  const { logout } = useLogout();
  const { theme } = useTheme();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close mobile sidebar on route change
  useEffect(() => {
    if (isMobile && onClose) {
      onClose();
    }
  }, [pathname, isMobile, onClose]);

  const handleLogout = async () => {
    await logout();
    router.push("/auth/login");
  };

  const getInitials = () => {
    if (user?.name) {
      return user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return "GU";
  };

  // Mobile Sidebar using Sheet
  const MobileSidebar = () => (
    <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden fixed top-4 left-4 z-40 cursor-pointer"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] p-0">
        <div className="flex flex-col h-full bg-gradient-to-b from-gray-900 to-gray-800 text-white">
          {/* Logo */}
          <div className="p-6 border-b border-gray-700">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center">
                <Home className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-lg">RoomServise</h2>
                <p className="text-xs text-gray-400">User Dashboard</p>
              </div>
            </div>
          </div>

          {/* User Info */}
          <div className="p-4 border-b border-gray-700">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 ring-2 ring-primary/50">
                <AvatarFallback className="bg-primary/20 text-primary">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {user?.name || "User"}
                </p>
                <p className="text-xs text-gray-400 truncate">
                  {user?.email || "user@example.com"}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
            {mainNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <div key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setIsMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg transition-all cursor-pointer",
                      isActive
                        ? "bg-primary text-white"
                        : "text-gray-300 hover:bg-gray-800 hover:text-white",
                    )}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    <span className="flex-1 text-sm">{item.title}</span>
                    {item.badge && (
                      <Badge className="bg-primary/20 text-primary border-0 text-xs">
                        {item.badge}
                      </Badge>
                    )}
                  </Link>
                </div>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-700 space-y-2">
            <Button
              variant="ghost"
              className="w-full justify-start text-gray-300 hover:text-white hover:bg-gray-800 cursor-pointer"
              onClick={() => router.push("/")}
            >
              <Home className="h-4 w-4 mr-3" />
              <span>View Site</span>
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-500/10 cursor-pointer"
              onClick={() => setShowLogoutDialog(true)}
            >
              <LogOut className="h-4 w-4 mr-3" />
              <span>Logout</span>
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );

  // Desktop Sidebar
  const DesktopSidebar = () => (
    <aside
      className={cn(
        "hidden md:flex flex-col h-screen sticky top-0 bg-gradient-to-b from-gray-900 to-gray-800 text-white transition-all duration-300",
        isCollapsed ? "w-20" : "w-64",
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between p-6 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center flex-shrink-0">
            <Home className="h-5 w-5 text-white" />
          </div>
          {!isCollapsed && (
            <div>
              <h2 className="font-bold text-lg">RoomServise</h2>
              <p className="text-xs text-gray-400">User Dashboard</p>
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="text-gray-400 hover:text-white hover:bg-gray-800 cursor-pointer"
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* User Info */}
      <div
        className={cn(
          "p-4 border-b border-gray-700",
          isCollapsed && "text-center",
        )}
      >
        <div
          className={cn(
            "flex items-center gap-3",
            isCollapsed && "justify-center",
          )}
        >
          <Avatar className="h-10 w-10 ring-2 ring-primary/50 flex-shrink-0">
            <AvatarFallback className="bg-primary/20 text-primary">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {user?.name || "User"}
              </p>
              <p className="text-xs text-gray-400 truncate">
                {user?.email || "user@example.com"}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        <TooltipProvider delayDuration={0}>
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg transition-all cursor-pointer group",
                      isCollapsed ? "justify-center" : "",
                      isActive
                        ? "bg-primary text-white"
                        : "text-gray-300 hover:bg-gray-800 hover:text-white",
                    )}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    {!isCollapsed && (
                      <>
                        <span className="flex-1 text-sm">{item.title}</span>
                        {item.badge && (
                          <Badge className="bg-primary/20 text-primary border-0 text-xs">
                            {typeof item.badge === "number"
                              ? item.badge
                              : item.badge}
                          </Badge>
                        )}
                      </>
                    )}
                  </Link>
                </TooltipTrigger>
                {isCollapsed && mounted && (
                  <TooltipContent side="right">
                    <p>{item.title}</p>
                    {item.badge && (
                      <Badge className="ml-2 bg-primary/20 text-primary border-0">
                        {item.badge}
                      </Badge>
                    )}
                  </TooltipContent>
                )}
              </Tooltip>
            );
          })}
        </TooltipProvider>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-700 space-y-2">
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  "w-full text-gray-300 hover:text-white hover:bg-gray-800 cursor-pointer",
                  isCollapsed ? "px-2" : "justify-start",
                )}
                onClick={() => router.push("/")}
              >
                <Home className={cn("h-4 w-4", isCollapsed ? "" : "mr-3")} />
                {!isCollapsed && <span>View Site</span>}
              </Button>
            </TooltipTrigger>
            {isCollapsed && mounted && (
              <TooltipContent side="right">View Site</TooltipContent>
            )}
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  "w-full text-red-400 hover:text-red-300 hover:bg-red-500/10 cursor-pointer",
                  isCollapsed ? "px-2" : "justify-start",
                )}
                onClick={() => setShowLogoutDialog(true)}
              >
                <LogOut className={cn("h-4 w-4", isCollapsed ? "" : "mr-3")} />
                {!isCollapsed && <span>Logout</span>}
              </Button>
            </TooltipTrigger>
            {isCollapsed && mounted && (
              <TooltipContent side="right">Logout</TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </div>
    </aside>
  );

  return (
    <>
      {isMobile ? <MobileSidebar /> : <DesktopSidebar />}
      <LogoutConfirmDialog
        open={showLogoutDialog}
        onOpenChange={setShowLogoutDialog}
        onConfirm={handleLogout}
      />
    </>
  );
}
