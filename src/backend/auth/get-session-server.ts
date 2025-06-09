import { createServerFn } from "@tanstack/react-start";
import { getHeaders } from "vinxi/http";
import { auth } from ".";

export const getSessionServer = createServerFn({ method: "GET" }).handler(
  async () => {
    const headerObj = getHeaders();
    const headers = new Headers();
    Object.entries(headerObj).forEach(([key, value]) => {
      if (value) {
        headers.set(key, value);
      }
    });

    const session = await auth.api.getSession({
      headers,
    });
    return session;
  },
);
