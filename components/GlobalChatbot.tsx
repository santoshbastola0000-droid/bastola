use client";

import { usePathname } from "next/navigation";
import { Chatbot } from "@/components/user/Chatbot";
import { useUserRole } from "@/stores/user-store";
import { useUserLocation } from "@/hooks/use-user-location";

const ADMIN_PATH_PREFIX = "/admin";
const AUTH_PATH_PREFIX = "/auth";

export function GlobalChatbot() {
  const pathname = usePathname();
  const { user } = useUserRole();

  // Keep location/heartbeat active for authenticated users everywhere except auth pages
  useUserLocation();

  if (!pathname) return null;

  // Hide on admin and auth pages
  if (
    pathname.startsWith(ADMIN_PATH_PREFIX) ||
    pathname.startsWith(AUTH_PATH_PREFIX)
  ) {
    return null;
  }

  // Only show chatbot widget on user-facing pages
import { AdvancedChatbot as Chatbot } from "@/components/user/Chatbot";
