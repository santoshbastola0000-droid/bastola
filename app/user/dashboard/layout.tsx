"use client";

import { useState, useEffect } from "react";
import { Inter } from "next/font/google";
import { useRouter, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useUserRole } from "@/stores/user-store";
import { UserHeader } from "@/components/user/Header";
import { Loader2 } from "lucide-react";
import { UserSidebar } from "@/components/user/Sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { RoomFAB } from "@/components/user/RoomFAB";

const inter = Inter({ subsets: ["latin"] });

export default function UserLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const router = useRouter();
  const pathname = usePathname();
  const { isUser, isLoaded, user } = useUserRole();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const isMobile = useMediaQuery("(max-width: 768px)");
  const isTablet = useMediaQuery("(min-width: 769px) and (max-width: 1024px)");

  // Auto-collapse on tablet
  useEffect(() => {
    if (isTablet) setIsSidebarCollapsed(true);
    else if (!isMobile) setIsSidebarCollapsed(false);
  }, [isTablet, isMobile]);

  // Close mobile sidebar on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  // Lock body scroll when mobile sidebar is open
  useEffect(() => {
    document.body.style.overflow = isMobile && isMobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobile, isMobileOpen]);

  // Auth redirect
  useEffect(() => {
    if (!isLoaded) return;
    if (!user) {
      router.push("/auth/login");
    } else if (!isUser) {
      router.push(
        user.role?.toLowerCase() === "admin" ? "/admin/dashboard" : "/",
      );
    }
  }, [isLoaded, isUser, user, router]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-white">
        <div className="text-center">
          <div className="relative mb-4">
            <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto relative" />
          </div>
          <p className="text-sm text-gray-500">Loading your dashboard…</p>
        </div>
      </div>
    );
  }

  if (!isUser || !user) return null;

  const desktopSidebarWidth = isSidebarCollapsed ? "72px" : "256px";

  return (
    <ThemeProvider>
      <div className={cn("min-h-screen bg-background", inter.className)}>
        {/* ── Desktop sidebar (sticky, fixed width) ── */}
        <aside
          className={cn(
            "hidden md:flex flex-col fixed inset-y-0 left-0 z-40 transition-all duration-300",
            isSidebarCollapsed ? "w-[72px]" : "w-64",
          )}
        >
          <UserSidebar
            isCollapsed={isSidebarCollapsed}
            setIsCollapsed={setIsSidebarCollapsed}
          />
        </aside>

        {/* ── Mobile sidebar drawer ── */}
        {/* Backdrop */}
        {isMobileOpen && (
          <div
            className="fixed inset-0 bg-black/60 z-40 md:hidden"
            onClick={() => setIsMobileOpen(false)}
          />
        )}
        {/* Drawer */}
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-50 w-72 md:hidden transition-transform duration-300 ease-in-out",
            isMobileOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <UserSidebar
            isCollapsed={false}
            setIsCollapsed={() => {}}
            isMobile
            onClose={() => setIsMobileOpen(false)}
          />
        </aside>

        {/* ── Main content ── */}
        <div
          className="flex flex-col min-h-screen transition-all duration-300"
          style={{ marginLeft: isMobile ? 0 : desktopSidebarWidth }}
        >
          <UserHeader
            isSidebarCollapsed={isSidebarCollapsed}
            onMenuClick={() => setIsMobileOpen((v) => !v)}
          />
          <main className="flex-1 bg-gradient-to-br from-gray-50 via-white to-gray-50">
            <div className="p-3 sm:p-4 md:p-6 lg:p-8">
              <div className="max-w-7xl mx-auto">{children}</div>
            </div>
          </main>
        </div>
        {/* Floating widgets */}
        <RoomFAB />
      </div>
    </ThemeProvider>
  );
}
