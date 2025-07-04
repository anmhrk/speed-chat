import { NextRequest, NextResponse } from "next/server";
import { generateText } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { getUser } from "@/lib/auth/get-user";
import { db } from "@/lib/db";
import { chats } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { TitleRequest } from "@/lib/types";
import { titleGenerationPrompt } from "@/lib/prompts";

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      throw new Error("Unauthorized");
    }

    const { chatId, prompt, apiKeys }: TitleRequest = await request.json();

    const openrouter = createOpenRouter({
      apiKey: apiKeys.openrouter ?? process.env.OPENROUTER_API_KEY,
    });

    const response = await generateText({
      model: openrouter("google/gemini-2.5-flash-lite-preview-06-17"),
      prompt: titleGenerationPrompt(prompt),
    });

    await db
      .update(chats)
      .set({
        title: response.text,
      })
      .where(eq(chats.id, chatId));

    return NextResponse.json({
      title: response.text,
      success: true,
    });
  } catch (error) {
    console.error("[Generate Title API] Error:", error);
    throw error;
  }
}
