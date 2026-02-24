"use client";

import type { ReactNode } from "react";
import { Toaster } from "react-hot-toast";
import { Suspense } from "react";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <>
      <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: {
            background: "#333",
            color: "#fff",
          },
        }}
      />
    </>
  );
}
