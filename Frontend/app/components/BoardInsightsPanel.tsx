"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BoardRecord,
  FeatureRecord,
  getOwnedBoards,
  getOwnerFeatures,
} from "@/lib/feedback-api";

const REFRESH_INTERVAL_MS = 20000;

const CHART_LEFT = 15;
const CHART_RIGHT = 95;
const CHART_TOP = 8;
const CHART_BOTTOM = 44;
const SVG_VIEWBOX_WIDTH = 106;
const SVG_VIEWBOX_HEIGHT = 78;

type DashboardTheme = "dark" | "light";

type RankedPoint = {
  id: number;
  rank: number;
  title: string;
  value: number;
};

type ChartPoint = RankedPoint & {
  x: number;
  y: number;
};

function buildRankedSeries(features: FeatureRecord[]): RankedPoint[] {
  const sortedByVotes = [...features].sort((a, b) => {
    const voteDifference = b.upvotes_count - a.upvotes_count;
    if (voteDifference !== 0) {
      return voteDifference;
    }

    // Stable fallback ordering for equal vote counts.
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });

  return sortedByVotes.map((feature, index) => ({
    id: feature.id,
    rank: index + 1,
    title: feature.title,
    value: Math.max(feature.upvotes_count, 0),
  }));
}

function pointsToPath(points: Array<{ x: number; y: number }>): string {
  if (points.length === 0) {
    return "";
  }

  const [firstPoint, ...rest] = points;
  return `M ${firstPoint.x} ${firstPoint.y} ${rest
    .map((point) => `L ${point.x} ${point.y}`)
    .join(" ")}`;
}

function pointsToAreaPath(points: Array<{ x: number; y: number }>): string {
  if (points.length === 0) {
    return "";
  }

  const linePath = pointsToPath(points);
  const first = points[0];
  const last = points[points.length - 1];
  return `${linePath} L ${last.x} ${CHART_BOTTOM} L ${first.x} ${CHART_BOTTOM} Z`;
}

