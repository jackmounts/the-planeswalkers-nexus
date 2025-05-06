import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function computeGridClass(n: number) {
  if (n <= 1) return "grid-rows-1 grid-cols-1";
  if (n === 2) return "grid-rows-2 grid-cols-1";
  if (n <= 4) return "grid-rows-2 grid-cols-2";
  if (n <= 6) return "grid-rows-2 grid-cols-3";
  return "grid-rows-3 grid-cols-3";
}
