"use client";

import type { ReactNode } from "react";
import { Toaster } from "react-hot-toast";
import { Suspense } from "react";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <>
      <Suspense
        fallback={
          <div
            className="flex min-h-screen items-center justify-center"
            aria-busy="true"
          >
            <span className="loading loading-spinner loading-lg" />
          </div>
        }
      >
        {children}
      </Suspense>
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
