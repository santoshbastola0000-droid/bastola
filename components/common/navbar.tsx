"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useUserStore } from "@/stores/user-store";
import { useLogout } from "@/hooks/useLogout";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Logo } from "@/components/Logo";
import { NavLinks } from "@/components/Navlinks";
import { UserMenu } from "@/components/UserMenu";
import { AuthButtons } from "@/components/AuthButtons";

export function NavBar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useUserStore();
  const { logout } = useLogout();
  const pathname = usePathname();

  const isAuthenticated = !!user;
  const isHomePage = pathname === "/";

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
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

  return (
    <header className={headerClasses}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <Logo variant={isHomePage ? "light" : "dark"} scrolled={scrolled} />

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:gap-6">
            <NavLinks
              scrolled={scrolled}
              isAuthenticated={isAuthenticated}
              userRole={user?.role}
            />

            {/* Desktop Auth/User Section */}
            {isAuthenticated ? (
              <UserMenu
                user={user}
                onLogout={handleLogout}
                scrolled={scrolled}
              />
            ) : (
              <AuthButtons scrolled={scrolled && !isHomePage} />
            )}
          </div>

          {/* Mobile Menu Button */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button
                variant="ghost"
                size="icon"
                className={`relative ${
                  scrolled || !isHomePage ? "text-slate-700" : "text-white"
                }`}
              >
                {mobileOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:w-80 p-0">
              <div className="flex flex-col h-full">
                {/* Mobile Header */}
                <div className="p-4 border-b bg-gradient-to-r from-[var(--primary)]/5 to-transparent">
                  <Logo />
                </div>

                {/* Mobile Content */}
                <div className="flex-1 overflow-y-auto p-4">
                  {/* Mobile Navigation Links */}
                  <div className="mb-6">
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                      Navigation
                    </h3>
                    <NavLinks
                      variant="mobile"
                      isAuthenticated={isAuthenticated}
                      userRole={user?.role}
                      onItemClick={() => setMobileOpen(false)}
                    />
                  </div>

                  {/* Mobile Auth/User Section */}
                  <div>
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                      {isAuthenticated ? "Account" : "Get Started"}
                    </h3>
                    {isAuthenticated ? (
                      <UserMenu
                        user={user}
                        onLogout={handleLogout}
                        variant="mobile"
                      />
                    ) : (
                      <AuthButtons variant="mobile" />
                    )}
                  </div>

                  {/* Mobile Footer */}
                  <div className="mt-8 pt-6 border-t">
                    <p className="text-xs text-slate-400 text-center">
                      © 2026 RoomServise. All rights reserved.
                    </p>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
