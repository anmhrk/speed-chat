"use client";

import { Chat } from "@/lib/db/schema";
import { useShape } from "@electric-sql/react";

export default function TestPage() {
  const { isLoading, data } = useShape<Chat>({
    url: `http://localhost:3000/api/shape-proxy`,
    params: {
      table: "chats",
    },
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      {data.map((d) => (
        <div key={d.id}>{d.title}</div>
      ))}
    </div>
  );
}
