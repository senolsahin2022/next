'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, RefreshCw } from 'lucide-react';
import { fetchRecommended } from '@/lib/api/api';
import { PostCard } from '@/components/feed/post-card';
import { HotList } from '@/components/feed/hot-list';

type FaqItem = {
  question: string;
  answer: string;
};

type HomeClientProps = {
  faqItems: FaqItem[];
};

export default function HomeClient({ faqItems }: HomeClientProps) {
  const [page, setPage] = useState(1);

  const { data, isLoading, error, refetch } = useQuery<any>({
    queryKey: ['recommended', page],
    queryFn: () => fetchRecommended(page),
  });

  return (
    <div className="mx-auto max-w-7xl">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-4">
        <div className="lg:col-span-2 space-y-6">
          <div className="mb-4 flex items-center justify-between rounded-2xl border border-neutral-800 bg-neutral-950 p-4">
            <div>
              <h1 className="text-2xl font-bold text-white">Live Crypto Feed and Trending Topics</h1>
              <p className="text-sm text-neutral-500 mt-1">Latest crypto discussions and market chatter</p>
            </div>
            <button
              onClick={() => refetch()}
              className="flex items-center gap-2 rounded-full bg-green-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-600"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>

          <div className="rounded-2xl border border-neutral-800 bg-neutral-950 overflow-hidden">
            {isLoading && (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-green-400" />
              </div>
            )}

            {error && (
              <div className="p-8 text-center">
                <p className="text-red-400 mb-4">Failed to load posts</p>
                <button
                  onClick={() => refetch()}
                  className="rounded-full bg-neutral-800 px-4 py-2 text-sm text-white hover:bg-neutral-700"
                >
                  Try Again
                </button>
              </div>
            )}

            {!isLoading && !error && data?.data && (
              <>
                {data.data.vos.map((post: any) => (
                  <PostCard key={post.id} post={post} />
                ))}

                {data.data.vos.length === 0 && (
                  <div className="p-8 text-center text-neutral-500">No posts found</div>
                )}

                {data.data.vos.length > 0 && (
                  <div className="flex items-center justify-center gap-4 p-6 border-t border-neutral-800">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="rounded-full bg-neutral-800 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <span className="text-sm text-neutral-400">Page {page}</span>
                    <button
                      onClick={() => setPage((p) => p + 1)}
                      className="rounded-full bg-green-500 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-green-600"
                    >
                      Next
                    </button>
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
