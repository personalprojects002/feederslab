import { auth } from "@/lib/better-auth.server";
import { toNextJsHandler } from "better-auth/next-js";

// Catch-all export keeps Better Auth's handler as the single authority for all
// auth verbs/endpoints, reducing drift between route files.
export const { GET, POST } = toNextJsHandler(auth.handler);
