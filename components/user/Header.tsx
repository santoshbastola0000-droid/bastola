"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Menu,
  Search,
  Bell,
  ChevronDown,
  Settings,
  LogOut,
  Home,
  Heart,
  MessageSquare,
  Wallet,
  HelpCircle,
  Moon,
  Sun,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
  DropdownMenuShortcut,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useUserStore } from "@/stores/user-store";
import { useLogout } from "@/hooks/useLogout";
import { useTheme } from "next-themes";
import { LogoutConfirmDialog } from "@/components/LogoutConfirmDialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface UserHeaderProps {
  isSidebarCollapsed?: boolean;
  onMenuClick?: () => void;
}

export function UserHeader({
  isSidebarCollapsed = false,
  onMenuClick,
}: UserHeaderProps) {
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: "Your room listing is approved",
      read: false,
      time: "5 min ago",
    },
    { id: 2, title: "New booking request", read: false, time: "1 hour ago" },
    {
      id: 3,
      title: "Payment of ₹1500 received",
      read: true,
      time: "2 hours ago",
    },
    {
      id: 4,
      title: "Withdrawal request processed",
      read: true,
      time: "1 day ago",
    },
  ]);

  const pathname = usePathname();
  const router = useRouter();
  const { user } = useUserStore();
  const { logout } = useLogout();
  const { theme, setTheme } = useTheme();

  const getPageTitle = () => {
    const path = pathname?.split("/").pop() || "Dashboard";
    return path
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
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
    return user?.email?.slice(0, 2).toUpperCase() || "GU";
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
      setShowSearch(false);
    }
  };

  const handleLogoutClick = () => {
    setShowLogoutDialog(true);
  };

  const handleLogoutConfirm = async () => {
    setShowLogoutDialog(false);
    await logout();
  };

  const handleNotificationClick = (id: number) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
    router.push("/user/notifications");
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <>
      <header className="sticky top-0 z-30 h-16 bg-white/80 backdrop-blur-md border-b border-border/50">
        <div className="flex items-center justify-between h-full px-4 md:px-6 lg:px-8">
          {/* Left Section */}
          <div className="flex items-center gap-4">
            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onMenuClick}
              className="md:hidden hover:bg-primary/10 cursor-pointer relative"
            >
              <Menu className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center text-white">
                  {unreadCount}
                </span>
              )}
            </Button>

            {/* Page Title */}
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-800">
                {getPageTitle()}
              </h1>
              <p className="text-xs text-muted-foreground hidden sm:flex items-center gap-1">
                <span>
                  {new Date().toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
                <span className="w-1 h-1 rounded-full bg-muted-foreground mx-1" />
                <span className="text-primary">
                  Welcome back, {user?.name?.split(" ")[0] || "User"}!
                </span>
              </p>
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-2 md:gap-4">
            {/* Mobile Search Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden hover:bg-primary/10 cursor-pointer"
              onClick={() => setShowSearch(!showSearch)}
            >
              <Search className="h-5 w-5" />
            </Button>

            {/* Search Bar - Desktop */}
            <form
              onSubmit={handleSearch}
              className={cn(
                "hidden md:flex relative transition-all duration-300",
                isSidebarCollapsed
                  ? "w-[300px] lg:w-[400px]"
                  : "w-[250px] lg:w-[350px]",
              )}
            >
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search rooms, locations..."
                className="pl-9 pr-4 h-10 bg-muted/30 border-0 focus-visible:ring-1 focus-visible:ring-primary rounded-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden lg:flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                <span className="text-xs">⌘</span>K
              </kbd>
            </form>

            {/* Theme Toggle */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="hover:bg-primary/10 cursor-pointer"
                    onClick={() =>
                      setTheme(theme === "dark" ? "light" : "dark")
                    }
                  >
                    {theme === "dark" ? (
                      <Sun className="h-5 w-5" />
                    ) : (
                      <Moon className="h-5 w-5" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Toggle theme</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Notifications */}
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative hover:bg-primary/10 cursor-pointer"
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 min-w-[20px] px-1 flex items-center justify-center bg-primary">
                      {unreadCount}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent className="w-full sm:w-[400px] p-0">
                <SheetHeader className="p-4 border-b flex flex-row items-center justify-between">
                  <SheetTitle>Notifications</SheetTitle>
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={markAllAsRead}
                      className="text-xs h-8"
                    >
                      Mark all as read
                    </Button>
                  )}
                </SheetHeader>
                <div className="divide-y max-h-[calc(100vh-80px)] overflow-y-auto">
                  {notifications.length > 0 ? (
                    notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={cn(
                          "p-4 hover:bg-muted/50 cursor-pointer transition-colors",
                          !notification.read && "bg-primary/5",
                        )}
                        onClick={() => handleNotificationClick(notification.id)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="relative">
                            <Bell className="h-4 w-4 text-primary" />
                            {!notification.read && (
                              <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full" />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">
                              {notification.title}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {notification.time}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center">
                      <Bell className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">
                        No notifications
                      </p>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center gap-2 px-2 hover:bg-primary/10 cursor-pointer h-auto py-1"
                >
                  <Avatar className="h-8 w-8 ring-2 ring-primary/20">
                    <AvatarImage src={user?.avatar} />
                    <AvatarFallback className="bg-gradient-to-br from-primary to-primary-dark text-white">
                      {getInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden lg:flex flex-col items-start">
                    <span className="text-sm font-semibold">
                      {user?.name || "Guest User"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {user?.email || "user@example.com"}
                    </span>
                  </div>
                  <ChevronDown className="h-4 w-4 hidden lg:block text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user?.name || "Guest User"}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email || "user@example.com"}
                    </p>
                    <Badge variant="outline" className="mt-1 w-fit">
                      {user?.role || "USER"}
                    </Badge>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                <DropdownMenuGroup>
                  <DropdownMenuItem
                    className="cursor-pointer hover:bg-primary/10"
                    onClick={() => router.push("/user/profile")}
                  >
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                    <DropdownMenuShortcut>⌘P</DropdownMenuShortcut>
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    className="cursor-pointer hover:bg-primary/10"
                    onClick={() => router.push("/user/wallet")}
                  >
                    <Wallet className="mr-2 h-4 w-4" />
                    <span>Wallet</span>
                    <Badge className="ml-auto bg-green-500">₹12.5k</Badge>
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    className="cursor-pointer hover:bg-primary/10"
                    onClick={() => router.push("/user/saved")}
                  >
                    <Heart className="mr-2 h-4 w-4" />
                    <span>Saved Rooms</span>
                    <Badge className="ml-auto bg-pink-500">8</Badge>
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    className="cursor-pointer hover:bg-primary/10"
                    onClick={() => router.push("/user/messages")}
                  >
                    <MessageSquare className="mr-2 h-4 w-4" />
                    <span>Messages</span>
                    <Badge className="ml-auto bg-red-500">5</Badge>
                  </DropdownMenuItem>
                </DropdownMenuGroup>

                <DropdownMenuSeparator />

                <DropdownMenuGroup>
                  <DropdownMenuItem
                    className="cursor-pointer hover:bg-primary/10"
                    onClick={() => router.push("/user/settings")}
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    className="cursor-pointer hover:bg-primary/10"
                    onClick={() => router.push("/support")}
                  >
                    <HelpCircle className="mr-2 h-4 w-4" />
                    <span>Help & Support</span>
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={() => router.push("/")}
                  >
                    <Home className="mr-2 h-4 w-4" />
                    <span>Visit Homepage</span>
                  </DropdownMenuItem>
                </DropdownMenuGroup>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  className="cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50 focus:text-red-700 focus:bg-red-50"
                  onClick={handleLogoutClick}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Mobile Search Bar */}
        {showSearch && (
          <div className="md:hidden p-4 border-t">
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search rooms..."
                className="pl-9 w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
            </form>
          </div>
        )}
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
