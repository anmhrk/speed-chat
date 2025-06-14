import { createAPIFileRoute } from "@tanstack/react-start/api";
import { setResponseStatus } from "@tanstack/react-start/server";
import { authGuard } from "@/lib/auth/auth-guard";
import { db } from "@/lib/db";
import { chat } from "@/lib/db/schema/chat.schema";
import { eq, desc } from "drizzle-orm";

export const APIRoute = createAPIFileRoute("/api/threads")({
  POST: async ({ request }) => {
    try {
      const { userId } = await request.json();

      const isAuthenticated = await authGuard();
      if (!isAuthenticated) {
        setResponseStatus(401);
        throw new Error("Unauthorized");
      }

      const threads = await db
        .select({
          id: chat.id,
          title: chat.title,
          createdAt: chat.createdAt,
          updatedAt: chat.updatedAt,
        })
        .from(chat)
        .where(eq(chat.userId, userId))
        .orderBy(desc(chat.updatedAt));

      return Response.json({ threads });
    } catch (error) {
      console.error("[Threads API] Error fetching threads:", error);
      setResponseStatus(500);
      throw error;
    }
  },
});
