"use client";

import { useEffect } from "react";
import { userService } from "@/http/services/user.service";
import { useUserStore } from "@/stores/user-store";
import type { BrowserPermissionState } from "@/types/user.types";

type PermissionNameSupported = "geolocation" | "notifications" | "microphone" | "camera";

const normalize = (state?: PermissionState | NotificationPermission): BrowserPermissionState => {
  if (state === "granted" || state === "denied") return state;
  if (state === "prompt" || state === "default") return "prompt";
  return "unknown";
};

async function readPermission(name: PermissionNameSupported): Promise<BrowserPermissionState> {
  if (name === "notifications") {
    if (!("Notification" in window)) return "unsupported";
    return normalize(Notification.permission);
  }

  if (!navigator.permissions?.query) return "unsupported";

  try {
    const status = await navigator.permissions.query({
      name: name as PermissionName,
    });
    return normalize(status.state);
  } catch {
    return "unsupported";
  }
}

export function PermissionStatusSync() {
  const userId = useUserStore((state) => state.user?.id);

  useEffect(() => {
    if (!userId || typeof window === "undefined") return;

    let cancelled = false;
    const cleanups: Array<() => void> = [];

    const sync = async () => {
      const [location, notification, microphone, camera] = await Promise.all([
        readPermission("geolocation"),
        readPermission("notifications"),
        readPermission("microphone"),
        readPermission("camera"),
      ]);

      if (cancelled) return;

      await userService
        .updatePermissions({ location, notification, microphone, camera })
        .catch(() => undefined);
    };

    void sync();

    const watchPermission = async (
      name: Exclude<PermissionNameSupported, "notifications">,
    ) => {
      if (!navigator.permissions?.query) return;
      try {
        const status = await navigator.permissions.query({
          name: name as PermissionName,
        });
        const onChange = () => void sync();
        status.addEventListener("change", onChange);
        cleanups.push(() => status.removeEventListener("change", onChange));
      } catch {
        // Permission name is unsupported in this browser.
      }
    };

    void watchPermission("geolocation");
    void watchPermission("microphone");
    void watchPermission("camera");

    const onFocus = () => void sync();
    window.addEventListener("focus", onFocus);

    return () => {
      cancelled = true;
      window.removeEventListener("focus", onFocus);
      cleanups.forEach((cleanup) => cleanup());
    };
  }, [userId]);

  return null;
}
