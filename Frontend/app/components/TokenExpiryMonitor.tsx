'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';

/**
 * Component that monitors JWT token expiration and redirects to sign-in when expired
 * For the 2-minute demo: Forces redirect after token expires
 */
export default function TokenExpiryMonitor() {
  const router = useRouter();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [checkedOnce, setCheckedOnce] = useState(false);

  const checkAndScheduleRedirect = () => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Get the JWT token to check its expiration
    const checkToken = async () => {
      let token: string | undefined;

      type TokenPluginResponse = { data?: { token?: unknown } } | null | undefined;
      const authClientWithToken = authClient as unknown as {
        token?: () => Promise<TokenPluginResponse>;
      };

      if (typeof authClientWithToken.token === 'function') {
        try {
          const tokenResp = await authClientWithToken.token();
          const candidate = tokenResp?.data?.token;
          if (typeof candidate === 'string') token = candidate;
        } catch (error) {
          console.error('Error getting token:', error);
        }
      }

      if (!token) {
        // If no token, try to get session to see if user is logged in
        try {
          const session = await authClient.getSession();
          if (!session) {
            // User not logged in, redirect to sign in
            console.log('No active session, redirecting to sign in...');
            router.push('/auth/signin');
            router.refresh();
            return;
          }
        } catch (error) {
          console.error('Error getting session:', error);
        }
        return;
      }

      try {
        // Decode the JWT token to get expiration time
        const payload = JSON.parse(atob(token.split('.')[1]));
        const exp = payload.exp; // Expiration time in seconds
        const now = Math.floor(Date.now() / 1000); // Current time in seconds

        if (exp) {
          const timeUntilExpiry = (exp - now) * 1000; // Convert to milliseconds

          console.log(`Token expires in ${timeUntilExpiry / 1000} seconds`);

          if (timeUntilExpiry <= 0) {
            // Token already expired, redirect immediately
            console.log('Token expired, redirecting to sign in...');
            router.push('/auth/signin');
            router.refresh();
          } else {
            // Schedule redirect for when token expires
            console.log(`Scheduling redirect in ${timeUntilExpiry / 1000} seconds...`);

            timeoutRef.current = setTimeout(() => {
              console.log('Token expired (via timeout), redirecting to sign in...');
              router.push('/auth/signin');
              router.refresh();
            }, timeUntilExpiry);
          }
        }
      } catch (error) {
        console.error('Error decoding token:', error);
        // If we can't decode the token, assume it's invalid and redirect
        router.push('/auth/signin');
        router.refresh();
      }
    };

    checkToken();
  };

  useEffect(() => {
    // Check token expiration immediately
    checkAndScheduleRedirect();
    setCheckedOnce(true);

    // Clean up on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [router]);

  // This component doesn't render anything, just manages token expiry
  return null;
}