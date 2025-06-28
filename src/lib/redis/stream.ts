import { get, set } from ".";

export async function loadStreams(chatId: string): Promise<string[]> {
  const data = await get(chatId);
  if (!data || typeof data !== "string") {
    return [];
  }
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export async function saveStreamId(chatId: string, streamId: string) {
  const existingStreamIds = await loadStreams(chatId);
  existingStreamIds.push(streamId);
  await set(chatId, JSON.stringify(existingStreamIds));
}
