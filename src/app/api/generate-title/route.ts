import { NextRequest, NextResponse } from "next/server";
import { generateText } from "ai";
import { openrouter } from "@openrouter/ai-sdk-provider";
import { getUser } from "@/lib/auth/get-user";
import { db } from "@/lib/db";
import { chats } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      throw new Error("Unauthorized");
    }

    const { chatId, prompt } = await request.json();

    const response = await generateText({
      model: openrouter("google/gemini-2.5-flash-preview-05-20"),
      prompt: `
        Your job is to create concise, descriptive titles for chat conversations based on the user's first message. 
        
        <rules>
        - Generate titles that are 5-6 words maximum
        - Make titles descriptive and specific to the topic
        - Use clear, professional language
        - Avoid generic titles like "Chat" or "Conversation"
        - Focus on the main subject or task being discussed
        - Use title case formatting
        - Do not include quotation marks or special formatting
        </rules>

        <examples>
        - "React Component State Management Help"
        - "Python Data Analysis Tutorial"
        - "Database Schema Design Discussion"
        - "API Integration Troubleshooting"
        </examples>

        <user_message>
        ${prompt}
        </user_message>

        Generate and return only the title text, nothing else.
        `,
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
