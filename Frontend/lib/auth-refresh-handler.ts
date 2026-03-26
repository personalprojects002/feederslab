import { authClient } from './auth-client';
import { getRefreshToken, setRefreshTokenCookie, removeRefreshTokenCookie } from './refresh-token-utils';

/**
 * Enhanced authentication handler with refresh token support
 */
class AuthRefreshHandler {
  private isRefreshing = false;
  private failedQueue: Array<{ resolve: any; reject: any }> = [];

  /**
   * Get a valid access token, refreshing if necessary
   */
  async getValidAccessToken(): Promise<string | null> {
    try {
      // Try to get the current token
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
        // If no token, try to get session
        const session = await authClient.getSession();
        if (!session) {
          return null;
        }
      }

      // Check if token is expired or expiring soon (within 1 minute)
      if (token && this.isTokenExpiringSoon(token)) {
        // Token is expiring soon, try to refresh
        const newToken = await this.refreshToken();
        return newToken;
      }

      return token || null;
    } catch (error) {
      console.error('Error getting valid access token:', error);
      return null;
    }
  }

  /**
   * Check if token is expiring within the threshold (default 60 seconds)
   */
  private isTokenExpiringSoon(token: string, thresholdSeconds: number = 60): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp; // Expiration time in seconds
      const now = Math.floor(Date.now() / 1000); // Current time in seconds

      if (exp) {
        const timeUntilExpiry = exp - now;
        return timeUntilExpiry <= thresholdSeconds;
      }
      return true; // If no exp claim, consider expired
    } catch (error) {
      console.error('Error checking token expiration:', error);
      return true;
    }
  }

  /**
   * Refresh the access token using the refresh token
   */
  async refreshToken(): Promise<string | null> {
    if (this.isRefreshing) {
      // If already refreshing, queue this request
      return new Promise((resolve, reject) => {
        this.failedQueue.push({ resolve, reject });
      });
    }

    try {
      this.isRefreshing = true;

      // Get the refresh token
      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        console.log('No refresh token available');
        this.processQueue(false);
        return null;
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

        // In a real implementation, we'd update the auth client with the new token
        // For now, we'll just return the new token

        this.processQueue(true, newAccessToken);
        return newAccessToken;
      } else {
        console.log('Token refresh failed:', response.status);
        // Refresh failed, clear refresh token and reject all queued requests
        removeRefreshTokenCookie();
        this.processQueue(false);
        return null;
      }
    } catch (error) {
      console.error('Error refreshing token:', error);
      this.processQueue(false);
      return null;
    } finally {
      this.isRefreshing = false;
    }
  }

  /**
   * Process queued requests after refresh completes
   */
  private processQueue(success: boolean, newToken?: string) {
    this.failedQueue.forEach(({ resolve, reject }) => {
      if (success && newToken) {
        resolve(newToken);
      } else {
        reject(new Error('Token refresh failed'));
      }
    });

    this.failedQueue = [];
  }

  /**
   * Generate a new refresh token (called after login)
   */
  async generateRefreshToken(): Promise<void> {
    try {
      // Get current session to verify user is authenticated
      const session = await authClient.getSession();
      if (!session?.data) {
        throw new Error('User not authenticated');
      }

      // Call backend to generate refresh token
      const response = await fetch('http://localhost:8000/auth/generate-refresh-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getValidAccessToken()}`
        },
      });

      if (response.ok) {
        const data = await response.json();
        const refreshToken = data.refreshToken;

        // Store the refresh token in a secure cookie
        setRefreshTokenCookie(refreshToken);
      } else {
        console.error('Failed to generate refresh token:', response.status);
      }
    } catch (error) {
      console.error('Error generating refresh token:', error);
    }
  }

  /**
   * Logout and revoke refresh token
   */
  async logout(): Promise<void> {
    try {
      const refreshToken = getRefreshToken();

      // Call backend to revoke refresh token
      await fetch('http://localhost:8000/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getValidAccessToken()}`
        },
        body: JSON.stringify({ refreshToken })
      });

      // Remove refresh token from cookie
      removeRefreshTokenCookie();

      // Clear the auth session
      await authClient.signOut();
    } catch (error) {
      console.error('Error during logout:', error);
      // Still remove the refresh token even if backend call fails
      removeRefreshTokenCookie();
      await authClient.signOut();
    }
  }
}

// Create a singleton instance
export const authRefreshHandler = new AuthRefreshHandler();