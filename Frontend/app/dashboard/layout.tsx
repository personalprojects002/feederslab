import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { auth } from "@/lib/better-auth.server";
import { headers } from "next/headers";
import DashboardWrapper from "@/app/dashboard/DashboardWrapper";

async function getSessionSafely() {
  try {
    return await auth.api.getSession({
      headers: await headers(),
    });
  } catch {
    // Treat transient auth/db outages as an unauthenticated state.
    return null;
  }
}

export default async function LayoutDashboard({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getSessionSafely();
  if (!session?.user) redirect("/sign-in");

  return <DashboardWrapper>{children}</DashboardWrapper>;
}
