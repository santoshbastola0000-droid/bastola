"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AdminSidebar } from "@/components/admin/Sidebar";
import { AdminHeader } from "@/components/admin/Header";
import { cn } from "@/lib/utils";
import { useUserRole } from "@/stores/user-store";
import { Loader2 } from "lucide-react";

export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const router = useRouter();
  const { isAdmin, isLoaded, user } = useUserRole();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;
    if (!user) {
      router.push("/auth/login");
    } else if (!isAdmin) {
      router.push(
        user.role?.toLowerCase() === "user" ? "/user/dashboard" : "/",
      );
    }
  }, [isLoaded, isAdmin, user, router]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-white">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-3" />
          <p className="text-sm text-gray-500">Loading…</p>
        </div>
      </div>
    );
  }

  if (!isAdmin || !user) return null;

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar
        isCollapsed={false}
        setIsCollapsed={() => {}}
        isMobile={true}
      />

      <div className="flex">
        {/* Desktop sidebar */}
        <AdminSidebar
          isCollapsed={isSidebarCollapsed}
          setIsCollapsed={setIsSidebarCollapsed}
          isMobile={false}
        />

        {/* Main content — offset on desktop only via sidebar width class */}
        <div className="flex-1 flex flex-col min-w-0">
          <AdminHeader isSidebarCollapsed={isSidebarCollapsed} />
          <main className="flex-1 p-4 md:p-6 lg:p-8 bg-gradient-to-br from-gray-50 to-white">
            <div className="max-w-7xl mx-auto">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
