"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  LogOut,
  User,
  Menu,
  Home,
  Calendar,
  Settings,
  HelpCircle,
  Hotel,
  LayoutDashboard,
} from "lucide-react";
import { useUserStore } from "@/stores/user-store";
import { useLogout } from "@/hooks/useLogout";
import { UserAvatar } from "@/components/UserAvatar";
import { UserRole } from "@/types/user.types";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

export function NavBar() {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const { user } = useUserStore();
  const { logout } = useLogout();
  const router = useRouter();

  const isAuthenticated = !!user;

  const handleLogout = async () => {
    await logout();
    setIsSheetOpen(false);
  };

  const handleNavigation = (href: string) => {
    router.push(href);
    setIsSheetOpen(false);
  };

  // Get dashboard link based on user role
  const getDashboardLink = () => {
    switch (user?.role) {
      case UserRole.ADMIN:
        return "/admin/dashboard";
      case UserRole.USER:
        return "/dashboard";
      default:
        return "/dashboard";
    }
  };

  // Get dashboard label based on user role
  const getDashboardLabel = () => {
    switch (user?.role) {
      case UserRole.ADMIN:
        return "Admin Dashboard";
      case UserRole.USER:
        return "My Dashboard";
      default:
        return "Dashboard";
    }
  };

  // Get role badge color
  const getRoleBadgeVariant = () => {
    switch (user?.role) {
      case UserRole.ADMIN:
        return "destructive";
      case UserRole.USER:
        return "default";
      default:
        return "secondary";
    }
  };

  // Navigation items for authenticated users
  const authNavItems = [
    { href: "/rooms", label: "Browse Rooms", icon: Home },
    { href: "/host", label: "Become a Host", icon: Hotel },
  ];

  // Navigation items for non-authenticated users
  const publicNavItems = [
    { href: "/rooms", label: "Browse Rooms", icon: Home },
    { href: "/host", label: "Become a Host", icon: Hotel },
  ];

  // Mobile navigation items based on auth status
  const mobileNavItems = isAuthenticated
    ? [
        {
          href: getDashboardLink(),
          label: getDashboardLabel(),
          icon: LayoutDashboard,
        },
        ...authNavItems,
        { href: "/bookings", label: "My Bookings", icon: Calendar },
        { href: "/settings", label: "Settings", icon: Settings },
        { href: "/help", label: "Help", icon: HelpCircle },
      ]
    : [
        ...publicNavItems,
        { href: "/auth/login", label: "Login", icon: User },
        { href: "/auth/register", label: "Sign Up", icon: User },
      ];

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="text-2xl font-bold text-[var(--primary)] hover:opacity-80 transition"
          >
            RoomServise
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:space-x-6">
            {/* Public/Common Links */}
            <Link
              href="/rooms"
              className="text-gray-600 hover:text-[var(--primary)] transition text-sm font-medium"
            >
              Browse Rooms
            </Link>
            <Link
              href="/host"
              className="text-gray-600 hover:text-[var(--primary)] transition text-sm font-medium"
            >
              Become a Host
            </Link>

            {/* Conditional Rendering for Desktop */}
            {isAuthenticated ? (
              // Authenticated User Menu
              <div className="flex items-center space-x-3">
                <Link
                  href={getDashboardLink()}
                  className="text-gray-600 hover:text-[var(--primary)] transition text-sm font-medium"
                >
                  {getDashboardLabel()}
                </Link>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="relative h-8 w-8 rounded-full"
                    >
                      <UserAvatar user={user!} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {user?.name || "User"}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user?.email}
                        </p>
                        <Badge
                          variant={getRoleBadgeVariant()}
                          className="mt-1 w-fit"
                        >
                          {user?.role}
                        </Badge>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                      <DropdownMenuItem asChild>
                        <Link
                          href={getDashboardLink()}
                          className="w-full cursor-pointer"
                        >
                          <LayoutDashboard className="mr-2 h-4 w-4" />
                          <span>{getDashboardLabel()}</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link
                          href="/bookings"
                          className="w-full cursor-pointer"
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          <span>My Bookings</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link
                          href="/settings"
                          className="w-full cursor-pointer"
                        >
                          <Settings className="mr-2 h-4 w-4" />
                          <span>Settings</span>
                        </Link>
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="text-red-600 focus:text-red-600 cursor-pointer"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              // Non-Authenticated Buttons
              <div className="flex items-center space-x-3">
                <Link
                  href="/auth/login"
                  className="px-4 py-2 text-sm font-medium text-[var(--primary)] border border-[var(--primary)] rounded-lg hover:bg-[var(--primary)]/10 transition"
                >
                  Login
                </Link>
                <Link
                  href="/auth/register"
                  className="px-4 py-2 text-sm font-medium text-white bg-[var(--primary)] rounded-lg hover:bg-[var(--primary-dark)] transition"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[350px] p-0">
              <SheetHeader className="p-4 border-b">
                <SheetTitle className="text-left text-[var(--primary)]">
                  RoomServise
                </SheetTitle>
              </SheetHeader>

              {/* User Info Section for Mobile */}
              {isAuthenticated && user && (
                <div className="p-4 bg-gray-50 border-b">
                  <div className="flex items-center space-x-3">
                    <UserAvatar user={user} className="h-10 w-10" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {user.name || "User"}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {user.email}
                      </p>
                      <Badge variant={getRoleBadgeVariant()} className="mt-1">
                        {user.role}
                      </Badge>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Links */}
              <ScrollArea className="h-[calc(100vh-8rem)]">
                <div className="p-4">
                  <div className="space-y-1">
                    {mobileNavItems.map((item) => (
                      <Button
                        key={item.href}
                        variant="ghost"
                        className="w-full justify-start"
                        onClick={() => handleNavigation(item.href)}
                      >
                        <item.icon className="mr-2 h-4 w-4" />
                        {item.label}
                      </Button>
                    ))}

                    {/* Logout Button for Mobile */}
                    {isAuthenticated && (
                      <>
                        <Separator className="my-2" />
                        <Button
                          variant="ghost"
                          className="w-full justify-start text-red-600 hover:text-red-600 hover:bg-red-50"
                          onClick={handleLogout}
                        >
                          <LogOut className="mr-2 h-4 w-4" />
                          Logout
                        </Button>
                      </>
                    )}
                  </div>

                  {/* Additional Info Section */}
                  <div className="mt-6 pt-6 border-t">
                    <p className="text-xs text-gray-500 text-center">
                      © 2024 RoomServise. All rights reserved.
                    </p>
                  </div>
                </div>
              </ScrollArea>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
