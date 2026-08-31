"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Wallet, Loader2, Bell } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { useUserStore } from "@/stores/user-store";
import { walletService } from "@/http/services/wallet.service";

import { Button } from "@/components/ui/button";
import { ServicesMenu } from "@/components/common/ServicesMenu";

import { Logo } from "@/components/Logo";
import { NavLinks } from "@/components/Navlinks";
import { UserMenu } from "@/components/UserMenu";
import { AuthButtons } from "@/components/AuthButtons";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export function NavBar() {
  const [scrolled, setScrolled] = useState(false);

  const { user } = useUserStore();
  const pathname = usePathname();

  const isAuthenticated = !!user;
  const isHomePage = pathname === "/";

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

            <ServicesMenu><Button variant="ghost" size="icon" aria-label="Open services menu" className={scrolled || !isHomePage ? "text-slate-700" : "text-white"}><Menu className="h-5 w-5" /></Button></ServicesMenu>
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
            <ServicesMenu><Button variant="ghost" size="icon" aria-label="Open services menu" className={scrolled || !isHomePage ? "text-slate-700" : "text-white"}><Menu className="h-5 w-5" /></Button></ServicesMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
