"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { AccessLevel, createShareLink } from "@/lib/feedback-api";

type ShareBoardModalProps = {
  boardId: number;
  open: boolean;
  onClose: () => void;
};

export default function ShareBoardModal({
  boardId,
  open,
  onClose,
}: ShareBoardModalProps) {
  // Access level is kept local until submission so users can safely evaluate
  // permission options before generating a durable public link.
  const [accessLevel, setAccessLevel] = useState<AccessLevel>("create_upvote");
  const [isCreating, setIsCreating] = useState(false);
  const [shareUrl, setShareUrl] = useState("");

  if (!open) {
    return null;
  }

  const handleCreate = async () => {
    if (isCreating) return;

    try {
      setIsCreating(true);
      const result = await createShareLink(boardId, accessLevel);
      // Persisting URL in state gives users visible confirmation of the exact
      // link generated, even if clipboard write later fails.
      setShareUrl(result.shareUrl);
      await navigator.clipboard.writeText(result.shareUrl);
      toast.success("Share link copied");
    } catch (error: unknown) {
      let message = "Failed to create share link";
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
      setIsCreating(false);
    }
  };

  const handleCopyLink = async () => {
    if (!shareUrl) return;

    try {
      // Explicit copy action supports users who want to regenerate clipboard
      // contents after context-switching to other apps.
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Link copied");
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const handleOpenLink = () => {
    if (!shareUrl) return;
    window.open(shareUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="dashboard-share-overlay fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="dashboard-share-modal w-full max-w-xl rounded-2xl border p-6 shadow-2xl md:p-7">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="dashboard-share-title text-xl font-semibold tracking-tight">
              Share board
            </h2>
            <p className="dashboard-share-subtitle mt-1 text-sm">
              Choose who can create features and who can only upvote.
            </p>
          </div>
          <button
            onClick={onClose}
            className="dashboard-share-close inline-flex h-9 w-9 items-center justify-center rounded-lg border"
            aria-label="Close"
          >
            x
          </button>
        </div>

        <div className="space-y-3">
          <label className="dashboard-share-option flex cursor-pointer items-start gap-3 rounded-xl border p-4">
            <input
              type="radio"
              name="access"
              className="mt-1"
              checked={accessLevel === "create_upvote"}
              onChange={() => setAccessLevel("create_upvote")}
            />
            <div>
              <div className="dashboard-share-option-title text-sm font-semibold">
                Create + Upvote
              </div>
              <div className="dashboard-share-option-text text-xs">
                Users can create features and upvote.
              </div>
            </div>
          </label>

          <label className="dashboard-share-option flex cursor-pointer items-start gap-3 rounded-xl border p-4">
            <input
              type="radio"
              name="access"
              className="mt-1"
              checked={accessLevel === "upvote_only"}
              onChange={() => setAccessLevel("upvote_only")}
            />
            <div>
              <div className="dashboard-share-option-title text-sm font-semibold">
                Upvote only
              </div>
              <div className="dashboard-share-option-text text-xs">
                Users can only upvote existing features.
              </div>
            </div>
          </label>
        </div>

        {shareUrl ? (
          <div className="dashboard-share-url mt-5 rounded-xl border p-3 text-xs">
            {shareUrl}
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            onClick={handleCreate}
            disabled={isCreating}
            className="dashboard-share-primary-btn inline-flex h-11 items-center justify-center rounded-xl px-5 text-sm font-semibold transition-colors disabled:opacity-60"
          >
            {isCreating ? (
              <span className="loading loading-spinner loading-xs" />
            ) : (
              "Create and copy link"
            )}
          </button>
          <button
            onClick={handleCopyLink}
            disabled={!shareUrl}
            className="dashboard-share-secondary-btn inline-flex h-11 items-center justify-center rounded-xl border px-5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
          >
            Copy again
          </button>
          <button
            onClick={handleOpenLink}
            disabled={!shareUrl}
            className="dashboard-share-secondary-btn inline-flex h-11 items-center justify-center rounded-xl border px-5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
          >
            Open link
          </button>
          <button
            onClick={onClose}
            className="dashboard-share-secondary-btn inline-flex h-11 items-center justify-center rounded-xl border px-5 text-sm font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
