'use client';

import { TrendingUp } from 'lucide-react';
import Link from 'next/link';

export function Header() {
  const chartUrl = 'https://crypto-feed.net/chart/BTCUSDT';
  const links = [
    { label: 'Live Chart', href: chartUrl },
    { label: 'Order Book', href: chartUrl },
    { label: 'Liquidation Heatmap', href: chartUrl },
    { label: 'AI', href: chartUrl, accent: true },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-neutral-800 bg-black/80 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-center justify-between gap-4 px-4 py-3">
          <Link href="/" className="flex items-center gap-2 text-xl font-bold">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-green-400 to-emerald-600">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <span className="bg-gradient-to-r from-green-400 to-emerald-600 bg-clip-text text-transparent">
              CryptoFeed
            </span>
          </Link>

          <div className="md:hidden shrink-0">
            <Link
              href={chartUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded-full border border-emerald-400/40 bg-emerald-500/15 px-4 py-2 text-sm font-semibold text-emerald-100 shadow-[0_0_22px_rgba(16,185,129,0.2)] transition hover:bg-emerald-500/25 hover:text-white"
            >
              Open AI Chart
            </Link>
          </div>

          <div className="hidden md:flex shrink-0 items-center gap-2 rounded-2xl border border-neutral-700 bg-neutral-900/75 p-1.5 shadow-[0_10px_28px_rgba(0,0,0,0.35)]">
            {links.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
                  item.accent
                    ? 'bg-emerald-500/20 text-emerald-200 ring-1 ring-emerald-400/35 hover:bg-emerald-500/30 hover:text-white'
                    : 'text-neutral-200 hover:bg-neutral-800 hover:text-white'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}
