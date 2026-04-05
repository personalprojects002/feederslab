"use client";

import { authClient } from "@/lib/auth-client";
import { useEffect, useState } from "react";

export default function MagicLinkAuth() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<
    | { type: "idle" }
    | { type: "success"; message: string }
    | { type: "error"; message: string }
  >({ type: "idle" });

  const [callbackURL, setCallbackURL] = useState("/dashboard");

  useEffect(() => {
    // Build absolute callback on client so auth emails remain valid across
    // local, preview, and production deployments.
    setCallbackURL(new URL("/dashboard", window.location.origin).toString());
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
    } catch (err: unknown) {
      const message =
        err &&
        typeof err === "object" &&
        "message" in err &&
        typeof (err as { message?: string }).message === "string" &&
        (err as { message?: string }).message?.length
          ? (err as { message: string }).message
          : "Failed to send email. Please try again.";
      setStatus({ type: "error", message });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="w-full">
      <form onSubmit={onSubmit} className="grid w-full gap-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-[#0B0B0C]">
            Email
          </label>
          <input
            type="email"
            name="email"
            autoComplete="email"
            inputMode="email"
            suppressHydrationWarning
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            disabled={isSubmitting}
            className="h-11 w-full rounded-xl border border-[#E5E7EB] bg-white px-3 text-sm text-[#0B0B0C] outline-none transition placeholder:text-gray-400 focus:border-[#0B0B0C]"
            required
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex h-11 items-center justify-center rounded-xl bg-[#0B0B0C] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#1F2937] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? (
            <span
              aria-label="Sending"
              className="h-5 w-5 rounded-full border-2 border-white/30 border-t-white animate-spin"
            />
          ) : (
            "Send sign-in link"
          )}
        </button>

        {status.type === "success" && (
          <p className="text-sm text-green-700">{status.message}</p>
        )}
        {status.type === "error" && (
          <p className="text-sm text-red-700">
            {status.message} If this continues, verify RESEND domain DNS and
            check Spam/Promotions.
          </p>
        )}
      </form>
    </div>
  );
}
