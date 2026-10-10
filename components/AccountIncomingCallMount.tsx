"use client";

import { useEffect, useState } from "react";
import { AccountBrowserCallPanel } from "@/components/AccountBrowserCallPanel";

export function AccountIncomingCallMount() {
  // Mount only for authenticated sessions; the signaling server verifies the actual cookie.
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => {
    const check = () => setSignedIn(document.cookie.includes("auth-token=") || document.cookie.includes("token=") || document.cookie.includes("jwt="));
    check();
    window.addEventListener("focus", check);
    return () => window.removeEventListener("focus", check);
  }, []);
  return signedIn ? <div className="fixed bottom-20 right-3 z-[90] w-[min(360px,calc(100vw-24px))]"><AccountBrowserCallPanel /></div> : null;
}
