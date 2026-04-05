"use client";

import { useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import {
  getBackendAccessTokenExpiryMs,
  initializeBackendAuthSession,
  refreshBackendAccessToken,
} from "@/lib/backend-api";

/**
 * Keeps backend API access tokens fresh.
 * Redirects to sign-in only when refresh and session recovery both fail.
 */
export default function TokenExpiryMonitor() {
  const router = useRouter();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const scheduleRefreshRef = useRef<() => void>(() => {});

  const refreshThresholdRaw =
    process.env.NEXT_PUBLIC_ACCESS_TOKEN_REFRESH_THRESHOLD_SECONDS;
  const parsedThreshold = Number.parseInt(refreshThresholdRaw ?? "120", 10);
  const refreshThresholdMs =
    Number.isFinite(parsedThreshold) && parsedThreshold >= 0
      ? parsedThreshold * 1000
      : 120000;

  const clearExistingTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const redirectToSignIn = useCallback(() => {
    router.push("/sign-in");
    router.refresh();
  }, [router]);

  const ensureSessionOrRedirect = useCallback(async () => {
    try {
      const session = await authClient.getSession();
      if (!session?.data) {
        redirectToSignIn();
        return false;
      }
      return true;
    } catch {
      redirectToSignIn();
      return false;
    }
  }, [redirectToSignIn]);

  const scheduleRefresh = useCallback(() => {
    clearExistingTimeout();

    const tokenExpiryMs = getBackendAccessTokenExpiryMs();
    if (!tokenExpiryMs) {
      return;
    }

    const msUntilRefresh = Math.max(
      tokenExpiryMs - Date.now() - refreshThresholdMs,
      0,
    );
    timeoutRef.current = setTimeout(async () => {
      const refreshed = await refreshBackendAccessToken();
      if (refreshed) {
        scheduleRefreshRef.current();
        return;
      }

      const recovered = await initializeBackendAuthSession();
      if (recovered) {
        scheduleRefreshRef.current();
        return;
      }

      await ensureSessionOrRedirect();
    }, msUntilRefresh);
  }, [clearExistingTimeout, ensureSessionOrRedirect, refreshThresholdMs]);

  useEffect(() => {
    scheduleRefreshRef.current = scheduleRefresh;
  }, [scheduleRefresh]);

  useEffect(() => {
    const start = async () => {
      const initialized = await initializeBackendAuthSession();
      if (initialized) {
        scheduleRefresh();
        return;
      }

      await ensureSessionOrRedirect();
    };

    start();

    const onVisibilityChange = async () => {
      if (document.visibilityState !== "visible") {
        return;
      }

      if (!getBackendAccessTokenExpiryMs()) {
        const initialized = await initializeBackendAuthSession();
        if (!initialized) {
          await ensureSessionOrRedirect();
          return;
        }
      }

      scheduleRefresh();
    };

    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      clearExistingTimeout();
    };
  }, [clearExistingTimeout, ensureSessionOrRedirect, scheduleRefresh]);

  return null;
}
