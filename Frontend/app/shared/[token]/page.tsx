"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import FeatureBoardClient from "@/app/components/FeatureBoardClient";
import { AccessLevel, getSharedBoard } from "@/lib/feedback-api";

type SharedBoard = {
  boardId: number;
  boardName: string;
  accessLevel: AccessLevel;
};

export default function SharedBoardPage() {
  const params = useParams<{ token: string | string[] }>();
  // Catch-all route params may arrive as an array, so we normalize once to keep
  // downstream fetch logic deterministic.
  const token = Array.isArray(params?.token)
    ? params.token[0]
    : params?.token || "";
  const [board, setBoard] = useState<SharedBoard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    const run = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getSharedBoard(token);
        setBoard(data);
      } catch (error: unknown) {
        if (error && typeof error === "object" && "response" in error) {
          const axiosError = error as {
            response?: { status?: number; data?: { detail?: string } };
          };
          if (axiosError.response?.status === 404) {
            // Invalid links are common share-path failures, so we provide an
            // explicit message that guides users instead of generic API text.
            setError("This share link is invalid or expired.");
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

    run();
  }, [token]);

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

  if (error || !board) {
    return (
      <div className="min-h-screen bg-[#F5F5F7]">
        <div className="mx-auto w-full max-w-5xl px-6 py-8 md:px-10">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
            <span>{error || "Unable to load board"}</span>
          </div>

          <div className="mt-4">
            <Link
              href="/"
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#E5E7EB] bg-white px-4 text-sm font-medium text-[#0B0B0C] hover:bg-[#F9FAFB]"
            >
              Go to home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F7]">
      <div className="mx-auto w-full max-w-5xl px-6 py-8 md:px-10">
        <div className="mb-4">
          <Link
            href="/"
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#E5E7EB] bg-white px-4 text-sm font-medium text-[#0B0B0C] hover:bg-[#F9FAFB]"
          >
            FeedersLab home
          </Link>
        </div>

        <FeatureBoardClient
          mode="shared"
          boardId={board.boardId}
          boardName={board.boardName}
          shareToken={token}
          accessLevel={board.accessLevel}
        />
      </div>
    </div>
  );
}
