"use server";

import { UTApi } from "uploadthing/server";

const utapi = new UTApi();

export async function deleteFiles(urls: string[]) {
  const keys = urls.map((url) => url.split("/f/")[1]);
  await utapi.deleteFiles(keys);
}

export async function uploadBase64Image(name: string, base64: string) {
  const file = new File([Buffer.from(base64, "base64")], name, {
    type: "image/png",
  });

  const uploadResponse = await utapi.uploadFiles(file);
  return uploadResponse.data?.ufsUrl;
}
