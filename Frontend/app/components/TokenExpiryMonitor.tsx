'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';

/**
 * Component that monitors JWT token expiration and handles automatic refresh or redirect to sign-in when expired
 */
export default function TokenExpiryMonitor() {
  const router = useRouter();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshAccessToken = async (): Promise<boolean> => {
    try {
      setIsRefreshing(true);

      // Get the refresh token from cookie or localStorage
      const refreshToken = document.cookie
        .split('; ')
        .find(row => row.startsWith('refresh_token='))
        ?.split('=')[1];

      if (!refreshToken) {
        console.log('No refresh token found, redirecting to sign in...');
        return false;
      }

      // Call the backend refresh endpoint
      const response = await fetch('http://localhost:8000/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        const newAccessToken = data.accessToken;

        // In a real app, you'd update the auth client with the new token
        // For now, we'll just log that the refresh was successful
        console.log('Token refreshed successfully');

        // Reset the expiration timer with the new token
        scheduleRedirect();
        return true;
      } else {
        console.log('Token refresh failed, redirecting to sign in...');
        return false;
      }
    } catch (error) {
      console.error('Error refreshing token:', error);
      return false;
    } finally {
      setIsRefreshing(false);
    }
  };

  const scheduleRedirect = async () => {
    try {
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Get the JWT token to check its expiration
      let token: string | undefined;

      type TokenPluginResponse = { data?: { token?: unknown } } | null | undefined;
      const authClientWithToken = authClient as unknown as {
        token?: () => Promise<TokenPluginResponse>;
      };

      if (typeof authClientWithToken.token === 'function') {
        const tokenResp = await authClientWithToken.token();
        const candidate = tokenResp?.data?.token;
        if (typeof candidate === 'string') token = candidate;
      }

      if (!token) {
        // If no token, try to get session to see if user is logged in
        const session = await authClient.getSession();
        if (!session) {
          // User not logged in, no need to monitor
          return;
        }
      }

      if (token) {
        // Decode the JWT token to get expiration time
        const payload = JSON.parse(atob(token.split('.')[1]));
        const exp = payload.exp; // Expiration time in seconds
        const now = Math.floor(Date.now() / 1000); // Current time in seconds

        if (exp) {
          const timeUntilExpiry = (exp - now) * 1000; // Convert to milliseconds

          // Refresh the token 30 seconds before it expires
          const refreshTime = Math.max(0, timeUntilExpiry - 30000); // 30 seconds before expiry

          if (timeUntilExpiry <= 0) {
            // Token already expired, redirect immediately
            console.log('Token already expired, redirecting to sign in...');
            router.push('/auth/signin');
            router.refresh();
          } else if (refreshTime === 0) {
            // Token expires in less than 30 seconds, try to refresh now
            const refreshed = await refreshAccessToken();
            if (!refreshed) {
              router.push('/auth/signin');
              router.refresh();
            }
          } else {
            // Schedule refresh for 30 seconds before expiry
            console.log(`Token expires in ${timeUntilExpiry / 1000} seconds, scheduling refresh in ${refreshTime / 1000} seconds...`);

            timeoutRef.current = setTimeout(async () => {
              const refreshed = await refreshAccessToken();
              if (!refreshed) {
                console.log('Refresh failed, redirecting to sign in...');
                router.push('/auth/signin');
                router.refresh();
              }
            }, refreshTime);
          }
        }
      }
    } catch (error) {
      console.error('Error monitoring token expiration:', error);
    }
  };

  useEffect(() => {
    // Check token expiration immediately
    scheduleRedirect();

    // Also check periodically in case the token changes
    const interval = setInterval(scheduleRedirect, 30000); // Check every 30 seconds

    return () => {
      // Clean up timeout and interval
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      clearInterval(interval);
    };
  }, [router]);

  // This component doesn't render anything, just manages token expiry
  return null;
}