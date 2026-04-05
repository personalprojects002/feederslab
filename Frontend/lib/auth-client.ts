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
      const requestUrl =
        typeof e.request?.url === "string"
          ? e.request.url
          : e.request?.url?.toString() || "";
      const isSessionProbe = requestUrl.includes(
        "/api/better-auth/get-session",
      );

      // Only log actual errors, not expected failures
      if (e.error?.status === 429) {
        console.warn("Rate limited - please try again later");
      } else if (e.error?.status === 401) {
        // 401 is expected when not authenticated - don't log as error
        console.debug("Not authenticated");
      } else if (e.error?.status === 403) {
        // 403 is expected for permission denied - don't log as error
        console.debug("Permission denied");
      } else if (e.error?.status && e.error.status >= 500) {
        // During session probes, temporary auth/db outages are handled upstream.
        if (!isSessionProbe) {
          console.error("Server error:", e.error.status, e.error.message);
        }
      }
      // Silently ignore other errors (network timeouts, etc.)
    },
  },
});
