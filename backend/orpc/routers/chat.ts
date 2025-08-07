import { z } from 'zod';
import { protectedProcedure } from '../middleware';

export const chatRouter = {
  chat: protectedProcedure
    .input(
      z.object({
        message: z.string(),
      })
    )
    .handler(({ input, context }) => {
      console.log(context.user);
      return input.message;
    }),
};
