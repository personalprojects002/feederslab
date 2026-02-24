**Complete Authentication Setup Guide**

This guide will help you set up a complete sign-in system for your website. We will use Google Sign-In and Magic Links, which are email links that let you log in without a password. We will also set up a database to potential store user information. Follow these steps carefully to build your authentication system.

**Step 1: Create the Sign-In Page**

We start by creating the visible page where users will log in. This page will be the main entry point for your application. You need to create a file named page.tsx inside the app/sign-in folder. This file brings together two smaller parts, the Google login button and the Magic Link form, which we will build later. It uses a clean layout with a centered box.

```tsx
"use client";

import GoogleAuth from "@/app/components/GoogleProvider";
import MagicLinkAuth from "@/app/components/MagicLink";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black p-4">
      <div className="max-w-sm w-full bg-white border border-zinc-200 shadow-2xl rounded-xl p-6">
        <h1 className="text-zinc-900 font-bold text-xl">Sign in</h1>
        <p className="text-zinc-500 text-sm mt-1">
          Sign in with Google or email.
        </p>

        <div className="mt-6 grid gap-4">
          <GoogleAuth />

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-zinc-200" />
            <span className="text-xs text-zinc-500">OR</span>
            <div className="h-px flex-1 bg-zinc-200" />
          </div>

          <MagicLinkAuth />
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Create the Google Login Button**

Now we will create the component that handles Google Sign-In. Create a file named GoogleProvider.tsx inside the app/components folder. This component shows a button with the Google logo. When a user clicks it, it talks to our authentication system to start the login process. We use a single-color logo here to make it look professional and clean.

```tsx
"use client";

import { authClient } from "@/lib/auth-client";
import { useState } from "react";

export default function GoogleAuth() {
  const [isPending, setIsPending] = useState(false);

  const handleSignIn = async () => {
    setIsPending(true);
    await authClient.signIn.social({
      provider: "google",
      callbackURL: "/dashboard",
    });
    setIsPending(false);
  };

  return (
    <button
      onClick={handleSignIn}
      disabled={isPending}
      className="w-full flex items-center justify-center gap-3 bg-white text-zinc-900 border border-zinc-200 hover:bg-zinc-50 font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
    >
      <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
        <path
          d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
        />
      </svg>
      {isPending ? "Signing in..." : "Continue with Google"}
    </button>
  );
}
```

**Step 3: Create the Magic Link Form**

Next, we need a way for users to log in with just their email address. Create a file named MagicLink.tsx inside the app/components folder. This component has a simple input field where the user types their email. When they submit the form, our system sends them an email with a unique link. Clicking that link logs them in automatically. It also handles success and error messages to show the user what is happening.

```tsx
"use client";

import { authClient } from "@/lib/auth-client";
import { useMemo, useState } from "react";

export default function MagicLinkAuth() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<
    | { type: "idle" }
    | { type: "success"; message: string }
    | { type: "error"; message: string }
  >({ type: "idle" });

  const callbackURL = useMemo(() => {
    if (typeof window === "undefined") return "/dashboard";
    return new URL("/dashboard", window.location.origin).toString();
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSubmitting(true);
    setStatus({ type: "idle" });

    try {
      await authClient.signIn.magicLink({
        email: email.trim(),
        callbackURL,
      });

      setStatus({
        type: "success",
        message:
          "Email sent. Open your inbox and click the sign-in link (check spam if you don't see it).",
      });
      setEmail("");
    } catch (err: any) {
      const message =
        typeof err?.message === "string" && err.message.length
          ? err.message
          : "Failed to send email. Please try again.";
      setStatus({ type: "error", message });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <div>
        <label htmlFor="email" className="sr-only">
          Email address
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="name@example.com"
          required
          className="w-full px-4 py-3 rounded-lg border border-zinc-200 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all placeholder:text-zinc-400 bg-white text-zinc-900"
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-black hover:bg-zinc-800 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isSubmitting ? "Sending..." : "Continue with Email"}
      </button>

      {status.type === "success" && (
        <div className="p-3 rounded-lg bg-green-50 text-green-600 text-sm border border-green-100">
          {status.message}
        </div>
      )}

      {status.type === "error" && (
        <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm border border-red-100">
          {status.message}
        </div>
      )}
    </form>
  );
}
```

**Step 4: Configure the Auth Client**

We need a helper file that allows the front part of our website to talk to the back part about authentication. Create a file named auth-client.ts inside the lib folder. This file initializes the client using the Better Auth library. It basically tells our app where the authentication server lives and what features we are using, like magic links.

```typescript
// we will use authclient methods to work with authentication
import { createAuthClient } from "better-auth/react";
import { magicLinkClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL,
  basePath: "/api/better-auth",
  plugins: [magicLinkClient()],
});
```

**Step 5: Connect to the Database**

To save user data, we need to connect to a MongoDB database. Create a file named mongo.ts inside the lib folder. This file handles the connection to MongoDB safely. It checks if you are in development mode or production mode to avoid creating too many connections at once. You must have your MongoDB connection string in your environment variables for this to work.

```typescript
import { MongoClient, ServerApiVersion } from "mongodb";

if (!process.env.MONGO_URI) {
  throw new Error('Invalid/Missing environment variable: "MONGO_URI"');
}

