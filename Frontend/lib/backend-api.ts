import axios from "axios";
import { authClient } from "./auth-client";

// This module centralizes backend auth token lifecycle so components never
// duplicate refresh/bootstrap logic and API behavior remains consistent.

const rawBackendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL;
const backendBaseUrl =
  rawBackendUrl && rawBackendUrl.trim().length > 0
    ? rawBackendUrl.trim()
    : "http://localhost:8000";

const refreshThresholdRaw =
  process.env.NEXT_PUBLIC_ACCESS_TOKEN_REFRESH_THRESHOLD_SECONDS;
const parsedRefreshThreshold = Number.parseInt(
  refreshThresholdRaw ?? "120",
  10,
);
const refreshThresholdSeconds =
  Number.isFinite(parsedRefreshThreshold) && parsedRefreshThreshold >= 0
    ? parsedRefreshThreshold
    : 120;
// Refresh-before-expiry buffer reduces race conditions where requests leave
// with tokens that expire while in flight.

type RefreshResponse = {
  accessToken?: string;
  expiresIn?: number;
};

let backendAccessToken: string | null = null;
let backendAccessTokenExpiresAtMs: number | null = null;
let refreshInFlight: Promise<string | null> | null = null;
let bootstrapInFlight: Promise<boolean> | null = null;
let lastForcedSignInRedirectAtMs = 0;

