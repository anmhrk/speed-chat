import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { generateReactHelpers } from "@uploadthing/react";
import type { OurFileRouter } from "@/app/api/uploadthing/core";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const { useUploadThing } = generateReactHelpers<OurFileRouter>();

export const isAppleDevice = () => {
  if (typeof window === "undefined") return false;
  return /Mac|iPhone|iPad|iPod/.test(navigator.userAgent);
};
