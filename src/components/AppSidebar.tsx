import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { ThreadSearchInput } from "@/components/ThreadSearchInput";
import { UserButton } from "@/components/UserButton";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@radix-ui/react-scroll-area";
import { Link } from "@tanstack/react-router";
import { useState } from "react";

const dummyThreads = [
  "Best phone to buy in 2025",
  "Best phone to buy in 2025",
  "Best AI model for coding",
  "Best AI model for coding",
];

export function AppSidebar() {
  const [search, setSearch] = useState("");

  return (
    <Sidebar>
      <SidebarHeader className="p-3">
        <div className="flex items-center">
          <SidebarTrigger />
          <Link to="/" className="flex-1 text-center text-lg font-semibold">
            Speed Chat
          </Link>
        </div>

        <div className="mt-4 space-y-4">
          <Button size="lg" className="w-full font-semibold">
            New Chat
          </Button>
          <ThreadSearchInput search={search} setSearch={setSearch} />
        </div>
      </SidebarHeader>

      <SidebarContent className="p-4">
        <ScrollArea className="h-[calc(100vh-10rem)]">
          {/* TODO: Sort threads by relative date later once db fetching is implemented */}
          <div className="space-y-2">
            {dummyThreads
              .filter((thread) =>
                thread.toLowerCase().includes(search.toLowerCase()),
              )
              .map((thread, index) => (
                <div
                  key={index}
                  className="hover:bg-muted flex cursor-pointer items-center rounded-lg p-2 text-sm"
                >
                  <span className="truncate">{thread}</span>
                </div>
              ))}
          </div>
        </ScrollArea>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <UserButton />
      </SidebarFooter>
    </Sidebar>
  );
}
