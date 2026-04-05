"use client";

import type { ReactNode } from "react";
import { Toaster } from "react-hot-toast";
import { Suspense } from "react";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <>
      {/* Root Suspense ensures async route trees can show a consistent loading
          fallback during streaming/navigation transitions. */}
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
      {/* A single global toaster keeps UX feedback consistent across pages and
          avoids each component mounting duplicate toast containers. */}
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
