import { createServerFn } from "@tanstack/react-start";
import { getGeminiFlashRateLimitStatus } from "./index";
import { getUser } from "../auth/get-user";

export const getRateLimitStatus = createServerFn({
  method: "GET",
}).handler(async () => {
  try {
    const user = await getUser();
    // const request = getWebRequest();

    // if (!request) {
    //   throw new Error("Request not available");
    // }

    // const identifier = user?.id ?? getClientIP(request);

    if (!user) {
      throw new Error("User not found");
    }

    const status = await getGeminiFlashRateLimitStatus(user.id);
    return status;
  } catch (error) {
    console.error("Rate limit status error:", error);
  }
});

// function getClientIP(request: Request): string {
//   const forwarded = request.headers.get("x-forwarded-for");
//   if (forwarded) {
//     return forwarded.split(",")[0].trim();
//   }

//   const realIP = request.headers.get("x-real-ip");
//   if (realIP) {
//     return realIP;
//   }

//   const cfConnectingIP = request.headers.get("cf-connecting-ip");
//   if (cfConnectingIP) {
//     return cfConnectingIP;
//   }

//   return "unknown";
// }
