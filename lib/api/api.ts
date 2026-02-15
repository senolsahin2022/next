import { useQuery } from '@tanstack/react-query';

const explicitApiUrl = (process.env.NEXT_PUBLIC_CRYPTO_API_URL || '').replace(/\/+$/, '');
const EDGE_FUNCTION_URL = explicitApiUrl || '/api/crypto-api';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

function getServerOrigin() {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.CF_PAGES_URL ? `https://${process.env.CF_PAGES_URL}` : '') ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '') ||
    process.env.URL ||
    'https://live.crypto-feed.net';

  const normalized = raw.startsWith('http') ? raw : `https://${raw}`;
  return normalized.replace(/\/+$/, '');
}

function resolveApiUrl() {
  if (/^https?:\/\//i.test(EDGE_FUNCTION_URL)) return EDGE_FUNCTION_URL;
  if (typeof window !== 'undefined') return EDGE_FUNCTION_URL;
  const base = getServerOrigin();
  const path = EDGE_FUNCTION_URL.startsWith('/') ? EDGE_FUNCTION_URL : `/${EDGE_FUNCTION_URL}`;
  return `${base}${path}`;
}

async function fetchData<T>(endpoint: string): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (SUPABASE_KEY) {
    headers.Authorization = `Bearer ${SUPABASE_KEY}`;
  }

  const response = await fetch(resolveApiUrl(), {
    method: 'POST',
    headers,
    body: JSON.stringify({ endpoint }),
  });

  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  return response.json();
}

function safeParse(payload: any) {
  if (typeof payload !== 'string') return payload;
  try {
    return JSON.parse(payload);
  } catch {
    return {};
  }
}

function collectArrays(value: any, arrays: any[][], depth = 0) {
  if (!value || depth > 6) return;
  if (Array.isArray(value)) {
    arrays.push(value);
    value.slice(0, 20).forEach((item) => collectArrays(item, arrays, depth + 1));
    return;
  }
  if (typeof value === 'object') {
    Object.values(value).forEach((v) => collectArrays(v, arrays, depth + 1));
  }
}

function isPostLike(item: any) {
  if (!item || typeof item !== 'object') return false;
  return !!(item.id || item.contentId) && !!(
    item.content ||
    item.title ||
    item.bodyTextOnly ||
    item.subTitle ||
    item.authorName ||
    item.username ||
    item.videoVO
  );
}

function normalizePostForCard(raw: any) {
  const createdAt = raw?.date ?? raw?.createTime ?? raw?.firstReleaseTime;
  const normalizedDate =
    typeof createdAt === 'number'
      ? createdAt > 10_000_000_000
        ? Math.floor(createdAt / 1000)
        : createdAt
      : undefined;

  const images =
    raw?.images?.length > 0
      ? raw.images
      : raw?.imageList?.length > 0
        ? raw.imageList
        : raw?.coverMeta?.url
          ? [raw.coverMeta.url]
          : [];

  return {
    ...raw,
    id: raw?.id || raw?.contentId || '',
    authorName: raw?.authorName || raw?.displayName || raw?.nickName || raw?.username || 'Unknown',
    authorAvatar: raw?.authorAvatar || raw?.avatar || raw?.userAvatar || '/placeholder.svg',
    username: raw?.username || raw?.authorName || raw?.displayName || 'unknown',
    content: raw?.content || raw?.bodyTextOnly || raw?.body || raw?.subTitle || '',
    date: normalizedDate,
    images,
  };
}

export function normalizeRecommendedPosts(payload: any) {
  const safePayload = safeParse(payload);
  const directArrays: any[][] = [
    ...(Array.isArray(safePayload?.data?.vos) ? [safePayload.data.vos] : []),
    ...(Array.isArray(safePayload?.data?.data?.vos) ? [safePayload.data.data.vos] : []),
    ...(Array.isArray(safePayload?.data?.data) ? [safePayload.data.data] : []),
    ...(Array.isArray(safePayload?.data?.contents) ? [safePayload.data.contents] : []),
    ...(Array.isArray(safePayload?.contents) ? [safePayload.contents] : []),
    ...(Array.isArray(safePayload) ? [safePayload] : []),
  ];

  for (const arr of directArrays) {
    const posts = arr.filter(isPostLike).map(normalizePostForCard);
    if (posts.length > 0) return posts;
  }

  const arrays: any[][] = [];
  collectArrays(safePayload, arrays);
  const best = arrays
    .map((arr) => ({ arr, score: arr.filter(isPostLike).length }))
    .sort((a, b) => b.score - a.score)[0];

  return best && best.score > 0 ? best.arr.filter(isPostLike).map(normalizePostForCard) : [];
}

