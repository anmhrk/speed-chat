import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Create rate limiter for free Gemini 2.5 Flash usage
// 5 requests per day per identifier (IP or user ID)
export const geminiFlashRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "1 d"),
  analytics: true,
  prefix: "gemini-flash-free",
});

/**
 * Check if user/IP has exceeded rate limit for free Gemini 2.5 Flash usage
 * @param identifier - User ID (if authenticated) or IP address (if not)
 * @returns Promise with rate limit result
 */
export async function checkGeminiFlashRateLimit(identifier: string) {
  try {
    const result = await geminiFlashRateLimit.limit(identifier);
    return {
      success: result.success,
      remaining: result.remaining,
      reset: result.reset,
      limit: result.limit,
    };
  } catch (error) {
    console.error("Rate limit check failed:", error);
    // Fail open - allow request if rate limit check fails
    return {
      success: true,
      remaining: 5,
      reset: Date.now() + 24 * 60 * 60 * 1000, // 24 hours from now
      limit: 5,
    };
  }
}

/**
 * Get current rate limit status without consuming a request
 * @param identifier - User ID (if authenticated) or IP address (if not)
 */
export async function getGeminiFlashRateLimitStatus(identifier: string) {
  try {
    // Use a separate key to check status without consuming
    const statusKey = `gemini-flash-free:${identifier}`;
    const current = await redis.get(statusKey);

    if (!current) {
      return {
        remaining: 5,
        reset: Date.now() + 24 * 60 * 60 * 1000,
        limit: 5,
      };
    }

    // Parse the stored data to get remaining count
    const data = JSON.parse(current as string);
    return {
      remaining: Math.max(0, 5 - data.count),
      reset: data.reset,
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
