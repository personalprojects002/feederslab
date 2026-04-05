import { Pool } from "pg";

const databaseUrl = process.env.DATABASE_URL?.toString()?.trim();

if (!databaseUrl) {
  throw new Error('Invalid/Missing environment variable: "DATABASE_URL"');
}

const connectionString: string = databaseUrl;

let pool: Pool;
let poolPromise: Promise<Pool>;

declare global {
  // Global caching is used only in development so Next.js hot-reload does not
  // create a new connection pool on every file save.
  var _pgPool: Pool | undefined;
  var _pgPoolPromise: Promise<Pool> | undefined;
}

if (process.env.NODE_ENV === "development") {
  const globalWithPg = global as typeof global & {
    _pgPool?: Pool;
    _pgPoolPromise?: Promise<Pool>;
  };

  if (!globalWithPg._pgPool) {
    pool = new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false,
      },
      // Lower dev cap keeps local resource usage predictable while still
      // supporting concurrent page/API activity during development.
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 60000,
      query_timeout: 60000,
    });

    globalWithPg._pgPool = pool;
    globalWithPg._pgPoolPromise = Promise.resolve(pool);
  }

  pool = globalWithPg._pgPool;
  poolPromise = globalWithPg._pgPoolPromise!;
} else {
  pool = new Pool({
    connectionString,
    ssl: {
      rejectUnauthorized: false,
    },
    // Production allows higher concurrency because multiple requests can hit
    // server actions and API routes at the same time.
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 60000,
    query_timeout: 60000,
  });

  poolPromise = Promise.resolve(pool);
}

export { pool, poolPromise };
export default poolPromise;
