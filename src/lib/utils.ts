import { createServerFn } from "@tanstack/react-start";
import { getWebRequest } from "@tanstack/react-start/server";
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

export const getSidebarState = createServerFn({ method: "GET" }).handler(
  async () => {
    const request = getWebRequest();
    const cookies = request?.headers?.get("cookie") || "";

    const match = cookies.match(/sidebar_state=([^;]*)/);
    const sidebarState = match ? match[1] : null;

    if (!sidebarState) {
      return true;
    } else {
      return sidebarState === "true";
    }
  },
);
