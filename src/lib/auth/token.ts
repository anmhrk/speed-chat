'use server';

import { getToken } from '@convex-dev/better-auth/nextjs';
import { createAuth } from './index';

export async function getAuthToken() {
  return await getToken(createAuth);
}
