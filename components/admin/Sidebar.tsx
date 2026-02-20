"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  Users,
  Building2,
  Wallet,
  Settings,
  ChevronRight,
  ChevronLeft,
  Plus,
  List,
  CheckCircle,
  Clock,
  BarChart3,
  LogOut,
  HelpCircle,
  Menu,
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
import { useMediaQuery } from "@/hooks/use-media-query";

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
  badgeColor?: string;
  subItems?: {
    title: string;
    href: string;
    icon: React.ElementType;
    badge?: string;
  }[];
}

const mainNavItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/admin/dashboard",
    icon: Home,
  },
  {
    title: "Rooms",
    href: "#",
    icon: Building2,
    badge: "12",
    badgeColor: "bg-red-500",
    subItems: [
      {
        title: "All Rooms",
        href: "/admin/dashboard/rooms",
        icon: List,
        badge: "156",
      },
      {
        title: "Create Room",
        href: "/admin/dashboard/rooms/create",
        icon: Plus,
      },
      {
        title: "Pending Approval",
        href: "/admin/dashboard/rooms/pending",
        icon: Clock,
        badge: "8",
      },
      {
        title: "Approved",
        href: "/admin/dashboard/rooms/approved",
        icon: CheckCircle,
        badge: "124",
      },
    ],
  },
  {
    title: "Users",
    href: "/admin/dashboard/users",
    icon: Users,
    badge: "2.4k",
    badgeColor: "bg-blue-500",
  },
  {
    title: "Wallet",
    href: "/admin/dashboard/wallet",
    icon: Wallet,
    badge: "$45.2k",
    badgeColor: "bg-green-500",
  },
];

interface AdminSidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

