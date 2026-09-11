type NetworkInformationLike = {
  effectiveType?: string;
  saveData?: boolean;
  downlink?: number;
  rtt?: number;
  addEventListener?: (type: string, listener: EventListener) => void;
  removeEventListener?: (type: string, listener: EventListener) => void;
};

export type NetworkProfile = {
  effectiveType: string;
  saveData: boolean;
  liteMode: boolean;
  verySlow: boolean;
  feedLimit: number;
  pollIntervalMs: number;
  prefetchDistancePx: number;
};

function connection(): NetworkInformationLike | undefined {
  if (typeof navigator === "undefined") return undefined;
  const nav = navigator as Navigator & {
    connection?: NetworkInformationLike;
    mozConnection?: NetworkInformationLike;
    webkitConnection?: NetworkInformationLike;
  };
  return nav.connection || nav.mozConnection || nav.webkitConnection;
}

export function getNetworkProfile(): NetworkProfile {
  const info = connection();
  const effectiveType = String(info?.effectiveType || "unknown").toLowerCase();
  const saveData = Boolean(info?.saveData);
  const verySlow = saveData || effectiveType === "slow-2g" || effectiveType === "2g";
  const liteMode = verySlow || effectiveType === "3g";

  return {
    effectiveType,
    saveData,
    liteMode,
    verySlow,
    feedLimit: verySlow ? 6 : liteMode ? 8 : 12,
    pollIntervalMs: verySlow ? 60_000 : liteMode ? 30_000 : 15_000,
    prefetchDistancePx: verySlow ? 180 : liteMode ? 350 : 700,
  };
}

export function onNetworkProfileChange(listener: () => void) {
  const info = connection();
  if (!info?.addEventListener || !info?.removeEventListener) return () => undefined;

  const handler: EventListener = () => listener();
  info.addEventListener("change", handler);
  return () => info.removeEventListener?.("change", handler);
}
