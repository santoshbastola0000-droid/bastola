"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  Building2,
  PlusCircle,
  Wallet,
  History,
  Calendar,
  MessageSquare,
  Star,
  Settings,
  HelpCircle,
  Bell,
  LogOut,
  ChevronRight,
  ChevronLeft,
  User,
  Heart,
  Clock,
  CheckCircle,
  CreditCard,
  Download,
  TrendingUp,
  Award,
  Shield,
  MapPin,
  Users,
  Coffee,
  Wifi,
  Zap,
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useUserStore } from "@/stores/user-store";

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  badge?: string | number;
  badgeColor?: string;
  subItems?: {
    title: string;
    href: string;
    icon: React.ElementType;
    badge?: string | number;
  }[];
}

const mainNavItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/user/dashboard",
    icon: Home,
  },
  {
    title: "My Rooms",
    href: "#",
    icon: Building2,
    badge: "3",
    badgeColor: "bg-blue-500",
    subItems: [
      {
        title: "All Listings",
        href: "/user/dashboard/rooms",
        icon: Building2,
        badge: "5",
      },
      {
        title: "Add New Room",
        href: "/user/dashboard/rooms/create",
        icon: PlusCircle,
      },
      {
        title: "Pending Approval",
        href: "/user/dashboard/rooms/pending",
        icon: Clock,
        badge: "2",
      },
      {
        title: "Approved",
        href: "/user/dashboard/rooms/approved",
        icon: CheckCircle,
        badge: "3",
      },
    ],
  },
  {
    title: "Wallet",
    href: "#",
    icon: Wallet,
    badge: "₹12.5k",
    badgeColor: "bg-green-500",
    subItems: [
      {
        title: "Overview",
        href: "/user/dashboard/wallet",
        icon: Wallet,
      },
      {
        title: "Transactions",
        href: "/user/dashboard/wallet/transactions",
        icon: History,
        badge: "12",
      },
      {
        title: "Withdrawals",
        href: "/user/dashboard/wallet/withdrawals",
        icon: Download,
      },
      {
        title: "Payment Methods",
        href: "/user/dashboard/wallet/payment-methods",
        icon: CreditCard,
      },
    ],
  },
];

const activityNavItems: NavItem[] = [
  {
    title: "Bookings",
    href: "/user/bookings",
    icon: Calendar,
    badge: "2",
    badgeColor: "bg-purple-500",
  },
  {
    title: "Messages",
    href: "/user/messages",
    icon: MessageSquare,
    badge: "5",
    badgeColor: "bg-red-500",
  },
  {
    title: "Reviews",
    href: "/user/reviews",
    icon: Star,
    badge: "3",
    badgeColor: "bg-yellow-500",
  },
  {
    title: "Saved Rooms",
    href: "/user/saved",
    icon: Heart,
    badge: "8",
    badgeColor: "bg-pink-500",
  },
];

const supportNavItems: NavItem[] = [
  {
    title: "Notifications",
    href: "/user/notifications",
    icon: Bell,
    badge: "3",
    badgeColor: "bg-orange-500",
  },
  {
    title: "Support",
    href: "/user/support",
    icon: HelpCircle,
  },
  {
    title: "Settings",
    href: "/user/settings",
    icon: Settings,
  },
];

interface UserSidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  isMobile?: boolean;
  onClose?: () => void;
}

