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
      <div className="min-h-screen bg-base-200 flex items-center justify-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center p-4">
        <div className="alert alert-error max-w-md">
          <span>{error}</span>
        </div>
      </div>
    );
  }

  // Board content
  return (
    <div className="min-h-screen bg-base-200">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-base-100 rounded-3xl p-8 shadow-sm">
          <h1 className="text-3xl font-bold mb-2">{board?.board_name}</h1>
          <p className="text-sm text-base-content/60 mb-8">
            Public Board • Created{" "}
            {new Date(board?.created_at || "").toLocaleDateString()}
          </p>

          {/* Public board content area - placeholder for future features */}
          <div className="bg-base-200 rounded-2xl p-8 text-center">
            <p className="text-base-content/60">
              This is a public view of the board
            </p>
            <p className="text-sm text-base-content/40 mt-2">
              Content will be displayed here
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
