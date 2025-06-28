// Ensure Redis is only used on the server
if (typeof window !== "undefined") {
  throw new Error("Redis client cannot be used on the client side");
}

import { createClient } from "redis";

// Mock Redis implementation for development without Redis server
const mockStore = new Map<string, string>();

interface RedisInterface {
  set(key: string, value: string): Promise<void>;
  get(key: string): Promise<string | null>;
  del(key: string): Promise<void>;
}

const mockRedis: RedisInterface = {
  async set(key: string, value: string) {
    console.log(`[Mock Redis] SET ${key} = ${value}`);
    mockStore.set(key, value);
  },

  async get(key: string) {
    const value = mockStore.get(key) || null;
    console.log(`[Mock Redis] GET ${key} = ${value}`);
    return value;
  },

  async del(key: string) {
    console.log(`[Mock Redis] DEL ${key}`);
    mockStore.delete(key);
  },
};

// Real Redis implementation
function createRealRedis(): RedisInterface {
  const client = createClient({
    url: process.env.REDIS_URL!,
  });

  // Handle connection errors
  client.on("error", (err: Error) => {
    console.error("Redis client error:", err);
  });

  async function ensureConnection() {
    if (!client.isOpen) {
      try {
        await client.connect();
      } catch (error) {
        console.error("Failed to connect to Redis:", error);
        throw error;
      }
    }
  }

  return {
    async set(key: string, value: string) {
      await ensureConnection();
      await client.set(key, value);
    },

    async get(key: string) {
      await ensureConnection();
      return await client.get(key);
    },

    async del(key: string) {
      await ensureConnection();
      await client.del(key);
    },
  };
}

// Choose implementation based on environment
const redis: RedisInterface = process.env.REDIS_URL
  ? createRealRedis()
  : (() => {
      console.warn(
        "[Redis] REDIS_URL not set, using mock implementation for development"
      );
      return mockRedis;
    })();

export const { set, get, del } = redis;
