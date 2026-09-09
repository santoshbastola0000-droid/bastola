"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Hotel,
  LayoutDashboard,
  Sparkles,
  Compass,
  BriefcaseBusiness,
  UsersRound,
} from "lucide-react";
import { useLanguage } from "@/components/providers/LanguageProvider";

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
  const { language } = useLanguage();

  const labels =
    language === "ne"
      ? {
          home: "होम",
          feed: "फिड",
          rooms: "कोठा खोज्नुहोस्",
          jobs: "जागिर खोज्नुहोस्",
          about: "हाम्रो बारेमा",
          contact: "सम्पर्क",
          adminDashboard: "एडमिन ड्यासबोर्ड",
          myDashboard: "मेरो ड्यासबोर्ड",
        }
      : {
          home: "Home",
          feed: "Feed",
          rooms: "Browse Rooms",
          jobs: "Find Jobs",
          about: "About",
          contact: "Contact",
          adminDashboard: "Admin Dashboard",
          myDashboard: "My Dashboard",
        };

  const isActive = (path: string) =>
    path === "/feed" ? pathname.startsWith("/feed") : pathname === path;

  const normalizedRole = String(userRole || "").toUpperCase();

  const getDashboardLink = () =>
    normalizedRole === "ADMIN" ? "/admin/dashboard" : "/user/dashboard";

  const getDashboardLabel = () =>
    normalizedRole === "ADMIN" ? labels.adminDashboard : labels.myDashboard;

  const publicLinks = [
    { href: "/", label: labels.home, icon: Home },
    { href: "/rooms", label: labels.rooms, icon: Compass },
    { href: "/jobs", label: labels.jobs, icon: BriefcaseBusiness },
    { href: "/about", label: labels.about, icon: Sparkles },
    { href: "/contact", label: labels.contact, icon: Hotel },
  ];

  const authLinks = isAuthenticated
    ? [
        { href: "/feed", label: labels.feed, icon: UsersRound },
        { href: "/rooms", label: labels.rooms, icon: Compass },
        { href: "/jobs", label: labels.jobs, icon: BriefcaseBusiness },
        {
          href: getDashboardLink(),
          label: getDashboardLabel(),
          icon: LayoutDashboard,
        },
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
            className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
              isActive(link.href)
                ? "border-l-4 border-[var(--primary)] bg-gradient-to-r from-[var(--primary)]/10 to-transparent text-[var(--primary)]"
                : "text-slate-600 hover:bg-slate-50 hover:pl-6"
            }`}
          >
            <link.icon
              className={`h-5 w-5 ${
                isActive(link.href)
                  ? "text-[var(--primary)]"
                  : "text-slate-400"
              }`}
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
          className={`group relative rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
            isActive(link.href)
              ? "text-[var(--primary)]"
              : scrolled || pathname !== "/"
                ? "text-slate-600 hover:text-slate-900"
                : "text-white/80 hover:text-white"
          }`}
        >
          <span className="relative z-10">{link.label}</span>
          {isActive(link.href) && (
            <span className="absolute inset-0 animate-fade-in rounded-full bg-[var(--primary)]/10" />
          )}
          <span className="absolute inset-x-4 -bottom-1 h-0.5 scale-x-0 bg-[var(--primary)] transition-transform duration-300 group-hover:scale-x-100" />
        </Link>
      ))}
    </nav>
  );
}
