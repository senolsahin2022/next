import type { Metadata } from 'next';

const SITE_NAME = 'CryptoFeed';
const SITE_URL = 'https://live.crypto-feed.net';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: `Search Crypto Posts | ${SITE_NAME}`,
  description: 'Search live crypto posts, hashtags, and community discussions on CryptoFeed.',
  alternates: {
    canonical: '/search',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  openGraph: {
    type: 'website',
    url: `${SITE_URL}/search`,
    title: `Search Crypto Posts | ${SITE_NAME}`,
    description: 'Search live crypto posts, hashtags, and community discussions on CryptoFeed.',
    siteName: SITE_NAME,
    images: [{ url: `${SITE_URL}/og-image.svg`, alt: `${SITE_NAME} search` }],
  },
  twitter: {
    card: 'summary_large_image',
    title: `Search Crypto Posts | ${SITE_NAME}`,
    description: 'Search live crypto posts, hashtags, and community discussions on CryptoFeed.',
    images: [`${SITE_URL}/og-image.svg`],
  },
};

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return children;
}
