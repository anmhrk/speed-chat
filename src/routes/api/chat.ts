// import { createAPIFileRoute } from "@tanstack/react-start/api";
// import { generateText, streamText } from "ai";
// import { createOpenAI } from "@ai-sdk/openai";
// import { createAnthropic } from "@ai-sdk/anthropic";
// import { checkGeminiFlashRateLimit } from "../../backend/ratelimit";
// import type { ChatRequest } from "@/lib/types";

// export const APIRoute = createAPIFileRoute("/api/chat")({
//   POST: async ({ request }) => {
//     try {
//       const body: ChatRequest = await request.json();
//       const { messages, model, apiKeys, userId } = body;

//       // Check if this is a free Gemini 2.5 Flash request
//       const isFreeGeminiFlash =
//         model === "gemini-2.5-flash" && !apiKeys?.openrouter;

//       if (isFreeGeminiFlash) {
//         // Get identifier for rate limiting (user ID if authenticated, IP if not)
//         const identifier = userId || getClientIP(request);

//         // Check rate limit
//         const rateLimitResult = await checkGeminiFlashRateLimit(identifier);

//         if (!rateLimitResult.success) {
//           return Response.json(
//             {
//               error: "Rate limit exceeded",
//               rateLimitExceeded: true,
//               remaining: rateLimitResult.remaining,
//               reset: rateLimitResult.reset,
//               limit: rateLimitResult.limit,
//             },
//             { status: 429 },
//           );
//         }

//         // Create OpenRouter provider for free Gemini 2.5 Flash
//         const openrouter = createOpenAI({
//           baseURL: "https://openrouter.ai/api/v1",
//           apiKey: process.env.OPENROUTER_API_KEY!,
//           headers: {
//             "HTTP-Referer": process.env.SITE_URL || "http://localhost:3000",
//             "X-Title": "Speed Chat",
//           },
//         });

//         const { text, usage } = await generateText({
//           model: openrouter("google/gemini-2.0-flash-exp"),
//           messages: [
//             {
//               role: "user",
//               content: message,
//             },
//           ],
//         });

//         return Response.json({
//           message: text,
//           usage,
//           rateLimitInfo: {
//             remaining: rateLimitResult.remaining - 1, // Subtract 1 since we consumed one
//             reset: rateLimitResult.reset,
//             limit: rateLimitResult.limit,
//           },
//         });
//       }

//       // Handle paid model requests with user's API keys
//       const modelConfig = getModelConfig(model);
//       if (!modelConfig) {
//         return Response.json({ error: "Invalid model" }, { status: 400 });
//       }

//       const apiKey = apiKeys[modelConfig.provider];
//       if (!apiKey) {
//         return Response.json(
//           { error: `API key required for ${modelConfig.provider}` },
//           { status: 400 },
//         );
//       }

//       // Create AI SDK provider with user's API key
//       const aiProvider = createAIProvider(modelConfig, apiKey);

//       const { text, usage } = await generateText({
//         model: aiProvider,
//         messages: [
//           {
//             role: "user",
//             content: message,
//           },
//         ],
//       });

//       return Response.json({
//         message: text,
//         usage,
//       });
//     } catch (error) {
//       console.error("Chat API error:", error);
//       return Response.json({ error: "Internal server error" }, { status: 500 });
//     }
//   },
// });

// function getClientIP(request: Request): string {
//   // Try to get IP from various headers
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

//   // Fallback
//   return "unknown";
// }

// function getModelConfig(modelId: string) {
//   const modelMap: Record<string, { provider: string; aiModel: string }> = {
//     "gpt-4.1": {
//       provider: "openai",
//       aiModel: "gpt-4-turbo",
//     },
//     "claude-4-sonnet": {
//       provider: "anthropic",
//       aiModel: "claude-3-5-sonnet-20241022",
//     },
//     "claude-4-opus": {
//       provider: "anthropic",
//       aiModel: "claude-3-opus-20240229",
//     },
//     "gemini-2.5-pro": {
//       provider: "openrouter",
//       aiModel: "google/gemini-2.0-flash-exp",
//     },
//     "o4-mini": {
//       provider: "openai",
//       aiModel: "gpt-4o-mini",
//     },
//     o3: {
//       provider: "openai",
//       aiModel: "o3-mini",
//     },
//   };

//   return modelMap[modelId];
// }

// function createAIProvider(
//   config: { provider: string; aiModel: string },
//   apiKey: string,
// ) {
//   switch (config.provider) {
//     case "openai":
//       const openaiProvider = createOpenAI({ apiKey });
//       return openaiProvider(config.aiModel as any);

//     case "anthropic":
//       const anthropicProvider = createAnthropic({ apiKey });
//       return anthropicProvider(config.aiModel as any);

//     case "openrouter":
//       const openrouterProvider = createOpenAI({
//         baseURL: "https://openrouter.ai/api/v1",
//         apiKey,
//         headers: {
//           "HTTP-Referer": process.env.SITE_URL || "http://localhost:3000",
//           "X-Title": "Speed Chat",
//         },
//       });
//       return openrouterProvider(config.aiModel as any);

//     default:
//       throw new Error(`Unsupported provider: ${config.provider}`);
//   }
// }
