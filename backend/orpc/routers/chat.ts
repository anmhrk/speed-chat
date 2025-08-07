import { protectedProcedure } from '../middleware';

export const chatRouter = {
  createChat: protectedProcedure,
  getChats: protectedProcedure,
  getMessages: protectedProcedure,
};
