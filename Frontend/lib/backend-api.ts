import axios from "axios";
import { authClient } from "./auth-client";

const rawBackendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL;
const backendBaseUrl =
  rawBackendUrl && rawBackendUrl.trim().length > 0
    ? rawBackendUrl.trim()
    : "http://localhost:8000";

let lastForcedSignInRedirectAtMs = 0;
async function getBetterAuthJwtToken(): Promise<string | null> {
  type TokenPluginResponse = { data?: { token?: unknown } } | null | undefined;
  const authClientWithToken = authClient as unknown as {
    token?: () => Promise<TokenPluginResponse>;
  };

  if (typeof authClientWithToken.token === "function") {
    try {
      const tokenResp = await authClientWithToken.token();
      const candidate = tokenResp?.data?.token;
      if (typeof candidate === "string" && candidate.length > 0) {
        return candidate;
      }
    } catch {
      // Token endpoint failed, try fallback.
    }
  }

  try {
    const session = await authClient.getSession();
    if (session?.data) {
      const sessionData = session.data as unknown;
      if (typeof sessionData === "object" && sessionData !== null) {
        const dataShape = sessionData as {
          token?: unknown;
          session?: { token?: unknown };
          user?: { id?: string };
        };
        if (typeof dataShape.token === "string") {
          return dataShape.token;
        }
        if (typeof dataShape.session?.token === "string") {
          return dataShape.session.token;
        }
      }
    }
  } catch {
    // Session retrieval failed.
  }

  return null;
}

const backendApi = axios.create({
  baseURL: backendBaseUrl,
  headers: {
    "Content-Type": "application/json",
  },
});

async function redirectToSignInIfSessionMissing(): Promise<void> {
  if (
    typeof window === "undefined" ||
    window.location.pathname === "/sign-in"
  ) {
    return;
  }

  const now = Date.now();
  if (now - lastForcedSignInRedirectAtMs < 5000) {
    return;
  }

  try {
    const session = await authClient.getSession();
    if (session?.data) {
      return;
    }
  } catch {
    // If session probe fails, keep current page and wait for next request.
    return;
  }

  lastForcedSignInRedirectAtMs = now;
  window.location.href = "/sign-in";
}

backendApi.interceptors.request.use(
  async (config) => {
    try {
      const token = await getBetterAuthJwtToken();
      if (token) {
        config.headers = config.headers ?? {};
        const headers = config.headers as Record<string, unknown>;
        headers.Authorization = `Bearer ${token}`;
      } else {
        console.debug("⚠️ No auth token available for request");
      }
    } catch (error) {
      console.error("❌ Error getting auth token:", error);
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

backendApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      console.error(
        "❌ Unauthorized - token invalid/expired",
        error.response?.data?.detail || error.message,
      );
      await redirectToSignInIfSessionMissing();
    }

    if (axios.isAxiosError(error) && !error.response) {
      const details = {
        baseURL: backendApi.defaults.baseURL,
        url: error.config?.url,
        method: error.config?.method,
        code: error.code,
        message: error.message,
      };
      console.error("❌ Network/CORS error reaching backend", details);
    }

    return Promise.reject(error);
  },
);

export default backendApi;
