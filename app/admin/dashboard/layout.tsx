"use client";

import { useState } from "react";
import { Inter } from "next/font/google";
import { AdminSidebar } from "@/components/admin/Sidebar";
import { AdminHeader } from "@/components/admin/Header";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/hooks/use-media-query";

const inter = Inter({ subsets: ["latin"] });

export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const isMobile = useMediaQuery("(max-width: 768px)");

  const sidebarWidth = isSidebarCollapsed && !isMobile ? "w-20" : "w-64";
  const marginLeft = isMobile
    ? "ml-0"
    : `ml-${isSidebarCollapsed ? "20" : "64"}`;

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
