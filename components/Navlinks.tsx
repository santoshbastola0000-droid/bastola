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
  Gift,
} from "lucide-react";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { privateApi } from "@/http/api/privateApi";

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
          refer: "Refer & Earn",
          earnUpTo: "रु १०,००० सम्म",
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
          refer: "Refer & Earn",
          earnUpTo: "Up to Rs. 10,000",
        };

  const isActive = (path: string) =>
    path === "/feed" ? pathname.startsWith("/feed") : pathname === path;

  const normalizedRole = String(userRole || "").toUpperCase();
  const showReferralOffer = normalizedRole !== "ADMIN";
  const referralHref = isAuthenticated
    ? "/user/dashboard/referrals"
    : "/auth/login?redirect=%2Fuser%2Fdashboard%2Freferrals";

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

  const handleReferralClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    onItemClick?.();
    if (!isAuthenticated) return;

    event.preventDefault();
    let redirected = false;
    const redirect = () => {
      if (redirected) return;
      redirected = true;
      window.location.assign("/user/dashboard/referrals");
    };
    const fallback = window.setTimeout(redirect, 650);

    void privateApi
      .post("/notifications/engagement/referral-offer-click", {
        placement: variant === "mobile" ? "HEADER_MOBILE_MENU" : "HEADER_DESKTOP",
        fromPath: pathname,
      })
      .catch(() => undefined)
      .finally(() => {
        window.clearTimeout(fallback);
        redirect();
      });
  };

  if (variant === "mobile") {
    return (
      <div className="space-y-2">
        {showReferralOffer && (
          <Link
            href={referralHref}
            onClick={handleReferralClick}
            className="group relative mb-3 flex overflow-hidden rounded-2xl border border-amber-300/70 bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 p-[1px] shadow-lg shadow-orange-500/20"
          >
            <span className="absolute -left-10 top-0 h-full w-10 -skew-x-12 animate-[shimmer_2.4s_infinite] bg-white/40 blur-sm" />
            <span className="flex w-full items-center gap-3 rounded-[15px] bg-gradient-to-r from-amber-50 to-rose-50 px-4 py-3">
              <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-rose-500 text-white shadow-md">
                <span className="absolute inset-0 animate-ping rounded-full bg-amber-400/30" />
                <Gift className="relative h-5 w-5 animate-bounce" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-black text-slate-950">{labels.refer}</span>
                <span className="block text-xs font-bold text-rose-600">{labels.earnUpTo}</span>
              </span>
              <Sparkles className="h-5 w-5 animate-pulse text-amber-500" />
            </span>
          </Link>
        )}

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

      {showReferralOffer && (
        <Link
          href={referralHref}
          onClick={handleReferralClick}
          title="Refer friends and earn up to Rs. 10,000"
          className="group relative ml-1 hidden min-w-[128px] overflow-hidden rounded-xl border border-amber-300/70 bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 p-[1px] shadow-md shadow-orange-500/20 transition hover:-translate-y-0.5 hover:shadow-lg lg:flex"
        >
          <span className="absolute -left-12 top-0 h-full w-10 -skew-x-12 animate-[shimmer_2.4s_infinite] bg-white/50 blur-sm" />
          <span className="flex w-full items-center gap-2 rounded-[11px] bg-white/95 px-2.5 py-1.5">
            <span className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-rose-500 text-white">
              <span className="absolute inset-0 animate-ping rounded-full bg-amber-400/30" />
              <Gift className="relative h-3.5 w-3.5 group-hover:animate-bounce" />
            </span>
            <span className="leading-none">
              <span className="block text-[11px] font-black text-slate-900">{labels.refer}</span>
              <span className="mt-1 block whitespace-nowrap text-[9px] font-extrabold text-rose-600">{labels.earnUpTo}</span>
            </span>
          </span>
        </Link>
      )}
    </nav>
  );
}
