"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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

export default function PublicFeedbackBoard({ params }: Props) {
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
          router.push("/");
          return;
        }

        // Fetch board from FastAPI backend (public endpoint)
        const response = await backendApi.get(`/boards/${boardId}`);
        setBoard(response.data);
      } catch (error: unknown) {
        console.error("Error fetching board:", error);

        if (error && typeof error === "object" && "response" in error) {
          const axiosError = error as {
            response?: { status?: number; data?: { detail?: string } };
          };

          if (axiosError.response?.status === 404) {
            setError("Board not found");
            setTimeout(() => router.push("/"), 2000);
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
      <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center p-4">
        <div className="max-w-md rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <span>{error}</span>
        </div>
      </div>
    );
  }

  // Board content
  return (
    <div className="min-h-screen bg-[#F5F5F7]">
      <div className="max-w-4xl mx-auto px-6 py-8 md:px-10">
        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-7 md:p-8">
          <h1 className="text-2xl font-semibold tracking-tight text-[#0B0B0C] md:text-3xl">
            {board?.board_name}
          </h1>
          <p className="mt-2 text-sm text-gray-500 mb-8">
            Public Board • Created{" "}
            {new Date(board?.created_at || "").toLocaleDateString()}
          </p>

          <div className="rounded-xl border border-dashed border-[#D1D5DB] bg-[#FAFAFB] p-8 text-center">
            <p className="text-sm text-gray-600">
              This is a public view of the board
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Content will be displayed here
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
