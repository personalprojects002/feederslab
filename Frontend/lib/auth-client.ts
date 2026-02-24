import { createAuthClient } from "better-auth/react";
import { magicLinkClient, jwtClient } from "better-auth/client/plugins";
const getBaseURL = () => {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3000";
};

export const authClient = createAuthClient({
  baseURL: getBaseURL(),
  basePath: "/api/better-auth",
  plugins: [magicLinkClient(), jwtClient()],
  fetchOptions: {
    onError(e) {
      if (e.error.status === 429) {
        console.error("Rate limited");
      } else {
        console.error("Auth error:", e.error);
      }
    },
  },
});
