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
      <div className="bg-base-200 min-h-screen">
        <div className="bg-base-200 shadow-sm">
          <div className="max-w-5xl mx-auto px-4 py-4 flex justify-end">
            <Link href="/dashboard" className="btn btn-neutral">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-4 h-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3"
                />
              </svg>
              Back
            </Link>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="flex justify-center py-12">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-base-200 min-h-screen">
        <div className="bg-base-200 shadow-sm">
          <div className="max-w-5xl mx-auto px-4 py-4 flex justify-end">
            <Link href="/dashboard" className="btn btn-neutral">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-4 h-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3"
                />
              </svg>
              Back
            </Link>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="alert alert-error">
            <span>{error}</span>
          </div>
        </div>
      </div>
    );
  }

  // Board content
  return (
    <div className="bg-base-200 min-h-screen">
      <div className="bg-base-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4 flex justify-end">
          <Link href="/dashboard" className="btn btn-neutral">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-4 h-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3"
              />
            </svg>
            Back
          </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-4">{board?.board_name}</h1>
        <div className="text-sm text-base-content/60 mb-8">
          Created on {new Date(board?.created_at || "").toLocaleDateString()}
        </div>

        {/* Board content area - placeholder for future features */}
        <div className="bg-base-100 rounded-3xl p-8 text-center">
          <p className="text-base-content/60">
            Board content will be displayed here
          </p>
        </div>
      </div>
    </div>
  );
}
