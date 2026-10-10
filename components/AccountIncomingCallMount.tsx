"use client";

import { AccountBrowserCallPanel } from "@/components/AccountBrowserCallPanel";

// Authentication cookies may be HttpOnly or scoped to the API hostname.
// The server verifies each WebSocket upgrade, so do not infer login from document.cookie.
export function AccountIncomingCallMount() {
  return <div className="fixed bottom-20 right-3 z-[90] w-[min(360px,calc(100vw-24px))]"><AccountBrowserCallPanel /></div>;
}
