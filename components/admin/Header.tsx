"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Search, ChevronDown, LogOut, Moon, Sun } from "lucide-react";
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useUserStore } from "@/stores/user-store";
import { useLogout } from "@/hooks/useLogout";
import { LogoutConfirmDialog } from "@/components/LogoutConfirmDialog";
import { useTheme } from "next-themes";

interface AdminHeaderProps {
  isSidebarCollapsed?: boolean;
  onMenuClick?: () => void;
}

export function AdminHeader({ isSidebarCollapsed = false }: AdminHeaderProps) {
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  // ── mounted guard ──────────────────────────────────────────────────────────
  // next-themes reads from localStorage/OS preference on the client only.
  // Before the component mounts, `theme` is undefined, which would cause the
  // icon to flash from one state to another on hydration. Rendering the toggle
  // only after mount eliminates this flicker.
  const [mounted, setMounted] = useState(false);

  const pathname = usePathname();
  const router = useRouter();
  const { user } = useUserStore();
  const { logout } = useLogout();
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

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
    return user?.email?.slice(0, 2).toUpperCase() || "AD";
  };

  const handleLogout = async () => {
    setShowLogoutDialog(false);
    await logout();
    router.push("/auth/login");
  };

  const isDark = theme === "dark";

  const toggleTheme = () => setTheme(isDark ? "light" : "dark");

  return (
    <>
      <header className="sticky top-0 z-30 h-16 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="flex items-center justify-between h-full px-4 md:px-6">
          {/* ── Left: Page title ── */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:block">
              <h1 className="text-lg md:text-xl lg:text-2xl font-bold text-foreground">
                {getPageTitle()}
              </h1>
              <p className="text-xs text-muted-foreground hidden lg:block">
                {new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>

          {/* ── Right: Actions ── */}
          <div className="flex items-center gap-1 md:gap-2">
            {/* ── Theme toggle ──────────────────────────────────────────────
                Rendered only after mount to prevent hydration mismatch.
                The placeholder <div> keeps the layout stable while mounting.
            ─────────────────────────────────────────────────────────────── */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  {mounted ? (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={toggleTheme}
                      className="hidden sm:flex"
                      aria-label={
                        isDark
                          ? "Switch to light theme"
                          : "Switch to dark theme"
                      }
                    >
                      {isDark ? (
                        <Sun
                          className="h-4 w-4 transition-transform duration-200 rotate-0 scale-100"
                          aria-hidden="true"
                        />
                      ) : (
                        <Moon
                          className="h-4 w-4 transition-transform duration-200 rotate-0 scale-100"
                          aria-hidden="true"
                        />
                      )}
                    </Button>
                  ) : (
                    // Placeholder keeps layout stable before mount
                    <div
                      className="hidden sm:flex h-9 w-9"
                      aria-hidden="true"
                    />
                  )}
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    {mounted && isDark ? "Switch to light" : "Switch to dark"}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* ── User dropdown ── */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center gap-2 px-2 hover:bg-accent"
                  aria-label="Open user menu"
                >
                  <Avatar className="h-7 w-7 md:h-8 md:w-8">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                      {getInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden lg:flex flex-col items-start">
                    <span className="text-sm font-medium leading-none">
                      {user?.name || "Admin"}
                    </span>
                    <span className="text-xs text-muted-foreground mt-0.5">
                      Administrator
                    </span>
                  </div>
                  <ChevronDown
                    className="h-3 w-3 hidden lg:block text-muted-foreground"
                    aria-hidden="true"
                  />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user?.name || "Admin User"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {user?.email || "admin@example.com"}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                {/* Theme toggle inside dropdown (visible on mobile where header button is hidden) */}
                {mounted && (
                  <DropdownMenuItem
                    onClick={toggleTheme}
                    className="cursor-pointer sm:hidden"
                  >
                    {isDark ? (
                      <Sun className="mr-2 h-4 w-4" aria-hidden="true" />
                    ) : (
                      <Moon className="mr-2 h-4 w-4" aria-hidden="true" />
                    )}
                    <span>{isDark ? "Light mode" : "Dark mode"}</span>
                  </DropdownMenuItem>
                )}
                {mounted && <DropdownMenuSeparator className="sm:hidden" />}

                <DropdownMenuItem
                  className="text-destructive focus:text-destructive cursor-pointer"
                  onClick={() => setShowLogoutDialog(true)}
                >
                  <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <LogoutConfirmDialog
        open={showLogoutDialog}
        onOpenChange={setShowLogoutDialog}
        onConfirm={handleLogout}
      />
    </>
  );
}
