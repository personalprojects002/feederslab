"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import BillingActionButton from "@/app/components/BillingActionButton";
import ButtonLogout from "@/app/components/ButtonLogout";
import ShareBoardModal from "@/app/components/ShareBoardModal";
import {
  BoardRecord,
  deleteOwnerBoard,
  getOutgoingSharedBoards,
  getOwnedBoards,
} from "@/lib/feedback-api";

const productIcon = "/icon-circle.svg";

const futureSections = ["Roadmap", "Changelog", "Analytics"];
const SIDEBAR_CACHE_KEY = "feeders_sidebar_cache_v1";

type DashboardTheme = "dark" | "light";

type DashboardSidebarProps = {
  onNavigate?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  theme?: DashboardTheme;
  onToggleTheme?: () => void;
};

function ProductCircleIcon({
  size,
  className = "",
  alt = "Product icon",
}: {
  size: number;
  className?: string;
  alt?: string;
}) {
  return (
    <span
      className={`inline-flex overflow-hidden rounded-full ${className}`}
      style={{ width: size, height: size }}
      aria-hidden={alt ? undefined : true}
    >
      <Image
        src={productIcon}
        alt={alt}
        width={size}
        height={size}
        className="h-full w-full rounded-full object-cover"
        priority
      />
    </span>
  );
}

function BoardItemIcon({
  isDark,
  isActive,
}: {
  isDark: boolean;
  isActive: boolean;
}) {
  const outerClass = isActive
    ? isDark
      ? "bg-black/10"
      : "bg-white/10"
    : isDark
      ? "bg-white/[0.08]"
      : "bg-[#F3F4F6]";

  const innerClass = isActive
    ? isDark
      ? "bg-black"
      : "bg-white"
    : isDark
      ? "bg-white"
      : "bg-[#0B0B0C]";

  return (
    <span
      className={`inline-flex h-6 w-6 items-center justify-center rounded-full ${outerClass}`}
      aria-hidden="true"
    >
      <span className={`h-2.5 w-2.5 rounded-full ${innerClass}`} />
    </span>
  );
}

function SidebarSectionTitle({
  label,
  count,
  expanded,
  onToggle,
  isDark,
}: {
  label: string;
  count?: number;
  expanded?: boolean;
  onToggle?: () => void;
  isDark: boolean;
}) {
  const textClass = isDark ? "text-white/55" : "text-gray-500";
  const badgeClass = isDark
    ? "border-white/15 text-white/55"
    : "border-[#E5E7EB] text-gray-500";

  if (!onToggle) {
    return (
      <p
        className={`mb-2 px-2 text-[11px] font-semibold uppercase tracking-[0.08em] ${textClass}`}
      >
        {label}
      </p>
    );
  }

  return (
    <button
      type="button"
      onClick={onToggle}
      className={`mb-2 flex w-full items-center justify-between rounded-lg px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] ${textClass} ${
        isDark ? "hover:bg-white/[0.06]" : "hover:bg-[#F3F4F6]"
      }`}
    >
      <span className="flex items-center gap-2">
        <span>{label}</span>
        <span
          className={`rounded-full border px-1.5 py-0.5 text-[10px] ${badgeClass}`}
        >
          {count ?? 0}
        </span>
      </span>
      <span
        className={isDark ? "text-xs text-white/45" : "text-xs text-gray-400"}
      >
        {expanded ? "-" : "+"}
      </span>
    </button>
  );
}

