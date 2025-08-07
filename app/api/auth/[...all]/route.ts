import { toNextJsHandler } from 'better-auth/next-js';
import { auth } from '@/backend/auth';

export const { POST, GET } = toNextJsHandler(auth);
