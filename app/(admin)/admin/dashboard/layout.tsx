"use client";

import { useState, useEffect } from "react";
import { Inter } from "next/font/google";
import { useRouter } from "next/navigation";
import { AdminSidebar } from "@/components/admin/Sidebar";
import { AdminHeader } from "@/components/admin/Header";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useUserRole } from "@/stores/user-store";
import { Loader2 } from "lucide-react";

const inter = Inter({ subsets: ["latin"] });

export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const router = useRouter();
  const { isAdmin, isLoaded, user } = useUserRole();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const isMobile = useMediaQuery("(max-width: 768px)");

  // Check if user is admin
  useEffect(() => {
    if (isLoaded) {
      if (!user) {
        // Not logged in
        router.push("/auth/login");
      } else if (!isAdmin) {
        // Logged in but not admin
        if (user.role?.toLowerCase() === "User") {
          router.push("/user/dashboard");
        } else {
          router.push("/");
        }
      }
    }
  }, [isLoaded, isAdmin, user, router]);

  // Show loading state while checking auth
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-white">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If not admin, don't render the layout (redirect will happen)
  if (!isAdmin || !user) {
    return null;
  }

  return (
    <div className={cn("min-h-screen bg-background", inter.className)}>
      <div className="flex">
        {/* Sidebar */}
        <AdminSidebar
          isCollapsed={isSidebarCollapsed}
          setIsCollapsed={setIsSidebarCollapsed}
        />

        {/* Main Content */}
        <div
          className={cn(
            "flex-1 transition-all duration-300 ease-in-out",
            !isMobile && `ml-${isSidebarCollapsed ? "20" : "64"}`,
          )}
        >
          <AdminHeader isSidebarCollapsed={isSidebarCollapsed} />
          <main className="p-4 md:p-6 lg:p-8 min-h-[calc(100vh-4rem)] bg-gradient-to-br from-gray-50 to-white">
            <div className="max-w-7xl mx-auto">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