export default function DashboardSidebar({
  onNavigate,
  collapsed = false,
  onToggleCollapse,
  theme = "dark",
  onToggleTheme,
}: DashboardSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const isDark = theme === "dark";
  const [boards, setBoards] = useState<BoardRecord[]>([]);
  const [sharedBoards, setSharedBoards] = useState<BoardRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [boardsExpanded, setBoardsExpanded] = useState(true);
  const [sharedExpanded, setSharedExpanded] = useState(true);
  const [deletingBoardId, setDeletingBoardId] = useState<number | null>(null);
  const [shareBoardId, setShareBoardId] = useState<number | null>(null);

  const fetchSidebarData = async ({
    silent = false,
  }: {
    silent?: boolean;
  } = {}) => {
    try {
      if (!silent) {
        setLoading(true);
      }

      const [owned, outgoing] = await Promise.all([
        getOwnedBoards(),
        getOutgoingSharedBoards(),
      ]);
      setBoards(owned);
      setSharedBoards(outgoing);

      if (typeof window !== "undefined") {
        // Session cache makes sidebar navigation feel immediate on revisit while
        // still allowing fresh data to replace it asynchronously.
        window.sessionStorage.setItem(
          SIDEBAR_CACHE_KEY,
          JSON.stringify({ owned, shared: outgoing }),
        );
      }
    } catch {
      if (!silent) {
        setBoards([]);
        setSharedBoards([]);
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    let hasCachedData = false;

    if (typeof window !== "undefined") {
      const raw = window.sessionStorage.getItem(SIDEBAR_CACHE_KEY);
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as {
            owned?: BoardRecord[];
            shared?: BoardRecord[];
          };
          if (Array.isArray(parsed.owned) && Array.isArray(parsed.shared)) {
            setBoards(parsed.owned);
            setSharedBoards(parsed.shared);
            setLoading(false);
            hasCachedData = true;
          }
        } catch {
          window.sessionStorage.removeItem(SIDEBAR_CACHE_KEY);
        }
      }
    }

    // Silent refresh prevents loading flicker when we already rendered from
    // cache, but still reconciles against latest server state.
    fetchSidebarData({ silent: hasCachedData });

    const handleBoardsChanged = () => {
      // Sidebar listens to cross-component board mutations (create/delete/share)
      // so navigation stays consistent without global store complexity.
      fetchSidebarData({ silent: true });
    };

    window.addEventListener("boards:changed", handleBoardsChanged);
    return () => {
      window.removeEventListener("boards:changed", handleBoardsChanged);
    };
  }, []);

  const isActive = (href: string) => pathname === href;

  const handleDeleteOwnedBoard = async (board: BoardRecord) => {
    const confirmed = window.confirm(
      `Delete \"${board.board_name}\"? This action cannot be undone.`,
    );
    if (!confirmed) return;

    try {
      setDeletingBoardId(board.id);
      await deleteOwnerBoard(board.id);

      if (isActive(`/dashboard/b/${board.id}`)) {
        router.push("/dashboard");
      }

      toast.success("Board deleted");
      window.dispatchEvent(new Event("boards:changed"));
      await fetchSidebarData();
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

  return (
    <aside
      className={`flex h-full flex-col ${
        isDark ? "bg-[#080808] text-white" : "bg-white text-[#0B0B0C]"
      }`}
    >
      <div
        className={`border-b px-3 py-3 ${
          isDark ? "border-white/10" : "border-[#E5E7EB]"
        }`}
      >
        {collapsed ? (
          <div className="flex items-center justify-between gap-1">
            <Link
              href="/dashboard"
              className={`inline-flex items-center justify-center ${
                isDark ? "text-white" : "text-[#0B0B0C]"
              }`}
              onClick={onNavigate}
              aria-label="FeedersLab"
            >
              <ProductCircleIcon size={28} alt="FeedersLab icon" />
            </Link>
            {onToggleCollapse ? (
              <button
                type="button"
                onClick={onToggleCollapse}
                className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border transition-colors ${
                  isDark
                    ? "border-white/15 text-white/70 hover:bg-white/[0.08]"
                    : "border-[#E5E7EB] text-gray-600 hover:bg-[#F3F4F6]"
                }`}
                aria-label="Expand sidebar"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.8}
                  className="h-4 w-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m9 6 6 6-6 6"
                  />
                </svg>
              </button>
            ) : null}
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2">
            <Link
              href="/dashboard"
              className={`inline-flex items-center gap-2 text-lg font-semibold tracking-tight ${
                isDark ? "text-white" : "text-[#0B0B0C]"
              }`}
              onClick={onNavigate}
            >
              <ProductCircleIcon size={28} alt="FeedersLab icon" />
              <span>FeedersLab</span>
            </Link>

            <div className="flex items-center gap-1">
              {onToggleTheme ? (
                <button
                  type="button"
                  onClick={onToggleTheme}
                  className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border transition-colors ${
                    isDark
                      ? "border-white/15 text-white/70 hover:bg-white/[0.08]"
                      : "border-[#E5E7EB] text-gray-600 hover:bg-[#F3F4F6]"
                  }`}
                  aria-label={
                    isDark ? "Switch to light mode" : "Switch to dark mode"
                  }
                >
                  {isDark ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.8}
                      className="h-4 w-4"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 3v2.5M12 18.5V21M5.636 5.636l1.768 1.768M16.596 16.596l1.768 1.768M3 12h2.5M18.5 12H21M5.636 18.364l1.768-1.768M16.596 7.404l1.768-1.768M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"
                      />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.8}
                      className="h-4 w-4"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M21 12.79A9 9 0 1 1 11.21 3c-.11.58-.17 1.18-.17 1.79A7 7 0 0 0 19.21 12c.61 0 1.21-.06 1.79-.17Z"
                      />
                    </svg>
                  )}
                </button>
              ) : null}

              {onToggleCollapse ? (
                <button
                  type="button"
                  onClick={onToggleCollapse}
                  className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border transition-colors ${
                    isDark
                      ? "border-white/15 text-white/70 hover:bg-white/[0.08]"
                      : "border-[#E5E7EB] text-gray-600 hover:bg-[#F3F4F6]"
                  }`}
                  aria-label="Collapse sidebar"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.8}
                    className="h-4 w-4"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m15 6-6 6 6 6"
                    />
                  </svg>
                </button>
              ) : null}
            </div>
          </div>
        )}
        {!collapsed ? (
          <p
            className={`mt-1 text-xs ${isDark ? "text-white/55" : "text-gray-500"}`}
          >
            Enterprise feedback workspace
          </p>
        ) : null}
      </div>

      <div
        className={`flex-1 overflow-y-auto ${
          collapsed ? "space-y-4 px-2 py-3" : "space-y-6 px-2.5 py-4"
        }`}
      >
        <section>
          {!collapsed ? (
            <SidebarSectionTitle
              label="Boards"
              count={boards.length}
              expanded={boardsExpanded}
              onToggle={() => setBoardsExpanded((prev) => !prev)}
              isDark={isDark}
            />
          ) : null}
          {boardsExpanded ? (
            <div className="space-y-1">
              {loading ? (
                <div
                  className={`rounded-lg px-3 py-2 text-sm ${
                    isDark ? "text-white/55" : "text-gray-500"
                  } ${collapsed ? "text-center text-xs" : ""}`}
                >
                  Loading boards...
                </div>
              ) : boards.length === 0 ? (
                <div
                  className={`rounded-lg px-3 py-2 text-sm ${
                    isDark ? "text-white/55" : "text-gray-500"
                  } ${collapsed ? "text-center text-xs" : ""}`}
                >
                  No boards yet
                </div>
              ) : (
                boards.map((board) => {
                  const href = `/dashboard/b/${board.id}`;
                  const active = isActive(href);
                  return (
                    <div
                      key={board.id}
                      className={`group flex items-center gap-2 rounded-lg border px-2 py-1.5 transition-colors ${
                        active
                          ? isDark
                            ? "border-white bg-white"
                            : "border-[#0B0B0C] bg-[#0B0B0C]"
                          : isDark
                            ? "border-transparent hover:border-white/15 hover:bg-white/[0.06]"
                            : "border-transparent hover:border-[#E5E7EB] hover:bg-[#F9FAFB]"
                      } ${collapsed ? "justify-center px-0" : ""}`}
                    >
                      <Link
                        href={href}
                        onClick={onNavigate}
                        title={board.board_name}
                        className={`flex flex-1 items-center gap-2 truncate rounded-md px-2 py-1 text-sm ${
                          active
                            ? isDark
                              ? "text-black"
                              : "text-white"
                            : isDark
                              ? "text-white/90"
                              : "text-[#0B0B0C]"
                        }`}
                      >
                        {collapsed ? (
                          <BoardItemIcon isDark={isDark} isActive={active} />
                        ) : (
                          <BoardItemIcon isDark={isDark} isActive={active} />
                        )}
                        {!collapsed ? (
                          <span className="truncate">{board.board_name}</span>
                        ) : (
                          <span className="sr-only">{board.board_name}</span>
                        )}
                      </Link>
                      <button
                        type="button"
                        onClick={() => setShareBoardId(board.id)}
                        className={`inline-flex h-7 w-7 items-center justify-center rounded-md text-xs transition-colors ${
                          active
                            ? isDark
                              ? "text-black/70 hover:bg-black/10"
                              : "text-white/80 hover:bg-white/15"
                            : isDark
                              ? "text-white/60 hover:bg-white hover:text-black"
                              : "text-gray-500 hover:bg-black hover:text-white"
                        } ${collapsed ? "hidden" : ""}`}
                        aria-label={`Share ${board.board_name}`}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={1.7}
                          className="h-3.5 w-3.5"
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
                        onClick={() => handleDeleteOwnedBoard(board)}
                        disabled={deletingBoardId === board.id}
                        className={`inline-flex h-7 w-7 items-center justify-center rounded-md text-xs transition-colors ${
                          active
                            ? isDark
                              ? "text-black/70 hover:bg-black/10"
                              : "text-white/80 hover:bg-white/15"
                            : isDark
                              ? "text-white/60 hover:bg-red-100 hover:text-red-700"
                              : "text-gray-500 hover:bg-red-50 hover:text-red-700"
                        } disabled:cursor-not-allowed disabled:opacity-50 ${collapsed ? "hidden" : ""}`}
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
                            className="h-3.5 w-3.5"
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
                  );
                })
              )}
            </div>
          ) : null}
        </section>

        <section>
          {!collapsed ? (
            <SidebarSectionTitle
              label="Shared Boards"
              count={sharedBoards.length}
              expanded={sharedExpanded}
              onToggle={() => setSharedExpanded((prev) => !prev)}
              isDark={isDark}
            />
          ) : null}
          {sharedExpanded ? (
            <div className="space-y-1">
              {loading ? (
                <div
                  className={`rounded-lg px-3 py-2 text-sm ${
                    isDark ? "text-white/55" : "text-gray-500"
                  }`}
                >
                  Loading shared boards...
                </div>
              ) : sharedBoards.length === 0 ? (
                <div
                  className={`rounded-lg px-3 py-2 text-sm ${
                    isDark ? "text-white/55" : "text-gray-500"
                  }`}
                >
                  No outgoing shares
                </div>
              ) : (
                sharedBoards.map((board) => {
                  const href = `/dashboard/b/${board.id}`;
                  const active = isActive(href);
                  return (
                    <Link
                      key={`shared-${board.id}`}
                      href={href}
                      title={board.board_name}
                      onClick={onNavigate}
                      className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors ${
                        active
                          ? isDark
                            ? "bg-white text-black"
                            : "bg-[#0B0B0C] text-white"
                          : isDark
                            ? "text-white/85 hover:bg-white/[0.06]"
                            : "text-[#0B0B0C] hover:bg-[#F3F4F6]"
                      } ${collapsed ? "justify-center px-0" : ""}`}
                    >
                      <span className="flex min-w-0 items-center gap-2 truncate">
                        {collapsed ? (
                          <BoardItemIcon isDark={isDark} isActive={active} />
                        ) : (
                          <BoardItemIcon isDark={isDark} isActive={active} />
                        )}
                        {!collapsed ? (
                          <span className="truncate">{board.board_name}</span>
                        ) : (
                          <span className="sr-only">{board.board_name}</span>
                        )}
                      </span>
                      <span
                        className={`ml-2 rounded-full border border-current px-2 py-0.5 text-[10px] ${
                          collapsed ? "hidden" : ""
                        }`}
                      >
                        {board.share_links_count || 0}
                      </span>
                    </Link>
                  );
                })
              )}
            </div>
          ) : null}
        </section>

        {!collapsed ? (
          <section>
            <SidebarSectionTitle label="Coming Soon" isDark={isDark} />
            <div className="space-y-1">
              {futureSections.map((item) => (
                <div
                  key={item}
                  className={`rounded-lg border border-dashed px-3 py-2 text-sm ${
                    isDark
                      ? "border-white/15 bg-black/40 text-white/55"
                      : "border-[#D1D5DB] text-gray-500"
                  }`}
                >
                  {item}
                </div>
              ))}
            </div>
          </section>
        ) : null}
      </div>

      {!collapsed ? (
        <div
          className={`flex flex-col gap-[15px] border-t p-4 ${
            isDark
              ? "border-white/10 bg-[#050505]"
              : "border-[#E5E7EB] bg-[#FCFCFD]"
          }`}
        >
          <BillingActionButton />
          <ButtonLogout />
        </div>
      ) : (
        <div
          className={`border-t p-3 ${
            isDark
              ? "border-white/10 bg-[#050505]"
              : "border-[#E5E7EB] bg-[#FCFCFD]"
          }`}
        >
          <button
            type="button"
            onClick={onToggleCollapse}
            className={`inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border transition-colors ${
              isDark
                ? "border-white/15 text-white/70 hover:bg-white/[0.08]"
                : "border-[#E5E7EB] text-gray-600 hover:bg-[#F3F4F6]"
            }`}
            aria-label="Expand sidebar"
          >
            <span className="text-xs font-semibold">Expand</span>
          </button>
        </div>
      )}

      <ShareBoardModal
        boardId={shareBoardId ?? 0}
        open={shareBoardId !== null}
        onClose={() => setShareBoardId(null)}
      />
    </aside>
  );
}
