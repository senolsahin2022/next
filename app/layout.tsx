import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Script from 'next/script';
import { Providers } from '@/lib/providers';
import { Header } from '@/components/layout/header';

const inter = Inter({ subsets: ['latin'] });
const siteName = 'CryptoFeed';

function getBaseUrl(): URL {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    'https://live.crypto-feed.net';

  try {
    return new URL(raw.startsWith('http') ? raw : `https://${raw}`);
  } catch {
    return new URL('https://live.crypto-feed.net');
  }
}

const metadataBase = getBaseUrl();
const defaultTitle = `${siteName} - Live Crypto Feed and Trending Discussions`;
const defaultDescription =
  'Follow live crypto discussions, trending hashtags, and market insights on CryptoFeed.';
const defaultOgImage = `${metadataBase.origin}/og-image.svg`;

export const metadata: Metadata = {
  metadataBase,
  applicationName: siteName,
  title: {
    default: defaultTitle,
    template: `%s | ${siteName}`,
  },
  description: defaultDescription,
  keywords: [
    'crypto feed',
    'crypto news',
    'crypto discussions',
    'trending crypto hashtags',
    'bitcoin community',
    siteName,
  ],
  alternates: {
    canonical: '/',
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
    siteName,
    title: defaultTitle,
    description: defaultDescription,
    url: metadataBase.origin,
    locale: 'en_US',
    images: [
      {
        url: defaultOgImage,
        alt: `${siteName} Open Graph image`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: defaultTitle,
    description: defaultDescription,
    images: [
      {
        url: defaultOgImage,
      },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const websiteJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteName,
    url: metadataBase.origin,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${metadataBase.origin}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-black text-white antialiased`}>
        <Script
          id="adsense-script"
          async
          strategy="afterInteractive"
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3083989177413994"
          crossOrigin="anonymous"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <Providers>
          <Header />
          <main className="min-h-screen">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
