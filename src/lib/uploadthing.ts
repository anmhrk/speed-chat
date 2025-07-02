"use server";

import { UTApi } from "uploadthing/server";

const utapi = new UTApi();

export async function deleteFiles(urls: string[]) {
  const keys = urls.map((url) => url.split("/f/")[1]);
  await utapi.deleteFiles(keys);
}
