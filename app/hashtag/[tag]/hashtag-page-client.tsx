'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchHashtagPosts } from '@/lib/api/api';
import { PostCard } from '@/components/feed/post-card';
import { HotList } from '@/components/feed/hot-list';
import { Loader2, Hash, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

type FaqItem = {
  question: string;
  answer: string;
};

type HashtagPageClientProps = {
  tag: string;
  faqItems: FaqItem[];
  initialHashtagData: any;
  initialRelatedHashtags: any[];
};

function normalizeHashtagResponse(payload: any): {
  posts: any[];
  relatedHashtags: any[];
  topContent: any | null;
} {
  if (!payload) return { posts: [], relatedHashtags: [], topContent: null };
  const safePayload =
    typeof payload === 'string'
      ? (() => {
          try {
            return JSON.parse(payload);
          } catch {
            return {};
          }
        })()
      : payload;

  const candidates: any[] = [
    ...(Array.isArray(safePayload) ? safePayload : []),
    ...(Array.isArray(safePayload?.data) ? safePayload.data : []),
    ...(Array.isArray(safePayload?.data?.data) ? safePayload.data.data : []),
    ...(Array.isArray(safePayload?.data?.vos) ? safePayload.data.vos : []),
    ...(Array.isArray(safePayload?.data?.contents) ? safePayload.data.contents : []),
    ...(Array.isArray(safePayload?.vos) ? safePayload.vos : []),
    ...(Array.isArray(safePayload?.contents) ? safePayload.contents : []),
  ];

  const isPostLike = (item: any) =>
    !!item &&
    !!item.id &&
    (item.content || item.title || item.authorName || item.username || item.cardType || item.videoVO);
  const isHashtagLike = (item: any) =>
    !!item && (!!item.hashtag || !!item.hashtagId || item.contentCount !== undefined);

  const posts = candidates.filter(isPostLike);
  let relatedHashtags = candidates.filter((item: any) => isHashtagLike(item) && !isPostLike(item));

  const topContent = safePayload?.data?.topContent || safePayload?.topContent || null;
  if (topContent && isPostLike(topContent)) {
    const exists = posts.some((post: any) => post?.id && post.id === topContent.id);
    if (!exists) posts.unshift(topContent);
  }

  if (posts.length === 0 || relatedHashtags.length === 0) {
    const arrays: any[][] = [];
    const walk = (value: any, depth: number) => {
      if (!value || depth > 6) return;
      if (Array.isArray(value)) {
        arrays.push(value);
        value.slice(0, 10).forEach((item) => walk(item, depth + 1));
        return;
      }
      if (typeof value === 'object') {
        Object.values(value).forEach((v) => walk(v, depth + 1));
      }
    };
    walk(safePayload, 0);

    if (posts.length === 0) {
      const bestPostArray = arrays
        .map((arr) => ({ arr, score: arr.filter(isPostLike).length }))
        .sort((a, b) => b.score - a.score)[0];
      if (bestPostArray && bestPostArray.score > 0) {
        posts.push(...bestPostArray.arr.filter(isPostLike));
      }
    }

    if (relatedHashtags.length === 0) {
      const bestHashtagArray = arrays
        .map((arr) => ({ arr, score: arr.filter(isHashtagLike).length }))
        .sort((a, b) => b.score - a.score)[0];
      if (bestHashtagArray && bestHashtagArray.score > 0) {
        relatedHashtags = bestHashtagArray.arr.filter(
          (item: any) => isHashtagLike(item) && !isPostLike(item)
        );
      }
    }
  }

  return { posts, relatedHashtags, topContent };
}

export default function HashtagPageClient({
  tag,
  faqItems,
  initialHashtagData,
  initialRelatedHashtags,
}: HashtagPageClientProps) {
  const { data, isLoading, error } = useQuery<any>({
    queryKey: ['hashtag', tag],
    queryFn: async () => {
      const first = await fetchHashtagPosts(tag);
      const firstNormalized = normalizeHashtagResponse(first);
      if (firstNormalized.posts.length > 0 || firstNormalized.relatedHashtags.length > 0) {
        return first;
      }
      return fetchHashtagPosts(`#${tag}`);
    },
    initialData: initialHashtagData || undefined,
  });

  const { posts, relatedHashtags } = normalizeHashtagResponse(data);
  const fallbackHashtags = relatedHashtags.length > 0 ? relatedHashtags : initialRelatedHashtags || [];

  return (
    <div className="mx-auto max-w-7xl">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-4">
        <div className="lg:col-span-2 space-y-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-neutral-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Feed
          </Link>

          <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-6">
            <h1 className="text-3xl font-bold text-white flex items-center gap-2">
              <Hash className="h-8 w-8 text-green-400" />
              #{tag}
            </h1>
            <p className="text-neutral-500 mt-2">Posts and discussions about #{tag}</p>
          </div>

          <div className="rounded-2xl border border-neutral-800 bg-neutral-950 overflow-hidden">
            {isLoading && (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-green-400" />
              </div>
            )}

            {error && (
              <div className="p-8 text-center">
                <p className="text-red-400">Failed to load posts</p>
              </div>
            )}

            {!isLoading && !error && (
              <>
                {posts.length > 0 ? (
                  posts.map((post: any, index: number) => (
                    <PostCard key={post?.id || `${tag}-${index}`} post={post} />
                  ))
                ) : (
                  <div className="p-8 text-center text-neutral-500">No posts found for #{tag}</div>
                )}

                {fallbackHashtags.length > 0 && (
                  <div className="border-t border-neutral-800">
                    <div className="px-5 pt-5 pb-3 text-sm text-neutral-400">
                      Related hashtag results from API
                    </div>
                    <div className="divide-y divide-neutral-800">
                      {fallbackHashtags.map((item: any, index: number) => (
                        <div key={item?.hashtagId || `${item?.hashtag}-${index}`} className="p-5">
                          <Link
                            href={`/hashtag/${encodeURIComponent((item?.hashtag || '').replace('#', ''))}`}
                            className="text-lg font-semibold text-green-400 hover:underline"
                          >
                            {item?.hashtag || `#${tag}`}
                          </Link>
                          {item?.description && (
                            <p className="mt-2 text-sm text-neutral-300 whitespace-pre-wrap">
                              {item.description}
                            </p>
                          )}
                          <div className="mt-3 text-xs text-neutral-500 flex flex-wrap gap-4">
                            <span>Posts: {item?.contentCount?.toLocaleString?.() || 0}</span>
                            <span>Views: {item?.viewCount?.toLocaleString?.() || 0}</span>
                            <span>7d: {item?.contentCount7days || 0}</span>
                            <span>30d: {item?.contentCount30days || 0}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <section className="rounded-2xl border border-neutral-800 bg-neutral-950 overflow-hidden">
            <div className="border-b border-neutral-800 px-6 py-4">
              <h2 className="text-xl font-bold text-white">Frequently Asked Questions</h2>
            </div>
            <div className="p-4 sm:p-6 space-y-3">
              {faqItems.map((item, index) => (
                <details
                  key={item.question}
                  className="rounded-xl border border-neutral-800 bg-neutral-900/40 px-4 py-3"
                  open={index === 0}
                >
                  <summary className="cursor-pointer list-none text-sm sm:text-base font-medium text-white">
                    {item.question}
                  </summary>
                  <p className="mt-2 text-sm text-neutral-300 leading-relaxed">{item.answer}</p>
                </details>
              ))}
            </div>
          </section>
        </div>

        <div className="hidden lg:block">
          <div className="sticky top-20">
            <HotList />
          </div>
        </div>
      </div>
    </div>
  );
}
