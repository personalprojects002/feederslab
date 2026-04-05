import backendApi from "@/lib/backend-api";

export type AccessLevel = "create_upvote" | "upvote_only";

export interface BoardRecord {
  id: number;
  board_name: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  share_links_count?: number;
}

export interface FeatureRecord {
  id: number;
  board_id: number;
  creator_user_id: string | null;
  creator_client_id: string | null;
  title: string;
  description: string | null;
  upvotes_count: number;
  created_at: string;
  updated_at: string;
}

export interface UpvoteStatus {
  featureId: number;
  upvotesCount: number;
  upvoted: boolean;
}

export interface SharedBoardRecord {
  boardId: number;
  boardName: string;
  accessLevel: AccessLevel;
}

export interface ShareLinkResult {
  token: string;
  accessLevel: AccessLevel;
  shareUrl: string;
}

type ShareLinkApiResponse = {
  token?: string;
  accessLevel?: AccessLevel;
  access_level?: AccessLevel;
  shareUrl?: string;
  share_url?: string;
  url?: string;
};

type SharedBoardApiResponse = {
  boardId?: number;
  board_id?: number;
  boardName?: string;
  board_name?: string;
  accessLevel?: AccessLevel;
  access_level?: AccessLevel;
};

function getFrontendOrigin() {
  if (typeof window !== "undefined" && window.location?.origin) {
    // Browser origin is preferred so copied links always point to the currently
    // active deployment environment (local, preview, or production).
    return window.location.origin;
  }
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

function extractTokenFromShareUrl(shareUrl: string) {
  const match = shareUrl.match(/\/shared\/([^/?#]+)/i);
  return match?.[1] || "";
}

function normalizeShareUrl(rawUrl: string, token: string) {
  const origin = getFrontendOrigin().replace(/\/$/, "");
  const normalizedRaw = rawUrl?.trim();

  if (token) {
    // Token is the only required piece of truth; rebuilding URL from origin+token
    // prevents stale backend hostnames from leaking into user-facing links.
    return `${origin}/shared/${token}`;
  }

  if (!normalizedRaw) {
    return `${origin}/shared/${token}`;
  }

  if (/^https?:\/\//i.test(normalizedRaw)) {
    return normalizedRaw;
  }

  if (normalizedRaw.startsWith("/")) {
    return `${origin}${normalizedRaw}`;
  }

  if (normalizedRaw.includes("shared/")) {
    return `${origin}/${normalizedRaw.replace(/^\/+/, "")}`;
  }

  return `${origin}/shared/${normalizedRaw}`;
}

export async function getOwnedBoards() {
  const response = await backendApi.get<BoardRecord[]>("/boards/");
  return [...response.data].sort((a, b) => {
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
  });
}

export async function getOutgoingSharedBoards() {
  const response = await backendApi.get<BoardRecord[]>(
    "/boards/shared/outgoing",
  );
  return response.data
    .filter((board) => (board.share_links_count || 0) > 0)
    .sort((a, b) => {
      return (
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );
    });
}

export async function getOwnerBoard(boardId: number) {
  const response = await backendApi.get<BoardRecord>(`/boards/${boardId}`);
  return response.data;
}

export async function deleteOwnerBoard(boardId: number) {
  await backendApi.delete(`/boards/${boardId}`);
}

export async function getOwnerFeatures(boardId: number) {
  const response = await backendApi.get<FeatureRecord[]>(
    `/boards/${boardId}/features`,
  );
  return response.data;
}

export async function createOwnerFeature(
  boardId: number,
  payload: { title: string; description?: string },
) {
  const response = await backendApi.post<FeatureRecord>(
    `/boards/${boardId}/features`,
    payload,
  );
  return response.data;
}

export async function deleteOwnerFeature(boardId: number, featureId: number) {
  await backendApi.delete(`/boards/${boardId}/features/${featureId}`);
}

export async function createShareLink(
  boardId: number,
  accessLevel: AccessLevel,
) {
  const response = await backendApi.post<ShareLinkApiResponse>(
    `/boards/${boardId}/share-links`,
    {
      accessLevel,
    },
  );

  const payload = response.data || {};
  // We intentionally accept camelCase and snake_case to keep frontend resilient
  // during backend response-shape migrations.
  const rawShareUrl =
    payload.shareUrl || payload.share_url || payload.url || "";
  const resolvedToken = payload.token || extractTokenFromShareUrl(rawShareUrl);
  const resolvedAccessLevel =
    payload.accessLevel || payload.access_level || accessLevel;

  if (!resolvedToken) {
    throw new Error("Invalid share link response: missing token");
  }

  return {
    token: resolvedToken,
    accessLevel: resolvedAccessLevel,
    shareUrl: normalizeShareUrl(rawShareUrl, resolvedToken),
  } satisfies ShareLinkResult;
}

export async function getSharedBoard(token: string) {
  const response = await backendApi.get<SharedBoardApiResponse>(
    `/shared/${token}`,
  );
  const payload = response.data || {};

  const boardId = payload.boardId ?? payload.board_id;
  const boardName = payload.boardName ?? payload.board_name;
  const resolvedAccessLevel = payload.accessLevel ?? payload.access_level;

  // Fail-fast validation prevents partially rendered shared pages that would
  // otherwise break deeper in the UI with less actionable errors.
  if (typeof boardId !== "number" || !boardName || !resolvedAccessLevel) {
    throw new Error("Invalid shared board response payload");
  }

  return {
    boardId,
    boardName,
    accessLevel: resolvedAccessLevel,
  } satisfies SharedBoardRecord;
}

export async function getSharedFeatures(token: string) {
  const response = await backendApi.get<FeatureRecord[]>(
    `/shared/${token}/features`,
  );
  return response.data;
}

export async function createSharedFeature(
  token: string,
  clientKey: string,
  payload: { title: string; description?: string },
) {
  const response = await backendApi.post<FeatureRecord>(
    `/shared/${token}/features`,
    payload,
    {
      headers: {
        "X-Client-Key": clientKey,
      },
    },
  );
  return response.data;
}

export async function deleteSharedFeature(
  token: string,
  featureId: number,
  clientKey: string,
) {
  await backendApi.delete(`/shared/${token}/features/${featureId}`, {
    headers: {
      "X-Client-Key": clientKey,
    },
  });
}

export async function setOwnerUpvote(
  featureId: number,
  upvoted: boolean,
  voterKey: string,
) {
  const response = await backendApi.post<UpvoteStatus>(
    `/features/${featureId}/upvote`,
    { upvoted },
    { headers: { "X-Voter-Key": voterKey } },
  );
  return response.data;
}

export async function setSharedUpvote(
  token: string,
  featureId: number,
  upvoted: boolean,
  voterKey: string,
) {
  const response = await backendApi.post<UpvoteStatus>(
    `/shared/${token}/features/${featureId}/upvote`,
    { upvoted },
    { headers: { "X-Voter-Key": voterKey } },
  );
  return response.data;
}
