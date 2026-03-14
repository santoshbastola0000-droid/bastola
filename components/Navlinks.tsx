// src/components/Navlinks.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Hotel,
  Calendar,
  LayoutDashboard,
  Sparkles,
  Search,
  Compass,
} from "lucide-react";

interface NavLinksProps {
  variant?: "desktop" | "mobile";
  scrolled?: boolean;
  isAuthenticated?: boolean;
  userRole?: string;
  onItemClick?: () => void;
}

export function NavLinks({
  variant = "desktop",
  scrolled,
  isAuthenticated,
  userRole,
  onItemClick,
}: NavLinksProps) {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  // Get dashboard link based on user role
  const getDashboardLink = () => {
    switch (userRole) {
      case "ADMIN":
        return "/admin/dashboard";
      case "USER":
        return "/user/dashboard";
      default:
        return "/dashboard";
    }
  };

  // Get dashboard label based on user role
  const getDashboardLabel = () => {
    switch (userRole) {
      case "ADMIN":
        return "Admin Dashboard";
      case "USER":
        return "My Dashboard";
      default:
        return "Dashboard";
    }
  };

  // Public navigation items - Added Browse Rooms
  const publicLinks = [
    { href: "/", label: "Home", icon: Home },
    { href: "/rooms", label: "Browse Rooms", icon: Compass },
    { href: "/about", label: "About", icon: Sparkles },
    { href: "/contact", label: "Contact", icon: Hotel },
  ];

  // Authenticated navigation items
  const authLinks = isAuthenticated
    ? [
        {
          href: getDashboardLink(),
          label: getDashboardLabel(),
          icon: LayoutDashboard,
        },
        { href: "/rooms", label: "Browse Rooms", icon: Compass },
        { href: "/bookings", label: "My Bookings", icon: Calendar },
        ...publicLinks.slice(2),
      ]
    : publicLinks;

  const links = isAuthenticated ? authLinks : publicLinks;

  if (variant === "mobile") {
    return (
      <div className="space-y-1">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            onClick={onItemClick}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
              isActive(link.href)
                ? "bg-gradient-to-r from-[var(--primary)]/10 to-transparent text-[var(--primary)] border-l-4 border-[var(--primary)]"
                : "text-slate-600 hover:bg-slate-50 hover:pl-6"
            }`}
          >
            <link.icon
              className={`w-5 h-5 ${isActive(link.href) ? "text-[var(--primary)]" : "text-slate-400"}`}
            />
            {link.label}
          </Link>
        ))}
      </div>
    );
  }

  return (
    <nav className="flex items-center gap-1">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={`relative px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 group ${
            isActive(link.href)
              ? "text-[var(--primary)]"
              : scrolled || pathname !== "/"
                ? "text-slate-600 hover:text-slate-900"
                : "text-white/80 hover:text-white"
          }`}
        >
          <span className="relative z-10">{link.label}</span>
          {isActive(link.href) && (
            <span className="absolute inset-0 bg-[var(--primary)]/10 rounded-full animate-fade-in" />
          )}
          <span className="absolute inset-x-4 -bottom-1 h-0.5 bg-[var(--primary)] scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
        </Link>
      ))}
    </nav>
  );
}
