import { createServerFn } from "@tanstack/react-start";
import { getWebRequest } from "@tanstack/react-start/server";
import { auth } from ".";

export const getUser = createServerFn({ method: "GET" }).handler(async () => {
  const request = getWebRequest();
  if (!request?.headers) {
    return null;
  }

  const session = await auth.api.getSession({
    headers: request.headers,
  });

  return session?.user;
});
