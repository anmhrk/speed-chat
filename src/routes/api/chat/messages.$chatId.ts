import { createAPIFileRoute } from "@tanstack/react-start/api";
import { authGuard } from "@/lib/auth/auth-guard";
import { db } from "@/lib/db";
import { chat } from "@/lib/db/schema/chat.schema";
import { eq, and } from "drizzle-orm";

export const APIRoute = createAPIFileRoute("/api/chat/messages/$chatId")({
  POST: async ({ request, params }) => {
    try {
      const { chatId } = params;
      const { userId } = (await request.json()) as { userId: string };

      const isAuthenticated = await authGuard();
      if (!isAuthenticated) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
      }

      const chatData = await db
        .select()
        .from(chat)
        .where(and(eq(chat.id, chatId), eq(chat.userId, userId)))
        .limit(1);

      if (chatData.length === 0) {
        return Response.json({ error: "Chat not found" }, { status: 404 });
      }

      if (chatData[0].userId !== userId) {
        return Response.json(
          { error: "You are not authorized to access this chat" },
          { status: 403 },
        );
      }

      return Response.json({ messages: chatData[0].messages });
    } catch (error) {
      console.error("[Messages API] Error fetching messages:", error);
      return Response.json({ error: "Internal server error" }, { status: 500 });
    }
  },
});
