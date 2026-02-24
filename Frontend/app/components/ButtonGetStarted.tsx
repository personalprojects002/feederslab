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
  const [isClient, setIsClient] = useState(false);
  const dashboardURL = "/dashboard";
  const { data: session, isPending, error } = authClient.useSession();
  useEffect(() => {
    setIsClient(true);
  }, []);
  if (!isClient || isPending) {
    return (
      <Link
        href="/sign-in"
        className={`btn btn-primary px-5 py-6 ${width ?? ""} ${
          className ?? "rounded-3xl"
        }`}
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
        className={`btn btn-primary px-5 py-6 ${width ?? ""} ${
          className ?? "rounded-3xl"
        }`}
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
        className={`btn btn-primary px-5 py-6 ${width ?? ""} ${
          className ?? "rounded-3xl"
        }`}
      >
        {`Welcome ${displayName}`}
      </Link>
    );
  }

  return (
    <Link
      href="/sign-in"
      className={`btn btn-primary px-5 py-6 ${width ?? ""} ${
        className ?? "rounded-3xl"
      }`}
    >
      Get Started
    </Link>
  );
}
