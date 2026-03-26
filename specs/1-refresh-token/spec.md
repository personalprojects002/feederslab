# Refresh Token Implementation with Automatic Token Expiration

**Feature ID**: 1-refresh-token
**Status**: Specification
**Created**: 2026-03-26

## Overview

Implement a secure token refresh mechanism with automatic access token expiration to enhance application security. This feature prevents unauthorized access if tokens are stolen by limiting their validity period and requiring periodic refresh.

## Problem Statement

Currently, JWT tokens issued by Better Auth may have long expiration times, creating a security risk. If a token is stolen, an attacker can use it indefinitely until it naturally expires. This feature addresses this vulnerability by:

1. Issuing short-lived access tokens (15 minutes)
2. Issuing long-lived refresh tokens (7 days) stored securely
3. Automatically refreshing access tokens before expiration
4. Allowing users to revoke refresh tokens

## User Scenarios & Testing

### Scenario 1: Normal User Session
**Actor**: Authenticated user
**Flow**:
1. User logs in and receives access token (15 min expiry) and refresh token (7 day expiry)
2. User makes API requests with access token
3. Before access token expires, frontend automatically refreshes it
4. User continues working without interruption
5. User logs out, refresh token is revoked

**Acceptance Criteria**:
- Access token is valid for 15 minutes
- Refresh token is valid for 7 days
- Frontend detects token expiration and refreshes automatically
- User session continues seamlessly

### Scenario 2: Token Expiration & Refresh
**Actor**: Authenticated user
**Flow**:
1. User receives access token with 15-minute expiry
2. After 10 minutes, frontend detects upcoming expiration
3. Frontend calls refresh endpoint with refresh token
4. Backend validates refresh token and issues new access token
5. Frontend updates stored token and continues requests

**Acceptance Criteria**:
- Refresh endpoint accepts valid refresh token
- Returns new access token with fresh expiry
- Old access token becomes invalid
- Refresh token remains valid for future refreshes

### Scenario 3: Stolen Token Prevention
**Actor**: Attacker with stolen access token
**Flow**:
1. Attacker steals access token from user
2. Attacker attempts to use token after 15 minutes
3. Backend rejects expired token
4. Attacker cannot refresh without refresh token
5. User's session remains secure

**Acceptance Criteria**:
- Expired access tokens are rejected
- Attacker cannot use stolen token beyond 15 minutes
- Refresh token is not exposed to frontend storage vulnerabilities

### Scenario 4: Refresh Token Revocation
**Actor**: User or security system
**Flow**:
1. User logs out or security event detected
2. Refresh token is revoked in database
3. Subsequent refresh attempts fail
4. User must log in again

**Acceptance Criteria**:
- Logout revokes all refresh tokens for user
- Revoked tokens cannot be used for refresh
- User must re-authenticate

## Functional Requirements

### FR1: Access Token Generation
- Access tokens must expire after 15 minutes
- Access tokens must contain user email and ID
- Access tokens must be signed with EdDSA (Ed25519)
- Access tokens must not include refresh token information

### FR2: Refresh Token Generation
- Refresh tokens must expire after 7 days
- Refresh tokens must be stored securely in database
- Refresh tokens must be associated with user and device/session
- Refresh tokens must be cryptographically random (minimum 32 bytes)

### FR3: Token Refresh Endpoint
- Endpoint: `POST /api/auth/refresh`
- Accepts refresh token in request body or secure HTTP-only cookie
- Validates refresh token against database
- Checks token expiration
- Issues new access token with fresh expiry
- Returns new access token to frontend
- Does not extend refresh token expiry on each refresh

### FR4: Frontend Token Management
- Automatically refresh access token when 2 minutes remain before expiry
- Store access token in memory (not localStorage)
- Store refresh token in secure HTTP-only cookie
- Attach access token to all API requests
- Handle 401 responses by attempting refresh
- Redirect to login if refresh fails

### FR5: Token Revocation
- Logout endpoint revokes all refresh tokens for user
- Revoked tokens cannot be used for refresh
- Revoked tokens are marked in database with revocation timestamp

### FR6: Security Headers
- Refresh token cookie must be HTTP-only
- Refresh token cookie must be Secure (HTTPS only)
- Refresh token cookie must have SameSite=Strict

## Success Criteria

1. **Security**: Stolen access tokens are useless after 15 minutes; attacker cannot refresh without refresh token
2. **User Experience**: Users experience no interruption; token refresh happens transparently
3. **Performance**: Token refresh completes in under 500ms
4. **Reliability**: 99.9% of token refreshes succeed without user intervention
5. **Compliance**: Tokens follow OAuth 2.0 best practices for token expiration and refresh

## Key Entities

### AccessToken
- `token`: JWT string
- `expiresAt`: Timestamp (15 minutes from issue)
- `userId`: User identifier
- `email`: User email
- `issuedAt`: Timestamp

### RefreshToken
- `id`: Unique identifier
- `token`: Cryptographically random string
- `userId`: User identifier
- `expiresAt`: Timestamp (7 days from issue)
- `revokedAt`: Timestamp (null if active)
- `issuedAt`: Timestamp
- `lastUsedAt`: Timestamp

### RefreshTokenRequest
- `refreshToken`: Token string from cookie or body

### RefreshTokenResponse
- `accessToken`: New JWT token
- `expiresIn`: Seconds until expiry (900 for 15 minutes)

## Dependencies

- Better Auth JWT plugin (already integrated)
- Database for storing refresh tokens
- HTTP-only cookie support in frontend and backend
- Secure HTTPS in production

## Assumptions

1. Frontend has secure storage mechanism (memory for access token)
2. Backend database is secure and accessible only to backend
3. HTTPS is enforced in production
4. Clock skew between frontend and backend is minimal (< 1 minute)
5. Users have modern browsers supporting HTTP-only cookies
6. Refresh token rotation is not required (same token used for multiple refreshes)

## Out of Scope

- Multi-device session management
- Refresh token rotation (issuing new refresh token on each refresh)
- Device fingerprinting or IP validation
- Biometric re-authentication for refresh
- Refresh token expiration extension on use

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Refresh token theft | Store in HTTP-only cookie, use HTTPS, implement rate limiting |
| Token replay attacks | Include issued-at timestamp, validate clock skew |
| Concurrent refresh requests | Implement request deduplication or token versioning |
| Database compromise | Hash refresh tokens in database, use strong encryption |
| Clock skew issues | Allow 1-minute clock skew tolerance in validation |
