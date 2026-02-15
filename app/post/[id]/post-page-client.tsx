'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchPost } from '@/lib/api/api';
import { PostCard } from '@/components/feed/post-card';
import { HotList } from '@/components/feed/hot-list';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

type FaqItem = {
  question: string;
  answer: string;
};

type PostPageClientProps = {
  id: string;
  faqItems: FaqItem[];
  initialPostData: any;
};

function normalizePostResponse(payload: any): any | null {
  if (!payload) return null;
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

  const isPostLike = (item: any) =>
    !!item &&
    !!(item.id || item.contentId) &&
    (item.content || item.title || item.authorName || item.username || item.cardType || item.videoVO);

  const directCandidates = [
    safePayload,
    safePayload?.data,
    safePayload?.data?.data,
    safePayload?.data?.content,
    safePayload?.content,
    safePayload?.post,
    safePayload?.data?.post,
  ];

  for (const candidate of directCandidates) {
    if (isPostLike(candidate)) return adaptPostForCard(candidate);
  }

  const arrayCandidates = [
    ...(Array.isArray(safePayload?.data) ? safePayload.data : []),
    ...(Array.isArray(safePayload?.data?.data) ? safePayload.data.data : []),
    ...(Array.isArray(safePayload?.data?.vos) ? safePayload.data.vos : []),
    ...(Array.isArray(safePayload?.data?.contents) ? safePayload.data.contents : []),
    ...(Array.isArray(safePayload?.contents) ? safePayload.contents : []),
  ];

  const found = arrayCandidates.find(isPostLike) || null;
  if (!found) return null;

  return adaptPostForCard(found);
}

function adaptPostForCard(raw: any) {
  const createdAt = raw?.date ?? raw?.createTime ?? raw?.firstReleaseTime;
  const normalizedDate =
    typeof createdAt === 'number'
      ? createdAt > 10_000_000_000
        ? Math.floor(createdAt / 1000)
        : createdAt
      : undefined;

  const normalizedContent =
    raw?.content ||
    raw?.bodyTextOnly ||
    raw?.body ||
    raw?.subTitle ||
    '';

  const normalizedImages =
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
    authorName:
      raw?.authorName ||
      raw?.displayName ||
      raw?.nickName ||
      raw?.author?.name ||
      raw?.author?.nickName ||
      raw?.username ||
      'Unknown',
    authorAvatar:
      raw?.authorAvatar ||
      raw?.avatar ||
      raw?.userAvatar ||
      raw?.author?.avatar ||
      '/placeholder.svg',
    username:
      raw?.username ||
      raw?.author?.username ||
      raw?.author?.userName ||
      raw?.squareAuthorId ||
      'unknown',
    content: normalizedContent,
    date: normalizedDate,
    images: normalizedImages,
  };
}

export default function PostPageClient({ id, faqItems, initialPostData }: PostPageClientProps) {
  const { data, isLoading, error } = useQuery<any>({
    queryKey: ['post', id],
    queryFn: () => fetchPost(id),
    initialData: initialPostData || undefined,
  });

  const post = normalizePostResponse(data);

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

          <div className="rounded-2xl border border-neutral-800 bg-neutral-950 overflow-hidden">
            {isLoading && (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-green-400" />
              </div>
            )}

            {error && (
              <div className="p-8 text-center">
                <p className="text-red-400">Failed to load post</p>
              </div>
            )}

            {!isLoading && !error && post && <PostCard post={post} />}

            {!isLoading && !error && !post && (
              <div className="p-8 text-center text-neutral-500">Post not found</div>
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
