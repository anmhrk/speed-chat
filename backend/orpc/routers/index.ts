import { chatRouter } from './chat';
import { chatActionsRouter } from './chat-actions';
import { chatStreamRouter } from './chat-stream';

export const appRouter = {
  chatRouter,
  chatStreamRouter,
  chatActionsRouter,
};
