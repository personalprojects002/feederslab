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
        window.dispatchEvent(new Event("boards:changed"));
      }

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

      console.error("Error creating board:", errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex flex-col gap-6">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-[#0B0B0C] md:text-2xl">
            Create a new board
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Give your board a clear name so your team can start collecting
            useful feedback.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <label className="mb-2 block text-sm font-medium text-[#0B0B0C]">
              Board name
            </label>
            <input
              type="text"
              required
              value={name}
              placeholder="e.g. Feature Requests"
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
              className="h-12 w-full rounded-xl border border-[#E5E7EB] bg-white px-4 text-sm text-[#0B0B0C] outline-none transition focus:border-[#0B0B0C]"
            />
          </div>

          <button
            type="submit"
            className="inline-flex h-12 items-center justify-center rounded-xl bg-[#0B0B0C] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#1F2937]"
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
