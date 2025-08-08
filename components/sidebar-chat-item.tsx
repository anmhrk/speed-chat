import type { DbChat } from '@/backend/db/schema/chat';

export function SidebarChatItem({ chat }: { chat: DbChat }) {
  return <div>{chat.title}</div>;
}
