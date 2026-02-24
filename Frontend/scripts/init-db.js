import { Pool } from "pg";
import { config } from "dotenv";

// Load environment variables
config({ path: ".env.local" });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("DATABASE_URL environment variable is required");
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function initDatabase() {
  try {
    console.log("Initializing database tables for Better Auth...");

    // Drop existing tables if they have wrong schema
    await pool.query(`DROP TABLE IF EXISTS "session" CASCADE;`);
    await pool.query(`DROP TABLE IF EXISTS "account" CASCADE;`);
    await pool.query(`DROP TABLE IF EXISTS "verification" CASCADE;`);
    await pool.query(`DROP TABLE IF EXISTS "user" CASCADE;`);

    console.log("Dropped existing tables with incorrect schema...");

    // Create users table with all required columns
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "user" (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        "emailVerified" BOOLEAN DEFAULT FALSE,
        name TEXT,
        image TEXT,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "display_name" TEXT
      );
    `);

    // Create sessions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "session" (
        id TEXT PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "expiresAt" TIMESTAMP NOT NULL,
        token TEXT NOT NULL UNIQUE,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "ipAddress" TEXT,
        "userAgent" TEXT,
        FOREIGN KEY ("userId") REFERENCES "user"(id) ON DELETE CASCADE
      );
    `);

    // Create accounts table for social login
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "account" (
        id TEXT PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "accountId" TEXT NOT NULL,
        "providerId" TEXT NOT NULL,
        "accessToken" TEXT,
        "refreshToken" TEXT,
        "idToken" TEXT,
        "accessTokenExpiresAt" TIMESTAMP,
        "refreshTokenExpiresAt" TIMESTAMP,
        "scope" TEXT,
        password TEXT,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("userId") REFERENCES "user"(id) ON DELETE CASCADE
      );
    `);

    // Create verification table for magic links
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "verification" (
        id TEXT PRIMARY KEY,
        identifier TEXT NOT NULL,
        value TEXT NOT NULL,
        "expiresAt" TIMESTAMP NOT NULL,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create jwks table for JWT key storage
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "jwks" (
        id TEXT PRIMARY KEY,
        "publicKey" TEXT NOT NULL,
        "privateKey" TEXT NOT NULL,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log("✅ Database tables created successfully!");
  } catch (error) {
    console.error("❌ Error initializing database:", error);
  } finally {
    await pool.end();
  }
}

initDatabase();
