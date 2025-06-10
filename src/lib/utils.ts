import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getLocalStorage = (key: string) => {
  if (typeof window !== "undefined") {
    return window.localStorage.getItem(key);
  }
  return null;
};

export const setLocalStorage = (key: string, value: string) => {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(key, value);
  }
  return null;
};
