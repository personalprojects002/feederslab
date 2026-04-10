"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
const SESSION_CHECK_INTERVAL_MS = 60_000;

/**
 * Lightweight monitor for expiring Better Auth sessions in dashboard screens.
 */
export default function TokenExpiryMonitor() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let cancelled = false;

    const verifySession = async () => {
      if (pathname === "/sign-in") {
        return;
      }

      try {
        const session = await authClient.getSession();
        if (!cancelled && !session?.data) {
          router.push("/sign-in");
          router.refresh();
        }
      } catch {
        // Ignore transient errors and retry on next interval.
      }
    };

    verifySession();
    const intervalId = window.setInterval(
      verifySession,
      SESSION_CHECK_INTERVAL_MS,
    );

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [pathname, router]);

  return null;
}
