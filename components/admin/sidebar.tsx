"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const menus = [
  {
    name: "Dashboard",
    href: "/admin",
  },
  {
    name: "AI Rules",
    href: "/admin/ai-rules",
  },
  {
    name: "AI Knowledge",
    href: "/admin/ai-knowledge",
  },
  {
    name: "AI Memory",
    href: "/admin/ai-memory",
  },
  {
    name: "AI Logs",
    href: "/admin/ai-logs",
  },
  {
    name: "AI Settings",
    href: "/admin/ai-settings",
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 min-h-screen border-r bg-white">
      <div className="p-6 text-xl font-bold">
        🤖 AI Admin
      </div>

      <nav className="flex flex-col">
        {menus.map((menu) => (
          <Link
            key={menu.href}
            href={menu.href}
            className={`px-6 py-3 hover:bg-gray-100 ${
              pathname === menu.href
                ? "bg-blue-100 font-semibold"
                : ""
            }`}
          >
            {menu.name}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
