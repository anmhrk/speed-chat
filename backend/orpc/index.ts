import { createORPCClient } from '@orpc/client';
import { RPCLink } from '@orpc/client/fetch';
import type { RouterClient } from '@orpc/server';
import { createRouterUtils } from '@orpc/tanstack-query';
import { env } from '../env/client';
import type { appRouter } from './routers';

declare global {
  var $client: RouterClient<typeof appRouter> | undefined;
}

const link = new RPCLink({
  url: `${env.NEXT_PUBLIC_BASE_URL}/rpc`,
});

export const client: RouterClient<typeof appRouter> =
  globalThis.$client ?? createORPCClient(link);

export const orpc = createRouterUtils(client);
