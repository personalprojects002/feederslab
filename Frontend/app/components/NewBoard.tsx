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
      // API Call: POST /boards/
      // Token is automatically included by backendApi interceptor
      const response = await backendApi.post("/boards/", {
        boardName: name,
      });

      console.log("Board created successfully:", response.data);
      toast.success("Board Created");

      setName("");

      // Trigger a refresh to update the BoardList component
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
    <form
      onSubmit={handleSubmit}
      className="bg-base-100 w-full max-w-md rounded-3xl shadow-xl border border-base-200"
    >
      <div className="p-8 flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-base-content tracking-tight">
            Create a new Board
          </h1>
          <p className="text-base-content/60 text-sm mt-1">
            Start collecting feedback in seconds
          </p>
        </div>

        <div className="w-full">
          <label className="label">
            <span className="label-text text-base-content">Board Name</span>
          </label>

          <input
            type="text"
            required
            value={name}
            placeholder="e.g. Feature Requests"
            onChange={(e) => setName(e.target.value)}
            disabled={isLoading}
            className="input input-bordered w-full h-12 px-4 rounded-2xl focus:outline-none focus:border-black/30 focus:ring-1 focus:ring-black/10 transition-all duration-200 bg-base-50"
          />
        </div>

        <button
          type="submit"
          className="btn btn-primary w-full h-12 rounded-xl shadow-lg hover:shadow-primary/40 transition-all duration-300 font-semibold text-lg"
        >
          {isLoading ? (
            <span className="loading loading-spinner loading-sm"></span>
          ) : (
            "Create Board"
          )}
        </button>
      </div>
    </form>
  );
}
