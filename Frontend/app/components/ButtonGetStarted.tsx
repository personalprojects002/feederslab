"use client";
import { authClient } from "@/lib/auth-client";
import Link from "next/link";
import { useEffect, useState } from "react";

interface ButtonGetStartedProps {
  className?: string;
  width?: string;
  variant?: "dark" | "light";
}

export default function ButtonGetStarted({
  className,
  width,
  variant = "dark",
}: ButtonGetStartedProps) {
  const dashboardURL = "/dashboard";
  const [mounted, setMounted] = useState(false);
  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    setMounted(true);
  }, []);

  const baseClasses = `inline-flex items-center justify-center px-5 py-3 text-sm font-semibold transition-colors ${
    width ?? ""
  } ${className ?? "rounded-xl"}`;

  const variantClasses =
    variant === "light"
      ? "bg-white text-black hover:bg-gray-100"
      : "bg-[#0B0B0C] text-white hover:bg-[#1F2937]";

  // Don't render until mounted to avoid hydration mismatch
  if (!mounted || isPending) {
    return (
      <Link href="/sign-in" className={`${baseClasses} ${variantClasses}`}>
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
      <Link href={dashboardURL} className={`${baseClasses} ${variantClasses}`}>
        {`Welcome ${displayName}`}
      </Link>
    );
  }

  return (
    <Link href="/sign-in" className={`${baseClasses} ${variantClasses}`}>
      Get Started
    </Link>
  );
}