export default function BoardInsightsPanel() {
  const [boards, setBoards] = useState<BoardRecord[]>([]);
  const [selectedBoardId, setSelectedBoardId] = useState<number | null>(null);
  const [features, setFeatures] = useState<FeatureRecord[]>([]);
  const [loadingBoards, setLoadingBoards] = useState(true);
  const [loadingFeatures, setLoadingFeatures] = useState(false);
  const [dashboardTheme, setDashboardTheme] = useState<DashboardTheme>("dark");
  const [hoveredPointId, setHoveredPointId] = useState<number | null>(null);
  const syncTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const syncTheme = () => {
      const themedRoot = document.querySelector<HTMLElement>(
        "[data-dashboard-theme]",
      );
      const nextTheme =
        themedRoot?.getAttribute("data-dashboard-theme") === "light"
          ? "light"
          : "dark";
      setDashboardTheme(nextTheme);
    };

    syncTheme();

    const observer = new MutationObserver(syncTheme);
    observer.observe(document.body, {
      attributes: true,
      subtree: true,
      attributeFilter: ["data-dashboard-theme"],
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  const isDark = dashboardTheme === "dark";

  const fetchBoards = async () => {
    try {
      setLoadingBoards(true);
      const owned = await getOwnedBoards();
      setBoards(owned);

      if (owned.length === 0) {
        setSelectedBoardId(null);
        setFeatures([]);
        return;
      }

      setSelectedBoardId((prev) => {
        if (prev && owned.some((board) => board.id === prev)) {
          return prev;
        }
        return owned[0].id;
      });
    } catch {
      setBoards([]);
      setSelectedBoardId(null);
      setFeatures([]);
    } finally {
      setLoadingBoards(false);
    }
  };

  useEffect(() => {
    fetchBoards();

    const onBoardsChanged = () => {
      fetchBoards();
    };

    window.addEventListener("boards:changed", onBoardsChanged);
    return () => {
      window.removeEventListener("boards:changed", onBoardsChanged);
    };
  }, []);

  const fetchFeaturesForBoard = async (
    boardId: number,
    options?: { silent?: boolean },
  ) => {
    const isSilent = options?.silent ?? false;

    try {
      if (!isSilent) {
        setLoadingFeatures(true);
      }

      const data = await getOwnerFeatures(boardId);
      setFeatures(data);
    } catch {
      if (!isSilent) {
        setFeatures([]);
      }
    } finally {
      if (!isSilent) {
        setLoadingFeatures(false);
      }
    }
  };

  useEffect(() => {
    const run = async () => {
      if (!selectedBoardId) {
        setFeatures([]);
        return;
      }

      await fetchFeaturesForBoard(selectedBoardId);
    };

    run();
  }, [selectedBoardId]);

  useEffect(() => {
    if (!selectedBoardId) {
      return;
    }

    const intervalId = window.setInterval(() => {
      void fetchFeaturesForBoard(selectedBoardId, { silent: true });
    }, REFRESH_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [selectedBoardId]);

  useEffect(() => {
    const onFeaturesChanged = (event: Event) => {
      const customEvent = event as CustomEvent<Record<string, unknown>>;
      const detail = customEvent.detail || {};
      const boardId = Number(detail.boardId || 0);

      if (!selectedBoardId || boardId !== selectedBoardId) {
        return;
      }

      const featureId = Number(detail.featureId || 0);
      const upvotesCount = Number(detail.upvotesCount);
      if (featureId && !Number.isNaN(upvotesCount)) {
        setFeatures((prev) =>
          prev.map((feature) =>
            feature.id === featureId
              ? { ...feature, upvotes_count: upvotesCount }
              : feature,
          ),
        );
      }

      if (syncTimeoutRef.current) {
        window.clearTimeout(syncTimeoutRef.current);
      }
      syncTimeoutRef.current = window.setTimeout(() => {
        if (selectedBoardId) {
          void fetchFeaturesForBoard(selectedBoardId, { silent: true });
        }
      }, 500);
    };

    window.addEventListener("features:changed", onFeaturesChanged);
    return () => {
      window.removeEventListener("features:changed", onFeaturesChanged);
      if (syncTimeoutRef.current) {
        window.clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [selectedBoardId]);

  const rankedSeries = useMemo(() => buildRankedSeries(features), [features]);

  const maxValue = useMemo(() => {
    return Math.max(...rankedSeries.map((point) => point.value), 1);
  }, [rankedSeries]);

  const minValue = useMemo(() => {
    if (rankedSeries.length === 0) {
      return 0;
    }
    return Math.min(...rankedSeries.map((point) => point.value));
  }, [rankedSeries]);

  const valueRange = maxValue - minValue;

  const valueToY = useCallback(
    (value: number) => {
      const spanY = CHART_BOTTOM - CHART_TOP;
      if (valueRange <= 0) {
        return CHART_TOP + spanY / 2;
      }

      const normalized = (value - minValue) / valueRange;
      return CHART_BOTTOM - normalized * spanY;
    },
    [minValue, valueRange],
  );

  const chartPoints = useMemo(() => {
    if (rankedSeries.length === 0) {
      return [] as ChartPoint[];
    }

    if (rankedSeries.length === 1) {
      const single = rankedSeries[0];
      return [
        {
          ...single,
          x: (CHART_LEFT + CHART_RIGHT) / 2,
          y: valueToY(single.value),
        },
      ];
    }

    const spanX = CHART_RIGHT - CHART_LEFT;
    const denominator = Math.max(rankedSeries.length - 1, 1);

    return rankedSeries.map((point, index) => {
      const x = CHART_LEFT + (index / denominator) * spanX;
      const y = valueToY(point.value);
      return {
        ...point,
        x,
        y,
      };
    });
  }, [rankedSeries, valueToY]);

  const hoveredPoint = useMemo(() => {
    return chartPoints.find((point) => point.id === hoveredPointId) ?? null;
  }, [chartPoints, hoveredPointId]);

  const linePath = useMemo(() => pointsToPath(chartPoints), [chartPoints]);
  const areaPath = useMemo(() => pointsToAreaPath(chartPoints), [chartPoints]);

  const peakPoint = rankedSeries[0];
  const lowestPoint = rankedSeries[rankedSeries.length - 1];

  const yAxisTicks = useMemo(() => {
    const tickCount = 4;
    return Array.from({ length: tickCount }, (_, index) => {
      const ratio = index / (tickCount - 1);
      const value = Math.round(maxValue - ratio * (maxValue - minValue));
      const y = CHART_TOP + ratio * (CHART_BOTTOM - CHART_TOP);
      return {
        y,
        value,
      };
    });
  }, [maxValue, minValue]);

  const chartSubtitle = "Feature votes ranked high to low";
  const emptyChartMessage =
    boards.length === 0
      ? "Create a board to start charting live votes."
      : features.length === 0
        ? "No features yet for this board."
        : null;

  const shellClass = isDark
    ? "border-white/10 bg-[#050505] text-white shadow-[0_20px_44px_rgba(0,0,0,0.52)]"
    : "border-[#D7DCE5] bg-white text-[#0F172A] shadow-[0_20px_44px_rgba(15,23,42,0.10)]";

  const blockClass = isDark
    ? "border-white/10 bg-[#090909]"
    : "border-[#E3E8F2] bg-[#F8FAFC]";

  const innerBlockClass = isDark
    ? "border-white/10 bg-[#070707]"
    : "border-[#DDE4EE] bg-white";

  const mutedLabelClass = isDark ? "text-white/45" : "text-slate-500";
  const subtitleClass = isDark ? "text-white/55" : "text-slate-600";
  const selectClass = isDark
    ? "border-white/15 bg-[#0A0A0A] text-white focus:border-white/40"
    : "border-[#D5DEEA] bg-white text-[#0F172A] focus:border-slate-400";
  const listItemClass = isDark
    ? "border-white/10 bg-[#0B0B0B]"
    : "border-[#E2E8F0] bg-[#F8FAFC]";
  const rankPillClass = isDark
    ? "bg-white/10 text-white/70"
    : "bg-slate-100 text-slate-600";
  const votePillClass = isDark
    ? "border-white/15 text-white"
    : "border-[#CBD5E1] text-slate-700";

  return (
    <section
      className={`dashboard-home-panel rounded-3xl border p-5 md:p-6 lg:p-7 ${shellClass}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p
            className={`text-[11px] font-semibold uppercase tracking-[0.09em] ${mutedLabelClass}`}
          >
            Live analytics
          </p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight md:text-2xl">
            Vote ranking line
          </h2>
          <p className={`mt-1 text-sm ${subtitleClass}`}>{chartSubtitle}</p>
        </div>

        <div className="w-full sm:w-auto sm:min-w-[250px] sm:max-w-[290px]">
          <label
            className={`mb-2 block text-[11px] font-semibold uppercase tracking-[0.09em] ${mutedLabelClass}`}
          >
            Select board
          </label>
          <div className="relative">
            <select
              value={selectedBoardId ?? ""}
              onChange={(event) =>
                setSelectedBoardId(Number(event.target.value))
              }
              disabled={loadingBoards || boards.length === 0}
              className={`h-11 w-full appearance-none rounded-xl border pl-3 pr-12 text-sm outline-none transition disabled:cursor-not-allowed disabled:opacity-60 ${selectClass}`}
            >
              {boards.length === 0 ? (
                <option value="">No boards available</option>
              ) : (
                boards.map((board) => (
                  <option key={board.id} value={board.id}>
                    {board.board_name}
                  </option>
                ))
              )}
            </select>

            <span
              className={`pointer-events-none absolute inset-y-0 right-4 flex items-center ${
                isDark ? "text-white/60" : "text-slate-500"
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-4 w-4"
                aria-hidden="true"
              >
                <path
                  d="m5 7 5 6 5-6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </div>
        </div>
      </div>

      <div className={`mt-5 rounded-2xl border p-4 md:p-5 ${blockClass}`}>
        <div className={`mb-4 rounded-xl border p-3 ${innerBlockClass}`}>
          <p
            className={`text-[11px] font-semibold uppercase tracking-[0.09em] ${mutedLabelClass}`}
          >
            Feature ranking (high to low)
          </p>

          {rankedSeries.length === 0 ? (
            <p
              className={`mt-2 text-sm ${isDark ? "text-white/50" : "text-slate-500"}`}
            >
              No features available.
            </p>
          ) : (
            <div className="mt-2 max-h-48 space-y-1.5 overflow-y-auto pr-1">
              {rankedSeries.map((point) => (
                <div
                  key={`rank-${point.id}`}
                  className={`flex items-center gap-3 rounded-lg border px-3 py-2 ${listItemClass}`}
                >
                  <span
                    className={`inline-flex min-w-7 items-center justify-center rounded-full px-2 py-1 text-[11px] font-semibold ${rankPillClass}`}
                  >
                    #{point.rank}
                  </span>
                  <span
                    className={`flex-1 truncate text-sm ${isDark ? "text-white/85" : "text-slate-700"}`}
                  >
                    {point.title}
                  </span>
                  <span
                    className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${votePillClass}`}
                  >
                    {point.value}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {loadingFeatures ? (
          <div className="flex h-[340px] items-center justify-center md:h-[390px]">
            <span
              className={`loading loading-spinner loading-md ${
                isDark ? "text-white" : "text-slate-700"
              }`}
            ></span>
          </div>
        ) : emptyChartMessage ? (
          <div
            className={`flex h-[240px] items-center justify-center rounded-xl border border-dashed p-6 text-center text-sm md:h-[300px] ${
              isDark
                ? "border-white/15 bg-black/40 text-white/60"
                : "border-[#D6DEE8] bg-[#F8FAFC] text-slate-600"
            }`}
          >
            {emptyChartMessage}
          </div>
        ) : (
          <div className="relative h-[340px] w-full md:h-[390px]">
            <svg
              viewBox={`0 0 ${SVG_VIEWBOX_WIDTH} ${SVG_VIEWBOX_HEIGHT}`}
              className="h-full w-full"
              role="img"
              aria-label="Live votes trend line chart"
            >
              <defs>
                <linearGradient id="lineGradient" x1="0" x2="1" y1="0" y2="0">
                  <stop
                    offset="0%"
                    stopColor={isDark ? "#F8FAFC" : "#1E293B"}
                    stopOpacity={isDark ? "0.55" : "0.72"}
                  />
                  <stop
                    offset="100%"
                    stopColor={isDark ? "#FFFFFF" : "#0F172A"}
                    stopOpacity="1"
                  />
                </linearGradient>
                <linearGradient id="areaGradient" x1="0" x2="0" y1="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor={isDark ? "#FFFFFF" : "#0F172A"}
                    stopOpacity={isDark ? "0.22" : "0.15"}
                  />
                  <stop
                    offset="100%"
                    stopColor={isDark ? "#FFFFFF" : "#0F172A"}
                    stopOpacity="0"
                  />
                </linearGradient>
              </defs>

              {yAxisTicks.map((tick) => {
                return (
                  <g key={`grid-${tick.y}`}>
                    <line
                      x1={CHART_LEFT}
                      x2={CHART_RIGHT}
                      y1={tick.y}
                      y2={tick.y}
                      stroke={
                        isDark
                          ? "rgba(255,255,255,0.10)"
                          : "rgba(15,23,42,0.12)"
                      }
                      strokeWidth="0.35"
                      strokeDasharray="1.2 1.8"
                    />
                    <text
                      x={CHART_LEFT - 2.2}
                      y={tick.y + 0.8}
                      fontSize="2.2"
                      textAnchor="end"
                      fill={
                        isDark
                          ? "rgba(255,255,255,0.55)"
                          : "rgba(15,23,42,0.58)"
                      }
                    >
                      {tick.value}
                    </text>
                  </g>
                );
              })}

              <line
                x1={CHART_LEFT}
                x2={CHART_LEFT}
                y1={CHART_TOP}
                y2={CHART_BOTTOM}
                stroke={
                  isDark ? "rgba(255,255,255,0.20)" : "rgba(15,23,42,0.22)"
                }
                strokeWidth="0.4"
              />

              <line
                x1={CHART_LEFT}
                x2={CHART_RIGHT}
                y1={CHART_BOTTOM}
                y2={CHART_BOTTOM}
                stroke={
                  isDark ? "rgba(255,255,255,0.20)" : "rgba(15,23,42,0.22)"
                }
                strokeWidth="0.4"
              />

              <path d={areaPath} fill="url(#areaGradient)" />
              <path
                d={linePath}
                fill="none"
                stroke="url(#lineGradient)"
                strokeWidth="1.65"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {chartPoints.map((point, index) => {
                const isLastPoint = index === chartPoints.length - 1;
                return (
                  <g
                    key={`dot-${point.id}`}
                    onMouseEnter={() => setHoveredPointId(point.id)}
                    onMouseLeave={() => setHoveredPointId(null)}
                    onFocus={() => setHoveredPointId(point.id)}
                    onBlur={() => setHoveredPointId(null)}
                    style={{ cursor: "pointer" }}
                  >
                    {isLastPoint ? (
                      <circle
                        cx={point.x}
                        cy={point.y}
                        r="3.5"
                        fill={
                          isDark
                            ? "rgba(255,255,255,0.18)"
                            : "rgba(15,23,42,0.14)"
                        }
                      />
                    ) : null}
                    <circle
                      cx={point.x}
                      cy={point.y}
                      r={isLastPoint ? 1.7 : 1.1}
                      fill={isDark ? "#FFFFFF" : "#0F172A"}
                    />
                    <title>
                      {point.title}: {point.value} vote
                      {point.value === 1 ? "" : "s"}
                    </title>
                  </g>
                );
              })}

              {chartPoints.map((point) => {
                const label =
                  point.title.length > 14
                    ? `${point.title.slice(0, 14)}...`
                    : point.title;

                return (
                  <text
                    key={`label-${point.id}`}
                    x={point.x}
                    y={CHART_BOTTOM + 8.5}
                    fontSize="2.2"
                    textAnchor="middle"
                    fill={
                      isDark ? "rgba(255,255,255,0.55)" : "rgba(15,23,42,0.62)"
                    }
                    transform={`rotate(-28 ${point.x} ${CHART_BOTTOM + 8.5})`}
                  >
                    {label}
                  </text>
                );
              })}

              <text
                x={(CHART_LEFT + CHART_RIGHT) / 2}
                y={SVG_VIEWBOX_HEIGHT - 1.2}
                fontSize="2.2"
                textAnchor="middle"
                fill={isDark ? "rgba(255,255,255,0.45)" : "rgba(15,23,42,0.55)"}
              >
                Features
              </text>

              <text
                x="2.8"
                y={(CHART_TOP + CHART_BOTTOM) / 2}
                fontSize="2.2"
                textAnchor="middle"
                fill={isDark ? "rgba(255,255,255,0.45)" : "rgba(15,23,42,0.55)"}
                transform={`rotate(-90 2.8 ${(CHART_TOP + CHART_BOTTOM) / 2})`}
              >
                Votes
              </text>
            </svg>

            {hoveredPoint ? (
              <div
                className={`pointer-events-none absolute z-10 rounded-lg border px-2.5 py-1.5 text-xs shadow-[0_8px_24px_rgba(0,0,0,0.22)] ${
                  isDark
                    ? "border-white/15 bg-black/95 text-white"
                    : "border-[#CBD5E1] bg-white/95 text-slate-800"
                }`}
                style={{
                  left: `${(hoveredPoint.x / SVG_VIEWBOX_WIDTH) * 100}%`,
                  top: `${(hoveredPoint.y / SVG_VIEWBOX_HEIGHT) * 100}%`,
                  transform: "translate(-50%, -125%)",
                }}
              >
                <p
                  className={`font-medium ${isDark ? "text-white/95" : "text-slate-900"}`}
                >
                  {hoveredPoint.title}
                </p>
                <p className={isDark ? "text-white/70" : "text-slate-600"}>
                  {hoveredPoint.value} vote{hoveredPoint.value === 1 ? "" : "s"}
                </p>
              </div>
            ) : null}
          </div>
        )}

        {emptyChartMessage ? null : (
          <div
            className={`mt-3 flex flex-wrap items-center justify-between gap-2 text-xs ${
              isDark ? "text-white/55" : "text-slate-600"
            }`}
          >
            <span>Features: {features.length}</span>
            <span>Top votes: {peakPoint?.value ?? 0}</span>
            <span>
              Lowest votes: {lowestPoint?.value ?? 0}
              {lowestPoint?.title ? ` (${lowestPoint.title})` : ""}
            </span>
          </div>
        )}
      </div>
    </section>
  );
}
