"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { Search, Bell, Settings, ChevronDown, Menu, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useUserStore } from "@/stores/user-store";
import { useLogout } from "@/hooks/useLogout";
import { LogoutConfirmDialog } from "@/components/LogoutConfirmDialog";
import { UserRole } from "@/types/user.types";

interface AdminHeaderProps {
  isSidebarCollapsed?: boolean;
  onMenuClick?: () => void;
}

export function AdminHeader({
  isSidebarCollapsed = false,
  onMenuClick,
}: AdminHeaderProps) {
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useUserStore();
  const { logout } = useLogout();

  const getPageTitle = () => {
    const path = pathname?.split("/").pop() || "Dashboard";
    return path.charAt(0).toUpperCase() + path.slice(1).replace(/-/g, " ");
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
    return user?.email?.slice(0, 2).toUpperCase() || "AD";
  };

  const getRoleColor = () => {
    switch (user?.role) {
      case UserRole.ADMIN:
        return "bg-purple-100 text-purple-700";
      case UserRole.USER:
        return "bg-blue-100 text-blue-700";
      default:
        return "gradient-red text-white";
    }
  };

  const handleLogoutClick = () => {
    setShowLogoutDialog(true);
  };

  const handleLogoutConfirm = async () => {
    setShowLogoutDialog(false);
    await logout();
  };

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  return (
    <>
      <header className="sticky top-0 z-30 h-16 glass border-b border-border">
        <div className="flex items-center justify-between h-full px-4 md:px-6 lg:px-8">
          {/* Left Section */}
          <div className="flex items-center gap-4">
            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onMenuClick}
              className="md:hidden hover:bg-primary/10 cursor-pointer"
            >
              <Menu className="h-5 w-5" />
            </Button>

            {/* Page Title */}
            <div>
              <h1 className="text-xl md:text-2xl font-bold gradient-red bg-clip-text text-transparent">
                {getPageTitle()}
              </h1>
              <p className="text-xs text-muted-foreground hidden sm:block">
                {new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-2 md:gap-4">
            {/* Search Bar - Adjust width based on sidebar state */}
            <div className="hidden md:flex relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search..."
                className={cn(
                  "pl-9 bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary",
                  isSidebarCollapsed
                    ? "w-[250px] lg:w-[350px]"
                    : "w-[200px] lg:w-[300px]",
                )}
              />
              <kbd className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none hidden lg:flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                <span className="text-xs">⌘</span>K
              </kbd>
            </div>

            {/* Notifications */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="relative hover:bg-primary/10 cursor-pointer"
                  >
                    <Bell className="h-5 w-5" />
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-primary">
                      3
                    </Badge>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Notifications</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Settings */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="hover:bg-primary/10 cursor-pointer"
                    onClick={() => handleNavigation("/admin/settings")}
                  >
                    <Settings className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Settings</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center gap-2 px-2 hover:bg-primary/50 cursor-pointer"
                >
                  <Avatar className={`h-8 w-8 ${getRoleColor()}`}>
                    <AvatarFallback className={getRoleColor()}>
                      {getInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden lg:flex flex-col items-start">
                    <span className="text-sm font-semibold">
                      {user?.name || "Admin User"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {user?.role || "Super Admin"}
                    </span>
                  </div>
                  <ChevronDown className="h-4 w-4 hidden lg:block" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user?.name || "Admin User"}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email || "admin@example.com"}
                    </p>
                    <Badge variant="outline" className="mt-1 w-fit">
                      {user?.role || "ADMIN"}
                    </Badge>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                {/* Home Navigation */}
                <DropdownMenuItem
                  className="cursor-pointer hover:bg-primary/10 focus:bg-primary/50"
                  onClick={() => handleNavigation("/")}
                >
                  <Home className="mr-2 h-4 w-4" />
                  <span>Home</span>
                </DropdownMenuItem>

                {/* Logout Option */}
                <DropdownMenuItem
                  className="text-destructive cursor-pointer hover:bg-destructive/10 focus:bg-destructive/10 focus:text-destructive"
                  onClick={handleLogoutClick}
                >
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Logout Confirmation Dialog */}
      <LogoutConfirmDialog
        open={showLogoutDialog}
        onOpenChange={setShowLogoutDialog}
        onConfirm={handleLogoutConfirm}
      />
    </>
  );
}
