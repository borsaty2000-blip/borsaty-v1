import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency: string = "EGP"): string {
  return new Intl.NumberFormat("ar-EG", {
    style: "currency",
    currency: currency,
    maximumFractionDigits: 2
  }).format(amount);
}

export function formatNumberArabic(value: number, decimals: number = 2): string {
  return new Intl.NumberFormat("ar-EG", {
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals
  }).format(value);
}

export function formatCompactNumber(value: number): string {
  if (value >= 1_000_000_000_000) {
    return `${(value / 1_000_000_000_000).toFixed(1)} تريليون`;
  }
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(1)} مليار`;
  }
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)} مليون`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)} ألف`;
  }
  return value.toString();
}
