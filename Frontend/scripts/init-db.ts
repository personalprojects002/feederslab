import { auth } from "@/lib/better-auth.server";

async function initializeDatabase() {
  try {
    console.log("Initializing Better Auth database tables...");
    // Better Auth automatically creates tables on first use
    // This just ensures the connection is working
    await auth.api.getSession({ headers: {} as any });
    console.log("✅ Database initialization complete");
  } catch (error) {
    console.error("❌ Database initialization error:", error);
    process.exit(1);
  }
}

initializeDatabase();
