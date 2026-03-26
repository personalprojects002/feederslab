"use client";
import { authClient } from "@/lib/auth-client";
import Link from "next/link";
import { useEffect, useState } from "react";

interface ButtonGetStartedProps {
  className?: string;
  width?: string;
}

export default function ButtonGetStarted({
  className,
  width,
}: ButtonGetStartedProps) {
  const dashboardURL = "/dashboard";
  const [mounted, setMounted] = useState(false);
  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render until mounted to avoid hydration mismatch
  if (!mounted || isPending) {
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
