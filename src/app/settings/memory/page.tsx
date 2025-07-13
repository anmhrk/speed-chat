import { MemoryPage } from "@/components/memory-page";
import { getUser } from "@/lib/actions";

export default async function MemoryPageRoute() {
  const user = await getUser();

  return <MemoryPage user={user!} />;
}
