import { createServerFn } from "@tanstack/react-start";
import { getWebRequest } from "@tanstack/react-start/server";
import { auth } from ".";

export const authGuard = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const request = getWebRequest();
    if (!request?.headers) {
      return false;
    }

    const session = await auth.api.getSession({
      headers: request.headers,
      query: {
        disableCookieCache: true,
      },
    });

    if (!session) {
      return false;
    }

    return true;
  } catch (error) {
    throw error;
  }
});
