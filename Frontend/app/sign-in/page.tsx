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
