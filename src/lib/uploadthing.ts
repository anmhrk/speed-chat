"use server";

import { UTApi } from "uploadthing/server";

const utapi = new UTApi();

export async function deleteFiles(urls: string[]) {
  console.log("Deleting files", urls);
  const keys = urls.map((url) => url.split("/f/")[1]);
  console.log("Keys", keys);
  await utapi.deleteFiles(keys).then((res) => {
    console.log("Res", res);
    console.log("Res.success", res.success);
    console.log("Res.deletedCount", res.deletedCount);
  });
}
