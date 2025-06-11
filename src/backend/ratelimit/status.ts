import { createServerFn } from "@tanstack/react-start";
import { getWebRequest } from "@tanstack/react-start/server";
import { getGeminiFlashRateLimitStatus } from "./index";

export const getRateLimitStatus = createServerFn({
  method: "GET",
}).handler(async () => {
  try {
    // Get identifier for rate limiting (user ID if authenticated, IP if not)
    // For now, we'll use IP since we don't have auth implemented yet
    const request = getWebRequest();
    if (!request) {
      throw new Error("Request not available");
    }
    const identifier = getClientIP(request);

    // Get current rate limit status without consuming a request
    const status = await getGeminiFlashRateLimitStatus(identifier);

    return status;
  } catch (error) {
    console.error("Rate limit status error:", error);
    throw new Error("Failed to get rate limit status");
  }
});

function getClientIP(request: Request): string {
  // Try to get IP from various headers
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  const realIP = request.headers.get("x-real-ip");
  if (realIP) {
    return realIP;
  }

  const cfConnectingIP = request.headers.get("cf-connecting-ip");
  if (cfConnectingIP) {
    return cfConnectingIP;
  }

  // Fallback
  return "unknown";
}
