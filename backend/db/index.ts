import { neon, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import ws from 'ws';
import { env } from '../env/server';
import * as schema from './schema';

neonConfig.webSocketConstructor = ws;
neonConfig.poolQueryViaFetch = true;

const sql = neon(env.DATABASE_URL);
export const db = drizzle({ client: sql, schema });
