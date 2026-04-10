"use client";

import { authClient } from "@/lib/auth-client";
import backendApi from "@/lib/backend-api";
type ButtonLogoutProps = {
  color?: string;
};

export default function ButtonLogout({ color }: ButtonLogoutProps) {
  return (
    <button
      className={`${
        color
          ? color
          : "inline-flex h-11 items-center justify-center rounded-xl border border-[#E5E7EB] bg-white px-5 text-sm font-semibold text-[#0B0B0C] transition-colors hover:bg-[#F9FAFB]"
      }`}
      onClick={async () => {
        try {
          await backendApi.post("/auth/logout", {});
        } catch {
          // Even if backend logout logging fails, continue sign-out to avoid trapping the user.
        }
        await authClient.signOut();
        window.location.href = "/";
      }}
    >
      Sign Out
    </button>
  );
}
