"use client";

import { useEffect, useState } from "react";
import { Bell, Download, X } from "lucide-react";

import { Button } from "@/components/ui/button";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function PwaInstallPrompt() {
  const [installPrompt, setInstallPrompt] =
    useState<InstallPromptEvent | null>(null);
  const [iosGuide, setIosGuide] = useState(false);
  const [dismissed, setDismissed] = useState(true);
  const [notificationPermission, setNotificationPermission] =
    useState<NotificationPermission | "unsupported">("default");

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone;

    if (isStandalone || localStorage.getItem("roomkhoj:pwa-dismissed")) {
      return;
    }

    setDismissed(false);
    setNotificationPermission(
      "Notification" in window
        ? Notification.permission
        : "unsupported",
    );

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    return () =>
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
  }, []);

  const isIos =
    typeof navigator !== "undefined" &&
    /iphone|ipad|ipod/i.test(navigator.userAgent);

  const dismiss = () => {
    localStorage.setItem("roomkhoj:pwa-dismissed", "1");
    setDismissed(true);
  };

  const enableCallNotifications = async () => {
    if (!("Notification" in window)) {
      setNotificationPermission("unsupported");
      return;
    }

    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);
  };

  const install = async () => {
    if (isIos) {
      setIosGuide(true);
      return;
    }

    if (!installPrompt) return;
    await installPrompt.prompt();
    const result = await installPrompt.userChoice;
    if (result.outcome === "accepted") setDismissed(true);
    setInstallPrompt(null);
  };

  if (dismissed) return null;

  return (
    <div className="fixed bottom-20 left-3 right-3 z-[90] mx-auto max-w-md rounded-2xl border bg-background p-4 shadow-xl md:bottom-5">
      <button
        type="button"
        aria-label="Close install prompt"
        onClick={dismiss}
        className="absolute right-3 top-3 text-muted-foreground"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="pr-7">
        <p className="font-semibold">RoomKhoj app install गर्नुहोस्</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Call notification, message र नयाँ room/job update तुरुन्त पाउनुहोस्।
        </p>
      </div>

      {iosGuide ? (
        <div className="mt-3 rounded-xl bg-muted p-3 text-sm">
          <p className="font-medium">iPhone मा यसरी install गर्नुहोस्:</p>
          <p className="mt-1">Safari को Share (□↑) → Add to Home Screen → Add</p>
        </div>
      ) : installPrompt || isIos ? (
        <Button className="mt-4 w-full" onClick={install}>
          <Download className="mr-2 h-4 w-4" />
          Install RoomKhoj
        </Button>
      ) : null}

      {notificationPermission === "granted" ? (
        <p className="mt-3 text-center text-sm font-medium text-emerald-600">
          Call notification allowed
        </p>
      ) : (
        <Button
          className="mt-3 w-full"
          variant="outline"
          onClick={enableCallNotifications}
          disabled={notificationPermission === "denied"}
        >
          <Bell className="mr-2 h-4 w-4" />
          {notificationPermission === "denied"
            ? "Notification browser settings मा blocked छ"
            : "Enable call notifications"}
        </Button>
      )}

      <button
        type="button"
        onClick={dismiss}
        className="mt-3 flex w-full items-center justify-center gap-1 text-xs text-muted-foreground"
      >
        <Bell className="h-3 w-3" />
        पछि पनि Profile बाट install गर्न मिल्छ
      </button>
    </div>
  );
}
