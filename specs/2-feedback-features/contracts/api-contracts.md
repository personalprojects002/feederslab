# API Contracts: Feedback Collection & Board Management

**Date**: 2026-04-05  
**Feature**: Feedback Collection & Board Management  
**Status**: Complete

## Overview

All API endpoints follow RESTful conventions. Authenticated endpoints require JWT token in `Authorization: Bearer {token}` header. Shared board endpoints are public but validate access level.

---

## Board Endpoints

### POST /api/boards
**Create a new board**

**Authentication**: Required (JWT token)  
**Permission**: Any authenticated user

**Request**:
```json
{
  "name": "Q2 Feature Requests",
  "description": "Features customers want in Q2 2026"
}
```

**Response** (201 Created):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "owner_id": "660e8400-e29b-41d4-a716-446655440001",
  "name": "Q2 Feature Requests",
  "description": "Features customers want in Q2 2026",
  "created_at": "2026-04-05T10:00:00Z",
  "updated_at": "2026-04-05T10:00:00Z"
}
```

**Error Responses**:
- 400 Bad Request: Invalid input (name empty, description too long)
- 401 Unauthorized: Missing or invalid JWT token
- 409 Conflict: Board name already exists for this owner

---

### GET /api/boards
**List all boards owned by authenticated user**

**Authentication**: Required (JWT token)  
**Permission**: Any authenticated user

**Query Parameters**:
- `skip`: Integer (default 0) - pagination offset
- `limit`: Integer (default 20, max 100) - pagination limit
- `sort`: String (default "created_at") - sort field (created_at, name, updated_at)
- `order`: String (default "desc") - sort order (asc, desc)

**Response** (200 OK):
```json
{
  "items": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "owner_id": "660e8400-e29b-41d4-a716-446655440001",
      "name": "Q2 Feature Requests",
      "description": "Features customers want in Q2 2026",
      "created_at": "2026-04-05T10:00:00Z",
      "updated_at": "2026-04-05T10:00:00Z"
    }
  ],
  "total": 1,
  "skip": 0,
  "limit": 20
}
```

**Error Responses**:
- 401 Unauthorized: Missing or invalid JWT token

---

### GET /api/boards/{boardId}
**Get board details (owner only)**

**Authentication**: Required (JWT token)  
**Permission**: Board owner only

**Response** (200 OK):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "owner_id": "660e8400-e29b-41d4-a716-446655440001",
  "name": "Q2 Feature Requests",
  "description": "Features customers want in Q2 2026",
  "created_at": "2026-04-05T10:00:00Z",
  "updated_at": "2026-04-05T10:00:00Z",
  "feature_count": 5,
  "share_links": [
    {
      "id": "770e8400-e29b-41d4-a716-446655440002",
      "token": "abc123def456ghi789jkl012mno345pq",
      "access_level": "CREATE_UPVOTE",
      "created_at": "2026-04-05T10:30:00Z",
      "expires_at": null
    }
  ]
}
```

**Error Responses**:
- 401 Unauthorized: Missing or invalid JWT token
- 403 Forbidden: User is not board owner
- 404 Not Found: Board does not exist

---

### DELETE /api/boards/{boardId}
**Delete board (owner only, cascades to features and share links)**

**Authentication**: Required (JWT token)  
**Permission**: Board owner only

**Response** (204 No Content)

**Error Responses**:
- 401 Unauthorized: Missing or invalid JWT token
- 403 Forbidden: User is not board owner
- 404 Not Found: Board does not exist

---

## Feature Endpoints

### POST /api/boards/{boardId}/features
**Create a new feature in board**

**Authentication**: Required for owned boards, optional for shared boards  
**Permission**: Board owner OR user with Create+Upvote share link

**Request**:
```json
{
  "title": "Dark mode support",
  "description": "Add dark mode theme to the application"
}
```

**Response** (201 Created):
```json
{
  "id": "880e8400-e29b-41d4-a716-446655440003",
  "board_id": "550e8400-e29b-41d4-a716-446655440000",
  "creator_id": "660e8400-e29b-41d4-a716-446655440001",
  "title": "Dark mode support",
  "description": "Add dark mode theme to the application",
  "upvote_count": 0,
  "created_at": "2026-04-05T10:15:00Z",
  "updated_at": "2026-04-05T10:15:00Z"
}
```

**Error Responses**:
- 400 Bad Request: Invalid input (title empty, description too long)
- 403 Forbidden: User lacks permission to create features
- 404 Not Found: Board does not exist
- 409 Conflict: Feature title already exists in this board

---

### GET /api/boards/{boardId}/features
**List all features in board**

**Authentication**: Optional  
**Permission**: Public (any user can view)

**Query Parameters**:
- `skip`: Integer (default 0) - pagination offset
- `limit`: Integer (default 50, max 200) - pagination limit
- `sort`: String (default "upvote_count") - sort field (upvote_count, created_at, title)
- `order`: String (default "desc") - sort order (asc, desc)

**Response** (200 OK):
```json
{
  "items": [
    {
      "id": "880e8400-e29b-41d4-a716-446655440003",
      "board_id": "550e8400-e29b-41d4-a716-446655440000",
      "creator_id": "660e8400-e29b-41d4-a716-446655440001",
      "title": "Dark mode support",
      "description": "Add dark mode theme to the application",
      "upvote_count": 42,
      "created_at": "2026-04-05T10:15:00Z",
      "updated_at": "2026-04-05T10:15:00Z"
    }
  ],
  "total": 1,
  "skip": 0,
  "limit": 50
}
```

