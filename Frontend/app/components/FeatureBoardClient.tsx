"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  AccessLevel,
  FeatureRecord,
  createOwnerFeature,
  createSharedFeature,
  deleteOwnerBoard,
  deleteOwnerFeature,
  deleteSharedFeature,
  getOwnerFeatures,
  getSharedFeatures,
  setOwnerUpvote,
  setSharedUpvote,
} from "@/lib/feedback-api";
import ShareBoardModal from "@/app/components/ShareBoardModal";

type FeatureBoardClientProps = {
  mode: "owner" | "shared";
  boardId: number;
  boardName: string;
  shareToken?: string;
  accessLevel?: AccessLevel;
};

function getOrCreateLocalKey(storageKey: string) {
  if (typeof window === "undefined") return "";

  const existing = window.localStorage.getItem(storageKey);
  if (existing) return existing;

  const generated = `${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
  // Persisting a stable local key lets anonymous collaborators keep ownership
  // over their own feature actions across refreshes in the same browser.
  window.localStorage.setItem(storageKey, generated);
  return generated;
}

async function detectPrivateBrowsingMode(): Promise<boolean> {
  if (typeof window === "undefined") return false;

  // In some private modes, localStorage writes fail immediately.
  try {
    const testKey = "__feeders_private_mode_ls_test__";
    window.localStorage.setItem(testKey, "1");
    window.localStorage.removeItem(testKey);
  } catch {
    return true;
  }

  // Chromium private windows usually expose a much smaller storage quota.
  try {
    if (navigator.storage?.estimate) {
      const estimate = await navigator.storage.estimate();
      if (typeof estimate.quota === "number") {
        const lowQuotaThreshold = 120 * 1024 * 1024;
        if (estimate.quota < lowQuotaThreshold) {
          return true;
        }
      }
    }
  } catch {
    // Ignore and continue with the next strategy.
  }

  // Some browsers block IndexedDB in private contexts.
  try {
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.open("__feeders_private_mode_idb_test__", 1);

      request.onupgradeneeded = () => {
        // no-op
      };

      request.onsuccess = () => {
        request.result.close();
        indexedDB.deleteDatabase("__feeders_private_mode_idb_test__");
        resolve();
      };

      request.onerror = () => {
        reject(request.error || new Error("IndexedDB unavailable"));
      };

      request.onblocked = () => {
        resolve();
      };
    });
  } catch {
    return true;
  }

  return false;
}

export default function FeatureBoardClient({
  mode,
  boardId,
  boardName,
  shareToken,
  accessLevel,
}: FeatureBoardClientProps) {
  const router = useRouter();
  const isOwner = mode === "owner";
  const canCreate = isOwner || accessLevel === "create_upvote";

  const voteScope = isOwner ? `owner_${boardId}` : `shared_${shareToken}`;
  // Vote state is scoped per board/share context so interactions on one board
  // never leak into another and confuse users.
  const votesStorageKey = `feeders_upvotes_${voteScope}`;
  const voterKeyStorage = `feeders_voter_key`;
  const creatorKeyStorage = `feeders_creator_key_${shareToken}`;

  const [features, setFeatures] = useState<FeatureRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const [upvoteState, setUpvoteState] = useState<Record<number, boolean>>({});
  const [busyFeatureId, setBusyFeatureId] = useState<number | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [isPrivateMode, setIsPrivateMode] = useState(false);
  const [privateModeChecked, setPrivateModeChecked] = useState(false);

  const emitFeaturesChanged = (detail?: Record<string, unknown>) => {
    if (typeof window === "undefined") return;
    // A lightweight window event keeps sidebar/insight widgets in sync without
    // introducing global state dependencies.
    window.dispatchEvent(
      new CustomEvent("features:changed", {
        detail: {
          boardId,
          ...detail,
        },
      }),
    );
  };

  const clientKey = useMemo(
    () => (isOwner ? "" : getOrCreateLocalKey(creatorKeyStorage)),
    [creatorKeyStorage, isOwner],
  );

  const voterKey = useMemo(
    () => getOrCreateLocalKey(voterKeyStorage),
    [voterKeyStorage],
  );

  const loadVotes = () => {
    if (typeof window === "undefined") return;

    const raw = window.localStorage.getItem(votesStorageKey);
    if (!raw) {
      setUpvoteState({});
      return;
    }

    try {
      const parsed = JSON.parse(raw) as Record<number, boolean>;
      setUpvoteState(parsed);
    } catch {
      setUpvoteState({});
    }
  };

  const persistVotes = (next: Record<number, boolean>) => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(votesStorageKey, JSON.stringify(next));
  };

  const fetchFeatures = async () => {
    try {
      setLoading(true);
      const data = isOwner
        ? await getOwnerFeatures(boardId)
        : await getSharedFeatures(shareToken || "");
      setFeatures(data);
    } catch (error: unknown) {
      let message = "Failed to load features";
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
      // Loading is cleared in finally so error paths cannot leave the screen
      // stuck in a permanent spinner state.
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVotes();
    fetchFeatures();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boardId, shareToken, mode]);

  useEffect(() => {
    let isMounted = true;

    const runPrivateModeCheck = async () => {
      try {
        const privateMode = await detectPrivateBrowsingMode();
        if (!isMounted) return;
        setIsPrivateMode(privateMode);
      } finally {
        if (!isMounted) return;
        setPrivateModeChecked(true);
      }
    };

    runPrivateModeCheck();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canCreate || creating) return;

    try {
      setCreating(true);
      if (isOwner) {
        await createOwnerFeature(boardId, { title, description });
      } else {
        await createSharedFeature(shareToken || "", clientKey, {
          title,
          description,
        });
      }
      setTitle("");
      setDescription("");
      await fetchFeatures();
      emitFeaturesChanged();
      toast.success("Feature created");
    } catch (error: unknown) {
      let message = "Failed to create feature";
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
      setCreating(false);
    }
  };

  const canDeleteFeature = (feature: FeatureRecord) => {
    if (isOwner) return true;
    if (!canCreate) return false;
    return feature.creator_client_id === clientKey;
  };

  const handleDeleteFeature = async (feature: FeatureRecord) => {
    if (!window.confirm("Delete this feature?")) return;

    try {
      if (isOwner) {
        await deleteOwnerFeature(boardId, feature.id);
      } else {
        await deleteSharedFeature(shareToken || "", feature.id, clientKey);
      }
      await fetchFeatures();
      emitFeaturesChanged();
      toast.success("Feature deleted");
    } catch (error: unknown) {
      let message = "Failed to delete feature";
      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as {
          response?: { data?: { detail?: string } };
        };
        if (axiosError.response?.data?.detail) {
          message = axiosError.response.data.detail;
        }
      }
      toast.error(message);
    }
  };

  const handleUpvoteToggle = async (feature: FeatureRecord) => {
    if (busyFeatureId) return;

    if (!privateModeChecked) {
      const privateMode = await detectPrivateBrowsingMode();
      setIsPrivateMode(privateMode);
      setPrivateModeChecked(true);
      if (privateMode) {
        toast.error(
          "Close incognito/private mode and open a normal browser window to vote.",
          { id: "vote-private-mode-blocked" },
        );
        return;
      }
    }

    if (isPrivateMode) {
      toast.error(
        "Close incognito/private mode and open a normal browser window to vote.",
        { id: "vote-private-mode-blocked" },
      );
      return;
    }

    const currentlyUpvoted = Boolean(upvoteState[feature.id]);
    const nextUpvoted = !currentlyUpvoted;
    const previousCount = feature.upvotes_count;
    const optimisticCount = Math.max(0, previousCount + (nextUpvoted ? 1 : -1));
    const previousVoteState = { ...upvoteState };

    // Optimistic UI keeps voting responsive while backend confirmation arrives;
    // rollback below preserves correctness if the request fails.
    setFeatures((prev) =>
      prev.map((item) =>
        item.id === feature.id
          ? { ...item, upvotes_count: optimisticCount }
          : item,
      ),
    );

    const optimisticVoteState = {
      ...upvoteState,
      [feature.id]: nextUpvoted,
    };
    setUpvoteState(optimisticVoteState);
    persistVotes(optimisticVoteState);
    emitFeaturesChanged({
      featureId: feature.id,
      upvotesCount: optimisticCount,
    });

    try {
      setBusyFeatureId(feature.id);
      const result = isOwner
        ? await setOwnerUpvote(feature.id, nextUpvoted, voterKey)
        : await setSharedUpvote(
            shareToken || "",
            feature.id,
            nextUpvoted,
            voterKey,
          );

      setFeatures((prev) =>
        prev.map((item) =>
          item.id === feature.id
            ? { ...item, upvotes_count: result.upvotesCount }
            : item,
        ),
      );

      const nextState = {
        ...optimisticVoteState,
        [feature.id]: result.upvoted,
      };
      setUpvoteState(nextState);
      persistVotes(nextState);
      emitFeaturesChanged({
        featureId: feature.id,
        upvotesCount: result.upvotesCount,
      });
    } catch (error: unknown) {
      // Rollback guarantees local state does not drift from server truth after
      // rejected votes or transient network failures.
      setFeatures((prev) =>
        prev.map((item) =>
          item.id === feature.id
            ? { ...item, upvotes_count: previousCount }
            : item,
        ),
      );
      setUpvoteState(previousVoteState);
      persistVotes(previousVoteState);
      emitFeaturesChanged({
        featureId: feature.id,
        upvotesCount: previousCount,
      });

      let message = "Failed to update upvote";
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
      setBusyFeatureId(null);
    }
  };

  const handleDeleteBoard = async () => {
    if (!isOwner) return;
    if (!window.confirm("Delete this board? This action cannot be undone."))
      return;

    try {
      await deleteOwnerBoard(boardId);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("boards:changed"));
      }
      toast.success("Board deleted");
      router.push("/dashboard");
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
    }
  };

  return (
    <div className="dashboard-feature-shell rounded-2xl border p-4 sm:p-5 md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="dashboard-feature-title break-words text-2xl font-semibold tracking-tight md:text-3xl">
            {boardName}
          </h1>
          <p className="dashboard-feature-subtitle mt-2 text-sm">
            {isOwner
              ? "Manage features, votes, and sharing for this board."
              : "Public feedback board. Vote on what should ship next."}
          </p>
        </div>

        <div className="flex w-full flex-col items-stretch gap-2 sm:w-auto sm:flex-row sm:items-center">
          {isOwner ? (
            <button
              onClick={() => setShareOpen(true)}
              className="dashboard-feature-secondary-btn inline-flex h-10 w-full items-center justify-center rounded-xl border px-4 text-sm font-semibold sm:w-auto"
            >
              Share board
            </button>
          ) : null}

          {isOwner ? (
            <button
              onClick={handleDeleteBoard}
              className="inline-flex h-10 w-full items-center justify-center rounded-xl border border-red-200 bg-red-50 px-4 text-sm font-semibold text-red-700 hover:bg-red-100 sm:w-auto"
            >
              Delete board
            </button>
          ) : null}
        </div>
      </div>

      {canCreate ? (
        <form
          onSubmit={handleCreate}
          className="dashboard-feature-form mt-6 rounded-xl border p-4"
        >
          <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto] md:items-end">
            <div>
              <label className="dashboard-feature-label mb-1 block text-xs font-semibold uppercase tracking-wide">
                Feature title
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                maxLength={200}
                placeholder="e.g. Export feedback to CSV"
                className="dashboard-feature-input h-11 w-full rounded-xl border px-3 text-sm outline-none"
              />
            </div>
            <div>
              <label className="dashboard-feature-label mb-1 block text-xs font-semibold uppercase tracking-wide">
                Description (optional)
              </label>
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={1000}
                placeholder="Explain what problem this solves"
                className="dashboard-feature-input h-11 w-full rounded-xl border px-3 text-sm outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={creating}
              className="dashboard-feature-primary-btn inline-flex h-11 w-full items-center justify-center rounded-xl px-5 text-sm font-semibold disabled:opacity-60 md:w-auto"
            >
              {creating ? (
                <span className="loading loading-spinner loading-xs" />
              ) : (
                "Add feature"
              )}
            </button>
          </div>
        </form>
      ) : (
        <div className="dashboard-feature-notice mt-6 rounded-xl border border-dashed p-4 text-sm">
          This board is shared in upvote-only mode. You can vote, but cannot
          create or delete features.
        </div>
      )}

      <div className="mt-6 space-y-3">
        {loading ? (
          <div className="flex justify-center py-10">
            <span className="loading loading-spinner loading-lg" />
          </div>
        ) : features.length === 0 ? (
          <div className="dashboard-feature-empty rounded-xl border border-dashed p-8 text-center text-sm">
            No features yet.
          </div>
        ) : (
          features.map((feature) => {
            const isUpvoted = Boolean(upvoteState[feature.id]);
            return (
              <div
                key={feature.id}
                className="dashboard-feature-card grid gap-3 rounded-xl border p-4 md:grid-cols-[1fr_auto_auto] md:items-start"
              >
                <div>
                  <h3 className="dashboard-feature-card-title text-base font-semibold">
                    {feature.title}
                  </h3>
                  {feature.description ? (
                    <p className="dashboard-feature-card-text mt-1 text-sm">
                      {feature.description}
                    </p>
                  ) : null}
                </div>

                <button
                  onClick={() => handleUpvoteToggle(feature)}
                  disabled={busyFeatureId === feature.id}
                  className={`dashboard-feature-upvote-btn inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-xl border px-3 text-sm font-semibold transition-all sm:min-w-[124px] sm:w-auto ${
                    isUpvoted
                      ? "dashboard-feature-upvote-active border-black bg-black text-white shadow-[0_10px_24px_rgba(0,0,0,0.45)]"
                      : "dashboard-feature-upvote-inactive border-[#111111] bg-white text-[#111111] hover:bg-black hover:text-white"
                  }`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    className="h-3.5 w-3.5 shrink-0"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 19V5m0 0-5 5m5-5 5 5"
                    />
                  </svg>
                  <span className="inline-flex min-w-[1.25rem] justify-center text-sm leading-none tabular-nums">
                    {feature.upvotes_count}
                  </span>
                  <span className="text-[11px] uppercase tracking-[0.06em] leading-none">
                    {isUpvoted ? "Voted" : "Vote"}
                  </span>
                </button>

                {canDeleteFeature(feature) ? (
                  <button
                    onClick={() => handleDeleteFeature(feature)}
                    className="inline-flex h-9 w-full items-center justify-center rounded-lg border border-red-200 bg-red-50 px-3 text-xs font-semibold text-red-700 hover:bg-red-100 sm:w-auto"
                  >
                    Delete
                  </button>
                ) : (
                  <div className="hidden md:block" />
                )}
              </div>
            );
          })
        )}
      </div>

      {isOwner ? (
        <ShareBoardModal
          boardId={boardId}
          open={shareOpen}
          onClose={() => setShareOpen(false)}
        />
      ) : null}
    </div>
  );
}
