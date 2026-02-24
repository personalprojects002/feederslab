"use client";

import { authClient } from "@/lib/auth-client";
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
        await authClient.signOut();
        window.location.href = "/";
      }}
    >
      Sign Out
    </button>
  );
}
