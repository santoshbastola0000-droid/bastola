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

const inter = Inter({ subsets: ["latin"] });

export default function UserLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const router = useRouter();
  const pathname = usePathname();
  const { isUser, isLoaded, user } = useUserRole();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isMobile = useMediaQuery("(max-width: 768px)");
  const isTablet = useMediaQuery("(min-width: 769px) and (max-width: 1024px)");

  // Auto collapse sidebar on tablet
  useEffect(() => {
    if (isTablet) {
      setIsSidebarCollapsed(true);
    }
  }, [isTablet]);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Check if user is user
  useEffect(() => {
    if (isLoaded) {
      if (!user) {
        // Not logged in
        router.push("/auth/login");
      } else if (!isUser) {
        // Logged in but not user
        if (user.role?.toLowerCase() === "admin") {
          router.push("/admin/dashboard");
        } else {
          router.push("/");
        }
      }
    }
  }, [isLoaded, isUser, user, router]);

  // Handle body scroll when mobile menu is open
  useEffect(() => {
    if (isMobile && isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMobile, isMobileMenuOpen]);

  // Show loading state while checking auth
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-white">
        <div className="text-center">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping"></div>
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4 relative" />
          </div>
          <p className="text-sm text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // If not user, don't render the layout (redirect will happen)
  if (!isUser || !user) {
    return null;
  }

  return (
    <div className={cn("min-h-screen bg-background", inter.className)}>
      <div className="flex">
        {/* Sidebar - Desktop */}
        <div
          className={cn(
            "hidden md:block fixed inset-y-0 left-0 z-50 transition-all duration-300",
            isSidebarCollapsed ? "w-20" : "w-64",
          )}
        >
          <UserSidebar
            isCollapsed={isSidebarCollapsed}
            setIsCollapsed={setIsSidebarCollapsed}
          />
        </div>

        {/* Mobile Menu Overlay */}
        {isMobile && isMobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden animate-fade-in"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Mobile Sidebar */}
        <div
          className={cn(
            "fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out md:hidden",
          )}
        >
          <UserSidebar
            isCollapsed={false}
            setIsCollapsed={() => {}}
            isMobile={true}
            onClose={() => setIsMobileMenuOpen(false)}
          />
        </div>

        {/* Main Content */}
        <div
          className={cn(
            "flex-1 transition-all duration-300 ease-in-out min-h-screen",
            !isMobile && (isSidebarCollapsed ? "md:ml-20" : "md:ml-64"),
          )}
        >
          {/* Header */}
          <UserHeader
            isSidebarCollapsed={isSidebarCollapsed}
            onMenuClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          />

          {/* Main Content Area */}
          <main className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-gray-50 via-white to-gray-50">
            <div className="p-3 sm:p-4 md:p-6 lg:p-8">
              <div className="max-w-7xl mx-auto">
                {/* Page Content */}
                {children}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
