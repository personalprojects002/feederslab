"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import backendApi from "@/lib/backend-api";

type Props = {
  params: Promise<{ boardId: string }>;
};

interface Board {
  id: number;
  board_name: string;
  user_id: number;
  created_at: string;
  updated_at: string;
}

export default function FeedbackBoard({ params }: Props) {
  const router = useRouter();
  const [boardId, setBoardId] = useState<string>("");
  const [board, setBoard] = useState<Board | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    params.then((resolvedParams) => {
      setBoardId(resolvedParams.boardId);
    });
  }, [params]);

  useEffect(() => {
    if (!boardId) return;

    const fetchBoard = async () => {
      try {
        setLoading(true);
        setError(null);

        // Validate boardId is a number
        if (isNaN(Number(boardId))) {
          router.push("/dashboard");
          return;
        }

        // Fetch board from FastAPI backend
        const response = await backendApi.get(`/boards/${boardId}`);
        setBoard(response.data);
      } catch (error: unknown) {
        console.error("Error fetching board:", error);

        if (error && typeof error === "object" && "response" in error) {
          const axiosError = error as {
            response?: { status?: number; data?: { detail?: string } };
          };

          if (axiosError.response?.status === 401) {
            // Not authenticated
            router.push("/sign-in");
          } else if (axiosError.response?.status === 403) {
            // Not authorized to view this board
            setError("You don't have permission to view this board");
            setTimeout(() => router.push("/dashboard"), 2000);
          } else if (axiosError.response?.status === 404) {
            // Board not found
            setError("Board not found");
            setTimeout(() => router.push("/dashboard"), 2000);
          } else {
            setError(
              axiosError.response?.data?.detail || "Failed to load board",
            );
          }
        } else {
          setError("Failed to load board");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchBoard();
  }, [boardId, router]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F5F7]">
        <div className="mx-auto w-full max-w-5xl px-6 py-8 md:px-10">
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-10">
            <div className="flex justify-center py-12">
              <span className="loading loading-spinner loading-lg"></span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-[#F5F5F7]">
        <div className="mx-auto w-full max-w-5xl px-6 py-8 md:px-10">
          <div className="mb-5">
            <Link
              href="/dashboard"
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#E5E7EB] bg-white px-4 text-sm font-medium text-[#0B0B0C] hover:bg-[#F9FAFB]"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="h-4 w-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3"
                />
              </svg>
              Back to dashboard
            </Link>
          </div>

          <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
            <span>{error}</span>
          </div>
        </div>
      </div>
    );
  }

  // Board content
  return (
    <div className="min-h-screen bg-[#F5F5F7]">
      <div className="mx-auto w-full max-w-5xl px-6 py-8 md:px-10">
        <div className="mb-5">
          <Link
            href="/dashboard"
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#E5E7EB] bg-white px-4 text-sm font-medium text-[#0B0B0C] hover:bg-[#F9FAFB]"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="h-4 w-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3"
              />
            </svg>
            Back to dashboard
          </Link>
        </div>

        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-7 md:p-8">
          <h1 className="text-2xl font-semibold tracking-tight text-[#0B0B0C] md:text-3xl">
            {board?.board_name}
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Created on {new Date(board?.created_at || "").toLocaleDateString()}
          </p>

          <div className="mt-6 rounded-xl border border-dashed border-[#D1D5DB] bg-white p-8 text-center">
            <p className="text-sm text-gray-600">
              Board content will appear here.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
