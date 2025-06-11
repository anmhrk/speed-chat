import { createMiddleware } from "@tanstack/react-start";
import { getWebRequest, setResponseStatus } from "@tanstack/react-start/server";
import { auth } from ".";

export const authMiddleware = createMiddleware().server(async ({ next }) => {
  const request = getWebRequest();
  if (!request?.headers) {
    setResponseStatus(400);
    throw new Error("Bad Request");
  }

  const session = await auth.api.getSession({
    headers: request.headers,
    query: {
      disableCookieCache: true,
    },
  });

  if (!session) {
    setResponseStatus(401);
    throw new Error("Unauthorized");
  }

  return next();
});
