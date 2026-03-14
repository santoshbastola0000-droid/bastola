"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Clock, CheckCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export function StatusTabs() {
  const pathname = usePathname();

  const tabs = [
    {
      name: "Pending Approval",
      href: "/user/dashboard/rooms/pending",
      icon: Clock,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
      borderColor: "border-yellow-200",
    },
    {
      name: "Approved Rooms",
      href: "/user/dashboard/rooms/approved",
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
    },
    {
      name: "Rejected Rooms",
      href: "/user/dashboard/rooms/rejected",
      icon: XCircle,
      color: "text-red-600",
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
    },
  ];

  return (
    <div className="border-b border-gray-200">
      <nav className="flex -mb-px space-x-8" aria-label="Tabs">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href;
          const Icon = tab.icon;

          return (
            <Link
              key={tab.name}
              href={tab.href}
              className={cn(
                "group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm",
                isActive
                  ? `${tab.borderColor} ${tab.color}`
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300",
              )}
            >
              <Icon
                className={cn(
                  "mr-2 h-5 w-5",
                  isActive
                    ? tab.color
                    : "text-gray-400 group-hover:text-gray-500",
                )}
              />
              {tab.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
