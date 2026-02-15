import { useQuery } from '@tanstack/react-query';

const EDGE_FUNCTION_URL = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/crypto-api`;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function fetchData<T>(endpoint: string): Promise<T> {
  const response = await fetch(EDGE_FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ endpoint }),
  });

  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  return response.json();
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
