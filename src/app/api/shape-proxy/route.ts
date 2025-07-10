import { NextRequest } from "next/server";
import { env } from "@/lib/env";
import { getUser } from "@/lib/auth/get-user";

export async function GET(request: NextRequest) {
  const user = await getUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const url = new URL(request.url);
  const originUrl = new URL(`${env.ELECTRIC_URL}/v1/shape`);

  url.searchParams.forEach((value, key) => {
    originUrl.searchParams.set(key, value);
  });

  originUrl.searchParams.set(`source_id`, env.ELECTRIC_SOURCE_ID);
  originUrl.searchParams.set(`source_secret`, env.ELECTRIC_SOURCE_SECRET);

  const headers = new Headers();
  const newRequest = new Request(originUrl.toString(), {
    method: `GET`,
    headers,
  });

  let resp = await fetch(newRequest);
  if (resp.headers.get(`content-encoding`)) {
    const headers = new Headers(resp.headers);
    headers.delete(`content-encoding`);
    headers.delete(`content-length`);
    resp = new Response(resp.body, {
      status: resp.status,
      statusText: resp.statusText,
      headers,
    });
  }
  return resp;
}
