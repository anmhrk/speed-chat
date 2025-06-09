import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface ThreadSearchInputProps {
  search: string;
  setSearch: (search: string) => void;
}

export function ThreadSearchInput({
  search,
  setSearch,
}: ThreadSearchInputProps) {
  return (
    <div className="relative mt-4">
      <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
      <Input
        placeholder="Search your threads..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="rounded-none border-0 border-b pl-9 focus-visible:ring-0 focus-visible:ring-offset-0"
      />
    </div>
  );
}
