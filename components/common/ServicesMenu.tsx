"use client";

import { useEffect, useId, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Dialog as DialogPrimitive } from "radix-ui";
import { useQuery } from "@tanstack/react-query";
import { X, Wallet, Loader2, Home, PlusCircle, BriefcaseBusiness, MessageCircle, Truck, LayoutDashboard, Building2, Gift, ClipboardList, Settings, CircleHelp, ChevronDown, ChevronRight, LogOut, Wrench, Droplets, Sparkles, Wifi, type LucideIcon } from "lucide-react";
import { Sheet, SheetTrigger, SheetClose, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { useUserStore } from "@/stores/user-store";
import { useLogout } from "@/hooks/useLogout";
import { walletService } from "@/http/services/wallet.service";
import { UserRole } from "@/types/user.types";
import { UserAvatar } from "@/components/UserAvatar";
import { AuthButtons } from "@/components/AuthButtons";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useLanguage } from "@/components/providers/LanguageProvider";

const adminLinks = [["All rooms","/admin/dashboard/rooms"],["Pending approvals","/admin/dashboard/rooms/pending"],["Approved rooms","/admin/dashboard/rooms/approved"],["Users","/admin/dashboard/users"],["Notifications","/admin/dashboard/notifications"],["Vacancies","/admin/dashboard/vacancies"],["Candidates","/admin/dashboard/candidates"],["Contact history","/admin/dashboard/candidate-contacts"],["Referrals","/admin/dashboard/referrals"],["Wallet","/admin/dashboard/wallet"],["Wallet top-up","/admin/dashboard/wallet/topup"],["Commission","/admin/dashboard/commission"],["Records","/admin/dashboard/records"],["Chatbot training","/admin/dashboard/chatbot"],["AI profiles","/admin/dashboard/ai-profiles"],["AI learning","/admin/dashboard/ai-learning"],["AI developer","/admin/dashboard/ai-developer"],["Room shifting","/admin/dashboard/shifting"]] as const;

// Shared only by service-navigation launchers. It does not change service forms,
// search/filter drawers, account dropdowns, APIs or dashboard desktop sidebars.
export function ServicesMenu({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showAllServices, setShowAllServices] = useState(false);
  const tilesId = useId();
  const pathname = usePathname();
  const user = useUserStore(state => state.user);
  const { logout } = useLogout();
  const { language } = useLanguage();
  const label = (english: string, nepali: string) => language === "ne" ? nepali : english;
  const isAuthenticated = !!user;
  const dashboardHref = user?.role === UserRole.ADMIN
    ? "/admin/dashboard" : "/user/dashboard";
  const protectedHref = (href: string) => isAuthenticated ? href : "/auth/login";
  const serviceTiles: {
    key: string; title: string; icon: LucideIcon; href?: string;
  }[] = [
    { key: "rooms", title: label("Find a room", "कोठा खोज्नुहोस्"), icon: Home, href: "/rooms" },
    { key: "moving", title: label("Room shifting", "कोठा सार्ने सेवा"), icon: Truck, href: "/room-shifting" },
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

  const { data: walletBalance, isLoading: walletLoading } = useQuery({
    queryKey: ["wallet-balance"], queryFn: () => walletService.getBalance(),
    enabled: mobileOpen && isAuthenticated, staleTime: 30000,
  });
  useEffect(() => { setMobileOpen(false); }, [pathname]);
  const handleLogout = async () => { await logout(); setMobileOpen(false); };
  return <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
    <SheetTrigger asChild>{children}</SheetTrigger>
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-[10000] bg-black/50" />
      <DialogPrimitive.Content className="fixed inset-y-0 right-0 z-[10001] flex h-[100dvh] w-[94vw] max-w-[440px] flex-col overflow-hidden border-l border-slate-200 bg-slate-50 shadow-xl outline-none sm:w-[440px]">
                <div className="flex min-h-0 flex-1 flex-col">
                  <div className="shrink-0 border-b border-slate-200 bg-white px-5 py-4 pr-14 pt-[max(16px,env(safe-area-inset-top))]">
                    <SheetTitle className="text-xl font-black text-slate-950">
                      {label("Menu", "मेनु")}
                    </SheetTitle>
                    <SheetDescription className="mt-1 text-xs text-slate-500">
                      {label("Your home. Your services. RoomKhoj.", "तपाईंको घर, तपाईंका सेवाहरू — RoomKhoj।")}
                    </SheetDescription>
                  </div>

                  <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pt-4 pb-[calc(24px+env(safe-area-inset-bottom))]">
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
                    <div className="grid grid-cols-2 gap-3" id={tilesId}>
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
                      aria-expanded={showAllServices} aria-controls={tilesId}
                      className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-slate-200 py-3 text-sm font-bold text-slate-900 hover:bg-slate-300">
                      {showAllServices ? label("See less", "कम हेर्नुहोस्") : label("See more", "थप हेर्नुहोस्")}
                      <ChevronDown className={`h-4 w-4 transition-transform ${showAllServices ? "rotate-180" : ""}`} aria-hidden="true" />
                    </button>

                    {user && <details className="mt-5"><summary className="cursor-pointer font-bold text-slate-950">{label("My account", "मेरो खाता")}</summary><div className="mt-3 grid grid-cols-2 gap-3">{[
                      [label("People", "प्रयोगकर्ताहरू"), "/user/dashboard/people"],
                      [label("Alert preferences", "सूचना प्राथमिकता"), "/user/dashboard/preferences"],
                      [label("Safety reports", "सुरक्षा रिपोर्ट"), "/user/dashboard/reports"],
                      [label("Pending rooms", "पर्खाइका कोठा"), "/user/dashboard/rooms/pending"],
                      [label("Approved rooms", "स्वीकृत कोठा"), "/user/dashboard/rooms/approved"],
                      [label("My shifting bookings", "मेरा सार्ने बुकिङ"), "/user/dashboard/shifting"],
                    ].map(([title, href]) => <Link key={href} href={href} onClick={() => setMobileOpen(false)} className="rounded-xl border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-900">{title}</Link>)}</div></details>}
                    {user?.role === UserRole.ADMIN && <details className="mt-5"><summary className="cursor-pointer font-bold text-slate-950">{label("Admin tools", "एडमिनका कामहरू")}</summary><div className="mt-3 grid grid-cols-2 gap-3">{adminLinks.map(([title, href]) => <Link key={href} href={href} onClick={() => setMobileOpen(false)} className="rounded-xl border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-900">{title}</Link>)}</div></details>}
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

        <SheetClose aria-label={label("Close menu", "मेनु बन्द गर्नुहोस्")} className="absolute right-3 top-[max(12px,env(safe-area-inset-top))] flex h-11 w-11 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-red-500"><X className="h-5 w-5" /></SheetClose>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  </Sheet>;
}
