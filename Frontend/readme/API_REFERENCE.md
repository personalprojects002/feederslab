# API Reference - Frontend

## Backend API Client

### Configuration

```typescript
// lib/backend-api.ts
const backendApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:8000",
});
```

### Authentication

All requests automatically include Bearer token in Authorization header via request interceptor.

## Boards API

### Get All Boards

```typescript
GET /boards/

// Usage
const response = await backendApi.get("/boards/");
const boards = response.data;

// Response
[
  {
    id: "uuid",
    board_name: "My Board",
    board_id: "unique-id",
    owner_email: "user@example.com",
    created_at: "2026-02-06T...",
    updated_at: "2026-02-06T..."
  }
]
```

### Get Board by ID

```typescript
GET /boards/{boardId}

// Usage
const response = await backendApi.get(`/boards/${boardId}`);
const board = response.data;

// Response
{
  id: "uuid",
  board_name: "My Board",
  board_id: "unique-id",
  owner_email: "user@example.com"
}
```

### Create Board

```typescript
POST /boards/

// Request Body
{
  board_name: string (required)
}

// Usage
const response = await backendApi.post("/boards/", {
  board_name: "New Board"
});

// Response
{
  id: "uuid",
  board_name: "New Board",
  board_id: "generated-id",
  owner_email: "user@example.com"
}
```

### Update Board

```typescript
PUT /boards/{boardId}

// Request Body
{
  board_name: string (required)
}

// Usage
await backendApi.put(`/boards/${boardId}`, {
  board_name: "Updated Name"
});

// Response
{
  id: "uuid",
  board_name: "Updated Name",
  board_id: "board-id",
  owner_email: "user@example.com"
}
```

### Delete Board

```typescript
DELETE / boards / { boardId };

// Usage
await backendApi.delete(`/boards/${boardId}`);

// Response
{
  message: "Board deleted successfully";
}
```

## Billing API

### Create Checkout Session

```typescript
POST / billing / create - checkout;

// Request Body
{
  priceId: string(required);
}

// Usage
const response = await backendApi.post("/billing/create-checkout", {
  priceId: "price_xxx",
});

// Response
{
  url: "https://checkout.stripe.com/...";
}

// Then redirect
window.location.href = response.data.url;
```

### Create Portal Session

```typescript
POST / billing / create - portal;

// Usage
const response = await backendApi.post("/billing/create-portal");

// Response
{
  url: "https://billing.stripe.com/...";
}

// Then redirect
window.location.href = response.data.url;
```

## Better Auth API

### Get Session

```typescript
GET /api/better-auth/get-session

// Usage (via auth-client)
const session = await authClient.getSession();

// Response
{
  data: {
    user: {
      id: string,
      email: string,
      name: string,
      image: string
    },
    session: {
      token: string,
      expiresAt: string
    }
  }
}
```

### Sign In with Magic Link

```typescript
// Usage
await authClient.signIn.magicLink({
  email: "user@example.com",
  callbackURL: "/dashboard",
});

// Sends email with sign-in link
```

### Sign In with Google

```typescript
// Usage
await authClient.signIn.social({
  provider: "google",
  callbackURL: "/dashboard",
});

// Redirects to Google OAuth
```

### Sign Out

```typescript
// Usage
await authClient.signOut();

// Clears session and redirects
```

## Error Handling

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (auth required)
- `403` - Forbidden (no access/subscription)
- `404` - Not Found
- `500` - Server Error

### Error Response Format

```typescript
{
  detail: string; // Error message
}
```

### Handling Errors

```typescript
try {
  const response = await backendApi.post("/boards/", data);
} catch (error) {
  if (error.response) {
    console.error(error.response.data.detail);
  } else if (error.request) {
    console.error("Network error");
  } else {
    console.error("Unknown error");
  }
}
```

## Authentication Headers

### Request Headers

```http
Authorization: Bearer <session-token>
Content-Type: application/json
```

### Session Token Extraction

The backend-api automatically extracts tokens from Better Auth session:

```typescript
// Possible token locations (checked in order):
1. session.session.token
2. session.token
3. session.session.id
4. session.sessionToken
5. session.session.sessionToken
```

## Rate Limiting

Better Auth includes built-in rate limiting:

- Handles 429 status codes
- Logs rate limit errors

```typescript
fetchOptions: {
  onError(e) {
    if (e.error.status === 429) {
      console.error("Rate limited");
    }
  }
}
```

## TypeScript Types

### Board

```typescript
interface Board {
  id: string;
  board_name: string;
  board_id: string;
  owner_email: string;
  created_at?: string;
  updated_at?: string;
}
```

### User

```typescript
interface User {
  id: string;
  email: string;
  name: string;
  image?: string;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}
```

### Session

```typescript
interface Session {
  user: User;
  session: {
    token: string;
    expiresAt: string;
  };
}
```
