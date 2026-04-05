"use client";

import { authClient } from "@/lib/auth-client";
import { useState } from "react";

export default function GoogleAuth() {
  const [isPending, setIsPending] = useState(false);

  const handleSignIn = async () => {
    try {
      setIsPending(true);
      // Social sign-in delegates trust and MFA capabilities to Google while
      // still returning users to the product dashboard as the landing context.
      await authClient.signIn.social({
        provider: "google",
        callbackURL: "/dashboard",
      });
    } catch (error) {
      console.error("Google sign-in error:", error);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <button
      onClick={handleSignIn}
      disabled={isPending}
      className="flex w-full items-center justify-center gap-3 rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 text-sm font-semibold text-[#0B0B0C] transition-colors hover:bg-[#F9FAFB] disabled:cursor-not-allowed disabled:opacity-60"
    >
      <svg
        className="w-5 h-5"
        viewBox="0 0 24 24"
        aria-hidden="true"
        fill="currentColor"
      >
        <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
      </svg>
      {isPending ? "Signing in..." : "Continue with Google"}
    </button>
  );
}
