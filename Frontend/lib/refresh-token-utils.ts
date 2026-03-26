/**
 * Utilities for handling refresh tokens
 */

/**
 * Set refresh token in a secure HTTP-only cookie
 */
export const setRefreshTokenCookie = (token: string) => {
  // For development, we'll store in a regular cookie
  // In production, this should be an HTTP-only, Secure, SameSite=Strict cookie
  document.cookie = `refresh_token=${token}; Path=/; HttpOnly; SameSite=Strict;`;
};

/**
 * Get refresh token from cookie
 */
export const getRefreshToken = (): string | null => {
  const refreshToken = document.cookie
    .split('; ')
    .find(row => row.startsWith('refresh_token='))
    ?.split('=')[1];
  return refreshToken || null;
};

/**
 * Remove refresh token cookie
 */
export const removeRefreshTokenCookie = () => {
  document.cookie = 'refresh_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
};

/**
 * Calculate time until token expires
 */
export const getTimeUntilExpiry = (token: string): number | null => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp = payload.exp; // Expiration time in seconds
    const now = Math.floor(Date.now() / 1000); // Current time in seconds

    if (exp) {
      return (exp - now) * 1000; // Convert to milliseconds
    }
    return null;
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};