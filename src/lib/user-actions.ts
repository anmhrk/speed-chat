"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";

export async function getAuthToken() {
  return (await (await auth()).getToken({ template: "convex" })) ?? undefined;
}

export async function deleteUser(userId: string) {
  try {
    const client = await clerkClient();
    await client.users.deleteUser(userId);
  } catch (error) {
    console.error(error);
    throw new Error("Failed to delete user");
  }
}
