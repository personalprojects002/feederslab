"use client";

import { authClient } from "@/lib/auth-client";
type ButtonLogoutProps = {
  color?: string;
};

export default function ButtonLogout({ color }: ButtonLogoutProps) {
  return (
    <button
      className={`${color ? color : "btn btn-primary"} px-5 py-6 rounded-3xl `}
      onClick={async () => {
        await authClient.signOut();
        window.location.href = "/";
      }}
    >
      Sign Out
    </button>
  );
}
