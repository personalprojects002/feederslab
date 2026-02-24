"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import backendApi from "@/lib/backend-api";

interface Board {
  id: number;
  board_name: string;
  user_id: number;
  created_at: string;
  updated_at: string;
}

export default function BoardList() {
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBoards = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await backendApi.get("/boards/");
      console.log("Fetched boards:", response.data);
      setBoards(response.data);
    } catch (error: unknown) {
      console.error("Error fetching boards:", error);

      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as {
          response?: { status?: number; data?: { detail?: string } };
        };
        if (axiosError.response?.status === 401) {
          setError("Please sign in to view your boards");
        } else if (axiosError.response?.data?.detail) {
          setError(axiosError.response.data.detail);
        } else {
          setError("Failed to load boards");
        }
      } else {
        setError("Failed to load boards");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBoards();

    const handleBoardsChanged = () => {
      fetchBoards();
    };

    window.addEventListener("boards:changed", handleBoardsChanged);

    return () => {
      window.removeEventListener("boards:changed", handleBoardsChanged);
    };
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className="mx-auto w-full max-w-2xl rounded-2xl border border-[#E5E7EB] bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold tracking-tight text-[#0B0B0C]">
            Your boards
          </h2>
        </div>
        <div className="flex justify-center py-10">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="mx-auto w-full max-w-2xl rounded-2xl border border-[#E5E7EB] bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold tracking-tight text-[#0B0B0C]">
            Your boards
          </h2>
        </div>
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <span>{error}</span>
        </div>
      </div>
    );
  }

  // Empty state
  if (boards.length === 0) {
    return (
      <div className="mx-auto w-full max-w-2xl rounded-2xl border border-[#E5E7EB] bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold tracking-tight text-[#0B0B0C]">
            Your boards
          </h2>
          <span className="text-sm text-gray-500">0</span>
        </div>
        <div className="rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] py-12 text-center">
          <p className="mb-2 text-base font-medium text-[#0B0B0C]">
            No boards yet
          </p>
          <p className="text-sm text-gray-500">
            Create your first board above to get started
          </p>
        </div>
      </div>
    );
  }

  // Boards list
  return (
    <div className="mx-auto w-full max-w-2xl rounded-2xl border border-[#E5E7EB] bg-white p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold tracking-tight text-[#0B0B0C]">
          Your boards
        </h2>
        <span className="text-sm text-gray-500">{boards.length}</span>
      </div>

      <div className="flex flex-col gap-4">
        {boards.map((board) => (
          <Link
            key={board.id}
            href={`/dashboard/b/${board.id}`}
            className="group block rounded-xl border border-[#E5E7EB] bg-white p-5 transition-colors hover:bg-[#F9FAFB]"
          >
            <h3 className="text-lg font-medium tracking-tight text-[#0B0B0C]">
              {board.board_name || "Untitled Board"}
            </h3>
            <p className="mt-2 text-xs text-gray-500">
              Created {new Date(board.created_at).toLocaleDateString()}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
