"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  Wallet,
  Loader2,
  Bell,
  Home, PlusCircle, BriefcaseBusiness, MessageCircle, Truck,
  LayoutDashboard, Building2, Gift, ClipboardList, Settings,
  CircleHelp, ChevronDown, ChevronRight, LogOut, Wrench,
  Droplets, Sparkles, Wifi, type LucideIcon,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { useUserStore } from "@/stores/user-store";
import { useLogout } from "@/hooks/useLogout";
import { walletService } from "@/http/services/wallet.service";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

import { Logo } from "@/components/Logo";
import { NavLinks } from "@/components/Navlinks";
import { UserMenu } from "@/components/UserMenu";
import { AuthButtons } from "@/components/AuthButtons";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { UserAvatar } from "@/components/UserAvatar";
import { UserRole } from "@/types/user.types";
import { useLanguage } from "@/components/providers/LanguageProvider";

export function NavBar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showAllServices, setShowAllServices] = useState(false);
  const { language } = useLanguage();
  const label = (english: string, nepali: string) =>
    language === "ne" ? nepali : english;

  const { user } = useUserStore();
  const { logout } = useLogout();
  const pathname = usePathname();

  const isAuthenticated = !!user;
  const isHomePage = pathname === "/";
  const dashboardHref = user?.role === UserRole.ADMIN
    ? "/admin/dashboard" : "/user/dashboard";
  const protectedHref = (href: string) => isAuthenticated ? href : "/auth/login";
  const serviceTiles: {
    key: string; title: string; icon: LucideIcon; href?: string;
  }[] = [
    { key: "rooms", title: label("Find a room", "कोठा खोज्नुहोस्"), icon: Home, href: "/rooms" },
    { key: "moving", title: label("Room shifting", "कोठा सार्ने सेवा"), icon: Truck },
    { key: "add", title: label("Post a room", "कोठा पोस्ट गर्नुहोस्"), icon: PlusCircle,
      href: protectedHref(user?.role === UserRole.ADMIN ? "/admin/dashboard/rooms/create" : "/user/dashboard/rooms/create") },
    { key: "jobs", title: label("Find jobs", "जागिर खोज्नुहोस्"), icon: BriefcaseBusiness, href: "/jobs" },
    { key: "messages", title: label("Messages", "सन्देशहरू"), icon: MessageCircle, href: protectedHref("/messages") },
    { key: "listings", title: label("My rooms", "मेरा कोठाहरू"), icon: Building2,
      href: protectedHref(user?.role === UserRole.ADMIN ? "/admin/dashboard/rooms" : "/user/dashboard/rooms") },
    { key: "wallet", title: label("Wallet", "वालेट"), icon: Wallet, href: protectedHref("/user/dashboard/wallet") },
    { key: "dashboard", title: label("Dashboard", "ड्यासबोर्ड"), icon: LayoutDashboard, href: protectedHref(dashboardHref) },
    { key: "post-job", title: label("Post a job", "जागिर पोस्ट गर्नुहोस्"), icon: BriefcaseBusiness, href: protectedHref("/jobs/post") },
    { key: "referrals", title: label("Referrals", "रेफरल"), icon: Gift, href: protectedHref("/user/dashboard/referrals") },
    { key: "requests", title: label("Room requests", "कोठाको अनुरोध"), icon: ClipboardList, href: protectedHref("/user/dashboard/room-requests") },
    { key: "cleaning", title: label("Home cleaning", "घर सरसफाइ"), icon: Sparkles },
    { key: "repairs", title: label("Repairs & electrician", "मर्मत तथा बिजुली"), icon: Wrench },
    { key: "plumbing", title: label("Plumbing", "प्लम्बिङ सेवा"), icon: Droplets },
    { key: "internet", title: label("Internet setup", "इन्टरनेट जडान"), icon: Wifi },
  ];

  const {
    data: walletBalance,
    isLoading: walletLoading,
  } = useQuery({
    queryKey: ["wallet-balance"],
    queryFn: () => walletService.getBalance(),
    enabled: isAuthenticated,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    await logout();
    setMobileOpen(false);
  };

  const headerClasses = `fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
    scrolled
      ? "bg-white/80 backdrop-blur-xl shadow-[0_8px_32px_-4px_rgba(0,0,0,0.08)] border-b border-slate-100/50"
      : isHomePage
        ? "bg-transparent"
        : "bg-white border-b border-slate-100"
  }`;

  const walletTextColor =
    scrolled || !isHomePage
      ? "text-slate-800"
      : "text-white";

  return (
    <header className={headerClasses}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">

          {/* LOGO */}
          <Logo
            variant={isHomePage ? "light" : "dark"}
            scrolled={scrolled}
          />

          {/* DESKTOP */}
          <div className="hidden md:flex md:items-center md:gap-5">
            <NavLinks
              scrolled={scrolled}
              isAuthenticated={isAuthenticated}
              userRole={user?.role}
            />

            <LanguageSwitcher />

            {isAuthenticated && (
              <Link
                href="/user/dashboard/wallet"
                className={`
                  group
                  flex
                  items-center
                  gap-2
                  rounded-full
                  border
                  px-3
                  py-2
                  transition-all
                  duration-200
                  ${
                    scrolled || !isHomePage
                      ? "border-slate-200 bg-white hover:border-red-300 hover:bg-red-50"
                      : "border-white/20 bg-white/10 backdrop-blur-md hover:bg-white/20"
                  }
                `}
              >
                <div
                  className={`
                    flex
                    h-7
                    w-7
                    items-center
                    justify-center
                    rounded-full
                    ${
                      scrolled || !isHomePage
                        ? "bg-red-50 text-red-600"
                        : "bg-white/15 text-white"
                    }
                  `}
                >
                  <Wallet className="h-4 w-4" />
                </div>

                <div className="flex flex-col leading-none">
                  <span
                    className={`text-[9px] font-medium opacity-60 ${walletTextColor}`}
                  >
                    Balance
                  </span>

                  {walletLoading ? (
                    <Loader2
                      className={`mt-1 h-3.5 w-3.5 animate-spin ${walletTextColor}`}
                    />
                  ) : (
                    <span
                      className={`mt-1 text-xs font-bold ${walletTextColor}`}
                    >
                      रू{" "}
                      {Number(
                        walletBalance?.balance ?? 0
                      ).toLocaleString("en-NP")}
                    </span>
                  )}
                </div>
              </Link>
            )}

            {isAuthenticated && (
              <Link
                href="/user/dashboard"
                aria-label="Notifications"
                className={`
                  relative flex h-10 w-10 items-center justify-center
                  rounded-full border transition-all duration-200
                  ${
                    scrolled || !isHomePage
                      ? "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      : "border-white/20 bg-white/10 text-white backdrop-blur-md hover:bg-white/20"
                  }
                `}
              >
                <Bell className="h-5 w-5" />
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
              </Link>
            )}

            {isAuthenticated ? (
              <UserMenu
                user={user}
                onLogout={handleLogout}
                scrolled={scrolled}
              />
            ) : (
              <AuthButtons
                scrolled={scrolled && !isHomePage}
              />
            )}
          </div>

          {/* MOBILE RIGHT SIDE */}
          <div className="flex items-center gap-2 md:hidden">

            {isAuthenticated && (
              <Link
                href="/user/dashboard/wallet"
                aria-label="Wallet"
                className={`
                  flex
                  h-9
                  items-center
                  gap-1.5
                  rounded-full
                  px-2.5
                  text-xs
                  font-bold
                  shadow-sm
                  backdrop-blur-md
                  transition-all
                  ${
                    scrolled || !isHomePage
                      ? "border border-slate-200 bg-white text-slate-800"
                      : "border border-white/20 bg-black/20 text-white"
                  }
                `}
              >
                <Wallet className="h-4 w-4 text-red-500" />

                {walletLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <span>
                    रू{" "}
                    {Number(
                      walletBalance?.balance ?? 0
                    ).toLocaleString("en-NP")}
                  </span>
                )}
              </Link>
            )}
<Link
  href="/user/dashboard"
  aria-label="Notifications"
  className={`
    relative
    flex
    h-9
    w-9
    items-center
    justify-center
    rounded-full
    transition-all
    ${
      scrolled || !isHomePage
        ? "border border-slate-200 bg-white text-slate-700"
        : "border border-white/20 bg-black/20 text-white"
    }
  `}
>
  <Bell className="h-4.5 w-4.5" />

  <span
    className="
      absolute
      right-1
      top-1
      h-2
      w-2
      rounded-full
      bg-red-500
      ring-2
      ring-white
    "
  />
</Link>

            {/* MOBILE MENU */}
            <Sheet
              open={mobileOpen}
              onOpenChange={setMobileOpen}
            >
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={label("Open services menu", "सेवा मेनु खोल्नुहोस्")}
                  className={`relative ${
                    scrolled || !isHomePage
                      ? "text-slate-700"
                      : "text-white"
                  }`}
                >
                  {mobileOpen ? (
                    <X className="h-5 w-5" />
                  ) : (
                    <Menu className="h-5 w-5" />
                  )}
                </Button>
              </SheetTrigger>

              <SheetContent
                side="right"
                className="z-[10000] h-[100dvh] w-[94vw] max-w-[440px] gap-0 border-l border-slate-200 bg-slate-50 p-0 sm:w-[440px] sm:max-w-[440px]"
              >
                <div className="flex min-h-0 flex-1 flex-col">
                  <div className="shrink-0 border-b border-slate-200 bg-white px-5 py-4 pr-12">
                    <SheetTitle className="text-xl font-black text-slate-950">
                      {label("Menu", "मेनु")}
                    </SheetTitle>
                    <SheetDescription className="mt-1 text-xs text-slate-500">
                      {label("Your home. Your services. RoomKhoj.", "तपाईंको घर, तपाईंका सेवाहरू — RoomKhoj।")}
                    </SheetDescription>
                  </div>

                  <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pt-4 pb-[calc(96px+env(safe-area-inset-bottom))]">
                    {user ? (
                      <Link
                        href="/user/dashboard/profile"
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:bg-slate-100"
                      >
                        <UserAvatar user={user} className="h-12 w-12 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-base font-bold text-slate-950">{user.name || label("My profile", "मेरो प्रोफाइल")}</p>
                          <p className="mt-1 text-xs text-slate-500">{label("View your profile", "आफ्नो प्रोफाइल हेर्नुहोस्")}</p>
                        </div>
                        <ChevronRight className="h-5 w-5 shrink-0 text-slate-400" aria-hidden="true" />
                      </Link>
                    ) : (
                      <div className="rounded-2xl border border-slate-200 bg-white p-4">
                        <p className="mb-3 font-bold text-slate-900">{label("Welcome to RoomKhoj", "RoomKhoj मा स्वागत छ")}</p>
                        <AuthButtons variant="mobile" />
                      </div>
                    )}

                    {isAuthenticated && (
                      <Link
                        href="/user/dashboard/wallet"
                        onClick={() => setMobileOpen(false)}
                        className="mt-3 flex items-center gap-3 rounded-2xl border border-red-100 bg-red-50 p-3"
                      >
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-600 text-white">
                          <Wallet className="h-5 w-5" aria-hidden="true" />
                        </span>
                        <div className="flex-1">
                          <p className="text-xs text-slate-600">{label("Wallet balance", "वालेट मौज्दात")}</p>
                          {walletLoading ? <Loader2 className="mt-1 h-4 w-4 animate-spin" aria-label="Loading balance" /> : (
                            <p className="font-extrabold text-slate-950">रु {Number(walletBalance?.balance ?? 0).toLocaleString("en-NP")}</p>
                          )}
                        </div>
                        <ChevronRight className="h-5 w-5 text-red-600" aria-hidden="true" />
                      </Link>
                    )}

                    <h2 className="mb-3 mt-6 text-base font-bold text-slate-950">
                      {label("Your services", "तपाईंका सेवाहरू")}
                    </h2>
                    <div className="grid grid-cols-2 gap-3" id="roomkhoj-service-tiles">
                      {(showAllServices ? serviceTiles : serviceTiles.slice(0, 8)).map((item) => {
                        const Icon = item.icon;
                        const active = item.href === pathname;
                        const tileClass = `flex min-h-[104px] flex-col items-start justify-between gap-3 rounded-2xl border p-3.5 text-left shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 ${
                          active ? "border-red-200 bg-red-50 text-red-700" : "border-slate-200 bg-white text-slate-900"
                        }`;
                        return item.href ? (
                          <Link key={item.key} href={item.href}
                            onClick={() => setMobileOpen(false)}
                            aria-current={active ? "page" : undefined}
                            className={tileClass + " hover:border-red-200 hover:bg-red-50/50"}>
                            <Icon className="h-7 w-7" strokeWidth={1.8} aria-hidden="true" />
                            <span className="text-sm font-bold leading-snug">{item.title}</span>
                          </Link>
                        ) : (
                          <div key={item.key} aria-disabled="true" className={tileClass}>
                            <div className="flex w-full flex-wrap items-center justify-between gap-1">
                              <Icon className="h-7 w-7 text-slate-500" strokeWidth={1.8} aria-hidden="true" />
                              <span className="rounded-full bg-amber-50 px-2 py-1 text-[10px] font-semibold text-amber-800">
                                {label("Coming soon", "छिट्टै आउँदैछ")}
                              </span>
                            </div>
                            <span className="text-sm font-bold leading-snug">{item.title}</span>
                          </div>
                        );
                      })}
                    </div>

                    <button type="button" onClick={() => setShowAllServices((value) => !value)}
                      aria-expanded={showAllServices} aria-controls="roomkhoj-service-tiles"
                      className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-slate-200 py-3 text-sm font-bold text-slate-900 hover:bg-slate-300">
                      {showAllServices ? label("See less", "कम हेर्नुहोस्") : label("See more", "थप हेर्नुहोस्")}
                      <ChevronDown className={`h-4 w-4 transition-transform ${showAllServices ? "rotate-180" : ""}`} aria-hidden="true" />
                    </button>

                    <div className="mt-6 divide-y divide-slate-200 border-y border-slate-200">
                      <details className="group py-1">
                        <summary className="flex cursor-pointer list-none items-center gap-3 py-4 font-bold text-slate-900 [&::-webkit-details-marker]:hidden">
                          <CircleHelp className="h-6 w-6" aria-hidden="true" />
                          <span className="flex-1">{label("Help & support", "सहयोग र सम्पर्क")}</span>
                          <ChevronDown className="h-5 w-5 group-open:rotate-180" aria-hidden="true" />
                        </summary>
                        <div className="space-y-2 pb-4">
                          <Link href="/contact" onClick={() => setMobileOpen(false)} className="block rounded-xl bg-white p-3 text-sm font-medium">{label("Contact RoomKhoj", "RoomKhoj लाई सम्पर्क")}</Link>
                          <Link href="/about" onClick={() => setMobileOpen(false)} className="block rounded-xl bg-white p-3 text-sm font-medium">{label("About RoomKhoj", "RoomKhoj को बारेमा")}</Link>
                        </div>
                      </details>
                      <details className="group py-1">
                        <summary className="flex cursor-pointer list-none items-center gap-3 py-4 font-bold text-slate-900 [&::-webkit-details-marker]:hidden">
                          <Settings className="h-6 w-6" aria-hidden="true" />
                          <span className="flex-1">{label("Settings & preferences", "सेटिङ र प्राथमिकता")}</span>
                          <ChevronDown className="h-5 w-5 group-open:rotate-180" aria-hidden="true" />
                        </summary>
                        <div className="space-y-2 pb-4">
                          {isAuthenticated && (
                            <Link href="/user/dashboard/preferences" onClick={() => setMobileOpen(false)} className="block rounded-xl bg-white p-3 text-sm font-medium">{label("My preferences", "मेरा प्राथमिकता")}</Link>
                          )}
                          <div className="flex items-center justify-between rounded-xl bg-white p-3 text-sm">
                            <span>{label("Language", "भाषा")}</span>
                            <LanguageSwitcher />
                          </div>
                        </div>
                      </details>
                    </div>

                    {isAuthenticated && (
                      <button type="button" onClick={handleLogout}
                        className="mt-5 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-slate-200 p-3 text-sm font-bold text-slate-900 hover:bg-slate-300">
                        <LogOut className="h-4 w-4" aria-hidden="true" />
                        {label("Log out", "लग आउट")}
                      </button>
                    )}
                    <p className="mt-5 text-center text-xs text-slate-400">RoomKhoj · {label("Find your next home", "आफ्नो नयाँ घर खोज्नुहोस्")}</p>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