export function UserSidebar({
  isCollapsed,
  setIsCollapsed,
  isMobile = false,
  onClose,
}: UserSidebarProps) {
  const pathname = usePathname();
  const { user } = useUserStore();
  const isSmallMobile = useMediaQuery("(max-width: 480px)");
  const [openSections, setOpenSections] = useState<string[]>([
    "My Rooms",
    "Wallet",
  ]);
  const [isHovered, setIsHovered] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleSection = (title: string) => {
    if (isCollapsed && !isHovered) return;
    setOpenSections((prev) =>
      prev.includes(title)
        ? prev.filter((item) => item !== title)
        : [...prev, title],
    );
  };

  const isActiveRoute = (href: string) => {
    if (href === "#") return false;
    return pathname === href || pathname?.startsWith(href);
  };

  const isSubItemActive = (subItems: NavItem["subItems"]) => {
    return subItems?.some((item) => pathname === item.href) || false;
  };

  const showFullSidebar = !isCollapsed || isHovered;

  const handleNavigation = (href: string) => {
    if (isMobile && onClose) {
      onClose();
    }
  };

  const NavItemComponent = ({ item }: { item: NavItem }) => {
    const isActive = isActiveRoute(item.href);
    const hasSubItems = item.subItems && item.subItems.length > 0;
    const isSectionOpen = openSections.includes(item.title);
    const isSubActive = isSubItemActive(item.subItems);
    const showSubItems = showFullSidebar && hasSubItems;

    if (hasSubItems) {
      return (
        <div key={item.title} className="space-y-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start h-11 px-3 font-medium rounded-xl",
                  "transition-all duration-200 group",
                  !showFullSidebar && "justify-center px-2",
                  (isActive || isSubActive) &&
                    "bg-gradient-to-r from-primary/10 to-transparent text-primary border-l-2 border-primary",
                  "hover:bg-primary/5 hover:text-primary",
                )}
                onClick={() => toggleSection(item.title)}
              >
                <div className="flex items-center gap-3 w-full">
                  <div className="relative">
                    <item.icon
                      className={cn(
                        "h-5 w-5 transition-transform group-hover:scale-110",
                        (isActive || isSubActive) && "text-primary",
                      )}
                    />
                    {item.badge && showFullSidebar && (
                      <span
                        className={cn(
                          "absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full text-[10px]",
                          "flex items-center justify-center text-white font-medium",
                          item.badgeColor || "bg-primary",
                        )}
                      >
                        {item.badge}
                      </span>
                    )}
                  </div>

                  <AnimatePresence>
                    {showFullSidebar && (
                      <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: "auto" }}
                        exit={{ opacity: 0, width: 0 }}
                        className="flex-1 text-left truncate text-sm"
                      >
                        {item.title}
                      </motion.span>
                    )}
                  </AnimatePresence>

                  {showFullSidebar && (
                    <ChevronRight
                      className={cn(
                        "h-4 w-4 transition-transform duration-200 flex-shrink-0",
                        isSectionOpen && "transform rotate-90",
                      )}
                    />
                  )}
                </div>
              </Button>
            </TooltipTrigger>
            {!showFullSidebar && mounted && (
              <TooltipContent side="right" className="flex items-center gap-2">
                <span>{item.title}</span>
                {item.badge && (
                  <Badge className={cn("text-xs", item.badgeColor)}>
                    {item.badge}
                  </Badge>
                )}
              </TooltipContent>
            )}
          </Tooltip>

          {/* Sub Items */}
          <AnimatePresence>
            {showSubItems && isSectionOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden pl-9 space-y-1"
              >
                {item.subItems?.map((subItem) => {
                  const isSubActive = pathname === subItem.href;
                  return (
                    <Tooltip key={subItem.title}>
                      <TooltipTrigger asChild>
                        <Link
                          href={subItem.href}
                          onClick={() => handleNavigation(subItem.href)}
                          className={cn(
                            "flex items-center gap-3 h-9 px-3 rounded-lg text-sm",
                            "transition-all duration-200 group relative",
                            isSubActive
                              ? "bg-primary text-white shadow-lg shadow-primary/20"
                              : "text-muted-foreground hover:text-foreground hover:bg-primary/5",
                          )}
                        >
                          <subItem.icon className="h-4 w-4 flex-shrink-0" />
                          <span className="flex-1 truncate">
                            {subItem.title}
                          </span>
                          {subItem.badge && (
                            <Badge
                              className={cn(
                                "text-xs",
                                isSubActive ? "bg-white/20" : "bg-muted",
                              )}
                            >
                              {subItem.badge}
                            </Badge>
                          )}
                        </Link>
                      </TooltipTrigger>
                      {!showFullSidebar && mounted && (
                        <TooltipContent side="right">
                          {subItem.title}
                        </TooltipContent>
                      )}
                    </Tooltip>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      );
    }

    return (
      <Tooltip key={item.title}>
        <TooltipTrigger asChild>
          <Link
            href={item.href}
            onClick={() => handleNavigation(item.href)}
            className={cn(
              "flex items-center h-11 px-3 rounded-xl font-medium",
              "transition-all duration-200 group",
              !showFullSidebar && "justify-center px-2",
              isActive
                ? "bg-gradient-to-r from-primary to-primary-dark text-white shadow-lg shadow-primary/20"
                : "text-muted-foreground hover:text-primary hover:bg-primary/5",
            )}
          >
            <div className="flex items-center gap-3 w-full">
              <div className="relative">
                <item.icon
                  className={cn(
                    "h-5 w-5 transition-transform group-hover:scale-110",
                    isActive && "text-white",
                  )}
                />
                {item.badge && showFullSidebar && (
                  <span
                    className={cn(
                      "absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full text-[10px]",
                      "flex items-center justify-center text-white font-medium",
                      item.badgeColor ||
                        (isActive ? "bg-white/20" : "bg-primary"),
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </div>

              <AnimatePresence>
                {showFullSidebar && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    className="flex-1 text-left truncate text-sm"
                  >
                    {item.title}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </Link>
        </TooltipTrigger>
        {!showFullSidebar && mounted && (
          <TooltipContent side="right" className="flex items-center gap-2">
            <span>{item.title}</span>
            {item.badge && (
              <Badge className={cn("text-xs", item.badgeColor)}>
                {item.badge}
              </Badge>
            )}
          </TooltipContent>
        )}
      </Tooltip>
    );
  };

  const NavSection = ({
    title,
    items,
  }: {
    title: string;
    items: NavItem[];
  }) => (
    <div className="space-y-2">
      {!isCollapsed && showFullSidebar && (
        <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {title}
        </h3>
      )}
      {items.map((item) => (
        <NavItemComponent key={item.title} item={item} />
      ))}
    </div>
  );

  return (
    <motion.aside
      className={cn(
        "h-screen bg-gradient-to-b from-white to-gray-50/50 border-r flex flex-col relative",
        "transition-all duration-300 ease-in-out",
        isMobile ? "fixed left-0 top-0 z-50 shadow-2xl" : "sticky top-0",
        isSmallMobile && "w-64",
      )}
      onMouseEnter={() => !isMobile && setIsHovered(true)}
      onMouseLeave={() => !isMobile && setIsHovered(false)}
      initial={false}
      animate={{
        width: isMobile ? 256 : isCollapsed && !isHovered ? 80 : 256,
      }}
    >
      {/* Sidebar Header with Logo */}
      <div className="flex items-center h-20 px-4 border-b bg-gradient-to-r from-primary/5 to-transparent">
        <Link
          href="/user/dashboard"
          className={cn(
            "flex items-center gap-3 transition-all duration-300",
            showFullSidebar ? "opacity-100" : "opacity-0 w-0",
          )}
          onClick={() => isMobile && onClose?.()}
        >
          <div className="relative group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary via-primary/90 to-primary-dark flex items-center justify-center shadow-lg shadow-primary/30 group-hover:scale-105 transition-transform">
              <Home className="h-5 w-5 text-white" />
            </div>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white animate-pulse" />
          </div>
          <div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">
              RoomServise
            </span>
          </div>
        </Link>

        {/* Collapse Button - Desktop only */}
        {!isMobile && (
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "ml-auto h-8 w-8 rounded-lg hover:bg-primary/10 transition-all duration-300",
              !showFullSidebar && "mx-auto",
            )}
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        )}

        {/* Mobile Close Button */}
        {isMobile && (
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto h-8 w-8 rounded-lg hover:bg-primary/10"
            onClick={onClose}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto scrollbar-thin px-3 py-6 space-y-6">
        <TooltipProvider delayDuration={0}>
          <NavSection title="MAIN" items={mainNavItems} />
        </TooltipProvider>
      </div>
    </motion.aside>
  );
}
