import { ShapeStream, Shape } from "@electric-sql/client";
import { useMemo, useEffect, useState } from "react";
import { env } from "@/lib/env";
import type { User } from "better-auth";
import type { Memory } from "@/lib/db/schema";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface UseMemoriesProps {
  user: User | null;
}

export function useMemories({ user }: UseMemoriesProps) {
  const router = useRouter();
  const [rawMemories, setRawMemories] = useState<Memory[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!user?.id) {
      setRawMemories([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const memoryStream = new ShapeStream<Memory>({
      url: `${env.NEXT_PUBLIC_SITE_URL}/api/shape-proxy`,
      params: {
        table: "memories",
        where: `user_id = '${user.id}'`,
      },
      onError: (error) => {
        console.error("Error loading memories:", error);
        toast.error("Error loading memories");
        setIsLoading(false);
      },
    });

    const memoryShape = new Shape(memoryStream);

    const unsubscribe = memoryShape.subscribe(({ rows }) => {
      setRawMemories(rows || []);
      setIsLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [user?.id, router]);

  const sortedMemories = useMemo(() => {
    return rawMemories.sort((a, b) => {
      return (
        // @ts-expect-error - created_at is not typed in the schema
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    });
  }, [rawMemories]);

  return {
    memories: sortedMemories,
    isLoading,
  };
}
