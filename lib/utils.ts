import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

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
