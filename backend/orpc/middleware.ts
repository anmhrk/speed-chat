import { ORPCError, os } from '@orpc/server';
import type { User } from 'better-auth';
import type { db } from '../db';

type Context = {
  user: User | null;
  db: typeof db;
};

const o = os.$context<Context>();

export const publicProcedure = o;

const requireAuth = o.middleware(({ context, next }) => {
  if (!context.user) {
    throw new ORPCError('UNAUTHORIZED');
  }

  return next({
    context: {
      user: context.user,
      db: context.db,
    },
  });
});

export const protectedProcedure = publicProcedure.use(requireAuth);
