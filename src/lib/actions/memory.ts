"use server";

import { db } from "../db";
import { memories } from "../db/schema";
import { getUser } from ".";
import { eq } from "drizzle-orm";

export async function getMemories() {
  const user = await getUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  return await db.select().from(memories).where(eq(memories.userId, user.id));
}

export async function addMemory(memory: string) {
  const user = await getUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  await db.insert(memories).values({
    id: crypto.randomUUID(),
    createdAt: new Date(),
    userId: user.id,
    memory,
  });
}

export async function deleteMemory(memoryId: string) {
  await db.delete(memories).where(eq(memories.id, memoryId));
}
