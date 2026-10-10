"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/** Hide marketing/login prompts and floating overlays only on game pages. */
export function OutsideQuietGame({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const quietGame = pathname === "/funny-check" || pathname.startsWith("/funny-check/") || pathname === "/invite-games" || pathname.startsWith("/invite-games/");
  return quietGame ? null : <>{children}</>;
}
