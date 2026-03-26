import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { auth } from "@/lib/better-auth";
import { headers } from "next/headers";
import DashboardWrapper from "./DashboardWrapper";

export default async function LayoutDashboard({
  children,
}: {
  children: ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user) redirect("/sign-in");

  return <DashboardWrapper>{children}</DashboardWrapper>;
}
