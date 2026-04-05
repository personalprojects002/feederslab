"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import FeatureBoardClient from "@/app/components/FeatureBoardClient";
import { getOwnerBoard } from "@/lib/feedback-api";

type Props = {
  params: Promise<{ boardId: string }>;
};

interface Board {
  id: number;
  board_name: string;
  user_id: string;
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
    // Params arrive as a promise in this setup; resolving once into state keeps
    // downstream effects independent from framework-specific param mechanics.
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

        // Early client-side validation avoids unnecessary network traffic for
        // malformed URLs and quickly returns users to a safe route.
        if (isNaN(Number(boardId))) {
          router.push("/dashboard");
          return;
        }

        const data = await getOwnerBoard(Number(boardId));
        setBoard(data);
      } catch (error: unknown) {
        console.error("Error fetching board:", error);

        if (error && typeof error === "object" && "response" in error) {
          const axiosError = error as {
            response?: { status?: number; data?: { detail?: string } };
          };

          if (axiosError.response?.status === 401) {
            // Authentication failures are redirected instead of rendered inline
            // so protected routes cannot linger in a partially broken state.
            router.push("/sign-in");
          } else if (axiosError.response?.status === 403) {
            // Short delay gives users context before navigation resets them.
            setError("You don't have permission to view this board");
            setTimeout(() => router.push("/dashboard"), 2000);
          } else if (axiosError.response?.status === 404) {
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
      <div className="min-h-screen bg-black">
        <div className="mx-auto w-full max-w-5xl px-6 py-8 md:px-10">
          <div className="rounded-2xl border border-white/15 bg-[#101010] p-10">
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
      <div className="min-h-screen bg-black">
        <div className="mx-auto w-full max-w-5xl px-6 py-8 md:px-10">
          <div className="mb-5">
            <Link
              href="/dashboard"
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/15 bg-[#0B0B0B] px-4 text-sm font-medium text-white hover:bg-[#171717]"
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

  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="mb-4">
        <Link
          href="/dashboard"
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/15 bg-[#0B0B0B] px-4 text-sm font-medium text-white hover:bg-[#171717]"
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

      {board ? (
        <FeatureBoardClient
          mode="owner"
          boardId={board.id}
          boardName={board.board_name}
        />
      ) : null}
    </div>
  );
}
