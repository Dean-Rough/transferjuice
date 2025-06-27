import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility function to merge CSS classes with TailwindCSS conflict resolution
 * This is the standard shadcn/ui utility function
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
