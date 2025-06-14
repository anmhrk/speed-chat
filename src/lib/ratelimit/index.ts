import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import type { RateLimitInfo } from "@/lib/types";

const redis = Redis.fromEnv();
const REDIS_KEY = "gemini-flash-free";

// Create rate limiter for free Gemini 2.5 Flash
// 5 requests per day per user
export const geminiFlashRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "1 d"),
  analytics: true,
  prefix: REDIS_KEY,
});

export async function getGeminiFlashRateLimitStatus(
  userId: string,
): Promise<RateLimitInfo> {
  try {
    const result = await geminiFlashRateLimit.getRemaining(userId);
    return {
      remaining: result.remaining,
      reset: result.reset,
      limit: 5,
    };
  } catch (error) {
    console.error("Rate limit status check failed:", error);
    return {
      remaining: 5,
      reset: Date.now() + 24 * 60 * 60 * 1000,
      limit: 5,
    };
  }
}
