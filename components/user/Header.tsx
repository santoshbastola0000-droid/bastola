"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  ChevronDown,
  LogOut,
  Home,
  Moon,
  Sun,
  Menu,
  Globe,
  UsersRound,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useUserStore } from "@/stores/user-store";
import { useLogout } from "@/hooks/useLogout";
import { useTheme } from "next-themes";
import { LogoutConfirmDialog } from "@/components/LogoutConfirmDialog";
import { api } from "@/http/api/api";
import { privateApi } from "@/http/api/privateApi";
import useTokenStore from "@/store";

type KnownAccount = {
  id: string;
  name: string;
  email: string;
};

const KNOWN_ACCOUNTS_KEY = "roomkhoj_known_accounts";

interface UserHeaderProps {
  isSidebarCollapsed?: boolean;
  onMenuClick?: () => void;
}

// Map pathname segments → human-readable titles
const PAGE_TITLES: Record<string, string> = {
  dashboard: "Dashboard",
  profile: "My Profile",
  rooms: "My Rooms",
  create: "Add New Room",
  pending: "Pending Approvals",
  approved: "Approved Rooms",
  wallet: "My Wallet",
};

export function UserHeader({ onMenuClick }: UserHeaderProps) {
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [knownAccounts, setKnownAccounts] = useState<KnownAccount[]>([]);
  const [switchingAccountId, setSwitchingAccountId] = useState<string | null>(
    null,
  );

  const pathname = usePathname();
  const router = useRouter();
  const { user, setUser } = useUserStore();
  const { setToken } = useTokenStore();
  const { logout } = useLogout();
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);

    try {
      const stored = JSON.parse(
        localStorage.getItem(KNOWN_ACCOUNTS_KEY) || "[]",
      ) as KnownAccount[];
      setKnownAccounts(
        Array.isArray(stored)
          ? stored.filter((account) => account?.email)
          : [],
      );
    } catch {
      setKnownAccounts([]);
    }
  }, [user?.email]);

  // Derive page title from last non-empty segment
  const pageTitle = (() => {
    const segments = pathname?.split("/").filter(Boolean) ?? [];
    const last = segments[segments.length - 1] ?? "dashboard";
    return (
      PAGE_TITLES[last] ??
      last
        .split("-")
        .map((w) => w[0].toUpperCase() + w.slice(1))
        .join(" ")
    );
  })();

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : (user?.email?.slice(0, 2).toUpperCase() ?? "U");

  const otherAccounts = knownAccounts.filter(
    (account) =>
      account.email.toLowerCase() !==
      String(user?.email || "").toLowerCase(),
  );

  const switchAccount = async (account: KnownAccount) => {
    setSwitchingAccountId(account.id);

    try {
      const response = await api.post("/user/account-switch", {
        userId: account.id,
      });
      const accessToken = response.data?.data?.accessToken;

      if (!accessToken) {
        throw new Error("Missing access token");
      }

      setToken(accessToken);
      privateApi.defaults.headers.common["Authorization"] =
        `Bearer ${accessToken}`;

      const userResponse = await privateApi.get("/user/active");
      const nextUser = userResponse.data?.data;

      if (!nextUser) {
        throw new Error("Missing active user");
      }

      setUser(nextUser);
      router.refresh();
    } catch {
      router.push(
        `/auth/login?add_account=1&email=${encodeURIComponent(
          account.email,
        )}`,
      );
    } finally {
      setSwitchingAccountId(null);
    }
  };

  const addAccount = () => {
    router.push("/auth/login?add_account=1");
  };

  const handleLogout = async () => {
    setShowLogoutDialog(false);
    await logout();
    router.push("/auth/login");
  };

  return (
    <>
      <header className="sticky top-0 z-30 h-16 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-border/50 shrink-0">
        <div className="flex items-center justify-between h-full px-4 gap-3">
          {/* LEFT: hamburger (mobile) + page title */}
          <div className="flex items-center gap-3 min-w-0">
            {/* Hamburger — only on mobile */}
            <button
              type="button"
              onClick={onMenuClick}
              className="md:hidden w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer flex-shrink-0"
              aria-label="Open sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 truncate">
                {pageTitle}
              </h1>
              <p className="text-[11px] text-muted-foreground hidden sm:block truncate">
                {new Date().toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}
                {" · "}
                <span className="text-red-500 font-medium">
                  Welcome, {user?.name?.split(" ")[0] || "User"}!
                </span>
              </p>
            </div>
          </div>

          {/* RIGHT: theme toggle + avatar menu */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* Theme toggle */}
            {mounted && (
              <button
                type="button"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                aria-label="Toggle theme"
              >
                {theme === "dark" ? (
                  <Sun className="w-4 h-4" />
                ) : (
                  <Moon className="w-4 h-4" />
                )}
              </button>
            )}

            {/* User dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                >
                  <Avatar className="h-8 w-8 ring-2 ring-red-200 dark:ring-red-900">
                    <AvatarFallback className="bg-gradient-to-br from-red-500 to-rose-600 text-white text-xs font-bold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden lg:flex flex-col items-start">
                    <span className="text-sm font-semibold text-gray-800 dark:text-gray-100 leading-none">
                      {user?.name?.split(" ")[0] || "User"}
                    </span>
                    <span className="text-[10px] text-muted-foreground mt-0.5 leading-none">
                      {user?.email || ""}
                    </span>
                  </div>
                  <ChevronDown className="h-3.5 w-3.5 hidden lg:block text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                align="end"
                className="w-60 rounded-2xl p-1.5"
              >
                <DropdownMenuLabel className="pb-2">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 ring-2 ring-red-200">
                      <AvatarFallback className="bg-gradient-to-br from-red-500 to-rose-600 text-white font-bold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold truncate">
                        {user?.name || "Guest"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {user?.email || ""}
                      </p>
                      <Badge
                        variant="outline"
                        className="mt-1 text-[10px] px-1.5 py-0 h-4"
                      >
                        {user?.role || "USER"}
                      </Badge>
                    </div>
                  </div>
                </DropdownMenuLabel>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  className="cursor-pointer rounded-xl gap-2"
                  onClick={() => router.push("/")}
                >
                  <Globe className="h-4 w-4 text-slate-500" />
                  <span>View Site</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator className="md:hidden" />

                <DropdownMenuLabel className="md:hidden flex items-center gap-2 px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                  <UsersRound className="h-4 w-4 text-[var(--primary)]" />
                  Switch account
                </DropdownMenuLabel>

                {otherAccounts.map((account) => (
                  <DropdownMenuItem
                    key={account.id || account.email}
                    className="md:hidden cursor-pointer rounded-xl"
                    onClick={() => switchAccount(account)}
                    disabled={switchingAccountId === account.id}
                  >
                    {switchingAccountId === account.id && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    <div className="min-w-0">
                      <span className="block truncate text-sm font-medium">
                        {account.name || "RoomKhoj user"}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {account.email}
                      </span>
                    </div>
                  </DropdownMenuItem>
                ))}

                <DropdownMenuItem
                  className="md:hidden cursor-pointer rounded-xl gap-2 text-[var(--primary)]"
                  onClick={addAccount}
                >
                  <UsersRound className="h-4 w-4" />
                  <span>Add account</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  className="cursor-pointer rounded-xl gap-2 text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950"
                  onClick={() => setShowLogoutDialog(true)}
                >
                  <LogOut className="h-4 w-4" />
                  <span>Log out</span>
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