function isUserLike(item: any) {
  if (!item || typeof item !== 'object') return false;
  return !!(
    item.username ||
    item.userName ||
    item.authorName ||
    item.nickName ||
    item.displayName ||
    item.avatar ||
    item.authorAvatar ||
    item.userAvatar ||
    item.squareUid ||
    item.squareAuthorId ||
    item.uid ||
    item.userId
  );
}

export function normalizeUserProfile(payload: any) {
  const safePayload = safeParse(payload);
  const candidates = [
    safePayload?.data?.author,
    safePayload?.data?.account,
    safePayload?.data?.user,
    safePayload?.data?.profile,
    safePayload?.data?.data?.author,
    safePayload?.data?.data?.user,
    safePayload?.data?.data,
    safePayload?.data,
    safePayload?.author,
    safePayload?.profile,
    safePayload?.account,
    safePayload?.user,
    safePayload,
  ];

  const direct = candidates.find(isUserLike);
  if (direct) return direct;

  const arrays: any[][] = [];
  collectArrays(safePayload, arrays);
  for (const arr of arrays) {
    const found = arr.find(isUserLike);
    if (found) return found;
  }

  return null;
}

export function normalizeUserPosts(payload: any) {
  const safePayload = safeParse(payload);
  const directArrays: any[][] = [
    ...(Array.isArray(safePayload?.data?.contents) ? [safePayload.data.contents] : []),
    ...(Array.isArray(safePayload?.data?.data) ? [safePayload.data.data] : []),
    ...(Array.isArray(safePayload?.data?.vos) ? [safePayload.data.vos] : []),
    ...(Array.isArray(safePayload?.contents) ? [safePayload.contents] : []),
    ...(Array.isArray(safePayload?.data) ? [safePayload.data] : []),
    ...(Array.isArray(safePayload) ? [safePayload] : []),
  ];

  for (const arr of directArrays) {
    const posts = arr.filter(isPostLike).map(normalizePostForCard);
    if (posts.length > 0) return posts;
  }

  const arrays: any[][] = [];
  collectArrays(safePayload, arrays);
  const best = arrays
    .map((arr) => ({ arr, score: arr.filter(isPostLike).length }))
    .sort((a, b) => b.score - a.score)[0];

  return best && best.score > 0 ? best.arr.filter(isPostLike).map(normalizePostForCard) : [];
}

export function getUserLookupIds(user: any, routeId: string) {
  return [
    user?.squareUid,
    user?.squareAuthorId,
    user?.uid,
    user?.id,
    user?.username,
    routeId,
  ].filter((v, i, arr) => typeof v === 'string' && v.trim().length > 0 && arr.indexOf(v) === i);
}



export async function fetchHotList() {
  return fetchData('/hotlist/hot');
}

export async function fetchRecommended(page: number = 1) {
  return fetchData(`/recommended/${page}`);
}

export async function fetchPost(postId: string) {
  return fetchData(`/post/${postId}`);
}

export async function fetchUser(userId: string) {
  return fetchData(`/user/${userId}`);
}

export async function fetchUserList(userId: string) {
  return fetchData(`/list/${userId}`);
}

export async function searchPosts(query: string) {
  return fetchData(`/search/${encodeURIComponent(query)}`);
}

export async function fetchHashtagPosts(hashtag: string) {
  return fetchData(`/hashtag/${encodeURIComponent(hashtag)}`);
}

export function useSymbolInfo() {
  return useQuery({
    queryKey: ['symbolInfo'],
    queryFn: () => fetchData('/symbol/info'),
    staleTime: 1000 * 60 * 15, // 15 minutes
  });
}
