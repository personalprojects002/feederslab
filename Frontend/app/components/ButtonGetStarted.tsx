"use client";
import { authClient } from "@/lib/auth-client";
import Link from "next/link";

interface ButtonGetStartedProps {
  className?: string;
  width?: string;
}

export default function ButtonGetStarted({
  className,
  width,
}: ButtonGetStartedProps) {
  const dashboardURL = "/dashboard";
  const { data: session, isPending, error } = authClient.useSession();
  if (isPending) {
    return (
      <Link
        href="/sign-in"
        className={`inline-flex items-center justify-center bg-[#0B0B0C] text-white px-5 py-3 text-sm font-semibold transition-colors hover:bg-[#1F2937] ${
          width ?? ""
        } ${className ?? "rounded-xl"}`}
      >
        Get Started
      </Link>
    );
  }
  if (error) {
    console.error("Session error:", error);
    return (
      <Link
        href="/sign-in"
        className={`inline-flex items-center justify-center bg-[#0B0B0C] text-white px-5 py-3 text-sm font-semibold transition-colors hover:bg-[#1F2937] ${
          width ?? ""
        } ${className ?? "rounded-xl"}`}
      >
        Get Started
      </Link>
    );
  }

  const user = session?.user;

  if (user) {
    const name =
      typeof user.name === "string" ? user.name : user.email || "User";
    const displayName =
      name === "Anonymous" || name === "User" || !name ? "Friend" : name;

    return (
      <Link
        href={dashboardURL}
        className={`inline-flex items-center justify-center bg-[#0B0B0C] text-white px-5 py-3 text-sm font-semibold transition-colors hover:bg-[#1F2937] ${
          width ?? ""
        } ${className ?? "rounded-xl"}`}
      >
        {`Welcome ${displayName}`}
      </Link>
    );
  }

  return (
    <Link
      href="/sign-in"
      className={`inline-flex items-center justify-center bg-[#0B0B0C] text-white px-5 py-3 text-sm font-semibold transition-colors hover:bg-[#1F2937] ${
        width ?? ""
      } ${className ?? "rounded-xl"}`}
    >
      Get Started
    </Link>
  );
}
