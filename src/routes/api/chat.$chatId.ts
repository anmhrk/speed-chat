import { createAPIFileRoute } from "@tanstack/react-start/api";
import { setResponseStatus } from "@tanstack/react-start/server";
import { authGuard } from "@/backend/auth/auth-guard";
import { db } from "@/backend/db";
import { chat } from "@/backend/db/schema/chat.schema";
import { eq, and } from "drizzle-orm";

export const APIRoute = createAPIFileRoute("/api/chat/$chatId")({
  POST: async ({ request, params }) => {
    try {
      const { chatId } = params;
      const { userId } = await request.json();

      const isAuthenticated = await authGuard();
      if (!isAuthenticated) {
        setResponseStatus(401);
        throw new Error("Unauthorized");
      }

      const chatData = await db
        .select()
        .from(chat)
        .where(and(eq(chat.id, chatId), eq(chat.userId, userId)))
        .limit(1);

      if (chatData.length === 0) {
        setResponseStatus(404);
        throw new Error("Chat not found");
      }

      return Response.json({ chat: chatData[0] });
    } catch (error) {
      console.error("[Chat API] Error fetching chat:", error);
      setResponseStatus(500);
      throw error;
    }
  },
});
