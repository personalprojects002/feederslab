"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
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
  const pathname = usePathname();
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBoards();
  }, [pathname]); // Only refresh when pathname changes (triggered by router.refresh())

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

  // Loading state
  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 mb-12">
        <div className="text-xl card-title mb-4">
          <span>Your Boards</span>
        </div>
        <div className="flex justify-center py-8">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-4 mb-12">
        <div className="text-xl card-title mb-4">
          <span>Your Boards</span>
        </div>
        <div className="alert alert-error">
          <span>{error}</span>
        </div>
      </div>
    );
  }

  // Empty state
  if (boards.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 mb-12">
        <div className="text-xl card-title mb-4">
          <span>Your Boards</span>
          <span className="text-base-content/60">(0)</span>
        </div>
        <div className="text-center py-12 bg-base-200 rounded-3xl">
          <p className="text-base-content/60 mb-2">No boards yet</p>
          <p className="text-sm text-base-content/40">
            Create your first board above to get started
          </p>
        </div>
      </div>
    );
  }

  // Boards list
  return (
    <div className="max-w-3xl mx-auto px-4 mb-12">
      <div className="text-xl card-title mb-4">
        <span>Your Boards</span>
        <span className="text-base-content/60">({boards.length})</span>
      </div>

      <div className="flex flex-col gap-4">
        {boards.map((board) => (
          <Link
            key={board.id}
            href={`/dashboard/b/${board.id}`}
            className="group bg-base-100 p-6 rounded-3xl shadow-sm hover:shadow-md transition-all duration-500 ease-in-out border border-black/10 block hover:bg-neutral hover:scale-[1.02]"
          >
            <h3 className="text-lg font-medium tracking-tight text-base-content group-hover:text-white antialiased">
              {board.board_name || "Untitled Board"}
            </h3>
            <p className="text-xs text-base-content/40 group-hover:text-white/60 mt-2">
              Created {new Date(board.created_at).toLocaleDateString()}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
