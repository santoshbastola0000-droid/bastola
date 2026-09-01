"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LogOut, LayoutDashboard, Star, Shield, UsersRound } from "lucide-react";
import { UserAvatar } from "@/components/UserAvatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { UserRole } from "@/types/user.types";
import { api } from "@/http/api/api";
import { privateApi } from "@/http/api/privateApi";
import useTokenStore from "@/store";
import { useUserStore } from "@/stores/user-store";

type KnownAccount = {
  id: string;
  name: string;
  email: string;
};

const KNOWN_ACCOUNTS_KEY = "roomkhoj_known_accounts";

interface UserMenuProps {
  user: any;
  onLogout: () => void;
  variant?: "desktop" | "mobile";
  scrolled?: boolean;
}

export function UserMenu({
  user,
  onLogout,
  variant = "desktop",
  scrolled,
}: UserMenuProps) {
  const [knownAccounts, setKnownAccounts] = useState<KnownAccount[]>([]);
  const { setToken } = useTokenStore();
  const { setUser } = useUserStore();

  useEffect(() => {
    try {
      const stored = JSON.parse(
        localStorage.getItem(KNOWN_ACCOUNTS_KEY) || "[]",
      ) as KnownAccount[];
      const accounts = Array.isArray(stored)
        ? stored.filter((account) => account?.email)
        : [];
      const currentAccount =
        user?.id && user?.email
          ? {
              id: String(user.id),
              name: String(user.name || "RoomKhoj user"),
              email: String(user.email).toLowerCase(),
            }
          : null;
      const merged = currentAccount
        ? [
            currentAccount,
            ...accounts.filter(
              (account) =>
                account.email.toLowerCase() !== currentAccount.email,
            ),
          ]
        : accounts;

      const nextAccounts = merged.slice(0, 5);
      setKnownAccounts(nextAccounts);
      localStorage.setItem(
        "roomkhoj_known_accounts",
        JSON.stringify(nextAccounts),
      );
    } catch {
      setKnownAccounts([]);
    }
  }, [user?.email]);

  const switchAccount = async (account: KnownAccount) => {
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
      window.location.assign(
        nextUser.role === "Admin"
          ? "/admin/dashboard"
          : "/user/dashboard",
      );
    } catch {
      window.location.assign(
        `/auth/login?add_account=1&email=${encodeURIComponent(
          account.email,
        )}`,
      );
    }
  };

  const addAccount = () => {
    window.location.assign("/auth/login?add_account=1");
  };

  const otherAccounts = knownAccounts.filter(
    (account) =>
      account.email.toLowerCase() !==
      String(user?.email || "").toLowerCase(),
  );

  const getDashboardLink = () => {
    switch (user?.role) {
      case user.role === UserRole.ADMIN:
        return "/admin/dashboard";
      case user.role === UserRole.USER:
        return "/user/dashboard";
      default:
        return "/user/dashboard";
    }
  };

  // Get dashboard label based on user role
  const getDashboardLabel = () => {
    switch (user?.role) {
      case user.role === UserRole.ADMIN:
        return "Admin Dashboard";
      case user.role === UserRole.USER:
        return "My Dashboard";
      default:
        return "Dashboard";
    }
  };

  const getRoleBadgeVariant = () => {
    switch (user?.role) {
      case UserRole.ADMIN:
        return "destructive";
      case "USER":
        return "default";
      default:
        return "secondary";
    }
  };

  const getRoleIcon = () => {
    switch (user?.role) {
      case UserRole.ADMIN:
        return <Shield className="w-3 h-3 mr-1" />;
      case UserRole.USER:
        return <Star className="w-3 h-3 mr-1" />;
      default:
        return null;
    }
  };

  if (variant === "mobile") {
    return (
      <div className="space-y-4">
        {/* User Info */}
        <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-[var(--primary)]/5 to-transparent rounded-xl cursor-pointer">
          <UserAvatar
            user={user}
            className="h-12 w-12 ring-2 ring-[var(--primary)]/20"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900 truncate">
              {user?.name || "User"}
            </p>
            <p className="text-xs text-slate-500 truncate">{user?.email}</p>
            <Badge
              variant={getRoleBadgeVariant()}
              className="mt-1.5 flex items-center w-fit"
            >
              {getRoleIcon()}
              {user?.role}
            </Badge>
          </div>
        </div>

        {/* Mobile Menu Items */}
        <div className="space-y-1">
          <Link
            href={getDashboardLink()}
            className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-xl transition-all"
          >
            <LayoutDashboard className="w-5 h-5 text-[var(--primary)]" />
            {getDashboardLabel()}
          </Link>
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-2">
            <div className="flex items-center gap-2 px-2 py-1.5 text-sm font-semibold text-slate-800">
              <UsersRound className="h-5 w-5 text-[var(--primary)]" />
              Switch account
            </div>

            {otherAccounts.map((account) => (
              <button
                key={account.id || account.email}
                type="button"
                onClick={() => switchAccount(account)}
                className="mt-1 w-full rounded-lg px-2 py-2 text-left hover:bg-white"
              >
                <span className="block truncate text-sm font-medium text-slate-800">
                  {account.name || "RoomKhoj user"}
                </span>
                <span className="block truncate text-xs text-slate-500">
                  {account.email}
                </span>
              </button>
            ))}

            <button
              type="button"
              onClick={addAccount}
              className="mt-1 w-full rounded-lg px-2 py-2 text-left text-sm font-medium text-[var(--primary)] hover:bg-white"
            >
              Add account
            </button>
          </div>

          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-all"
          >
            <LogOut className="w-5 h-5" />
            Log out
          </button>
        </div>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={`relative h-9 w-9 rounded-full transition-transform hover:scale-105 ${
            scrolled ? "" : "border-2 border-white/20"
          }`}
        >
          <UserAvatar className="cursor-pointer" user={user} />
          <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64" align="end" forceMount>
        <DropdownMenuLabel className="font-normal p-4">
          <div className="flex items-center gap-3">
            <UserAvatar user={user} className="h-10 w-10" />
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-semibold leading-none">
                {user?.name || "User"}
              </p>
              <p className="text-xs leading-none text-muted-foreground">
                {user?.email}
              </p>
              <Badge
                variant={getRoleBadgeVariant()}
                className="mt-1.5 w-fit flex items-center"
              >
                {getRoleIcon()}
                {user?.role}
              </Badge>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href={getDashboardLink()} className="cursor-pointer">
              <LayoutDashboard className="mr-2 h-4 w-4 text-[var(--primary)]" />
              <span>{getDashboardLabel()}</span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
          <UsersRound className="h-4 w-4 text-[var(--primary)]" />
          Switch account
        </DropdownMenuLabel>
        {otherAccounts.map((account) => (
          <DropdownMenuItem
            key={account.id || account.email}
            onClick={() => switchAccount(account)}
            className="cursor-pointer"
          >
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
          onClick={addAccount}
          className="cursor-pointer text-[var(--primary)]"
        >
          <UsersRound className="mr-2 h-4 w-4" />
          <span>Add account</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={onLogout}
          className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