**Error Responses**:
- 404 Not Found: Board does not exist

---

### DELETE /api/boards/{boardId}/features/{featureId}
**Delete feature (creator or board owner only)**

**Authentication**: Required  
**Permission**: Feature creator OR board owner

**Response** (204 No Content)

**Error Responses**:
- 401 Unauthorized: Missing or invalid JWT token
- 403 Forbidden: User is not feature creator or board owner
- 404 Not Found: Feature or board does not exist

---

## Share Link Endpoints

### POST /api/boards/{boardId}/share
**Generate a new share link for board**

**Authentication**: Required (JWT token)  
**Permission**: Board owner only

**Request**:
```json
{
  "access_level": "CREATE_UPVOTE",
  "expires_at": null
}
```

**Response** (201 Created):
```json
{
  "id": "770e8400-e29b-41d4-a716-446655440002",
  "board_id": "550e8400-e29b-41d4-a716-446655440000",
  "token": "abc123def456ghi789jkl012mno345pq",
  "access_level": "CREATE_UPVOTE",
  "created_at": "2026-04-05T10:30:00Z",
  "expires_at": null,
  "share_url": "https://app.feeders.com/shared/abc123def456ghi789jkl012mno345pq"
}
```

**Error Responses**:
- 400 Bad Request: Invalid access_level or expires_at in past
- 401 Unauthorized: Missing or invalid JWT token
- 403 Forbidden: User is not board owner
- 404 Not Found: Board does not exist

---

### GET /api/share/{token}
**Get shared board details (public, no auth required)**

**Authentication**: Not required  
**Permission**: Public (any user with valid token)

**Response** (200 OK):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Q2 Feature Requests",
  "description": "Features customers want in Q2 2026",
  "access_level": "CREATE_UPVOTE",
  "created_at": "2026-04-05T10:00:00Z",
  "feature_count": 5
}
```

**Error Responses**:
- 404 Not Found: Share link does not exist or has expired
- 410 Gone: Share link has been revoked

---

### GET /api/share/{token}/features
**List features in shared board (public, no auth required)**

**Authentication**: Not required  
**Permission**: Public (any user with valid token)

**Query Parameters**:
- `skip`: Integer (default 0)
- `limit`: Integer (default 50, max 200)
- `sort`: String (default "upvote_count")
- `order`: String (default "desc")

**Response** (200 OK):
```json
{
  "items": [
    {
      "id": "880e8400-e29b-41d4-a716-446655440003",
      "title": "Dark mode support",
      "description": "Add dark mode theme to the application",
      "upvote_count": 42,
      "created_at": "2026-04-05T10:15:00Z"
    }
  ],
  "total": 1,
  "skip": 0,
  "limit": 50,
  "access_level": "CREATE_UPVOTE"
}
```

**Error Responses**:
- 404 Not Found: Share link does not exist or has expired

---

## Upvote Endpoints

### POST /api/features/{featureId}/upvote
**Toggle upvote on feature (public, no auth required)**

**Authentication**: Not required  
**Permission**: Public (any user)

**Request**:
```json
{
  "user_identifier": "session_abc123def456"
}
```

**Response** (200 OK):
```json
{
  "feature_id": "880e8400-e29b-41d4-a716-446655440003",
  "upvoted": true,
  "upvote_count": 43
}
```

**Response** (200 OK - when removing upvote):
```json
{
  "feature_id": "880e8400-e29b-41d4-a716-446655440003",
  "upvoted": false,
  "upvote_count": 42
}
```

**Error Responses**:
- 400 Bad Request: Invalid user_identifier
- 404 Not Found: Feature does not exist

---

### GET /api/features/{featureId}/upvote-status
**Check if user has upvoted feature (public, no auth required)**

**Authentication**: Not required  
**Permission**: Public (any user)

**Query Parameters**:
- `user_identifier`: String (required) - user session identifier

**Response** (200 OK):
```json
{
  "feature_id": "880e8400-e29b-41d4-a716-446655440003",
  "upvoted": true,
  "upvote_count": 43
}
```

**Error Responses**:
- 400 Bad Request: Missing user_identifier
- 404 Not Found: Feature does not exist

---

## Error Response Format

All error responses follow this format:

```json
{
  "detail": "Error message describing what went wrong",
  "error_code": "ERROR_CODE",
  "status_code": 400
}
```

**Common Error Codes**:
- `INVALID_INPUT`: Request validation failed
- `UNAUTHORIZED`: Missing or invalid authentication
- `FORBIDDEN`: User lacks permission
- `NOT_FOUND`: Resource does not exist
- `CONFLICT`: Resource already exists (e.g., duplicate name)
- `EXPIRED`: Share link has expired
- `REVOKED`: Share link has been revoked

---

## Authentication

**JWT Token Format**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Token Claims**:
- `sub`: User ID (UUID)
- `email`: User email
- `exp`: Expiration timestamp
- `iat`: Issued at timestamp

---

## Rate Limiting

- **Authenticated endpoints**: 1000 requests per hour per user
- **Public endpoints**: 100 requests per hour per IP address
- **Share link endpoints**: 500 requests per hour per token

---

## Versioning

- Current API version: `v1`
- All endpoints prefixed with `/api/v1/` (future-proofing)
- Breaking changes require major version bump

---

## CORS Policy

- **Allowed Origins**: Frontend domain (configured in environment)
- **Allowed Methods**: GET, POST, DELETE, OPTIONS
- **Allowed Headers**: Content-Type, Authorization
- **Credentials**: Allowed (for JWT tokens)
