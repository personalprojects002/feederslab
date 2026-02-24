# Authentication Guide

## Overview

The application uses **Better Auth** with the following authentication methods:

- Magic Link (Email-based passwordless authentication)
- Google OAuth
- JWT-based session management

## Setup

### 1. Environment Variables

```env
# Better Auth
BETTER_AUTH_SECRET=your-secret-key-min-32-characters
NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3000

# Google OAuth
GOOGLE_ID=your-google-client-id
GOOGLE_SECRET=your-google-client-secret

# Email Service (Resend)
RESEND_KEY=your-resend-api-key
RESEND_FROM=noreply@yourdomain.com

# Database
DATABASE_URL=postgresql://user:pass@host:port/database
```

### 2. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Go to Credentials → Create Credentials → OAuth 2.0 Client ID
5. Set authorized redirect URIs:
   - `http://localhost:3000/api/better-auth/callback/google`
   - `https://yourdomain.com/api/better-auth/callback/google` (production)
6. Copy Client ID and Client Secret to `.env.local`

### 3. Resend Email Setup

1. Sign up at [Resend](https://resend.com/)
2. Verify your sending domain
3. Create API key
4. Copy to `RESEND_KEY` in `.env.local`

## Authentication Flow

### Magic Link Flow

```
1. User enters email on /sign-in
2. Click "Send Magic Link"
3. Backend calls Resend API
4. Email sent with signed URL
5. User clicks link
6. Session created
7. Redirect to /dashboard
```

### Google OAuth Flow

```
1. User clicks "Sign in with Google"
2. Redirect to Google OAuth
3. User authorizes
4. Callback to /api/better-auth/callback/google
5. Session created
6. Redirect to /dashboard
```

## Using Authentication

### Client Components

```tsx
"use client";
import { authClient } from "@/lib/auth-client";

export default function MyComponent() {
  const { data: session, isPending, error } = authClient.useSession();

  if (isPending) return <div>Loading...</div>;
  if (error) return <div>Error</div>;

  if (session?.user) {
    return <div>Hello {session.user.name}</div>;
  }

  return <div>Not logged in</div>;
}
```

### Server Components

```tsx
import { auth } from "@/lib/better-auth";
import { headers } from "next/headers";

export default async function ServerComponent() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  return <div>Protected content</div>;
}
```

### API Routes

```tsx
import { auth } from "@/lib/better-auth";

export async function GET(request: Request) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  return Response.json({ user: session.user });
}
```

## Session Management

### Get Session

```tsx
const session = await authClient.getSession();
```

### Sign Out

```tsx
await authClient.signOut();
```

### Check Authentication

```tsx
const { data: session } = authClient.useSession();
const isAuthenticated = !!session?.user;
```

## Protected Routes

### Middleware Approach

Create `middleware.ts`:

```tsx
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const session = request.cookies.get("better-auth.session_token");

  if (!session && request.nextUrl.pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
```

### Component-Level Protection

```tsx
"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function Dashboard() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/sign-in");
    }
  }, [session, isPending, router]);

  if (isPending) return <div>Loading...</div>;
  if (!session) return null;

  return <div>Dashboard Content</div>;
}
```

## Database Schema

Better Auth creates these tables automatically:

**user**

- id (primary key)
- email (unique)
- name
- image
- emailVerified
- createdAt
- updatedAt

**session**

- id (primary key)
- userId (foreign key)
- token (unique)
- expiresAt
- ipAddress
- userAgent

**verification**

- id (primary key)
- identifier (email)
- value (token)
- expiresAt

**account** (for OAuth)

- id (primary key)
- userId (foreign key)
- provider
- providerAccountId
- accessToken
- refreshToken
- expiresAt

## Troubleshooting

### Session Not Persisting

Check cookies are enabled and HTTPS in production:

```tsx
export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL,
  basePath: "/api/better-auth",
  fetchOptions: {
    credentials: "include", // Important!
  },
});
```

### Magic Link Not Sending

1. Check RESEND_KEY is valid
2. Verify domain is verified in Resend
3. Check spam folder
4. Look at server logs for errors

### Google OAuth Redirect URI Mismatch

Ensure redirect URI matches exactly:

- `http://localhost:3000/api/better-auth/callback/google` (dev)
- `https://yourdomain.com/api/better-auth/callback/google` (prod)

### CORS Errors

Backend must allow frontend origin:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True
)
```

## Security Best Practices

1. **Use HTTPS in production**
2. **Set secure cookie flags** (Better Auth handles this)
3. **Rotate BETTER_AUTH_SECRET regularly**
4. **Validate sessions server-side** for sensitive operations
5. **Set appropriate session expiration** (default 7 days)
6. **Use CSRF protection** (Better Auth includes this)

## Testing Authentication

```tsx
// __tests__/auth.test.tsx
import { render, screen } from "@testing-library/react";
import { authClient } from "@/lib/auth-client";

jest.mock("@/lib/auth-client");

test("shows login when not authenticated", () => {
  (authClient.useSession as jest.Mock).mockReturnValue({
    data: null,
    isPending: false,
  });

  render(<MyComponent />);
  expect(screen.getByText("Sign In")).toBeInTheDocument();
});
```

## Rate Limiting

Better Auth includes built-in rate limiting:

- 10 magic link requests per hour per email
- 429 status code when exceeded

Handle in your code:

```tsx
try {
  await authClient.signIn.magicLink({ email });
} catch (error) {
  if (error.status === 429) {
    toast.error("Too many requests. Please try again later.");
  }
}
```
