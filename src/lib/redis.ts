import { createClient } from "redis";

const redis = createClient({
  url: process.env.REDIS_URL!,
});

async function ensureConnection() {
  try {
    if (!redis.isOpen) {
      await redis.connect();
    }
  } catch (error) {
    console.error("Failed to connect to Redis:", error);
  }
}

async function set(key: string, value: string) {
  await ensureConnection();
  await redis.set(key, value);
}

async function get(key: string) {
  await ensureConnection();
  return await redis.get(key);
}

export async function loadStreamIds(chatId: string): Promise<string[]> {
  try {
    const data = await get(chatId);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error(error);
    return [];
  }
}

export async function saveStreamId(chatId: string, streamId: string) {
  try {
    const existingStreamIds = await loadStreamIds(chatId);
    existingStreamIds.push(streamId);
    await set(chatId, JSON.stringify(existingStreamIds));
  } catch (error) {
    console.error(error);
  }
}
