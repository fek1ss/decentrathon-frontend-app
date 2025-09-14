import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { DatabaseConfig } from '../types';

export const createConnection = (config: DatabaseConfig) => {
  const connectionString = `postgresql://${config.username}:${config.password}@${config.host}:${config.port}/${config.database}`;
  const client = postgres(connectionString);
  return drizzle(client);
};
