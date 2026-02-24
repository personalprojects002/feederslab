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
    <div className="w-full">
      <form onSubmit={onSubmit} className="grid w-full gap-4">
        <div>
          <label className="text-zinc-700 font-medium mb-1.5 block">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            disabled={isSubmitting}
            className="bg-zinc-50 border border-zinc-200 focus:ring-2 focus:ring-black focus:border-transparent rounded-lg p-3 transition-all text-zinc-900 placeholder:text-zinc-400 w-full"
            required
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-black text-white hover:bg-zinc-800 rounded-lg py-3 font-semibold transition-all shadow-lg hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isSubmitting ? (
            <span
              aria-label="Sending"
              className="h-5 w-5 rounded-full border-2 border-white/30 border-t-white animate-spin"
            />
          ) : (
            "Send login link"
          )}
        </button>

        {status.type === "success" && (
          <p className="text-sm text-green-600">{status.message}</p>
        )}
        {status.type === "error" && (
          <p className="text-sm text-red-600">{status.message}</p>
        )}
      </form>
    </div>
  );
}
