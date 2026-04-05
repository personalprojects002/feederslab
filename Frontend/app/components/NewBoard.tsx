"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import backendApi from "@/lib/backend-api";

export default function NewBoard() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    setIsLoading(true);

    try {
      const response = await backendApi.post("/boards/", {
        boardName: name,
      });

      console.log("Board created successfully:", response.data);
      toast.success("Board created");
      setName("");

      if (typeof window !== "undefined") {
        // Broadcast keeps sidebar/list widgets in sync without introducing a
        // heavyweight shared-state dependency.
        window.dispatchEvent(new Event("boards:changed"));
      }

      // refresh updates server-rendered dashboard surfaces that depend on board
      // queries while preserving current client state.
      router.refresh();
    } catch (error: unknown) {
      let errorMessage = "Something went wrong";

      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as {
          response?: { data?: { detail?: string } };
          message?: string;
        };
        if (axiosError.response?.data?.detail) {
          errorMessage = axiosError.response.data.detail;
        } else if (axiosError.message) {
          errorMessage = axiosError.message;
        }
      }

      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex flex-col gap-5">
        <div className="space-y-1.5">
          <p className="dashboard-newboard-eyebrow">Board setup</p>
          <h2 className="dashboard-newboard-title text-xl font-semibold tracking-tight md:text-2xl">
            Create a board
          </h2>
          <p className="dashboard-newboard-subtitle text-sm">
            Name your workspace and start collecting feedback in seconds.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <label className="dashboard-newboard-label mb-2 block text-xs font-semibold uppercase tracking-[0.08em]">
              Board name
            </label>
            <input
              type="text"
              required
              value={name}
              placeholder="e.g. Feature Requests"
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
              className="dashboard-newboard-input h-12 w-full rounded-xl border px-4 text-sm outline-none transition"
            />
          </div>

          <button
            type="submit"
            className="dashboard-newboard-button inline-flex h-12 items-center justify-center rounded-xl px-6 text-sm font-semibold transition-colors"
          >
            {isLoading ? (
              <span className="loading loading-spinner loading-sm"></span>
            ) : (
              "Create board"
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
