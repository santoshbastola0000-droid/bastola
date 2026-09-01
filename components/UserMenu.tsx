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

  useEffect(() => {
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

  const switchGoogleAccount = (email?: string) => {
    const backendUrl =
      process.env.NEXT_PUBLIC_BACKEND_URL ||
      "https://api.roomkhoj.com";
    const params = email
      ? `?login_hint=${encodeURIComponent(email)}`
      : "";
    window.location.assign(
      `${backendUrl.replace(/\/$/, "")}/user/oauth/google${params}`,
    );
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
                onClick={() => switchGoogleAccount(account.email)}
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
              onClick={() => switchGoogleAccount()}
              className="mt-1 w-full rounded-lg px-2 py-2 text-left text-sm font-medium text-[var(--primary)] hover:bg-white"
            >
              Use another Google account
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