export function AdminSidebar({
  isCollapsed,
  setIsCollapsed,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [openSections, setOpenSections] = useState<string[]>(["Rooms"]);
  const [isHovered, setIsHovered] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Auto collapse on mobile
  useEffect(() => {
    if (isMobile) {
      setIsCollapsed(true);
      setIsMobileOpen(false);
    }
  }, [isMobile, setIsCollapsed]);

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

  const sidebarWidth = isCollapsed && !isHovered ? "w-20" : "w-64";
  const showFullSidebar = !isCollapsed || isHovered;

  return (
    <>
      {/* Mobile Menu Button */}
      {isMobile && (
        <Button
          variant="ghost"
          size="icon"
          className="fixed top-4 left-4 z-50 md:hidden bg-white shadow-lg"
          onClick={() => setIsMobileOpen(!isMobileOpen)}
        >
          <Menu className="h-5 w-5" />
        </Button>
      )}

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobile && isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setIsMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        className={cn(
          "fixed top-0 left-0 z-40 h-full glass border-r border-border",
          "flex flex-col transition-all duration-300 ease-in-out",
          isMobile ? "fixed" : "sticky",
          isMobile && !isMobileOpen && "-translate-x-full",
          isMobile && isMobileOpen && "translate-x-0",
          !isMobile && sidebarWidth,
        )}
        onMouseEnter={() => !isMobile && setIsHovered(true)}
        onMouseLeave={() => !isMobile && setIsHovered(false)}
        initial={false}
        animate={{
          width: isMobile
            ? isMobileOpen
              ? 256
              : 0
            : isCollapsed && !isHovered
              ? 80
              : 256,
        }}
      >
        {/* Sidebar Header */}
        <div className="flex items-center h-16 px-4 border-b border-border">
          <Link
            href="/admin/dashboard"
            className={cn(
              "flex items-center gap-2 transition-all duration-300",
              showFullSidebar ? "opacity-100" : "opacity-0 w-0",
            )}
          >
            <div className="relative">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-lg shadow-primary/20">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">
              Rental
            </span>
          </Link>

          {/* Collapse Button - Desktop */}
          {!isMobile && (
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "ml-auto h-8 w-8 rounded-lg hover:bg-accent/10 transition-all duration-300",
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
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto scrollbar-thin px-3 py-4">
          <TooltipProvider delayDuration={0}>
            <nav className="space-y-1">
              {/* Main Navigation */}
              <div className="space-y-1">
                {mainNavItems.map((item) => {
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
                                "w-full justify-start h-10 px-3 font-medium rounded-lg",
                                "transition-all duration-200",
                                !showFullSidebar && "justify-center px-2",
                                (isActive || isSubActive) &&
                                  "bg-accent/10 text-primary",
                                "hover:bg-accent/10 hover:text-primary",
                              )}
                              onClick={() => toggleSection(item.title)}
                            >
                              <div className="flex items-center gap-3">
                                <div
                                  className={cn(
                                    "relative",
                                    (isActive || isSubActive) && "text-primary",
                                  )}
                                >
                                  <item.icon className="h-5 w-5" />
                                  {item.badge && showFullSidebar && (
                                    <span
                                      className={cn(
                                        "absolute -top-1 -right-1 w-4 h-4 rounded-full text-[10px]",
                                        "flex items-center justify-center text-white",
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
                                      className="flex-1 text-left truncate"
                                    >
                                      {item.title}
                                    </motion.span>
                                  )}
                                </AnimatePresence>
                              </div>

                              {showFullSidebar && (
                                <ChevronRight
                                  className={cn(
                                    "h-4 w-4 transition-transform duration-200",
                                    isSectionOpen && "transform rotate-90",
                                  )}
                                />
                              )}
                            </Button>
                          </TooltipTrigger>
                          {!showFullSidebar && (
                            <TooltipContent
                              side="right"
                              className="flex items-center gap-2"
                            >
                              <span>{item.title}</span>
                              {item.badge && (
                                <Badge
                                  className={cn("text-xs", item.badgeColor)}
                                >
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
                                        className={cn(
                                          "flex items-center gap-3 h-9 px-3 rounded-lg text-sm",
                                          "transition-all duration-200 group relative",
                                          isSubActive
                                            ? "bg-primary text-white shadow-lg shadow-primary/20"
                                            : "text-muted-foreground hover:text-foreground hover:bg-accent/5",
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
                                              isSubActive
                                                ? "bg-white/20"
                                                : "bg-muted",
                                            )}
                                          >
                                            {subItem.badge}
                                          </Badge>
                                        )}
                                      </Link>
                                    </TooltipTrigger>
                                    {!showFullSidebar && (
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
                          className={cn(
                            "flex items-center h-10 px-3 rounded-lg font-medium",
                            "transition-all duration-200 group",
                            !showFullSidebar && "justify-center px-2",
                            isActive
                              ? "bg-primary text-white shadow-lg shadow-primary/20"
                              : "text-muted-foreground hover:text-foreground hover:bg-accent/5",
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <item.icon className="h-5 w-5 flex-shrink-0" />
                              {item.badge && showFullSidebar && (
                                <span
                                  className={cn(
                                    "absolute -top-1 -right-1 w-4 h-4 rounded-full text-[10px]",
                                    "flex items-center justify-center text-white",
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
                                  className="flex-1 text-left truncate"
                                >
                                  {item.title}
                                </motion.span>
                              )}
                            </AnimatePresence>
                          </div>
                        </Link>
                      </TooltipTrigger>
                      {!showFullSidebar && (
                        <TooltipContent
                          side="right"
                          className="flex items-center gap-2"
                        >
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
                })}
              </div>
            </nav>
          </TooltipProvider>
        </div>

        {/* Sidebar Footer */}
        <div className="border-t border-border p-4">
          <div
            className={cn(
              "flex items-center gap-3",
              !showFullSidebar && "justify-center",
            )}
          >
            <div className="flex -space-x-2">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center ring-2 ring-background">
                <span className="text-[10px] font-bold text-white">JD</span>
              </div>
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center ring-2 ring-background">
                <span className="text-[10px] font-bold text-white">AS</span>
              </div>
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center ring-2 ring-background">
                <span className="text-[10px] font-bold text-white">+3</span>
              </div>
            </div>

            <AnimatePresence>
              {showFullSidebar && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="flex-1"
                >
                  <p className="text-xs text-muted-foreground">Team members</p>
                  <p className="text-xs font-medium">5 active now</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.aside>
    </>
  );
}
