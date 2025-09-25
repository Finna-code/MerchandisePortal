import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getAppBaseUrl() {
  const raw = process.env.APP_BASE_URL || process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL;
  if (!raw) return "http://localhost:3000";
  try {
    const url = new URL(raw);
    url.pathname = url.pathname.replace(/\/$/, "");
    return url.toString().replace(/\/$/, "");
  } catch {
    return "http://localhost:3000";
  }
}

