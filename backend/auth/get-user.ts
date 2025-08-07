import { headers } from 'next/headers';
import { auth } from '.';

export async function getUser() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return session?.user ?? null;
}
