import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { BASE_URL } from "./constants/app.constants";
import { formatDistanceToNow } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

// Format price in NPR (Nepalese Rupees)
export function formatPriceNPR(price: string | number): string {
  const numPrice = typeof price === "string" ? parseFloat(price) : price;

  if (isNaN(numPrice)) {
    return "रू 0";
  }

  return `रू ${numPrice.toLocaleString("en-US")}`;
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

/**
 * Format currency in NPR (Nepalese Rupees)
 * @param amount - The amount to format
 * @param options - Formatting options
 * @returns Formatted currency string
 */
export function formatCurrency(
  amount: number | string,
  options?: {
    compact?: boolean;
    showSymbol?: boolean;
    decimals?: number;
  },
): string {
  const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;

  if (isNaN(numAmount)) {
    return "Rs. 0";
  }

  const { compact = false, showSymbol = true, decimals = 2 } = options || {};

  const formatter = new Intl.NumberFormat("ne-NP", {
    style: showSymbol ? "currency" : "decimal",
    currency: "NPR",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    notation: compact ? "compact" : "standard",
    compactDisplay: "short",
  });

  // For NPR, Intl will use "Rs" as symbol
  return formatter.format(numAmount);
}

// src/lib/utils.ts
export const formatNepaliCurrency = (amount: number | string): string => {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return "Rs. 0";

  // Format with commas for Nepali numbering system
  const formatter = new Intl.NumberFormat("ne-NP", {
    style: "currency",
    currency: "NPR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  return formatter.format(num).replace("NPR", "Rs.");
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Converts a relative `/uploads/...` path to a full URL */
export function resolveImageUrl(path: string | null | undefined): string {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}

/** Returns just the first meaningful segment of a formatted address */
export function getShortAddress(formattedAddress: string): string {
  if (!formattedAddress) return "";
  // First word before the first comma
  const firstPart = formattedAddress.split(",")[0].trim();
  return firstPart;
}

export function timeAgo(dateStr: string): string {
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
  } catch {
    return formatDate(dateStr);
  }
}

export const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const exp = payload.exp;
    const now = Math.floor(Date.now() / 1000);
    return now >= exp;
  } catch (error) {
    return true; // If we can't decode, assume it's expired
  }
};

export const getTokenExpiration = (token: string): Date | null => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const exp = payload.exp;
    return exp ? new Date(exp * 1000) : null;
  } catch (error) {
    return null;
  }
};