const authTransport = axios.create({
  baseURL: backendBaseUrl,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

function decodeTokenExpMs(token: string): number | null {
  try {
    const tokenParts = token.split(".");
    if (tokenParts.length < 2) return null;
    const payload = JSON.parse(atob(tokenParts[1]));
    if (typeof payload?.exp !== "number") return null;
    return payload.exp * 1000;
  } catch {
    return null;
  }
}

function setBackendAccessToken(token: string, expiresIn?: number): void {
  backendAccessToken = token;

  if (
    typeof expiresIn === "number" &&
    Number.isFinite(expiresIn) &&
    expiresIn > 0
  ) {
    backendAccessTokenExpiresAtMs = Date.now() + expiresIn * 1000;
    return;
  }

  backendAccessTokenExpiresAtMs = decodeTokenExpMs(token);
}

export function clearBackendAccessToken(): void {
  backendAccessToken = null;
  backendAccessTokenExpiresAtMs = null;
}

export function getBackendAccessTokenExpiryMs(): number | null {
  return backendAccessTokenExpiresAtMs;
}

function isBackendAccessTokenStale(): boolean {
  if (!backendAccessToken || !backendAccessTokenExpiresAtMs) {
    return true;
  }
  const thresholdMs = refreshThresholdSeconds * 1000;
  // Proactive staleness check avoids burst failures from multiple concurrent
  // requests all discovering expiry at the same moment.
  return backendAccessTokenExpiresAtMs - Date.now() <= thresholdMs;
}

async function getBetterAuthJwtToken(): Promise<string | null> {
  // Try to get token from jwtClient plugin
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
      // Token endpoint failed; continue to session fallback.
    }
  }

  // Fallback: get session and extract token
  try {
    const session = await authClient.getSession();
    if (session?.data) {
      const sessionData = session.data as unknown;
      if (typeof sessionData === "object" && sessionData !== null) {
        const dataShape = sessionData as {
          token?: unknown;
          session?: { token?: unknown };
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

async function requestAccessTokenRefresh(): Promise<string | null> {
  try {
    const response = await authTransport.post<RefreshResponse>(
      "/auth/refresh",
      {},
    );
    const accessToken = response.data?.accessToken;
    if (typeof accessToken !== "string" || accessToken.length === 0) {
      clearBackendAccessToken();
      return null;
    }

    setBackendAccessToken(accessToken, response.data?.expiresIn);
    return accessToken;
  } catch {
    clearBackendAccessToken();
    return null;
  }
}

export async function refreshBackendAccessToken(): Promise<string | null> {
  if (refreshInFlight) {
    // Coalescing refresh calls prevents duplicate refresh attempts from racing
    // and overwriting each other's token state.
    return refreshInFlight;
  }

  refreshInFlight = (async () => {
    return requestAccessTokenRefresh();
  })();

  try {
    return await refreshInFlight;
  } finally {
    refreshInFlight = null;
  }
}

async function issueRefreshTokenFromSession(): Promise<string | null> {
  const betterAuthToken = await getBetterAuthJwtToken();
  if (!betterAuthToken) {
    return null;
  }

  try {
    const response = await authTransport.post<RefreshResponse>(
      "/auth/generate-refresh-token",
      {},
      {
        headers: {
          Authorization: `Bearer ${betterAuthToken}`,
        },
      },
    );

    const accessToken = response.data?.accessToken;
    if (typeof accessToken !== "string" || accessToken.length === 0) {
      return null;
    }

    setBackendAccessToken(accessToken, response.data?.expiresIn);
    return accessToken;
  } catch {
    return null;
  }
}

export async function initializeBackendAuthSession(): Promise<boolean> {
  if (!isBackendAccessTokenStale()) {
    return true;
  }

  if (bootstrapInFlight) {
    // Collapse concurrent callers into one bootstrap request to prevent
    // auth stampedes during app startup or tab visibility changes.
    return bootstrapInFlight;
  }

  bootstrapInFlight = (async () => {
    const refreshed = await refreshBackendAccessToken();
    if (refreshed) {
      return true;
    }

    const issued = await issueRefreshTokenFromSession();
    return Boolean(issued);
  })();

  try {
    return await bootstrapInFlight;
  } finally {
    bootstrapInFlight = null;
  }
}

function isSharedRoute(url: string): boolean {
  return url.startsWith("/shared/");
}

function isAuthRoute(url: string): boolean {
  return url.startsWith("/auth/");
}

function isProtectedRouteForAuthRecovery(url: string): boolean {
  return !isSharedRoute(url) && !isAuthRoute(url);
}

async function hasBetterAuthSession(): Promise<boolean> {
  try {
    const session = await authClient.getSession();
    return Boolean(session?.data);
  } catch {
    return false;
  }
}

async function redirectToSignInIfSessionMissing(reason: string): Promise<void> {
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

  const sessionExists = await hasBetterAuthSession();
  if (sessionExists) {
    // When Better Auth session is still valid, backend token sync may just be
    // transiently unavailable. Avoid kicking users out repeatedly.
    console.warn(
      "Skipped sign-in redirect because Better Auth session exists:",
      reason,
    );
    return;
  }

  lastForcedSignInRedirectAtMs = now;
  window.location.href = "/sign-in";
}

const backendApi = axios.create({
  baseURL: backendBaseUrl,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

backendApi.interceptors.request.use(
  async (config) => {
    try {
      const requestUrl = `${config.url ?? ""}`;

      if (!isSharedRoute(requestUrl) && isBackendAccessTokenStale()) {
        // Public share routes should stay accessible even when user session
        // recovery fails, so we skip forced auth bootstrap there.
        await initializeBackendAuthSession();
      }

      if (!isBackendAccessTokenStale() && backendAccessToken) {
        config.headers = config.headers ?? {};
        const headers = config.headers as Record<string, unknown>;
        headers.Authorization = `Bearer ${backendAccessToken}`;
      }
    } catch (error) {
      console.warn("Auth token bootstrap warning:", error);
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
    if (error.response?.status === 401 && axios.isAxiosError(error)) {
      const originalRequest = error.config as typeof error.config & {
        _authRetried?: boolean;
      };

      const requestUrl = `${originalRequest?.url ?? ""}`;
      const canRetry =
        Boolean(originalRequest) && !originalRequest?._authRetried;
      const isRefreshEndpoint = requestUrl.startsWith("/auth/refresh");
      const isGenerateEndpoint = requestUrl.startsWith(
        "/auth/generate-refresh-token",
      );

      if (
        canRetry &&
        !isRefreshEndpoint &&
        !isGenerateEndpoint &&
        isProtectedRouteForAuthRecovery(requestUrl)
      ) {
        originalRequest._authRetried = true;

        let retryToken = await refreshBackendAccessToken();

        // If cookie-refresh is unavailable (first load/new tab), try issuing from active Better Auth session.
        if (!retryToken) {
          const bootstrapped = await initializeBackendAuthSession();
          if (
            bootstrapped &&
            backendAccessToken &&
            !isBackendAccessTokenStale()
          ) {
            retryToken = backendAccessToken;
          }
        }

        if (retryToken) {
          // Retrying once after successful recovery keeps UX smooth without
          // creating infinite loops on persistent auth failures.
          originalRequest.headers = originalRequest.headers ?? {};
          const headers = originalRequest.headers as Record<string, unknown>;
          headers.Authorization = `Bearer ${retryToken}`;
          return backendApi(originalRequest);
        }

        clearBackendAccessToken();
        await redirectToSignInIfSessionMissing("backend 401 after retry");
      }

      // If we already retried and still received 401 on a protected route,
      // force sign-in to prevent stale UI state (e.g. showing Subscribe by fallback).
      if (
        !canRetry &&
        isProtectedRouteForAuthRecovery(requestUrl) &&
        typeof window !== "undefined"
      ) {
        clearBackendAccessToken();
        await redirectToSignInIfSessionMissing(
          "backend 401 after exhausted recovery",
        );
      }

      const detail = `${error.response?.data?.detail || error.message}`;
      const expectedAuthExpiry =
        detail.toLowerCase().includes("expired") ||
        detail.toLowerCase().includes("not authorized") ||
        detail.toLowerCase().includes("unauthorized");

      if (expectedAuthExpiry) {
        console.warn(
          "Auth session expired; recovery/redirect applied.",
          detail,
        );
      } else {
        console.error("❌ Unauthorized - token invalid/expired", detail);
      }
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
