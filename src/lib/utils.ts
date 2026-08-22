import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Sanitize full name: trim extra spaces and convert to Title Case
 */
export function sanitizeFullName(name: string): string {
  if (!name) return ""
  return name
    .trim()
    .replace(/\s+/g, " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ")
}

/**
 * Sanitize email: trim leading/trailing whitespace and convert to lowercase
 */
export function sanitizeEmail(email: string): string {
  if (!email) return ""
  return email.trim().toLowerCase()
}
