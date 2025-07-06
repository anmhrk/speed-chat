import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { generateReactHelpers } from "@uploadthing/react";
import type { OurFileRouter } from "@/app/api/uploadthing/core";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const { useUploadThing } = generateReactHelpers<OurFileRouter>();

export const getRandomGreeting = (name: string) => {
  const greetings = [
    `How can I help you, ${name}?`,
    `What can I do for you, ${name}?`,
    `What's on your mind, ${name}?`,
    `How can I assist you, ${name}?`,
    `Where should we begin, ${name}?`,
    `Good to see you, ${name}!`,
    `Nice to see you, ${name}!`,
    `Welcome back, ${name}!`,
    `Ready when you are, ${name}!`,
  ];

  const randomGreeting =
    greetings[Math.floor(Math.random() * greetings.length)];

  return randomGreeting;
};
