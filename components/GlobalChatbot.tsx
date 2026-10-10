"use client";

import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
const Chatbot = dynamic(()=>import("@/components/user/Chatbot").then(m=>m.Chatbot),{ssr:false});
import { useUserRole } from "@/stores/user-store";
import { useUserLocation } from "@/hooks/use-user-location";

const ADMIN_PATH_PREFIX = "/admin";
const AUTH_PATH_PREFIX = "/auth";

export function GlobalChatbot() {
  const pathname = usePathname();
  const [activated,setActivated]=useState(false);
  useEffect(()=>{const open=()=>setActivated(true);window.addEventListener('open-roomkhoj-chatbot',open);return()=>window.removeEventListener('open-roomkhoj-chatbot',open);},[]);
  const { user } = useUserRole();

  // Keep location/heartbeat active for authenticated users everywhere except auth pages
  useUserLocation();

  if (!pathname) return null;

  // Hide where the floating assistant can cover primary controls.
  if (
    pathname.startsWith(ADMIN_PATH_PREFIX) ||
    pathname.startsWith(AUTH_PATH_PREFIX) ||
    pathname.startsWith("/messages")
  ) {
    return null;
  }

  // Only show chatbot widget on user-facing pages
  return activated ? <Chatbot initialOpen /> : null;
}
