"use client";

import { useRouter, usePathname } from "next/navigation";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export function RoomFAB() {
  const router = useRouter();
  const pathname = usePathname();

  // Hide on the create room page itself
  if (pathname === "/user/dashboard/rooms/create") return null;

  return (
    <button
      type="button"
      onClick={() => router.push("/user/dashboard/rooms/create")}
      className={cn(
        "fixed bottom-6 right-6 sm:bottom-24 sm:right-24 z-50 w-12 h-12 rounded-full shadow-lg",
        "bg-white dark:bg-gray-800 border-2 border-red-500 text-red-600",
        "flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-950",
        "hover:scale-110 transition-all duration-200 cursor-pointer",
      )}
      aria-label="Add new room"
      title="Add New Room"
    >
      <Plus className="w-6 h-6 font-bold" strokeWidth={3} />
    </button>
  );
}
