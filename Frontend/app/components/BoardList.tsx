"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import ShareBoardModal from "@/app/components/ShareBoardModal";
import {
  BoardRecord,
  deleteOwnerBoard,
  getOwnedBoards,
} from "@/lib/feedback-api";

export default function BoardList() {
  const [boards, setBoards] = useState<BoardRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(true);
  const [deletingBoardId, setDeletingBoardId] = useState<number | null>(null);
  const [shareBoardId, setShareBoardId] = useState<number | null>(null);

  const fetchBoards = async () => {
    try {
      setLoading(true);
      setError(null);

      const owned = await getOwnedBoards();
      setBoards(owned);
    } catch (error: unknown) {
      console.error("Error fetching boards:", error);

      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as {
          response?: { status?: number; data?: { detail?: string } };
        };
        if (axiosError.response?.status === 401) {
          setError("Please sign in to view your boards");
        } else if (axiosError.response?.status === 403) {
          setBoards([]);
          setError("Subscription required. Please subscribe to create boards.");
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

  const handleDeleteBoard = async (board: BoardRecord) => {
    const confirmed = window.confirm(
      `Delete \"${board.board_name}\"? This action cannot be undone.`,
    );
    if (!confirmed) return;

    try {
      setDeletingBoardId(board.id);
      await deleteOwnerBoard(board.id);
      toast.success("Board deleted");
      window.dispatchEvent(new Event("boards:changed"));
      await fetchBoards();
    } catch (error: unknown) {
      let message = "Failed to delete board";
      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as {
          response?: { data?: { detail?: string } };
        };
        if (axiosError.response?.data?.detail) {
          message = axiosError.response.data.detail;
        }
      }
      toast.error(message);
    } finally {
      setDeletingBoardId(null);
    }
  };

  useEffect(() => {
    fetchBoards();

    const handleBoardsChanged = () => {
      // BoardList follows the same event contract as sidebar so both views stay
      // in sync after mutations triggered elsewhere in the app.
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
      <div className="mx-auto w-full max-w-6xl rounded-2xl border border-[#E5E7EB] bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold tracking-tight text-[#0B0B0C]">
            Your boards
          </h2>
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            className="inline-flex items-center rounded-lg border border-black px-2.5 py-1 text-xs font-semibold text-black hover:bg-black hover:text-white"
          >
            {expanded ? "Collapse" : "Expand"}
          </button>
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
      <div className="mx-auto w-full max-w-6xl rounded-2xl border border-[#E5E7EB] bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold tracking-tight text-[#0B0B0C]">
            Your boards
          </h2>
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            className="inline-flex items-center rounded-lg border border-black px-2.5 py-1 text-xs font-semibold text-black hover:bg-black hover:text-white"
          >
            {expanded ? "Collapse" : "Expand"}
          </button>
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
      <div className="mx-auto w-full max-w-6xl rounded-2xl border border-[#E5E7EB] bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold tracking-tight text-[#0B0B0C]">
            Your boards
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">0</span>
            <button
              type="button"
              onClick={() => setExpanded((prev) => !prev)}
              className="inline-flex items-center rounded-lg border border-black px-2.5 py-1 text-xs font-semibold text-black hover:bg-black hover:text-white"
            >
              {expanded ? "Collapse" : "Expand"}
            </button>
          </div>
        </div>
        {expanded ? (
          <div className="rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] py-12 text-center">
            <p className="mb-2 text-base font-medium text-[#0B0B0C]">
              No boards yet
            </p>
            <p className="text-sm text-gray-500">
              Create your first board above to get started
            </p>
          </div>
        ) : null}
      </div>
    );
  }

  // Boards list
  return (
    <div className="mx-auto w-full max-w-6xl rounded-2xl border border-[#E5E7EB] bg-white p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold tracking-tight text-[#0B0B0C]">
          Your boards
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">{boards.length}</span>
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            className="inline-flex items-center rounded-lg border border-black px-2.5 py-1 text-xs font-semibold text-black hover:bg-black hover:text-white"
          >
            {expanded ? "Collapse" : "Expand"}
          </button>
        </div>
      </div>

      {expanded ? (
        <div className="flex flex-col gap-4">
          {boards.map((board) => (
            <div
              key={board.id}
              className="group flex items-start gap-2 rounded-xl border border-[#E5E7EB] bg-white p-3 transition-colors hover:bg-[#F9FAFB]"
            >
              <Link
                href={`/dashboard/b/${board.id}`}
                className="block flex-1 rounded-lg p-2"
              >
                <h3 className="text-lg font-medium tracking-tight text-[#0B0B0C]">
                  {board.board_name || "Untitled Board"}
                </h3>
                <p className="mt-2 text-xs text-gray-500">
                  Created {new Date(board.created_at).toLocaleDateString()}
                </p>
              </Link>
              <button
                type="button"
                onClick={() => setShareBoardId(board.id)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-xs text-gray-600 hover:bg-black hover:text-white"
                aria-label={`Share ${board.board_name}`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.7}
                  className="h-4 w-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M7 12a5 5 0 0 1 5-5h5m0 0-3-3m3 3-3 3M17 12a5 5 0 0 1-5 5H7m0 0 3 3m-3-3 3-3"
                  />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => handleDeleteBoard(board)}
                disabled={deletingBoardId === board.id}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-xs text-gray-500 hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label={`Delete ${board.board_name}`}
              >
                {deletingBoardId === board.id ? (
                  "..."
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.7}
                    className="h-4 w-4"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 7h12M10 7V5h4v2m-6 0 1 12h6l1-12"
                    />
                  </svg>
                )}
              </button>
            </div>
          ))}
        </div>
      ) : null}

      <ShareBoardModal
        boardId={shareBoardId ?? 0}
        open={shareBoardId !== null}
        onClose={() => setShareBoardId(null)}
      />
    </div>
  );
}
