"use client";

import GoogleAuth from "@/app/components/GoogleProvider";
import MagicLinkAuth from "@/app/components/MagicLink";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F5F5F7] px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-[#E5E7EB] bg-white p-7 md:p-8">
        <p className="text-xs font-medium tracking-wide text-gray-500">
          Secure access
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[#0B0B0C]">
          Sign in to FeedersLab
        </h1>
        <p className="mt-2 text-sm leading-6 text-gray-600">
          Continue with Google or use your email to receive a secure sign-in
          link.
        </p>

        <div className="mt-6 grid gap-4">
          {/* Social-first path reduces friction for most users while the email
              option below keeps authentication accessible without Google. */}
          <GoogleAuth />

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-[#E5E7EB]" />
            <span className="text-xs text-gray-500">OR</span>
            <div className="h-px flex-1 bg-[#E5E7EB]" />
          </div>

          <MagicLinkAuth />
        </div>

        {/* Trust cue reinforces security posture near the final decision point. */}
        <p className="mt-6 text-xs text-gray-500">
          Your session is protected. We never expose sensitive keys in the
          browser.
        </p>
      </div>
    </div>
  );
}
