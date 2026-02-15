'use client';

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { fetchHotList } from '@/lib/api/api';

export function HotList() {
  const { data: hotList, isLoading } = useQuery<any>({
    queryKey: ['hotlist'],
    queryFn: fetchHotList,
  });

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-4">
        <h2 className="mb-4 text-xl font-bold text-white">Trending Now</h2>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 w-24 rounded bg-neutral-800 mb-2"></div>
              <div className="h-3 w-16 rounded bg-neutral-800"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  if (!hotList?.data.data || hotList.data.data.length === 0) {
    return null;
  }

  const getTrendIcon = (trend: string) => {
    if (trend === 'up') return <TrendingUp className="h-4 w-4 text-green-400" />;
    if (trend === 'down') return <TrendingDown className="h-4 w-4 text-red-400" />;
    return <Minus className="h-4 w-4 text-neutral-500" />;
  };

  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-4">
      <h2 className="mb-4 text-xl font-bold text-white">Trending Now</h2>
      <div className="space-y-4">
        {hotList.data.data.map((item: any, index: number) => (
          <Link
            key={item.hashtag || index}
            href={`/hashtag/${encodeURIComponent((item.hashtag || '').replace('#', '').trim())}`}
            className="block group"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-neutral-500">#{index + 1}</span>
                  <span className="font-semibold text-white group-hover:text-green-400 transition-colors">
                    {item.hashtag || 'Unknown'}
                  </span>
                  {getTrendIcon(item.trend)}
                </div>
                {item.posts > 0 && (
                  <p className="mt-1 text-sm text-neutral-500">
                    {item.posts.toLocaleString()} posts
                  </p>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
