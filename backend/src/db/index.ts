// connection to db
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
import { ENV } from '../config/env';

if (!ENV.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set in environment variables ');
}

// Personal Info
/**
 * Connection Pool -> a cache of database connections that are kept open and reused
 * 1) Opening/Closing connections is slow, reuse existing connections rather than
 * creating a new connection for each request
 * 2) Database limits concurrent connections, a pool manages a fixed number of connections and
 * shares them across requests, 
 * default : 10 connections
 */

// initialise PostgreSQL connection pool
const pool = new Pool({ connectionString: ENV.DATABASE_URL });

// show successful first connection
pool.on('connect', () => {
  console.log('DATABASE CONNECTED SUCCESSFULLY!');
});

// show errors when failed
pool.on('error', (err) => {
  console.log('DATABASE CONNECTION ERROR!: ', err);
});

export const db = drizzle({ client: pool, schema });