const uri: string = process.env.MONGO_URI;
const options = {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

if (process.env.NODE_ENV === "development") {
  const globalWithMongo = global as typeof global & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options);
    globalWithMongo._mongoClientPromise = client.connect();
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export default clientPromise;
```

**Step 6: Configure the Server Side Auth**

This is the most important configuration file. Create a file named better-auth.ts inside the lib folder. This file sets up the actual logic for how users are logged in. It connects to the database, sets up Google login with your keys, and configures how emails are sent using Resend.

```typescript
import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { magicLink } from "better-auth/plugins";
import clientPromise from "./mongo";

const client = await clientPromise; // Make a connection with server
const db = client.db();//Connect with database

const googleId = process.env.GOOGLE_ID?.trim();
const googleSecret = process.env.GOOGLE_SECRET?.trim();

if (!googleId || !googleSecret) {
  throw new Error(
    "Missing Google credentials. Please set GOOGLE_ID and GOOGLE_SECRET in your .env"
  );
}

export const auth = betterAuth({
  appName: "Feeders",
  database: mongodbAdapter(db),
  secret: process.env.BETTER_AUTH_SECRET,

  socialProviders: {
    google: {
      clientId: googleId,
      clientSecret: googleSecret,
    },
  },

  plugins: [
    magicLink({
      sendMagicLink: async ({ email, url }) => {
        const { host } = new URL(url);
        const from = process.env.RESEND_FROM || "noreply@email.feeders.app";

        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.RESEND_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from,
            to: email,
            subject: `Sign in to ${host}`,
            html: html({ url, host }),
            text: text({ url, host }),
          }),
        });

        if (!res.ok) {
          console.error("Resend error", await res.json());
          throw new Error("Failed to send email");
        }
      },
    }),
  ],

  basePath: "/api/better-auth",
});

function html({ url, host }: { url: string; host: string }) {
  const escapedHost = host.replace(/\./g, "&#8203;.");
  const color = {
    background: "#000000",
    text: "#ffffff",
    secondaryText: "#a1a1aa",
    buttonBackground: "#ffffff",
    buttonText: "#000000",
    border: "#333333",
  };

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Sign in to ${escapedHost}</title>
</head>
<body style="margin:0; background:${color.background}; font-family:Arial;">
  <div style="max-width:600px; margin:auto; padding:40px; border:1px solid ${color.border}; border-radius:12px;">
    <h1 style="color:${color.text};">${escapedHost}</h1>
    <p style="color:${color.secondaryText};">Click the button below to sign in.</p>
    <a href="${url}" style="display:inline-block; padding:14px 32px; background:${color.buttonBackground};
      color:${color.buttonText}; text-decoration:none; border-radius:8px;">
      Sign in
    </a>
    <p style="margin-top:24px; color:${color.secondaryText}; font-size:14px;">
      If you didn't request this email, ignore it.
    </p>
    <p style="margin-top:40px; font-size:12px; color:#666;">
      © ${new Date().getFullYear()} ${escapedHost}
    </p>
  </div>
</body>
</html>
`;
}

function text({ url, host }: { url: string; host: string }) {
  return `Sign in to ${host}\n${url}\n\n`;
}
```

**Step 7: The Main API Route**

Now we need to expose our authentication system to the internet so the frontend can talk to it. Create a new folder structure app/api/better-auth/[...all] and inside it, create a file named route.ts. The [...all] part is a special Next.js feature that catches all requests starting with that path. This file is very short because it just passes everything to the Better Auth library to handle.

```typescript
import { auth } from "@/lib/better-auth";
import { toNextJsHandler } from "better-auth/next-js";

export const { GET, POST } = toNextJsHandler(auth.handler);
```

**Step 8: How to Verify Users in API Routes**

Finally, this is how you protect your own API routes to ensure only logged-in users can access them. We will look at the board creation route as an example. Create a file named route.ts inside the app/api/board folder. In this file, we use methods from our auth configuration to check who is making the request. If the session does not exist or has no user email, we stop them immediately. This ensures that only real users can create boards in your database.

```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/better-auth";
import { headers } from "next/headers";
import connectMongo from "@/lib/mongoose";
import Board from "@/Models/board";
import User from "@/Models/user";

// Define request body interface
interface BoardRequestBody {
  boardName: string;
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body: BoardRequestBody = await request.json();

    // Validate input
    if (!body.boardName || body.boardName.trim() === "") {
      return NextResponse.json(
        { error: "Board name is required" },
        { status: 400 }
      );
    }

    // Check authentication
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Not Authorized" }, { status: 401 });
    }

    // Connect to database
    await connectMongo();

    const email = session.user.email;
    const sessionName = session.user.name?.trim();

    // Find existing user
    const user = await User.findOne({ email });

    if (!user) {
      return NextResponse.json(
        { error: "You are not allowed to create a board" },
        { status: 403 }
      );
    }

    // Optional: update user name if empty or placeholder
    // if ((user.name === "Friend" || !user.name) && sessionName) {
    //   user.name = sessionName;
    //   await user.save();
    // }

    // Create new board
    const newBoard = await Board.create({
      boardName: body.boardName,
      user: user._id,
    });

    // Link board to user and save
    user.boards.push(newBoard._id);
    await user.save();

    // Return success response
    return NextResponse.json(newBoard, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

