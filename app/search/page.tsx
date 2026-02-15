'use client';

import { useQuery } from '@tanstack/react-query';
import { searchPosts } from '@/lib/api/api';
import { PostCard } from '@/components/feed/post-card';
import { HotList } from '@/components/feed/hot-list';
import { Loader2, Search as SearchIcon } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';

  const { data, isLoading, error } = useQuery<any>({
    queryKey: ['search', query],
    queryFn: () => searchPosts(query),
    enabled: query.length > 0,
  });

  return (
    <div className="mx-auto max-w-7xl">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-4">
        <div className="lg:col-span-2">
          <div className="mb-4 rounded-2xl border border-neutral-800 bg-neutral-950 p-4">
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <SearchIcon className="h-6 w-6" />
              Search Results
            </h1>
            {query && (
              <p className="text-neutral-500 mt-1">Showing results for: {query}</p>
            )}
          </div>

          <div className="rounded-2xl border border-neutral-800 bg-neutral-950 overflow-hidden">
            {!query && (
              <div className="p-8 text-center text-neutral-500">
                Enter a search query to find posts
              </div>
            )}

            {query && isLoading && (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-green-400" />
              </div>
            )}

            {query && error && (
              <div className="p-8 text-center">
                <p className="text-red-400">Failed to search posts</p>
              </div>
            )}

            {query && !isLoading && !error && data?.data && (
              <>
                {data.data.length > 0 ? (
                  data.data.map((post: any) => (
                    <PostCard key={post.id} post={post} />
                  ))
                ) : (
                  <div className="p-8 text-center text-neutral-500">
                    No results found for "{query}"
                  </div>
                )}
              </>
            )}
          </div>
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

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-green-400" />
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
